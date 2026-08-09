#pragma once

#include <cstdio>

#include "panel_config_document.h"

namespace espcontrol::configuration {

constexpr uint16_t PANEL_CONFIG_API_VERSION = 1;
constexpr uint16_t PANEL_CONFIG_WEB_ASSET_VERSION = 1;
constexpr size_t PANEL_CONFIG_CAPABILITIES_MAX_JSON_BYTES = 160;

inline bool &panel_config_read_supported() {
  static bool supported = false;
  return supported;
}

inline void set_panel_config_read_supported(bool supported) {
  panel_config_read_supported() = supported;
}

// The discovery response is deliberately static for the first native
// configuration release. The future immutable web-bundle manifest will
// replace the legacy delivery marker while preserving these version fields.
inline bool write_panel_config_capabilities_json(char *output,
                                                 size_t output_capacity,
                                                 size_t *output_size) {
  if (output == nullptr || output_size == nullptr || output_capacity == 0)
    return false;
  const int written = std::snprintf(
      output, output_capacity,
      "{\"api\":{\"version\":%u},\"configuration\":{\"document_versions\":[%u],"
      "\"read\":%s,\"write\":false},\"web_assets\":{\"versions\":[%u],"
      "\"delivery\":\"legacy\"}}",
      static_cast<unsigned>(PANEL_CONFIG_API_VERSION),
      static_cast<unsigned>(PANEL_CONFIG_DOCUMENT_VERSION),
      panel_config_read_supported() ? "true" : "false",
      static_cast<unsigned>(PANEL_CONFIG_WEB_ASSET_VERSION));
  if (written < 0 || static_cast<size_t>(written) >= output_capacity)
    return false;
  *output_size = static_cast<size_t>(written);
  return true;
}

}  // namespace espcontrol::configuration
