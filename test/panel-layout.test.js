const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");

test("folder settings stay scrollable and save remains reachable in a short panel", () => {
  const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
  const editorRule = css.match(/\.folder-editor\s*\{([^}]*)\}/s);

  assert.ok(editorRule, "folder editor rule is missing");
  assert.match(editorRule[1], /max-height:\s*calc\(100vh\s*-\s*24px\)/);
  assert.match(editorRule[1], /flex:\s*0\s+0\s+auto/);
  assert.match(editorRule[1], /overflow-y:\s*auto/);
});
