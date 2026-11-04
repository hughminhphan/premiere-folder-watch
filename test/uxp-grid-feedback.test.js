const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");

test("sync feedback areas use flex because UXP does not support CSS grid", () => {
  const css = fs.readFileSync(path.join(root, "style.css"), "utf8");

  for (const selector of [".summary", ".card-meta", ".activity-item"]) {
    const escaped = selector.replace(".", "\\.");
    const rule = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, "s"));
    assert.ok(rule, `${selector} rule is missing`);
    assert.doesNotMatch(rule[1], /display:\s*grid|grid-template/, `${selector} must not use grid`);
  }
  assert.match(css.match(/\.summary\s*\{([^}]*)\}/s)[1], /display:\s*flex/);
  assert.match(css.match(/\.activity-item\s*\{([^}]*)\}/s)[1], /display:\s*flex/);
});
