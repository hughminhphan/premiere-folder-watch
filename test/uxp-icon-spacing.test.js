const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const css = fs.readFileSync(path.resolve(__dirname, "..", "style.css"), "utf8");

// UXP does not apply flex `gap`, so the space beside each header icon is an explicit margin.
for (const selector of [".brand-mark", ".project-icon", ".folder-glyph"]) {
  test(`${selector} keeps a 9px gap before its heading`, () => {
    const escaped = selector.replace(".", "\\.");
    const block = css.match(new RegExp(`^${escaped} \\{[\\s\\S]*?\\n\\}`, "m"));
    assert.ok(block, `${selector} rule is missing`);
    assert.match(block[0], /margin-right:\s*9px/);
  });
}
