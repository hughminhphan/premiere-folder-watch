const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const js = fs.readFileSync(path.join(root, "main.js"), "utf8");

test("Remove is a div (UXP paints a pill over <button> backgrounds) and stays keyboard-operable", () => {
  assert.match(html, /<div id="removeFolder" class="danger-button" role="button" tabindex="0">Remove<\/div>/);
  assert.match(js, /\$\("removeFolder"\)\.addEventListener\("click", removeEditorFolder\)/);
  assert.match(js, /\$\("removeFolder"\)\.addEventListener\("keydown"/);
});

test("Remove has no outline, a gray fill like the other buttons, and turns red on hover", () => {
  const normal = css.match(/^\.danger-button \{[^}]*\}/m)[0];
  const hover = css.match(/^\.danger-button:hover \{[^}]*\}/m)[0];
  assert.match(normal, /background-color:\s*#6a6a6a/);
  assert.match(normal, /border-radius:\s*10px/);
  assert.match(normal, /min-height:\s*38px/);
  assert.match(hover, /background-color:\s*var\(--danger\)/);
  for (const block of [normal, hover]) assert.doesNotMatch(block, /border:|border-color|outline|box-shadow/);
});
