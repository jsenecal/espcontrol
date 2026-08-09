#pragma once

#include <cstddef>
#include <cstdint>

#ifdef USE_WEBSERVER
#include <cstdio>
#include <cstring>

#include <esp_http_server.h>

#include "configuration_service.h"
#include "esphome/components/web_server_idf/web_server_idf.h"
#include "panel_config_document.h"
#include "panel_config_http_etag.h"

namespace espcontrol::configuration {

class PanelConfigWriteHandler final
    : public esphome::web_server_idf::AsyncWebHandler {
 public:
  PanelConfigWriteHandler(ConfigurationService &service, uint8_t *document,
                          size_t document_capacity, const char *username,
                          const char *password)
      : service_(service), document_(document), document_capacity_(document_capacity),
        username_(username), password_(password) {}

  bool canHandle(
      esphome::web_server_idf::AsyncWebServerRequest *request) const override {
    if (request->method() != HTTP_PUT) return false;
    char url_buffer[
        esphome::web_server_idf::AsyncWebServerRequest::URL_BUF_SIZE];
    const esphome::StringRef url = request->url_to(url_buffer);
    return std::strcmp(url.c_str(), "/api/v1/config") == 0;
  }

  void handleBody(esphome::web_server_idf::AsyncWebServerRequest *, uint8_t *data,
                  size_t len, size_t index, size_t total) override {
    if (index == 0) {
      received_size_ = 0;
      expected_size_ = total;
      body_valid_ = total > 0 && total <= document_capacity_;
    }
    if (!body_valid_ || data == nullptr || index != received_size_ ||
        len > document_capacity_ - received_size_) {
      body_valid_ = false;
      return;
    }
    std::memcpy(document_ + received_size_, data, len);
    received_size_ += len;
  }

  void handleRequest(
      esphome::web_server_idf::AsyncWebServerRequest *request) override {
#ifdef USE_WEBSERVER_AUTH
    if (!request->authenticate(username_, password_)) {
      request->requestAuthentication();
      reset_upload();
      return;
    }
#endif
    httpd_req_t *raw_request = *request;
    const auto content_type = request->get_header("Content-Type");
    if (!content_type.has_value() ||
        *content_type != "application/vnd.espcontrol.panel-config") {
      send_status(raw_request, "415 Unsupported Media Type",
                  "Panel configuration must use its binary media type");
      reset_upload();
      return;
    }
    if (!body_valid_ || expected_size_ == 0 ||
        received_size_ != expected_size_) {
      httpd_resp_send_err(raw_request, HTTPD_400_BAD_REQUEST,
                          "Invalid panel configuration body");
      reset_upload();
      return;
    }
    const auto if_match = request->get_header("If-Match");
    uint32_t expected_generation = 0;
    if (!if_match.has_value() ||
        !parse_panel_config_etag(if_match->c_str(), &expected_generation)) {
      send_status(raw_request, "428 Precondition Required",
                  "A quoted If-Match generation is required");
      reset_upload();
      return;
    }

    const ServiceSaveResult saved = service_.save_if_generation(
        expected_generation, PANEL_CONFIG_DOCUMENT_VERSION, document_, received_size_);
    reset_upload();
    if (saved.status == ServiceStatus::GENERATION_CONFLICT) {
      set_generation_headers(raw_request, saved.generation);
      send_status(raw_request, "409 Conflict",
                  "Panel configuration changed on the device");
      return;
    }
    if (saved.status == ServiceStatus::INVALID_DOCUMENT ||
        saved.status == ServiceStatus::UNSUPPORTED_VERSION ||
        saved.status == ServiceStatus::INVALID_ARGUMENT) {
      httpd_resp_send_err(raw_request, HTTPD_400_BAD_REQUEST,
                          "Invalid panel configuration document");
      return;
    }
    if (!saved.durable()) {
      httpd_resp_send_err(raw_request, HTTPD_500_INTERNAL_SERVER_ERROR,
                          "Panel configuration could not be saved");
      return;
    }
    set_generation_headers(raw_request, saved.generation);
    if (saved.status == ServiceStatus::LEGACY_MIRROR_FAILED) {
      httpd_resp_set_hdr(raw_request, "X-Panel-Config-Legacy-Mirror", "failed");
      httpd_resp_set_status(raw_request, "202 Accepted");
    } else {
      httpd_resp_set_status(raw_request, "204 No Content");
    }
    httpd_resp_send(raw_request, nullptr, 0);
  }

 private:
  static void send_status(httpd_req_t *request, const char *status,
                          const char *message) {
    httpd_resp_set_status(request, status);
    httpd_resp_set_type(request, "text/plain");
    httpd_resp_send(request, message, HTTPD_RESP_USE_STRLEN);
  }

  void reset_upload() {
    received_size_ = 0;
    expected_size_ = 0;
    body_valid_ = false;
  }

  static void set_generation_headers(httpd_req_t *request, uint32_t generation) {
    char generation_text[16]{};
    char etag[20]{};
    std::snprintf(generation_text, sizeof(generation_text), "%lu",
                  static_cast<unsigned long>(generation));
    std::snprintf(etag, sizeof(etag), "\"%lu\"",
                  static_cast<unsigned long>(generation));
    httpd_resp_set_hdr(request, "ETag", etag);
    httpd_resp_set_hdr(request, "X-Panel-Config-Generation", generation_text);
    httpd_resp_set_hdr(request, "X-Panel-Config-Version", "1");
  }

  ConfigurationService &service_;
  uint8_t *document_;
  size_t document_capacity_;
  const char *username_;
  const char *password_;
  size_t received_size_{0};
  size_t expected_size_{0};
  bool body_valid_{false};
};

inline bool register_panel_config_write_endpoint(
    ConfigurationService &service, uint8_t *document, size_t document_capacity,
    const char *username, const char *password) {
  static bool registered = false;
  if (registered) return true;
  if (document == nullptr || document_capacity == 0) return false;
  auto *server = esphome::web_server_idf::global_async_web_server();
  if (server == nullptr) return false;
  server->addHandler(new PanelConfigWriteHandler(service, document,
                                                  document_capacity, username,
                                                  password));
  registered = true;
  return true;
}

}  // namespace espcontrol::configuration
#else
namespace espcontrol::configuration {
class ConfigurationService;
inline bool register_panel_config_write_endpoint(ConfigurationService &, uint8_t *,
                                                size_t, const char *, const char *) {
  return true;
}
}  // namespace espcontrol::configuration
#endif
