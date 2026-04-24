#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const rootDir = path.resolve(__dirname, "..");
const envPath = path.join(rootDir, ".env");

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const contents = fs.readFileSync(filePath, "utf8");
  const lines = contents.split(/\r?\n/);
  const parsed = {};

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    parsed[key] = value;
  }

  return parsed;
}

function getApiUrl(env) {
  return env.EXPO_PUBLIC_API_URL?.trim() || "http://localhost:3000";
}

function getPortFromUrl(urlString) {
  const url = new URL(urlString);
  if (url.port) return url.port;
  return url.protocol === "https:" ? "443" : "80";
}

function run(command, args, env) {
  const child = spawn(command, args, {
    cwd: rootDir,
    env,
    stdio: "inherit",
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 0);
  });
}

const [, , target, mobileScript] = process.argv;

if (!target) {
  console.error("Usage: node scripts/dev-env.js <web|mobile> [mobile-script]");
  process.exit(1);
}

const fileEnv = parseEnvFile(envPath);
const env = {
  ...process.env,
  ...fileEnv,
};

env.EXPO_PUBLIC_API_URL = getApiUrl(env);

if (target === "web") {
  env.PORT = getPortFromUrl(env.EXPO_PUBLIC_API_URL);
  run("npm", ["run", "dev", "-w", "@suliv/web"], env);
  return;
}

if (target === "mobile") {
  const script = mobileScript || "start";
  run("npm", ["run", script, "-w", "@suliv/mobile"], env);
  return;
}

console.error(`Unknown target: ${target}`);
process.exit(1);
