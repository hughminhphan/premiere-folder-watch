const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");

test("the app container is the vertical scroll area, not the document", () => {
  const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
  const appRule = css.match(/#app\s*\{([^}]*)\}/s);
  const documentRule = css.match(/html,\s*body\s*\{([^}]*)\}/s);

  assert.ok(appRule, "#app rule is missing");
  assert.match(appRule[1], /height:\s*100%/);
  assert.match(appRule[1], /overflow-y:\s*auto/);
  assert.ok(documentRule, "html, body rule is missing");
  assert.match(documentRule[1], /height:\s*100%/);
  assert.match(documentRule[1], /overflow:\s*hidden/);
});
