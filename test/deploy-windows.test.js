const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const script = path.join(root, "scripts", "deploy-windows.sh");
const runtimeFiles = ["manifest.json", "index.html", "style.css", "main.js", "watch-core.js"];
const hasBash = process.platform !== "win32" && spawnSync("bash", ["--version"]).status === 0;

function deploy(dest) {
  return spawnSync("bash", [script, dest], {
    encoding: "utf8",
    env: { ...process.env, SKIP_CHECK: "1" },
  });
}

test("deploy copies exactly the runtime files and is repeatable", { skip: !hasBash }, () => {
  const dest = fs.mkdtempSync(path.join(os.tmpdir(), "fw-deploy-"));
  fs.writeFileSync(path.join(dest, "unrelated.txt"), "keep");

  for (let run = 0; run < 2; run += 1) {
    const result = deploy(dest);
    assert.equal(result.status, 0, result.stderr);
  }

  assert.deepEqual(fs.readdirSync(dest).sort(), [...runtimeFiles, "unrelated.txt"].sort());
  for (const file of runtimeFiles) {
    assert.deepEqual(fs.readFileSync(path.join(dest, file)), fs.readFileSync(path.join(root, file)));
  }
  fs.rmSync(dest, { recursive: true, force: true });
});
