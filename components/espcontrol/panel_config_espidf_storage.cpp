#include "panel_config_espidf_storage.h"

#ifdef USE_ESP32
#include <esp_err.h>
#include <nvs.h>
#endif

namespace espcontrol::configuration {

const char *EspIdfPanelConfigBlobStorage::slot_key(uint8_t slot) {
  return slot == 0 ? "slot_a" : (slot == 1 ? "slot_b" : nullptr);
}

bool EspIdfPanelConfigBlobStorage::begin() {
#ifdef USE_ESP32
  if (ready_) return true;
  if (nvs_open("espcontrol_cfg", NVS_READWRITE, &handle_) != ESP_OK)
    return false;
  ready_ = true;
  return true;
#else
  return false;
#endif
}

BlobLoadStatus EspIdfPanelConfigBlobStorage::load_blob(uint8_t slot,
                                                        uint8_t *output,
                                                        size_t size) {
#ifdef USE_ESP32
  const char *key = slot_key(slot);
  if (!ready_ || key == nullptr || (size > 0 && output == nullptr))
    return BlobLoadStatus::FAILED;
  size_t stored_size = size;
  const esp_err_t result = nvs_get_blob(handle_, key, output, &stored_size);
  if (result == ESP_ERR_NVS_NOT_FOUND) return BlobLoadStatus::MISSING;
  return result == ESP_OK && stored_size == size ? BlobLoadStatus::OK
                                                  : BlobLoadStatus::FAILED;
#else
  (void) slot;
  (void) output;
  (void) size;
  return BlobLoadStatus::FAILED;
#endif
}

bool EspIdfPanelConfigBlobStorage::save_blob(uint8_t slot, const uint8_t *data,
                                              size_t size) {
#ifdef USE_ESP32
  const char *key = slot_key(slot);
  return ready_ && key != nullptr && (size == 0 || data != nullptr) &&
         nvs_set_blob(handle_, key, data, size) == ESP_OK;
#else
  (void) slot;
  (void) data;
  (void) size;
  return false;
#endif
}

bool EspIdfPanelConfigBlobStorage::sync() {
#ifdef USE_ESP32
  return ready_ && nvs_commit(handle_) == ESP_OK;
#else
  return false;
#endif
}

}  // namespace espcontrol::configuration
