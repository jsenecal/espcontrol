#include "espcontrol_app.h"

#include <cinttypes>

#include "esphome/core/log.h"

#include "panel_config_capabilities_endpoint.h"

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
  if (!panel_config_blobs_.begin()) {
    ESP_LOGE(TAG, "Native configuration storage is unavailable");
  } else if (!legacy_config_.configured()) {
    ESP_LOGW(TAG, "Native configuration sources are not configured");
  } else {
    const configuration::ServiceLoadResult loaded = panel_config_service_.load(
        panel_config_document_buffer_.data(), panel_config_document_buffer_.size());
    if (loaded.status == configuration::ServiceStatus::IMPORTED_LEGACY) {
      ESP_LOGI(TAG, "Imported legacy panel configuration into generation %" PRIu32,
               loaded.generation);
    } else if (!loaded.ok() && loaded.status != configuration::ServiceStatus::EMPTY) {
      ESP_LOGE(TAG, "Native configuration load failed (%u)",
               static_cast<unsigned>(loaded.status));
    }
  }
  configuration::register_panel_config_capabilities_endpoint();
}

void EspControlApp::loop() { core_.run_once(); }

void EspControlApp::on_shutdown() { core_.stop(); }

}  // namespace espcontrol
