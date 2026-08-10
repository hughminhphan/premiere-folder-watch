#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const runtimeFiles = [
  "manifest.json",
  "index.html",
  "style.css",
  "main.js",
  "watch-core.js"
];

function fail(message) {
  process.stderr.write(`check: ${message}\n`);
  process.exitCode = 1;
}

if (manifest.version !== packageJson.version) {
  fail(`manifest version ${manifest.version} does not match package version ${packageJson.version}`);
}

if (manifest.id !== "com.hughp.folderwatch") {
  fail(`unexpected plugin id: ${manifest.id}`);
}

for (const file of runtimeFiles) {
  const filePath = path.join(root, file);
  if (!fs.existsSync(filePath)) {
    fail(`missing runtime file: ${file}`);
    continue;
  }
  if (fs.readFileSync(filePath).includes(0)) fail(`${file} contains a NUL byte`);
}

for (const file of ["main.js", "watch-core.js", "scripts/check.js", "scripts/package.js", "scripts/load-via-udt.js"]) {
  const result = spawnSync(process.execPath, ["--check", file], {
    cwd: root,
    encoding: "utf8"
  });
  if (result.status !== 0) fail(`${file} failed syntax validation\n${result.stderr}`);
}

const tests = spawnSync(process.execPath, ["--test"], {
  cwd: root,
  encoding: "utf8"
});
if (tests.status !== 0) fail(`tests failed\n${tests.stdout}\n${tests.stderr}`);
else process.stdout.write(tests.stdout);

if (!process.exitCode) {
  process.stdout.write(`check: ${runtimeFiles.length} runtime files validated for Folder Watch ${manifest.version}\n`);
}
