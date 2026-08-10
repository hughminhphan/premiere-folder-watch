const test = require("node:test");
const assert = require("node:assert/strict");
const {
  cameraProfileForPath,
  downgradePartialSequenceDuplicates,
  extensionOf,
  filterFiles,
  groupImageSequences,
  isSupportedMedia,
  matchesFolderRule,
  normalizePath,
  observeFile,
  parseSequenceFrame,
  pathKey,
  planSync,
  relativePathBetween,
  resolveFolderSettings,
  resolveRelativePath,
  shouldIgnorePath,
  watchFolderId
} = require("../watch-core.js");

function file(path, relativePath = path.split("/").pop()) {
  return {
    name: path.split("/").pop(),
    path,
    relativePath,
    relativeDirectory: relativePath.includes("/")
      ? relativePath.slice(0, relativePath.lastIndexOf("/"))
      : ""
  };
}

test("recognizes supported media case-insensitively", () => {
  assert.equal(isSupportedMedia("clip.MP4"), true);
  assert.equal(isSupportedMedia("audio.WaV"), true);
  assert.equal(isSupportedMedia("frame.0001.EXR"), true);
  assert.equal(isSupportedMedia("camera.BRAW"), true);
  assert.equal(isSupportedMedia("C8002M01.XML"), false);
  assert.equal(isSupportedMedia(".DS_Store"), false);
});

test("supports a user-defined extension allowlist", () => {
  assert.equal(isSupportedMedia("edit.psd", ["psd"]), true);
  assert.equal(isSupportedMedia("edit.psd", ["mov"]), false);
});

test("uses only the final suffix as the extension", () => {
  assert.equal(extensionOf("shot.v2.final.mov"), "mov");
  assert.equal(extensionOf("README"), "");
});

test("requires repeated stable observations before a file is ready", () => {
  const metadata = { size: 2048, dateModified: new Date("2026-08-10T12:00:00Z") };
  const first = observeFile(undefined, metadata, 2);
  const second = observeFile(first, metadata, 2);
  const third = observeFile(second, metadata, 2);
  assert.deepEqual(
    [first.ready, second.ready, third.ready],
    [false, false, true]
  );
});

test("a changed file resets its stability count", () => {
  const first = observeFile(undefined, { size: 100, dateModified: new Date(1) }, 2);
  const second = observeFile(first, { size: 200, dateModified: new Date(2) }, 2);
  assert.equal(second.stablePolls, 0);
  assert.equal(second.ready, false);
});

test("normalizes Windows and UNC paths for duplicate comparison", () => {
  assert.equal(normalizePath("C:\\Media\\Day 1\\"), "C:/Media/Day 1");
  assert.equal(pathKey("C:\\MEDIA\\A.MOV"), pathKey("c:/media/a.mov"));
  assert.equal(normalizePath("\\\\server\\share\\clips"), "//server/share/clips");
});

test("matches exact, wildcard, and regular-expression ignored folders", () => {
  assert.equal(matchesFolderRule("Proxy", "proxy"), true);
  assert.equal(matchesFolderRule("_AME_temp", "*_temp"), true);
  assert.equal(matchesFolderRule("_AME_temp", "/^_ame_/"), true);
  assert.equal(matchesFolderRule("Footage", "/^_ame_/"), false);
  assert.equal(shouldIgnorePath("Footage/_AME_temp/render.mov", ["/^_ame_/"]), true);
});

test("filters unsupported files, hidden files, ignored folders, and duplicate paths", () => {
  const result = filterFiles([
    file("/root/clip.mov", "clip.mov"),
    file("/root/clip.mov", "clip.mov"),
    file("/root/.hidden.mov", ".hidden.mov"),
    file("/root/cache/render.mov", "cache/render.mov"),
    file("/root/notes.txt", "notes.txt")
  ], { ignoredFolders: ["cache"] });
  assert.deepEqual(result.included.map((item) => item.name), ["clip.mov"]);
  assert.deepEqual(result.ignored.map((item) => item.reason), [
    "hidden-file",
    "ignored-folder",
    "unsupported-extension"
  ]);
});

test("detects numbered image sequences with three or more digits", () => {
  assert.deepEqual(parseSequenceFrame("cleanup_0001.exr"), {
    prefix: "cleanup_",
    frame: 1,
    frameText: "0001",
    padding: 4,
    extension: "exr"
  });
  assert.equal(parseSequenceFrame("sframe_01.png"), null);
  assert.equal(parseSequenceFrame("clip_0001.mov"), null);
});

test("groups sequence frames by folder, prefix, padding, and extension", () => {
  const groups = groupImageSequences([
    file("/root/a/shot_0002.png", "a/shot_0002.png"),
    file("/root/a/shot_0001.png", "a/shot_0001.png"),
    file("/root/b/shot_0001.png", "b/shot_0001.png")
  ]);
  assert.equal(groups.size, 2);
  const group = [...groups.values()].find((value) => value.directory === "a");
  assert.equal(group.first.name, "shot_0001.png");
  assert.equal(group.last.name, "shot_0002.png");
});

test("recognizes documented camera-card folder families", () => {
  assert.equal(cameraProfileForPath("PRIVATE/AVCHD/BDMV/STREAM/00001.MTS"), "avchd");
  assert.equal(cameraProfileForPath("CONTENTS/CLIPS001/AA001.MXF"), "canon-xf");
  assert.equal(cameraProfileForPath("BPAV/CLPR/0001/0001.MP4"), "xdcam-ex");
  assert.equal(cameraProfileForPath("XDROOT/Clip/C0001.MXF"), "sony-xavc");
  assert.equal(cameraProfileForPath("DCIM/100MEDIA/DJI_0001.MP4"), "dcim");
  assert.equal(cameraProfileForPath("A001_C001_0101AB.RDC/A001.R3D"), "red");
});

