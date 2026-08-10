#pragma once

#include <cstdint>

#include "button_grid_card_runtime.h"
#include "display_lifecycle_service.h"

namespace espcontrol {

enum class AppLifecycleState : uint8_t {
  CONSTRUCTED,
  RUNNING,
  STOPPED,
};

// Framework-independent owner for EspControl's long-lived firmware services.
// Keeping this core free of ESPHome APIs makes lifecycle and ownership
// executable in host tests.
class EspControlAppCore {
 public:
  bool start();
  bool run_once();
  bool stop();

  AppLifecycleState lifecycle_state() const { return lifecycle_state_; }
  uint32_t loop_count() const { return loop_count_; }

  DisplayLifecycleService &display_lifecycle() { return display_lifecycle_; }
  const DisplayLifecycleService &display_lifecycle() const { return display_lifecycle_; }

  cards::CardRuntimeRegistryService &card_runtime_registry() {
    return card_runtime_registry_;
  }
  const cards::CardRuntimeRegistryService &card_runtime_registry() const {
    return card_runtime_registry_;
  }

  // Compatibility facade for ESPHome YAML while display ownership migrates to
  // the explicit lifecycle service.
  DisplayModeController &display() { return display_lifecycle_.controller(); }
  const DisplayModeController &display() const {
    return display_lifecycle_.controller();
  }

 private:
  AppLifecycleState lifecycle_state_{AppLifecycleState::CONSTRUCTED};
  uint32_t loop_count_{0};
  DisplayLifecycleService display_lifecycle_{};
  cards::CardRuntimeRegistryService card_runtime_registry_{};
};

}  // namespace espcontrol
