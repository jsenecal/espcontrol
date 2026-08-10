#pragma once

#include <array>
#include <cstddef>
#include <cstdint>
#include <string>

#include "configuration_service.h"
#include "panel_config_document.h"

namespace espcontrol::configuration {

// Minimal view of a restored ESPHome text entity. Keeping this port separate
// from ESPHome makes the one-time import and compatibility mirror host-testable.
class LegacyTextValue {
 public:
  virtual ~LegacyTextValue() = default;

  virtual const std::string &value() const = 0;
  // Changes the preference-backed compatibility entity for firmware that is
  // later downgraded to a legacy release.
  virtual bool set_value(const char *value, size_t value_size) = 0;
  // Updates only the live ESPHome state. This triggers the existing grid
  // refresh wiring without overwriting the compatibility preference store.
  virtual bool publish_value(const char *value, size_t value_size) = 0;
};

class PanelConfigLegacyAdapter final : public LegacyConfigurationAdapter,
                                       public ConfigurationRuntimeAdapter {
 public:
  static constexpr size_t MAX_SUBPAGE_CHUNKS = 8;

  void set_device_profile(const char *device_profile);
  void set_button_order(LegacyTextValue *button_order) {
    button_order_ = button_order;
  }
  void set_button_on_color(LegacyTextValue *button_on_color) {
    button_on_color_ = button_on_color;
  }
  void set_button(uint8_t slot, LegacyTextValue *button,
                  const std::array<LegacyTextValue *, MAX_SUBPAGE_CHUNKS>
                      &subpage_chunks);

  bool configured() const;
  LegacyLoadResult load(uint8_t *output, size_t output_capacity) override;
  bool mirror(uint16_t document_version, const uint8_t *document,
              size_t document_size) override;
  bool apply(uint16_t document_version, const uint8_t *document,
             size_t document_size) override;

 private:
  struct ButtonSources {
    LegacyTextValue *button{nullptr};
    std::array<LegacyTextValue *, MAX_SUBPAGE_CHUNKS> subpage_chunks{};
  };

  bool write_document(uint8_t *output, size_t output_capacity,
                      size_t *document_size) const;
  bool apply_document(const uint8_t *document, size_t document_size,
                      bool persist_legacy);
  static bool write_value(LegacyTextValue *target, const char *value,
                          size_t value_size, bool persist_legacy);

  std::string device_profile_;
  LegacyTextValue *button_order_{nullptr};
  LegacyTextValue *button_on_color_{nullptr};
  std::array<ButtonSources, PANEL_CONFIG_MAX_SLOT_COUNT> buttons_{};
};

}  // namespace espcontrol::configuration
