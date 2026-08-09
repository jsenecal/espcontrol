#include <cstdlib>
#include <cstring>
#include <array>

#include "panel_config_capabilities.h"

int main() {
  using namespace espcontrol::configuration;
  std::array<char, PANEL_CONFIG_CAPABILITIES_MAX_JSON_BYTES> capabilities{};
  size_t capabilities_size = 0;
  const bool passed = PANEL_CONFIG_API_VERSION == 1 &&
                      PANEL_CONFIG_WEB_ASSET_VERSION == 1 &&
                      write_panel_config_capabilities_json(
                          capabilities.data(), capabilities.size(),
                          &capabilities_size) &&
                      capabilities_size > 0 &&
                      std::strstr(capabilities.data(), "\"document_versions\":[1]") !=
                          nullptr &&
                      std::strstr(capabilities.data(), "\"read\":false") != nullptr &&
                      std::strstr(capabilities.data(), "\"write\":false") != nullptr &&
                      std::strstr(capabilities.data(), "\"web_assets\"") != nullptr &&
                      !write_panel_config_capabilities_json(nullptr,
                                                            capabilities.size(),
                                                            &capabilities_size);
  return passed ? EXIT_SUCCESS : EXIT_FAILURE;
}
