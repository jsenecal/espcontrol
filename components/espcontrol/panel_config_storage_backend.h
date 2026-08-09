#pragma once

#include <array>
#include <cstddef>
#include <cstdint>
#include <cstring>

#include "configuration_store.h"

namespace espcontrol::configuration {

// Narrow persistence port for the ESP-IDF NVS binding. Keeping it separate
// lets the two-slot protocol have host coverage without pulling ESP-IDF into
// firmware unit tests.
enum class BlobLoadStatus : uint8_t { OK, MISSING, FAILED };

class BlobStorage {
 public:
  virtual ~BlobStorage() = default;

  virtual BlobLoadStatus load_blob(uint8_t slot, uint8_t *output,
                                   size_t size) = 0;
  virtual bool save_blob(uint8_t slot, const uint8_t *data, size_t size) = 0;
  virtual bool sync() = 0;
};

// Adapts full-slot blobs to the small byte-range operations used by
// ConfigurationStore. Both slots live in fixed memory; writes are accumulated
// until ConfigurationStore's explicit sync boundary makes them durable.
template <size_t SlotCapacity>
class BufferedBlobStorageBackend final : public StorageBackend {
 public:
  static_assert(SlotCapacity >= CONFIGURATION_ENVELOPE_HEADER_SIZE,
                "Configuration slot must hold its envelope");

  explicit BufferedBlobStorageBackend(BlobStorage &storage)
      : storage_(storage) {}

  size_t slot_capacity() const override { return SlotCapacity; }

  bool read(uint8_t slot, size_t offset, uint8_t *output,
            size_t size) override {
    if (!range_is_valid(slot, offset, size) || (size > 0 && output == nullptr) ||
        !load_slot(slot)) {
      return false;
    }
    if (size > 0) std::memcpy(output, slots_[slot].data() + offset, size);
    return true;
  }

  bool write(uint8_t slot, size_t offset, const uint8_t *data,
             size_t size) override {
    if (!range_is_valid(slot, offset, size) || (size > 0 && data == nullptr) ||
        !load_slot(slot)) {
      return false;
    }
    if (size > 0) std::memcpy(slots_[slot].data() + offset, data, size);
    dirty_[slot] = true;
    return true;
  }

  bool sync() override {
    for (uint8_t slot = 0; slot < CONFIGURATION_SLOT_COUNT; ++slot) {
      if (!dirty_[slot]) continue;
      if (!storage_.save_blob(slot, slots_[slot].data(), SlotCapacity))
        return false;
    }
    if (!storage_.sync()) return false;
    dirty_.fill(false);
    return true;
  }

 private:
  bool range_is_valid(uint8_t slot, size_t offset, size_t size) const {
    return slot < CONFIGURATION_SLOT_COUNT && offset <= SlotCapacity &&
           size <= SlotCapacity - offset;
  }

  bool load_slot(uint8_t slot) {
    if (loaded_[slot]) return true;
    const BlobLoadStatus result =
        storage_.load_blob(slot, slots_[slot].data(), SlotCapacity);
    if (result == BlobLoadStatus::FAILED) return false;
    if (result == BlobLoadStatus::MISSING) slots_[slot].fill(0xFF);
    loaded_[slot] = true;
    return true;
  }

  BlobStorage &storage_;
  std::array<std::array<uint8_t, SlotCapacity>, CONFIGURATION_SLOT_COUNT>
      slots_{};
  std::array<bool, CONFIGURATION_SLOT_COUNT> loaded_{};
  std::array<bool, CONFIGURATION_SLOT_COUNT> dirty_{};
};

}  // namespace espcontrol::configuration
