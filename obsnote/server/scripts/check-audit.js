import fs from "fs";

const AUDIT_FILE = "audit-report.json";
const FAIL_LEVEL = (process.env.AUDIT_FAIL_LEVEL ?? "moderate").toLowerCase();
const severityOrder = ["info", "low", "moderate", "high", "critical"];

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

if (!severityOrder.includes(FAIL_LEVEL)) {
  fail(`Invalid AUDIT_FAIL_LEVEL '${FAIL_LEVEL}'. Use one of: ${severityOrder.join(", ")}`);
}

if (!fs.existsSync(AUDIT_FILE)) {
  fail(`Missing ${AUDIT_FILE}. Run 'npm run audit:report' first.`);
}

let report;
try {
  report = JSON.parse(fs.readFileSync(AUDIT_FILE, "utf8"));
} catch (error) {
  fail(`Could not parse ${AUDIT_FILE}: ${error.message}`);
}

const counts = report?.metadata?.vulnerabilities;
if (!counts) {
  fail(`Unexpected npm audit JSON structure in ${AUDIT_FILE}.`);
}

const info = counts.info ?? 0;
const low = counts.low ?? 0;
const moderate = counts.moderate ?? 0;
const high = counts.high ?? 0;
const critical = counts.critical ?? 0;
const total = counts.total ?? info + low + moderate + high + critical;

console.log("npm audit summary");
console.log(`- policy fail level: ${FAIL_LEVEL}`);
console.log(`- total: ${total}`);
console.log(`- info: ${info}`);
console.log(`- low: ${low}`);
console.log(`- moderate: ${moderate}`);
console.log(`- high: ${high}`);
console.log(`- critical: ${critical}`);

const severityCounts = { info, low, moderate, high, critical };
const failFromIndex = severityOrder.indexOf(FAIL_LEVEL);
const failingSeverities = severityOrder.slice(failFromIndex);
const failed = failingSeverities.some((severity) => (severityCounts[severity] ?? 0) > 0);

if (failed) {
  fail(`Audit policy failed: vulnerabilities found at '${FAIL_LEVEL}' severity or higher.`);
}

console.log(`Audit policy passed: no '${FAIL_LEVEL}+' vulnerabilities.`);
