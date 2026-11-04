const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");

test("global settings use an explicit toggle control (not a <button>, which UXP will not lay out children in) instead of details/summary", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const js = fs.readFileSync(path.join(root, "main.js"), "utf8");

  assert.doesNotMatch(html, /<details|<summary/);
  assert.match(html, /<div id="settingsToggle"[^>]*role="button"[^>]*aria-expanded="false"[^>]*aria-controls="settingsBody"/);
  assert.match(html, /<div class="settings-header">\s*<span>Global settings<\/span>\s*<div id="settingsToggle"/);
  assert.match(html, /<div id="settingsBody"[^>]*\shidden/);
  assert.match(js, /\$\("settingsToggle"\)\.addEventListener\("click", toggleSettingsPanel\)/);
});

test("collapsing global settings only hides the body and never touches its controls", () => {
  const js = fs.readFileSync(path.join(root, "main.js"), "utf8");
  const setter = js.match(/function setSettingsPanelExpanded[\s\S]*?\n\}/);

  assert.ok(setter, "setSettingsPanelExpanded is missing");
  assert.doesNotMatch(setter[0], /\.value|\.checked|innerHTML|textContent/);
});

test("only the chevron toggles global settings and collapsed swaps to a separately drawn rotated chevron", () => {
  const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const js = fs.readFileSync(path.join(root, "main.js"), "utf8");

  assert.match(html, /class="chevron chevron-expanded"/);
  assert.match(html, /<svg class="chevron-collapsed"/);
  assert.match(css, /\.settings-panel\.is-collapsed \.chevron-expanded\s*\{\s*display:\s*none/);
  assert.match(css, /\.settings-panel\.is-collapsed \.chevron-collapsed\s*\{\s*display:\s*block/);
  assert.doesNotMatch(css, /\.chevron[^{]*\{[^}]*rotate\(/);
  assert.doesNotMatch(js, /settingsPanel"\)\.addEventListener|settings-header[^;]*addEventListener/);
});
