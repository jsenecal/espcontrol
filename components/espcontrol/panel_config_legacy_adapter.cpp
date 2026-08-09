#include "panel_config_legacy_adapter.h"

#include <algorithm>
#include <array>
#include <cstring>

namespace espcontrol::configuration {
namespace {

constexpr char BUTTON_ORDER_KEY[] = "button_order";

bool append_text(std::array<uint8_t, PANEL_CONFIG_MAX_RECORD_BODY_BYTES - 1>
                     *output,
                 size_t *output_size, const std::string &value) {
  if (output == nullptr || output_size == nullptr ||
      value.size() > output->size() - *output_size)
    return false;
  if (!value.empty()) {
    std::memcpy(output->data() + *output_size, value.data(), value.size());
    *output_size += value.size();
  }
  return true;
}

}  // namespace

void PanelConfigLegacyAdapter::set_device_profile(const char *device_profile) {
  device_profile_ = device_profile == nullptr ? "" : device_profile;
}

void PanelConfigLegacyAdapter::set_button(
    uint8_t slot, LegacyTextValue *button,
    const std::array<LegacyTextValue *, MAX_SUBPAGE_CHUNKS> &subpage_chunks) {
  if (slot == 0 || slot > buttons_.size()) return;
  buttons_[slot - 1] = {button, subpage_chunks};
}

bool PanelConfigLegacyAdapter::configured() const {
  return !device_profile_.empty() && button_order_ != nullptr;
}

LegacyLoadResult PanelConfigLegacyAdapter::load(uint8_t *output,
                                                size_t output_capacity) {
  if (!configured()) return {LegacyStatus::EMPTY, PANEL_CONFIG_DOCUMENT_VERSION, 0};
  size_t document_size = 0;
  if (!write_document(output, output_capacity, &document_size)) {
    return {LegacyStatus::BUFFER_TOO_SMALL, PANEL_CONFIG_DOCUMENT_VERSION,
            document_size};
  }
  return {LegacyStatus::OK, PANEL_CONFIG_DOCUMENT_VERSION, document_size};
}

bool PanelConfigLegacyAdapter::write_document(uint8_t *output,
                                              size_t output_capacity,
                                              size_t *document_size) const {
  if (document_size != nullptr) *document_size = 0;
  PanelConfigWriter writer(output, output_capacity);
  if (writer.begin() != PanelConfigStatus::OK ||
      writer.append_device_profile(
          reinterpret_cast<const uint8_t *>(device_profile_.data()),
          device_profile_.size()) != PanelConfigStatus::OK) {
    return false;
  }

  for (size_t index = 0; index < buttons_.size(); ++index) {
    const ButtonSources &sources = buttons_[index];
    if (sources.button != nullptr && !sources.button->value().empty() &&
        writer.append_button(static_cast<uint8_t>(index + 1),
                             reinterpret_cast<const uint8_t *>(
                                 sources.button->value().data()),
                             sources.button->value().size()) !=
            PanelConfigStatus::OK) {
      return false;
    }

    std::array<uint8_t, PANEL_CONFIG_MAX_RECORD_BODY_BYTES - 1> subpage{};
    size_t subpage_size = 0;
    for (LegacyTextValue *chunk : sources.subpage_chunks) {
      if (chunk != nullptr && !append_text(&subpage, &subpage_size,
                                           chunk->value())) {
        return false;
      }
    }
    if (subpage_size > 0 &&
        writer.append_subpage(static_cast<uint8_t>(index + 1), subpage.data(),
                              subpage_size) != PanelConfigStatus::OK) {
      return false;
    }
  }

  if (!button_order_->value().empty() &&
      writer.append_setting(
          reinterpret_cast<const uint8_t *>(BUTTON_ORDER_KEY),
          sizeof(BUTTON_ORDER_KEY) - 1,
          reinterpret_cast<const uint8_t *>(button_order_->value().data()),
          button_order_->value().size()) != PanelConfigStatus::OK) {
    return false;
  }
  return writer.finish(document_size) == PanelConfigStatus::OK;
}

bool PanelConfigLegacyAdapter::mirror(uint16_t document_version,
                                      const uint8_t *document,
                                      size_t document_size) {
  return document_version == PANEL_CONFIG_DOCUMENT_VERSION && configured() &&
         mirror_document(document, document_size);
}

bool PanelConfigLegacyAdapter::mirror_document(const uint8_t *document,
                                               size_t document_size) {
  PanelConfigReader reader(document, document_size);
  if (reader.begin() != PanelConfigStatus::OK) return false;

  // Clear known values first. Missing records intentionally mean that the
  // corresponding old entity is empty in the native document.
  if (!button_order_->set_value("", 0)) return false;
  for (ButtonSources &sources : buttons_) {
    if (sources.button != nullptr && !sources.button->set_value("", 0))
      return false;
    for (LegacyTextValue *chunk : sources.subpage_chunks) {
      if (chunk != nullptr && !chunk->set_value("", 0)) return false;
    }
  }

  PanelConfigRecord record;
  PanelConfigStatus status = PanelConfigStatus::OK;
  while ((status = reader.next(&record)) == PanelConfigStatus::OK) {
    if (record.type == PanelConfigRecordType::DEVICE_PROFILE) {
      if (record.value_size != device_profile_.size() ||
          std::memcmp(record.value, device_profile_.data(), record.value_size) !=
              0) {
        return false;
      }
    } else if (record.type == PanelConfigRecordType::BUTTON) {
      ButtonSources &sources = buttons_[record.slot - 1];
      if (sources.button == nullptr ||
          !sources.button->set_value(reinterpret_cast<const char *>(record.value),
                                     record.value_size)) {
        return false;
      }
    } else if (record.type == PanelConfigRecordType::SUBPAGE) {
      ButtonSources &sources = buttons_[record.slot - 1];
      size_t offset = 0;
      for (LegacyTextValue *chunk : sources.subpage_chunks) {
        if (chunk == nullptr) continue;
        const size_t chunk_size = std::min<size_t>(255, record.value_size - offset);
        if (!chunk->set_value(reinterpret_cast<const char *>(record.value + offset),
                              chunk_size)) {
          return false;
        }
        offset += chunk_size;
      }
      if (offset != record.value_size) return false;
    } else if (record.type == PanelConfigRecordType::SETTING &&
               record.key_size == sizeof(BUTTON_ORDER_KEY) - 1 &&
               std::memcmp(record.key, BUTTON_ORDER_KEY, record.key_size) == 0) {
      if (!button_order_->set_value(reinterpret_cast<const char *>(record.value),
                                    record.value_size)) {
        return false;
      }
    }
  }
  return status == PanelConfigStatus::END;
}

}  // namespace espcontrol::configuration