test("child folder settings inherit from parent overrides", () => {
  const resolved = resolveFolderSettings(
    { flatten: false, imageSequences: "auto", labelIndex: 2 },
    {
      "Renders": { flatten: true },
      "Renders/Final": { labelIndex: 5 }
    },
    "Renders/Final/VFX"
  );
  assert.equal(resolved.flatten, true);
  assert.equal(resolved.imageSequences, "auto");
  assert.equal(resolved.labelIndex, 5);
});

test("builds a sync plan with hierarchy, sequences, and duplicate prevention", () => {
  const files = [
    file("/root/Audio/voice.wav", "Audio/voice.wav"),
    file("/root/Renders/shot_0001.exr", "Renders/shot_0001.exr"),
    file("/root/Renders/shot_0002.exr", "Renders/shot_0002.exr"),
    file("/root/Footage/clip.mov", "Footage/clip.mov")
  ];
  const result = planSync(files, {
    settings: { imageSequences: "auto", flatten: false },
    overrides: { "Audio": { labelIndex: 3 } },
    existingPaths: ["/root/Footage/clip.mov"]
  });
  assert.equal(result.candidates.length, 2);
  assert.equal(result.duplicates.length, 1);
  const audio = result.candidates.find((unit) => unit.kind === "file");
  const sequence = result.candidates.find((unit) => unit.kind === "sequence");
  assert.deepEqual(audio.destinationSegments, ["Audio"]);
  assert.equal(audio.labelIndex, 3);
  assert.equal(sequence.sequence.frameCount, 2);
  assert.deepEqual(sequence.destinationSegments, ["Renders"]);
});

test("imports later sequence-like frames as stills when the first frame was already a still", () => {
  const first = file("/root/Renders/shot_0001.exr", "Renders/shot_0001.exr");
  const second = file("/root/Renders/shot_0002.exr", "Renders/shot_0002.exr");
  const rawPlan = planSync([first, second], {
    settings: { imageSequences: "auto" },
    registryPaths: [first.path]
  });
  const result = downgradePartialSequenceDuplicates(rawPlan, {
    registryPaths: [first.path]
  });

  assert.equal(result.duplicates.length, 0);
  assert.equal(result.downgradedSequences.length, 1);
  assert.deepEqual(result.candidates.map((unit) => unit.importPath), [second.path]);
  assert.equal(result.candidates[0].kind, "file");
});

test("keeps known growing sequences grouped for refresh", () => {
  const first = file("/root/Renders/shot_0001.exr", "Renders/shot_0001.exr");
  const second = file("/root/Renders/shot_0002.exr", "Renders/shot_0002.exr");
  const rawPlan = planSync([first, second], {
    settings: { imageSequences: "auto" },
    registryPaths: [first.path]
  });
  const sequenceKey = rawPlan.duplicates[0].sequence.key;
  const result = downgradePartialSequenceDuplicates(rawPlan, {
    registryPaths: [first.path],
    knownSequenceKeys: [sequenceKey]
  });

  assert.equal(result.candidates.length, 0);
  assert.equal(result.duplicates.length, 1);
  assert.equal(result.downgradedSequences.length, 0);
});

test("flattens known camera folders automatically", () => {
  const avchd = file("/card/PRIVATE/AVCHD/BDMV/STREAM/00001.MTS", "PRIVATE/AVCHD/BDMV/STREAM/00001.MTS");
  const dcim = file("/card/DCIM/100MEDIA/DJI_0001.MP4", "100MEDIA/DJI_0001.MP4");
  dcim.cameraPath = "DCIM/100MEDIA/DJI_0001.MP4";
  const result = planSync([avchd, dcim], {
    settings: { flatten: false, autoFlattenCameraFolders: true }
  });
  assert.deepEqual(result.candidates[0].destinationSegments, []);
  assert.deepEqual(result.candidates[1].destinationSegments, []);
});

test("can exclude subfolders without excluding root files", () => {
  const result = planSync([
    file("/root/top.mov", "top.mov"),
    file("/root/nested/child.mov", "nested/child.mov")
  ], { settings: { includeSubfolders: false } });
  assert.deepEqual(result.candidates.map((unit) => unit.importPath), ["/root/top.mov"]);
});

test("computes and resolves portable relative paths", () => {
  assert.equal(
    relativePathBetween("/Projects/Template", "/Projects/Template/Media/Camera"),
    "Media/Camera"
  );
  assert.equal(
    resolveRelativePath("/Projects/Template", "Media/Camera"),
    "/Projects/Template/Media/Camera"
  );
  assert.equal(
    resolveRelativePath("C:/Projects/Template", "../Shared/Audio"),
    "C:/Projects/Shared/Audio"
  );
  assert.equal(relativePathBetween("C:/One", "D:/Two"), null);
});

test("creates stable non-secret watch folder identifiers", () => {
  assert.equal(
    watchFolderId("project-1", "/Media/Footage"),
    watchFolderId("project-1", "/Media/Footage/")
  );
  assert.notEqual(
    watchFolderId("project-1", "/Media/Footage"),
    watchFolderId("project-2", "/Media/Footage")
  );
});
