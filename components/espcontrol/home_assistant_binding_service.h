#pragma once

#include <utility>

#include "ha_read_coordinator.h"

// Owns Home Assistant callback scope and read/subscription state. Transport and
// heap policies keep the service host-testable and leave ESPHome as wiring.
template<typename Transport, typename HeapProbe>
class HomeAssistantBindingService {
 public:
  using ReadCoordinator = HaReadCoordinator<Transport, HeapProbe>;

  class CallbackOwnerScope {
   public:
    CallbackOwnerScope(HomeAssistantBindingService &service, void *owner)
        : service_(service), previous_(service.callback_owner_) {
      service_.callback_owner_ = owner;
    }
    ~CallbackOwnerScope() { service_.callback_owner_ = previous_; }

    CallbackOwnerScope(const CallbackOwnerScope &) = delete;
    CallbackOwnerScope &operator=(const CallbackOwnerScope &) = delete;

   private:
    HomeAssistantBindingService &service_;
    void *previous_ = nullptr;
  };

  explicit HomeAssistantBindingService(
      Transport transport = Transport(), HeapProbe heap_probe = HeapProbe())
      : read_coordinator_(std::move(transport), std::move(heap_probe)) {}

  ReadCoordinator &read_coordinator() { return read_coordinator_; }
  const ReadCoordinator &read_coordinator() const { return read_coordinator_; }

  void *callback_owner() const { return callback_owner_; }
  void *&callback_owner_ref() { return callback_owner_; }
  CallbackOwnerScope callback_owner_scope(void *owner) {
    return CallbackOwnerScope(*this, owner);
  }

 private:
  ReadCoordinator read_coordinator_{};
  void *callback_owner_ = nullptr;
};
