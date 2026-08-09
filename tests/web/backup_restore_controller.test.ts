import { createBackupRestoreController } from "../../src/webserver/features/backup_restore_controller";

function equal<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) throw new Error(`${message}: expected ${String(expected)}, received ${String(actual)}`);
}

export async function runBackupRestoreControllerTests(): Promise<void> {
  const events: string[] = [];
  let resolveIdle: (() => void) | undefined;
  const controller = createBackupRestoreController<{ warnings: string[] }, { device: string }>({
    plan: () => ({ warnings: ["Different device"] }),
    warnings: (plan) => plan.warnings,
    showBanner: (message, kind) => events.push(`${kind}:${message}`),
    setPostThrottle: (milliseconds) => events.push(`throttle:${milliseconds}`),
    resetPostQueueError: () => events.push("reset"),
    postQueueIdle: () => new Promise<void>((resolve) => { resolveIdle = resolve; }),
    postQueueHadError: () => false,
  });

  equal(controller.restore({}, { device: "panel" }, () => events.push("apply")), true, "valid backups start a restore");
  equal(
    events.join(","),
    "warning:Different device,throttle:75,reset,apply,throttle:0",
    "restore preserves warning and queued-write ordering",
  );
  resolveIdle?.();
  await Promise.resolve();
  equal(events.at(-1), "success:Configuration imported successfully", "successful queue completion is reported");

  const rejected = createBackupRestoreController<never, undefined>({
    plan: () => { throw Object.assign(new Error("invalid"), { backupMessage: "Backup is too new" }); },
    warnings: () => [],
    showBanner: (message, kind) => events.push(`${kind}:${message}`),
    setPostThrottle: () => { throw new Error("must not enqueue invalid backup"); },
    resetPostQueueError: () => { throw new Error("must not reset invalid backup"); },
    postQueueIdle: async () => undefined,
    postQueueHadError: () => false,
  });
  equal(rejected.restore({}, undefined, () => { throw new Error("must not apply invalid backup"); }), false,
    "invalid backups are rejected before writes");
  equal(events.at(-1), "error:Backup is too new", "validation error stays user-readable");
}
