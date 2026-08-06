import fs from "node:fs";
import path from "node:path";
import process from "node:process";

export function parseArgs(argv = process.argv.slice(2)) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (!item.startsWith("--")) continue;
    const key = item.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith("--")) {
      args[key] = next;
      i += 1;
    } else {
      args[key] = true;
    }
  }
  return args;
}

export function loadConfig() {
  const args = parseArgs();
  const configPath = path.resolve(
    args.config ||
    process.env.DAY1_CONFIG_PATH ||
    "config.json"
  );
  if (!fs.existsSync(configPath)) {
    throw new Error(`找不到配置文件：${configPath}`);
  }
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  return { config, configPath, args };
}

export function outputDir() {
  const dir = path.resolve(process.env.DAY1_OUTPUT_DIR || "artifacts/latest");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function writeJson(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), "utf8");
}

export function writeText(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, value, "utf8");
}

export function nowIso() {
  return new Date().toISOString();
}

export function check(status, name, detail = "", evidence = "") {
  return { status, name, detail, evidence };
}

export function mergeUrl(base, route) {
  return new URL(route, base).toString();
}

export async function fetchWithTimeout(url, options = {}, timeoutMs = 20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "user-agent": "MemePhotoAI-Day1-Validation/1.0",
        ...(options.headers || {})
      }
    });
  } finally {
    clearTimeout(timer);
  }
}

export function redact(value) {
  if (!value) return "";
  return String(value)
    .replace(/AIza[0-9A-Za-z_-]{20,}/g, "[REDACTED_GOOGLE_KEY]")
    .replace(/sk-[0-9A-Za-z_-]{12,}/g, "[REDACTED_API_KEY]")
    .replace(/[A-Fa-f0-9]{32,}/g, "[REDACTED_TOKEN]");
}

export function relativeToOutput(filePath, outDir) {
  return path.relative(outDir, filePath).replaceAll("\\", "/");
}

export function statusCounts(checks = []) {
  const counts = { PASS: 0, FAIL: 0, WARN: 0, MANUAL: 0, SKIP: 0 };
  for (const item of checks) {
    if (counts[item.status] !== undefined) counts[item.status] += 1;
  }
  return counts;
}
