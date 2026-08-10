#include "espcontrol_app_core.h"

namespace espcontrol {

bool EspControlAppCore::configure_configuration_service(
    configuration::ConfigurationStore &store,
    configuration::LegacyConfigurationAdapter &legacy,
    const configuration::ConfigurationDocumentValidator *validator) {
  if (configuration_service_) return false;
  configuration_service_.emplace(store, legacy, validator);
  return true;
}

bool EspControlAppCore::start() {
  if (lifecycle_state_ != AppLifecycleState::CONSTRUCTED) return false;
  if (!display_lifecycle_.start()) return false;
  set_home_assistant_callback_owner_service(&home_assistant_callback_owner_);
  lifecycle_state_ = AppLifecycleState::RUNNING;
  return true;
}

bool EspControlAppCore::run_once() {
  if (lifecycle_state_ != AppLifecycleState::RUNNING) return false;
  if (!display_lifecycle_.run_once()) return false;
  ++loop_count_;
  return true;
}

bool EspControlAppCore::stop() {
  if (lifecycle_state_ != AppLifecycleState::RUNNING) return false;
  if (!display_lifecycle_.stop()) return false;
  set_home_assistant_callback_owner_service(nullptr);
  lifecycle_state_ = AppLifecycleState::STOPPED;
  return true;
}

}  // namespace espcontrol
