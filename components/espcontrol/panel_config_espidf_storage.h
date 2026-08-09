#pragma once

#include <cstddef>
#include <cstdint>

#include "panel_config_storage_backend.h"

#ifdef USE_ESP32
#include <nvs.h>
#endif

namespace espcontrol::configuration {

// ESP-IDF NVS binding. It uses its own namespace in ESPHome's existing NVS
// partition, so it neither collides with restored text entities nor requires
// a partition-table migration during the compatibility releases.
class EspIdfPanelConfigBlobStorage final : public BlobStorage {
 public:
  bool begin();
  BlobLoadStatus load_blob(uint8_t slot, uint8_t *output,
                           size_t size) override;
  bool save_blob(uint8_t slot, const uint8_t *data, size_t size) override;
  bool sync() override;

 private:
  static const char *slot_key(uint8_t slot);

#ifdef USE_ESP32
  nvs_handle_t handle_{0};
#endif
  bool ready_{false};
};

}  // namespace espcontrol::configuration
