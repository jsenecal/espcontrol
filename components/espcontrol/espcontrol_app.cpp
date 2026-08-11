#include "espcontrol_app.h"

#ifdef USE_ESP32
#include <esp_heap_caps.h>
#endif

#include "esphome/core/log.h"

#include "panel_config_capabilities_endpoint.h"
#include "configuration_release_policy.h"
#include "panel_config_read_endpoint.h"
#include "panel_config_write_endpoint.h"

namespace espcontrol {

static const char *const TAG = "espcontrol.config";

void EspControlApp::set_panel_config_device_profile(const char *device_profile) {
  legacy_config_.set_device_profile(device_profile);
}

void EspControlApp::set_panel_config_button_order(
    esphome::text::Text *button_order) {
  button_order_text_.bind(button_order);
  legacy_config_.set_button_order(&button_order_text_);
}

void EspControlApp::set_panel_config_button_on_color(
    esphome::text::Text *button_on_color) {
  button_on_color_text_.bind(button_on_color);
  legacy_config_.set_button_on_color(&button_on_color_text_);
}

void EspControlApp::set_panel_config_button(
    uint8_t slot, esphome::text::Text *button,
    esphome::text::Text *subpage_0, esphome::text::Text *subpage_1,
    esphome::text::Text *subpage_2, esphome::text::Text *subpage_3,
    esphome::text::Text *subpage_4, esphome::text::Text *subpage_5,
    esphome::text::Text *subpage_6, esphome::text::Text *subpage_7) {
  if (slot == 0 || slot > legacy_button_texts_.size()) return;
  LegacyButtonTextSources &sources = legacy_button_texts_[slot - 1];
  sources.button.bind(button);
  const std::array<esphome::text::Text *,
                   configuration::PanelConfigLegacyAdapter::MAX_SUBPAGE_CHUNKS>
      subpages{{subpage_0, subpage_1, subpage_2, subpage_3, subpage_4,
                subpage_5, subpage_6, subpage_7}};
  std::array<configuration::LegacyTextValue *,
             configuration::PanelConfigLegacyAdapter::MAX_SUBPAGE_CHUNKS>
      legacy_subpages{};
  for (size_t index = 0; index < subpages.size(); ++index) {
    sources.subpages[index].bind(subpages[index]);
    legacy_subpages[index] = &sources.subpages[index];
  }
  legacy_config_.set_button(slot, &sources.button, legacy_subpages);
}

void EspControlApp::register_panel_config_endpoints() {
  // Do not let an early reconnect cache a legacy-only capability response
  // while the deferred native configuration setup is still in progress.
  if (!native_configuration_initialized_) return;
  configuration::ConfigurationService *const panel_config_service =
      core_.configuration_service();
  const bool can_register_document_endpoints =
      panel_config_service != nullptr && panel_config_document_buffer_ != nullptr;
  const bool read_endpoint_registered = can_register_document_endpoints &&
      configuration::register_panel_config_read_endpoint(
          *panel_config_service, panel_config_document_buffer_,
          PANEL_CONFIG_STORAGE_SLOT_CAPACITY, web_auth_username_.c_str(),
          web_auth_password_.c_str());
  const bool write_endpoint_registered = can_register_document_endpoints &&
      configuration::register_panel_config_write_endpoint(
          *panel_config_service, panel_config_document_buffer_,
          PANEL_CONFIG_STORAGE_SLOT_CAPACITY, web_auth_username_.c_str(),
          web_auth_password_.c_str());
  configuration::set_panel_config_read_supported(read_endpoint_registered);
  configuration::set_panel_config_write_supported(write_endpoint_registered);
  configuration::register_panel_config_capabilities_endpoint();
}

void EspControlApp::setup() {
  if (core_.start()) {
    cards::set_card_runtime_registry_service(&core_.card_runtime_registry());
  } else {
    ESP_LOGE(TAG, "Application core failed to start");
  }

  // NVS work and the legacy snapshot can be expensive on a populated panel.
  // Give P4 displays time to finish their display, hosted-network, and OTA
  // boot-validation paths before importing and mirroring configuration.
  constexpr uint32_t native_configuration_start_delay_ms = 10000;
  this->set_timeout(native_configuration_start_delay_ms,
                    [this]() { this->initialize_native_configuration(); });
}

void EspControlApp::initialize_native_configuration() {
  configuration::set_panel_config_initialization_status("initializing");
  const bool newly_configured = core_.configure_configuration_service(
      panel_config_store_, legacy_config_, &panel_config_validator_,
      configuration::PANEL_CONFIG_LEGACY_MODE);
  configuration::ConfigurationService *const panel_config_service =
      core_.configuration_service();
  if (panel_config_service == nullptr) {
    ESP_LOGE(TAG, "Native configuration service is unavailable");
    configuration::set_panel_config_initialization_status("service-unavailable");
    retry_native_configuration_initialization("service unavailable");
    return;
  }
  if (!newly_configured) {
    ESP_LOGD(TAG, "Retrying native configuration initialization");
  }
  panel_config_service->set_runtime_adapter(&legacy_config_);
  if (!legacy_config_.configured()) {
    // Compatibility-only profiles intentionally keep using text entities until
    // their Product Model migration wires a native document source.
    ESP_LOGW(TAG, "Native configuration sources are not configured");
    configuration::set_panel_config_initialization_status("legacy-only");
    native_configuration_initialized_ = true;
    register_panel_config_endpoints();
    return;
  }
  // Diagnostic staging for P4 rollout: registering capabilities before the
  // backing store lets a physical test distinguish early component startup
  // from storage initialization. The next change restores storage setup once
  // this boundary is proven stable on the reference device.
  native_configuration_initialized_ = true;
  configuration::set_panel_config_initialization_status("storage-pending");
  register_panel_config_endpoints();
  return;
  if (!panel_config_blobs_.begin()) {
    ESP_LOGE(TAG, "Native configuration storage is unavailable");
    configuration::set_panel_config_initialization_status("storage-unavailable");
    retry_native_configuration_initialization("storage unavailable");
    return;
  }
  {
#ifdef USE_ESP32
    // Two fixed slots back the atomic store; its scratch buffer and the HTTP
    // request buffer must not overlap each other.
    constexpr size_t panel_config_memory_size =
        PANEL_CONFIG_STORAGE_SLOT_CAPACITY * 4;
    // Preserve the allocation when an unavailable backend is retried. Retrying
    // the startup operation must not gradually consume PSRAM on a busy boot.
    if (panel_config_memory_ == nullptr) {
      panel_config_memory_ = static_cast<uint8_t *>(
          heap_caps_malloc(panel_config_memory_size,
                           MALLOC_CAP_SPIRAM | MALLOC_CAP_8BIT));
    }
#endif
    if (panel_config_memory_ == nullptr ||
        !panel_config_backend_.begin(panel_config_memory_,
                                     PANEL_CONFIG_STORAGE_SLOT_CAPACITY * 2)) {
      ESP_LOGE(TAG, "Native configuration memory is unavailable");
      configuration::set_panel_config_initialization_status("memory-unavailable");
      retry_native_configuration_initialization("memory unavailable");
      return;
    }
    panel_config_service->set_scratch_buffer(
        panel_config_memory_ + PANEL_CONFIG_STORAGE_SLOT_CAPACITY * 2,
        PANEL_CONFIG_STORAGE_SLOT_CAPACITY);
    panel_config_document_buffer_ =
        panel_config_memory_ + PANEL_CONFIG_STORAGE_SLOT_CAPACITY * 3;
  }
  // ESPHome restores the mirrored text entities before this component starts,
  // so the live grid already reflects the saved configuration. Importing or
  // reapplying the complete document here causes a second wave of entity
  // updates while the P4 hosted network is bringing itself online. Defer that
  // work until the browser reads or saves its configuration through the native
  // API, where ConfigurationService performs the same atomic migration.
  native_configuration_initialized_ = true;
  configuration::set_panel_config_initialization_status("ready");
  register_panel_config_endpoints();
}

void EspControlApp::retry_native_configuration_initialization(
    const char *reason) {
  constexpr uint32_t retry_delay_ms = 2000;
  ++native_configuration_initialization_attempts_;
  ESP_LOGW(TAG, "Native configuration initialization deferred (%s, attempt %u)",
           reason == nullptr ? "unknown" : reason,
           static_cast<unsigned>(native_configuration_initialization_attempts_));
  this->set_timeout(retry_delay_ms,
                    [this]() { this->initialize_native_configuration(); });
}

void EspControlApp::loop() {
  core_.run_once();
  // The app core starts before WiFi so Home Assistant boot automations are
  // safe. The IDF web server starts later, so retry idempotent registrations.
  register_panel_config_endpoints();
}

void EspControlApp::on_shutdown() {
  cards::set_card_runtime_registry_service(nullptr);
  core_.stop();
}

}  // namespace espcontrol
