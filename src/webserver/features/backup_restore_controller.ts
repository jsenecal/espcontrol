export interface BackupRestoreControllerOptions<Plan, Target> {
  readonly plan: (data: unknown, target: Target) => Plan;
  readonly warnings: (plan: Plan) => readonly string[];
  readonly showBanner: (message: string, kind: "warning" | "error" | "success") => void;
  readonly setPostThrottle: (milliseconds: number) => void;
  readonly resetPostQueueError: () => void;
  readonly postQueueIdle: () => Promise<unknown>;
  readonly postQueueHadError: () => boolean;
}

/** Coordinates a restore so all entity posts use the same safe queue lifecycle. */
export function createBackupRestoreController<Plan, Target>(
  options: BackupRestoreControllerOptions<Plan, Target>,
) {
  return {
    restore(data: unknown, target: Target, apply: (plan: Plan) => void): boolean {
      let backupPlan: Plan;
      try {
        backupPlan = options.plan(data, target);
      } catch (error) {
        const message = (error as Error & { backupMessage?: string }).backupMessage
          || "Invalid config file \u2014 missing required fields";
        options.showBanner(message, "error");
        return false;
      }

      for (const warning of options.warnings(backupPlan)) options.showBanner(warning, "warning");

      options.setPostThrottle(75);
      options.resetPostQueueError();
      try {
        apply(backupPlan);
      } finally {
        options.setPostThrottle(0);
      }
      options.postQueueIdle().then(() => {
        if (!options.postQueueHadError()) options.showBanner("Configuration imported successfully", "success");
      });
      return true;
    },
  };
}
