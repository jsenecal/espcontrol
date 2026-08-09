#pragma once

#include <cstddef>
#include <cstdint>

#ifdef USE_WEBSERVER
#include <array>
#include <cstdio>
#include <cstring>

#include <esp_http_server.h>

#include "configuration_service.h"
#include "esphome/components/web_server_idf/web_server_idf.h"

namespace espcontrol::configuration {

class PanelConfigReadHandler final
    : public esphome::web_server_idf::AsyncWebHandler {
 public:
  PanelConfigReadHandler(ConfigurationService &service, uint8_t *document,
                         size_t document_capacity, const char *username,
                         const char *password)
      : service_(service), document_(document), document_capacity_(document_capacity),
        username_(username), password_(password) {}

  bool canHandle(
      esphome::web_server_idf::AsyncWebServerRequest *request) const override {
    if (request->method() != HTTP_GET) return false;
    char url_buffer[
        esphome::web_server_idf::AsyncWebServerRequest::URL_BUF_SIZE];
    const esphome::StringRef url = request->url_to(url_buffer);
    return std::strcmp(url.c_str(), "/api/v1/config") == 0;
  }

  void handleRequest(
      esphome::web_server_idf::AsyncWebServerRequest *request) override {
#ifdef USE_WEBSERVER_AUTH
    if (!request->authenticate(username_, password_)) {
      request->requestAuthentication();
      return;
    }
#endif
    httpd_req_t *raw_request = *request;
    const ServiceLoadResult loaded =
        service_.load(document_, document_capacity_);
    if (loaded.status == ServiceStatus::EMPTY) {
      httpd_resp_send_err(raw_request, HTTPD_404_NOT_FOUND,
                          "No native configuration is stored");
      return;
    }
    if (!loaded.ok()) {
      httpd_resp_send_err(raw_request, HTTPD_500_INTERNAL_SERVER_ERROR,
                          "Native configuration is unavailable");
      return;
    }

    char generation[16]{};
    char etag[20]{};
    char version[8]{};
    std::snprintf(generation, sizeof(generation), "%lu",
                  static_cast<unsigned long>(loaded.generation));
    std::snprintf(etag, sizeof(etag), "\"%lu\"",
                  static_cast<unsigned long>(loaded.generation));
    std::snprintf(version, sizeof(version), "%u",
                  static_cast<unsigned>(loaded.document_version));
    httpd_resp_set_status(raw_request, "200 OK");
    httpd_resp_set_type(raw_request,
                        "application/vnd.espcontrol.panel-config");
    httpd_resp_set_hdr(raw_request, "Cache-Control", "no-store");
    httpd_resp_set_hdr(raw_request, "ETag", etag);
    httpd_resp_set_hdr(raw_request, "X-Panel-Config-Generation", generation);
    httpd_resp_set_hdr(raw_request, "X-Panel-Config-Version", version);
    httpd_resp_send(raw_request, reinterpret_cast<const char *>(document_),
                    loaded.document_size);
  }

 private:
  ConfigurationService &service_;
  uint8_t *document_;
  size_t document_capacity_;
  const char *username_;
  const char *password_;
};

inline bool register_panel_config_read_endpoint(
    ConfigurationService &service, uint8_t *document, size_t document_capacity,
    const char *username, const char *password) {
  static bool registered = false;
  if (registered) return true;
  if (document == nullptr || document_capacity == 0) return false;
  auto *server = esphome::web_server_idf::global_async_web_server();
  if (server == nullptr) return false;
  server->addHandler(
      new PanelConfigReadHandler(service, document, document_capacity, username,
                                 password));
  registered = true;
  return true;
}

}  // namespace espcontrol::configuration
#else
namespace espcontrol::configuration {
class ConfigurationService;
inline bool register_panel_config_read_endpoint(ConfigurationService &, uint8_t *,
                                               size_t, const char *, const char *) {
  return true;
}
}  // namespace espcontrol::configuration
#endif
