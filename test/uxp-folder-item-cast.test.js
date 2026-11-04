const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");

test("child bins are created through FolderItem because getItems() returns plain ProjectItems", () => {
  const js = fs.readFileSync(path.join(root, "main.js"), "utf8");
  const creator = js.match(/async function createChildBin[\s\S]*?\n\}/);

  assert.match(js, /function asFolderItem[\s\S]*ppro\.FolderItem[\s\S]*\.cast\(item\)/);
  assert.ok(creator, "createChildBin is missing");
  assert.match(creator[0], /asFolderItem\(parent\)/);
  assert.match(creator[0], /parentFolder\.createBinAction\(name, false\)/);
});
