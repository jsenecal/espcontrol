#include "espcontrol_app.h"

#include <cinttypes>

#ifdef USE_ESP32
#include <esp_heap_caps.h>
#endif

#include "esphome/core/log.h"

#include "panel_config_capabilities_endpoint.h"
#include "panel_config_read_endpoint.h"

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

void EspControlApp::setup() {
  core_.start();
  if (!legacy_config_.configured()) {
    ESP_LOGW(TAG, "Native configuration sources are not configured");
  } else if (!panel_config_blobs_.begin()) {
    ESP_LOGE(TAG, "Native configuration storage is unavailable");
  } else {
#ifdef USE_ESP32
    constexpr size_t panel_config_memory_size =
        PANEL_CONFIG_STORAGE_SLOT_CAPACITY * 4;
    panel_config_memory_ = static_cast<uint8_t *>(
        heap_caps_malloc(panel_config_memory_size,
                         MALLOC_CAP_SPIRAM | MALLOC_CAP_8BIT));
#endif
    if (panel_config_memory_ == nullptr ||
        !panel_config_backend_.begin(panel_config_memory_,
                                     PANEL_CONFIG_STORAGE_SLOT_CAPACITY * 2)) {
      ESP_LOGE(TAG, "Native configuration memory is unavailable");
      configuration::register_panel_config_capabilities_endpoint();
      return;
    }
    panel_config_service_.set_scratch_buffer(
        panel_config_memory_ + PANEL_CONFIG_STORAGE_SLOT_CAPACITY * 2,
        PANEL_CONFIG_STORAGE_SLOT_CAPACITY);
    panel_config_document_buffer_ =
        panel_config_memory_ + PANEL_CONFIG_STORAGE_SLOT_CAPACITY * 3;
    const configuration::ServiceLoadResult loaded = panel_config_service_.load(
        panel_config_document_buffer_, PANEL_CONFIG_STORAGE_SLOT_CAPACITY);
    if (loaded.status == configuration::ServiceStatus::IMPORTED_LEGACY) {
      ESP_LOGI(TAG, "Imported legacy panel configuration into generation %" PRIu32,
               loaded.generation);
    } else if (!loaded.ok() && loaded.status != configuration::ServiceStatus::EMPTY) {
      ESP_LOGE(TAG, "Native configuration load failed (%u)",
               static_cast<unsigned>(loaded.status));
    }
    const configuration::ServiceLoadResult refreshed =
        panel_config_service_.refresh_legacy_shadow(
            panel_config_document_buffer_, PANEL_CONFIG_STORAGE_SLOT_CAPACITY);
    if (refreshed.status == configuration::ServiceStatus::SYNCED_LEGACY) {
      ESP_LOGI(TAG, "Refreshed native configuration shadow to generation %" PRIu32,
               refreshed.generation);
    } else if (!refreshed.ok() &&
               refreshed.status != configuration::ServiceStatus::EMPTY) {
      ESP_LOGE(TAG, "Native configuration refresh failed (%u)",
               static_cast<unsigned>(refreshed.status));
    }
    const bool read_endpoint_registered =
        configuration::register_panel_config_read_endpoint(
            panel_config_service_, panel_config_document_buffer_,
            PANEL_CONFIG_STORAGE_SLOT_CAPACITY, web_auth_username_.c_str(),
            web_auth_password_.c_str());
    configuration::set_panel_config_read_supported(read_endpoint_registered);
    if (!read_endpoint_registered) {
      ESP_LOGW(TAG, "Native configuration read endpoint is unavailable");
    }
  }
  configuration::register_panel_config_capabilities_endpoint();
}

void EspControlApp::loop() { core_.run_once(); }

void EspControlApp::on_shutdown() { core_.stop(); }

}  // namespace espcontrol
