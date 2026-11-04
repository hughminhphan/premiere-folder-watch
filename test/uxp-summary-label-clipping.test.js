const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const css = fs.readFileSync(path.resolve(__dirname, "..", "style.css"), "utf8");

test("summary labels have room above and below the glyphs without changing the row height", () => {
  const rule = css.match(/^\.summary span \{[^}]*\}/m);
  assert.ok(rule, ".summary span rule is missing");
  // overflow: hidden clips the top and bottom of the glyphs; padding makes room; the negative margins cancel the padding and the taller line box.
  assert.match(rule[0], /padding:\s*3px 0/);
  assert.match(rule[0], /margin:\s*-3px 0 -6px/);
  // A fixed line height keeps every label on the same baseline; "normal" shifted words with descenders.
  assert.match(rule[0], /line-height:\s*14px/);
});
