import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import type { AppConfig } from "../../core/config.js";

export type DoctorStatus = "pass" | "fail" | "warn";

export interface DoctorCheck {
  name: string;
  status: DoctorStatus;
  detail: string;
}

export interface DoctorReport {
  ok: boolean;
  checks: DoctorCheck[];
}

export interface DoctorOptions {
  noWriteCheck?: boolean;
}

function runCommandCheck(command: string, args: string[]): { ok: boolean; detail: string } {
  const result = spawnSync(command, args, {
    encoding: "utf-8",
    timeout: 15_000,
    stdio: ["ignore", "pipe", "pipe"]
  });

  if (result.error) {
    return {
      ok: false,
      detail: result.error.message
    };
  }

  if (typeof result.status === "number" && result.status !== 0) {
    const stderr = (result.stderr || "").trim();
    return {
      ok: false,
      detail: stderr || `${command} exited with status ${result.status}`
    };
  }

  const stdout = (result.stdout || "").trim();
  const summaryLine = stdout
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0);
  return {
    ok: true,
    detail: (summaryLine && summaryLine.slice(0, 200)) || `${command} ${args.join(" ")} succeeded`
  };
}

function checkWritable(targetDir: string): { ok: boolean; detail: string } {
  try {
    fs.mkdirSync(targetDir, { recursive: true });
    const probePath = path.join(targetDir, `.probe-${Date.now()}`);
    fs.writeFileSync(probePath, "ok", "utf-8");
    fs.unlinkSync(probePath);
    return { ok: true, detail: `Writable: ${targetDir}` };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, detail: message };
  }
}

export function runDoctor(config: AppConfig, options: DoctorOptions = {}): DoctorReport {
  const checks: DoctorCheck[] = [];

  const codexVersion = runCommandCheck("codex", ["--version"]);
  checks.push({
    name: "codex command",
    status: codexVersion.ok ? "pass" : "fail",
    detail: codexVersion.detail
  });

  const codexExecHelp = runCommandCheck("codex", ["exec", "--help"]);
  checks.push({
    name: "codex exec mode",
    status: codexExecHelp.ok ? "pass" : "fail",
    detail: codexExecHelp.detail
  });

  const claudeVersion = runCommandCheck("claude", ["--version"]);
  checks.push({
    name: "claude command",
    status: claudeVersion.ok ? "pass" : "fail",
    detail: claudeVersion.detail
  });

  const claudePrintHelp = runCommandCheck("claude", ["-p", "--help"]);
  checks.push({
    name: "claude print mode",
    status: claudePrintHelp.ok ? "pass" : "fail",
    detail: claudePrintHelp.detail
  });

  if (options.noWriteCheck) {
    checks.push({
      name: "data directory",
      status: "warn",
      detail: "Skipped via --no-write-check"
    });
    checks.push({
      name: "db directory",
      status: "warn",
      detail: "Skipped via --no-write-check"
    });
  } else {
    const dataDir = checkWritable(config.dataDir);
    checks.push({
      name: "data directory",
      status: dataDir.ok ? "pass" : "fail",
      detail: dataDir.detail
    });

    const dbDir = checkWritable(path.dirname(config.dbPath));
    checks.push({
      name: "db directory",
      status: dbDir.ok ? "pass" : "fail",
      detail: dbDir.detail
    });
  }

  const workspaceExists = fs.existsSync(config.workspaceDir);
  checks.push({
    name: "workspace path",
    status: workspaceExists ? "pass" : "fail",
    detail: workspaceExists ? `Exists: ${config.workspaceDir}` : `Missing: ${config.workspaceDir}`
  });

  const ok = checks.every((check) => check.status !== "fail");
  return { ok, checks };
}

export function printDoctorReport(report: DoctorReport): void {
  const icon = {
    pass: "[PASS]",
    fail: "[FAIL]",
    warn: "[WARN]"
  } as const;

  for (const check of report.checks) {
    process.stdout.write(`${icon[check.status]} ${check.name}: ${check.detail}\n`);
  }

  process.stdout.write(`\nOverall: ${report.ok ? "healthy" : "unhealthy"}\n`);
}
