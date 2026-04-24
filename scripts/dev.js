#!/usr/bin/env node

const path = require("path");
const { spawn } = require("child_process");

const rootDir = path.resolve(__dirname, "..");

function startProcess(name, args) {
  const child = spawn("npm", args, {
    cwd: rootDir,
    env: process.env,
    stdio: ["inherit", "pipe", "pipe"],
  });

  child.stdout.on("data", (chunk) => {
    process.stdout.write(`[${name}] ${chunk}`);
  });

  child.stderr.on("data", (chunk) => {
    process.stderr.write(`[${name}] ${chunk}`);
  });

  return child;
}

const children = [
  startProcess("web", ["run", "web"]),
  startProcess("mobile", ["run", "mobile"]),
];

let shuttingDown = false;

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill(signal);
    }
  }
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => shutdown(signal));
}

for (const child of children) {
  child.on("exit", (code, signal) => {
    if (!shuttingDown) {
      shutdown("SIGTERM");
    }

    if (signal) {
      process.exitCode = 1;
      return;
    }

    if ((code ?? 0) !== 0) {
      process.exitCode = code ?? 1;
    }
  });
}
