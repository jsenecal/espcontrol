#include "ha_read_coordinator.h"

#include <cstdlib>
#include <functional>
#include <string>
#include <utility>
#include <vector>

namespace {

struct FakeTransport {
  using State = std::string;
  using Callback = std::function<void(State)>;

  struct Request {
    std::string entity_id;
    std::string attribute;
    Callback callback;
  };

  bool api_available = true;
  bool connected = true;
  std::vector<Request> reads;
  std::vector<Request> subscriptions;

  bool available() const { return api_available; }
  bool state_connected() const { return connected; }

  void get(std::string entity_id, std::string attribute, Callback callback) {
    reads.push_back({std::move(entity_id), std::move(attribute), std::move(callback)});
  }

  void subscribe(const std::string &entity_id,
                 const std::string &attribute,
                 Callback callback) {
    subscriptions.push_back({entity_id, attribute, std::move(callback)});
  }

  void deliver_read(size_t index, const std::string &state) {
    Callback callback = reads.at(index).callback;
    callback(state);
  }

  void publish(size_t index, const std::string &state) {
    Callback callback = subscriptions.at(index).callback;
    callback(state);
  }
};

struct FakeHeapProbe {
  bool enough = true;
  size_t checks = 0;

  bool available(const char *, size_t, size_t) {
    checks++;
    return enough;
  }
};

using Coordinator = HaReadCoordinator<FakeTransport, FakeHeapProbe>;

[[noreturn]] void fail(const char *message) {
  (void) message;
  std::abort();
}

void require(bool condition, const char *message) {
  if (!condition) fail(message);
}

void disconnected_read_flushes_after_reconnect() {
  Coordinator coordinator;
  coordinator.transport().connected = false;
  std::string received;
  require(coordinator.get("sensor.room", "", [&](std::string value) { received = value; },
                          false, 10, 5),
          "disconnected read should queue");
  require(coordinator.deferred_count() == 1 && coordinator.transport().reads.empty(),
          "disconnected read was not deferred");
  coordinator.transport().connected = true;
  coordinator.flush(8, 10, 5);
  require(coordinator.transport().reads.size() == 1, "reconnected read was not sent");
  coordinator.transport().deliver_read(0, "ready");
  require(received == "ready", "reconnected callback was not invoked");
}

void low_memory_preserves_deferred_work() {
  Coordinator coordinator;
  coordinator.transport().connected = false;
  int calls = 0;
  require(coordinator.get("sensor.heap", "", [&](std::string) { calls++; }, false, 10, 5),
          "read should queue before heap pressure");
  coordinator.transport().connected = true;
  coordinator.heap_probe().enough = false;
  coordinator.flush(8, 10, 5);
  require(coordinator.deferred_count() == 1 && coordinator.transport().reads.empty(),
          "low-memory flush should retain work");
  coordinator.heap_probe().enough = true;
  coordinator.flush(8, 10, 5);
  coordinator.transport().deliver_read(0, "ok");
  require(calls == 1, "deferred low-memory read did not recover");
}

void duplicate_reads_fan_out_once() {
  Coordinator coordinator;
  coordinator.transport().connected = false;
  int first = 0;
  int second = 0;
  require(coordinator.get("sensor.same", "", [&](std::string) { first++; }, false, 10, 5),
          "first duplicate read should queue");
  require(coordinator.get("sensor.same", "", [&](std::string) { second++; }, false, 10, 5),
          "second duplicate read should join");
  require(coordinator.deferred_count() == 1, "duplicate reads were not coalesced");
  coordinator.transport().connected = true;
  coordinator.flush(8, 10, 5);
  require(coordinator.transport().reads.size() == 1, "duplicate reads sent more than once");
  coordinator.transport().deliver_read(0, "on");
  require(first == 1 && second == 1, "duplicate callbacks did not fan out");
}

void reentrant_reads_are_deferred() {
  Coordinator coordinator;
  int nested = 0;
  require(coordinator.get(
              "sensor.outer", "",
              [&](std::string) {
                require(coordinator.get("sensor.inner", "", [&](std::string) { nested++; },
                                        false, 10, 5),
                        "nested read should queue");
              },
              false, 10, 5),
          "outer read should send");
  coordinator.transport().deliver_read(0, "outer");
  require(coordinator.deferred_count() == 1 && coordinator.transport().reads.size() == 1,
          "reentrant read was sent inside callback");
  coordinator.flush(8, 10, 5);
  require(coordinator.transport().reads.size() == 2, "reentrant read did not flush");
  coordinator.transport().deliver_read(1, "inner");
  require(nested == 1, "reentrant callback did not run");
}

void cancellation_is_safe_during_callback() {
  Coordinator coordinator;
  constexpr uint32_t scope = 1u << 2;
  int calls = 0;
  require(coordinator.subscribe(
              "sensor.cancel", "",
              [&](std::string) {
                calls++;
                coordinator.reset_subscriptions(scope);
              },
              scope),
          "subscription should register");
  coordinator.transport().publish(0, "first");
  coordinator.transport().publish(0, "second");
  require(calls == 1 && coordinator.subscription_count() == 0,
          "callback cancellation was not deferred safely");
}

void stale_generations_do_not_deliver() {
  Coordinator coordinator;
  int calls = 0;
  require(coordinator.get("sensor.stale", "", [&](std::string) { calls++; }, false, 10, 5),
          "stale read should send");
  uint32_t old_generation = coordinator.generation();
  coordinator.bump_generation(1u);
  require(coordinator.generation() != old_generation, "generation did not advance");
  coordinator.transport().deliver_read(0, "late");
  require(calls == 0, "stale in-flight callback was delivered");

  coordinator.transport().connected = false;
  require(coordinator.get("sensor.queued", "", [&](std::string) { calls++; }, false, 10, 5),
          "queued stale read should be accepted");
  coordinator.bump_generation(1u);
  require(coordinator.deferred_count() == 0, "generation cleanup retained deferred work");
}

void attribute_requests_preserve_attribute() {
  Coordinator coordinator;
  require(coordinator.get("media_player.room", "media_title", [](std::string) {}, true, 10, 5),
          "attribute read should send");
  require(coordinator.transport().reads.size() == 1 &&
              coordinator.transport().reads[0].attribute == "media_title",
          "attribute read lost its attribute");
}

void rebuilt_subpage_subscriptions_request_current_state() {
  Coordinator coordinator;
  constexpr uint32_t subpage_scope = 1u << 4;
  int calls = 0;
  std::string state;
  require(coordinator.subscribe(
              "light.kitchen", "brightness",
              [&](std::string value) {
                calls++;
                state = std::move(value);
              },
              subpage_scope, true, 10, 5),
          "subpage subscription should register");
  require(coordinator.transport().subscriptions.size() == 1,
          "subpage subscription was not registered");
  require(coordinator.transport().reads.size() == 1,
          "subpage subscription did not request its current value");
  require(coordinator.transport().reads[0].attribute == "brightness",
          "subpage initial read lost its attribute");
  coordinator.transport().deliver_read(0, "128");
  coordinator.transport().publish(0, "255");
  require(calls == 2 && state == "255",
          "subpage subscription did not retain live updates after its initial read");
}

void discarded_subpage_initial_reads_do_not_touch_deleted_widgets() {
  Coordinator coordinator;
  constexpr uint32_t subpage_scope = 1u << 4;
  int calls = 0;
  require(coordinator.subscribe(
              "sensor.discarded", "",
              [&](std::string) { calls++; },
              subpage_scope, true, 10, 5),
          "discarded subpage subscription should register");
  require(coordinator.transport().reads.size() == 1,
          "discarded subpage should queue an initial read");
  coordinator.reset_subscriptions(subpage_scope);
  coordinator.transport().deliver_read(0, "late");
  require(calls == 0,
          "discarded subpage initial read invoked a callback after cleanup");
}

}  // namespace

int main() {
  disconnected_read_flushes_after_reconnect();
  low_memory_preserves_deferred_work();
  duplicate_reads_fan_out_once();
  reentrant_reads_are_deferred();
  cancellation_is_safe_during_callback();
  stale_generations_do_not_deliver();
  attribute_requests_preserve_attribute();
  rebuilt_subpage_subscriptions_request_current_state();
  discarded_subpage_initial_reads_do_not_touch_deleted_widgets();
  return EXIT_SUCCESS;
}
