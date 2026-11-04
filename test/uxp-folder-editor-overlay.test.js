const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");

test("the folder editor overlay is sized to the viewport without position:fixed or inset", () => {
  const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
  const backdropRule = css.match(/\.editor-backdrop\s*\{([^}]*)\}/s);

  assert.ok(backdropRule, "editor backdrop rule is missing");
  assert.match(backdropRule[1], /position:\s*absolute/);
  assert.match(backdropRule[1], /top:\s*0/);
  assert.match(backdropRule[1], /left:\s*0/);
  assert.match(backdropRule[1], /width:\s*100%/);
  assert.match(backdropRule[1], /height:\s*100%/);
  assert.doesNotMatch(backdropRule[1], /position:\s*fixed|inset:/);
});
