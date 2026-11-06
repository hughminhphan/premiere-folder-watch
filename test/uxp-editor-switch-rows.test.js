const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

test("the small heading style applies only to the Configure label, not to a switch row that happens to be first", () => {
  assert.doesNotMatch(css, /\.editor-section > label:first-child/);
  assert.match(css, /#overridePickerWrap > label:first-child \{[^}]*text-transform: uppercase/);
  assert.match(html, /<div id="overridePickerWrap" class="editor-section">\s*<label for="overridePath">/);
});

test("Import existing media and Portable relative path are ordinary switch rows", () => {
  assert.match(html, /<label id="editImportExistingRow" class="switch-row">/);
  assert.match(html, /<label class="switch-row">\s*<span><strong>Portable relative path/);
});
