import { spawn } from "node:child_process";
import readline from "node:readline";
import { AsyncQueue } from "../utils/async-queue.js";
import { BackendInvocationError } from "../adapters/errors.js";
import type { BackendName } from "../types.js";

export interface ProcessLine {
  source: "stdout" | "stderr";
  line: string;
}

export interface SpawnStreamOptions {
  backend: BackendName;
  command: string;
  args: string[];
  cwd: string;
  env?: NodeJS.ProcessEnv;
  timeoutMs: number;
  maxOutputBytes: number;
  abortSignal?: AbortSignal;
}

function classifyExitCode(code: number | null): { code: string; transient: boolean } {
  if (code === 127) {
    return { code: "COMMAND_NOT_FOUND", transient: false };
  }
  if (code === 126) {
    return { code: "PERMISSION_DENIED", transient: false };
  }
  return { code: "PROCESS_EXIT_NON_ZERO", transient: true };
}

export async function* spawnStreamLines(options: SpawnStreamOptions): AsyncGenerator<ProcessLine> {
  const queue = new AsyncQueue<ProcessLine>();
  const child = spawn(options.command, options.args, {
    cwd: options.cwd,
    env: { ...process.env, ...options.env },
    stdio: ["ignore", "pipe", "pipe"]
  });

  let finished = false;
  let outputBytes = 0;
  let terminationError: BackendInvocationError | null = null;
  const stderrLines: string[] = [];

  const cleanup = (): void => {
    clearTimeout(timeoutId);
    options.abortSignal?.removeEventListener("abort", onAbort);
  };

  const terminateChild = (): void => {
    if (finished) {
      return;
    }
    child.kill("SIGTERM");
    setTimeout(() => {
      if (!finished) {
        child.kill("SIGKILL");
      }
    }, 1_500).unref();
  };

  const onAbort = (): void => {
    terminationError =
      terminationError ||
      new BackendInvocationError(`Request aborted for ${options.backend}`, {
        backend: options.backend,
        code: "REQUEST_ABORTED",
        transient: false
      });
    terminateChild();
  };

  if (options.abortSignal?.aborted) {
    onAbort();
  } else {
    options.abortSignal?.addEventListener("abort", onAbort);
  }

  const timeoutId = setTimeout(() => {
    terminationError =
      terminationError ||
      new BackendInvocationError(`${options.backend} request timed out`, {
        backend: options.backend,
        code: "TIMEOUT",
        transient: true
      });
    terminateChild();
  }, options.timeoutMs);
  timeoutId.unref();

  child.on("error", (error) => {
    terminationError =
      terminationError ||
      new BackendInvocationError(`Failed to spawn ${options.backend}: ${error.message}`, {
        backend: options.backend,
        code: "SPAWN_FAILED",
        transient: false,
        details: error.message
      });
    queue.fail(terminationError);
  });

  const stdout = child.stdout;
  const stderr = child.stderr;
  if (!stdout || !stderr) {
    throw new BackendInvocationError(`Failed to capture ${options.backend} process output`, {
      backend: options.backend,
      code: "SPAWN_FAILED",
      transient: false
    });
  }

  stdout.on("data", (chunk: Buffer) => {
    outputBytes += chunk.length;
    if (outputBytes > options.maxOutputBytes) {
      terminationError =
        terminationError ||
        new BackendInvocationError(`Output limit exceeded for ${options.backend}`, {
          backend: options.backend,
          code: "OUTPUT_LIMIT",
          transient: false
        });
      terminateChild();
    }
  });

  const stdoutReader = readline.createInterface({ input: stdout });
  stdoutReader.on("line", (line) => {
    queue.push({ source: "stdout", line });
  });

  const stderrReader = readline.createInterface({ input: stderr });
  stderrReader.on("line", (line) => {
    stderrLines.push(line);
    if (stderrLines.length > 20) {
      stderrLines.shift();
    }
    queue.push({ source: "stderr", line });
  });

  child.on("close", (code, signal) => {
    finished = true;
    cleanup();
    stdoutReader.close();
    stderrReader.close();

    if (terminationError) {
      queue.fail(terminationError);
      return;
    }

    if (signal) {
      queue.fail(
        new BackendInvocationError(`${options.backend} terminated by signal ${signal}`, {
          backend: options.backend,
          code: "PROCESS_SIGNAL",
          transient: true,
          details: stderrLines.join("\n")
        })
      );
      return;
    }

    if (code !== 0) {
      const classified = classifyExitCode(code);
      queue.fail(
        new BackendInvocationError(`${options.backend} exited with code ${code}`, {
          backend: options.backend,
          code: classified.code,
          transient: classified.transient,
          details: stderrLines.join("\n")
        })
      );
      return;
    }

    queue.end();
  });

  try {
    for await (const line of queue) {
      yield line;
    }
  } finally {
    cleanup();
    if (!finished) {
      terminateChild();
    }
  }
}
