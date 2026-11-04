const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");

test("decorative icon boxes use flex centering because UXP does not support grid or button children", () => {
  const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const js = fs.readFileSync(path.join(root, "main.js"), "utf8");

  for (const selector of [".brand-mark", ".icon-button", ".project-icon"]) {
    const escaped = selector.replace(".", "\\.");
    const bodies = [...css.matchAll(new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`, "gs"))].map((match) => match[1]).join("\n");
    assert.ok(bodies, `${selector} rule is missing`);
    assert.match(bodies, /display:\s*flex/);
    assert.doesNotMatch(bodies, /display:\s*grid|place-items/);
  }
  assert.match(html, /<div id="syncNow" class="icon-button" role="button" tabindex="0"/);
  assert.doesNotMatch(html, /<button id="syncNow"/);
  assert.match(js, /classList\.toggle\("is-disabled", syncUnavailable\)/);
  assert.match(js, /if \(!\$\("syncNow"\)\.classList\.contains\("is-disabled"\)\) syncAll\("manual"\)/);
});
