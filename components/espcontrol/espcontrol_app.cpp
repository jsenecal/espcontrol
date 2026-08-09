#include "espcontrol_app.h"

#include "panel_config_capabilities_endpoint.h"

namespace espcontrol {

void EspControlApp::setup() {
  core_.start();
  configuration::register_panel_config_capabilities_endpoint();
}

void EspControlApp::loop() { core_.run_once(); }

void EspControlApp::on_shutdown() { core_.stop(); }

}  // namespace espcontrol
