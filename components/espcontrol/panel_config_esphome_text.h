#pragma once

#include <cstddef>
#include <string>

#include "esphome/components/text/text.h"

#include "panel_config_legacy_adapter.h"

namespace espcontrol::configuration {

class EspHomeLegacyTextValue final : public LegacyTextValue {
 public:
  void bind(esphome::text::Text *text) { text_ = text; }

  const std::string &value() const override {
    return text_ == nullptr ? empty_ : text_->state;
  }

  bool set_value(const char *value, size_t value_size) override {
    if (text_ == nullptr || (value == nullptr && value_size > 0)) return false;
    text_->make_call().set_value(value, value_size).perform();
    return true;
  }

 private:
  esphome::text::Text *text_{nullptr};
  std::string empty_;
};

}  // namespace espcontrol::configuration
