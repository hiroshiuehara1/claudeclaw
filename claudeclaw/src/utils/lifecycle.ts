import { logger } from "./logger.js";

export type CleanupHandler = {
  name: string;
  handler: () => Promise<void> | void;
};

export class LifecycleManager {
  private handlers: CleanupHandler[] = [];
  private shuttingDown = false;
  private forcedExitTimeout: number;

  constructor(forcedExitTimeout = 10_000) {
    this.forcedExitTimeout = forcedExitTimeout;
  }

  register(name: string, handler: () => Promise<void> | void): void {
    this.handlers.push({ name, handler });
  }

  install(): void {
    const shutdown = async (signal: string) => {
      if (this.shuttingDown) return;
      this.shuttingDown = true;
      logger.info(`Received ${signal}, shutting down gracefully...`);

      // Force exit after timeout to prevent hanging
      const forceTimer = setTimeout(() => {
        logger.warn(`Forced exit after ${this.forcedExitTimeout}ms timeout`);
        process.exit(1);
      }, this.forcedExitTimeout);
      forceTimer.unref();

      await this.runAll();
      process.exit(0);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  }

  async runAll(): Promise<void> {
    for (const { name, handler } of this.handlers) {
      try {
        logger.info(`Cleanup: ${name}...`);
        await handler();
        logger.info(`Cleanup: ${name} done`);
      } catch (err) {
        logger.error(
          `Cleanup: ${name} failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  }
}
