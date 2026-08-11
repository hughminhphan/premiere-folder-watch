const DEFAULT_MEDIA_EXTENSIONS = Object.freeze([
  "3g2", "3gp", "aac", "aif", "aiff", "ai", "ari", "arx", "asf", "avi",
  "bmp", "braw", "cin", "crm", "dng", "dpx", "eps", "exr", "f4v", "flac",
  "gif", "heic", "heif", "j2c", "j2k", "jp2", "jpeg", "jpg", "m1v", "m2t",
  "m2ts", "m2v", "m4a", "m4v", "mkv", "mov", "mp2", "mp3", "mp4", "mpeg",
  "mpg", "mxf", "mts", "pct", "pict", "png", "psd", "r3d", "raw", "rm",
  "sgi", "svg", "tga", "tif", "tiff", "vob", "wav", "webm", "webp", "wmv"
]);

const IMAGE_EXTENSIONS = new Set([
  "ari", "arx", "bmp", "cin", "dng", "dpx", "exr", "gif", "heic", "heif",
  "j2c", "j2k", "jp2", "jpeg", "jpg", "pct", "pict", "png", "psd", "raw",
  "sgi", "tga", "tif", "tiff", "webp"
]);

const DEFAULT_IGNORED_FOLDERS = Object.freeze([
  ".git",
  ".svn",
  ".trash",
  ".trashes",
  "$recycle.bin",
  "__macosx",
  "system volume information",
  "untitled folder"
]);

const DEFAULT_WATCH_SETTINGS = Object.freeze({
  includeSubfolders: true,
  flatten: false,
  autoFlattenCameraFolders: true,
  imageSequences: "auto",
  labelIndex: null,
  importExisting: true,
  duplicateScan: true
});

const CAMERA_FOLDER_RULES = Object.freeze([
  { id: "avchd", required: ["private", "avchd", "bdmv", "stream"] },
  { id: "canon-xf", required: ["contents", "clips001"] },
  { id: "panasonic-p2", required: ["contents"], any: ["video", "audio", "clip", "icon", "proxy"] },
  { id: "xdcam-ex", required: ["bpav", "clpr"] },
  { id: "sony-xavc", required: ["xdroot", "clip"] },
  { id: "xdcam-hd", root: "clip" },
  { id: "sony-hdv", required: ["video", "hdv"] },
  { id: "dcim", required: ["dcim"] },
  { id: "red", suffix: ".rdc" },
  { id: "arriraw", any: ["arriraw", "arx", "ari"] }
]);

function extensionOf(name) {
  const dot = String(name || "").lastIndexOf(".");
  return dot < 0 ? "" : String(name).slice(dot + 1).toLowerCase();
}

function fileNameOf(filePath) {
  const normalized = slashPath(filePath);
  const slash = normalized.lastIndexOf("/");
  return slash < 0 ? normalized : normalized.slice(slash + 1);
}

function dirnameOf(filePath) {
  const normalized = slashPath(filePath);
  const slash = normalized.lastIndexOf("/");
  return slash < 0 ? "" : normalized.slice(0, slash);
}

function slashPath(value) {
  return String(value || "").replace(/\\/g, "/");
}

function normalizePath(value) {
  let normalized = slashPath(value).trim();
  const unc = normalized.startsWith("//");
  normalized = normalized.replace(/\/{2,}/g, "/");
  if (unc) normalized = `/${normalized}`;
  while (normalized.length > 1 && normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1);
  }
  return normalized;
}

function pathKey(value) {
  const normalized = normalizePath(value);
  if (/^[a-z]:\//i.test(normalized) || normalized.startsWith("//")) {
    return normalized.toLowerCase();
  }
  return normalized;
}

function joinPath(...parts) {
  return normalizePath(parts.filter(Boolean).map(slashPath).join("/"));
}

function splitRelativePath(value) {
  return slashPath(value)
    .split("/")
    .map((part) => part.trim())
    .filter((part) => part && part !== ".");
}

function isHiddenName(name) {
  return String(name || "").startsWith(".");
}

function toExtensionSet(extensions) {
  const values = extensions || DEFAULT_MEDIA_EXTENSIONS;
  return new Set(values.map((value) => String(value).replace(/^\./, "").toLowerCase()).filter(Boolean));
}

function isSupportedMedia(name, extensions) {
  return toExtensionSet(extensions).has(extensionOf(name));
}

function signature(metadata) {
  const modifiedValue = metadata && (metadata.modifiedMs ?? metadata.dateModified);
  const modified = modifiedValue instanceof Date
    ? modifiedValue.getTime()
    : new Date(modifiedValue || 0).getTime();
  return `${Number(metadata && metadata.size) || 0}:${Number.isFinite(modified) ? modified : 0}`;
}

function observeFile(previous, metadata, stablePollsRequired = 2) {
  const nextSignature = signature(metadata);
  if (!previous || previous.signature !== nextSignature) {
    return { signature: nextSignature, stablePolls: 0, ready: false };
  }
  const stablePolls = previous.stablePolls + 1;
  return {
    signature: nextSignature,
    stablePolls,
    ready: stablePolls >= Math.max(0, stablePollsRequired)
  };
}

function parseRegexRule(rule) {
  const value = String(rule || "").trim();
  if (!value.startsWith("/")) return null;
  const lastSlash = value.lastIndexOf("/");
  if (lastSlash <= 0) return null;
  const pattern = value.slice(1, lastSlash);
  const requestedFlags = value.slice(lastSlash + 1).replace(/[^gimsuy]/g, "");
  const flags = requestedFlags.includes("i") ? requestedFlags : `${requestedFlags}i`;
  try {
    return new RegExp(pattern, flags.replace(/g/g, ""));
  } catch (_) {
    return null;
  }
}

function wildcardRegex(rule) {
  const escaped = String(rule)
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*")
    .replace(/\?/g, ".");
  return new RegExp(`^${escaped}$`, "i");
}

function matchesFolderRule(name, rule) {
  const value = String(rule || "").trim();
  if (!value) return false;
  const regex = parseRegexRule(value);
  if (regex) return regex.test(String(name || ""));
  if (value.includes("*") || value.includes("?")) {
    return wildcardRegex(value).test(String(name || ""));
  }
  return String(name || "").toLowerCase() === value.toLowerCase();
}

function shouldIgnoreFolder(name, rules = DEFAULT_IGNORED_FOLDERS) {
  if (isHiddenName(name)) return true;
  return (rules || []).some((rule) => matchesFolderRule(name, rule));
}

function shouldIgnorePath(relativePath, rules = DEFAULT_IGNORED_FOLDERS) {
  const parts = splitRelativePath(relativePath);
  return parts.slice(0, -1).some((part) => shouldIgnoreFolder(part, rules));
}

function parseSequenceFrame(name, extensions = DEFAULT_MEDIA_EXTENSIONS) {
  const extension = extensionOf(name);
  if (!IMAGE_EXTENSIONS.has(extension) || !toExtensionSet(extensions).has(extension)) return null;
  const basename = String(name).slice(0, -(extension.length + 1));
  const match = basename.match(/^(.*?)(\d{3,})$/);
  if (!match) return null;
  return {
    prefix: match[1],
    frame: Number(match[2]),
    frameText: match[2],
    padding: match[2].length,
    extension
  };
}

function sequenceKey(file, extensions) {
  const parsed = parseSequenceFrame(file.name || fileNameOf(file.path), extensions);
  if (!parsed) return null;
  const directory = normalizePath(file.relativeDirectory || dirnameOf(file.relativePath || file.path));
  return `${directory}\x00${parsed.prefix}\x00${parsed.padding}\x00${parsed.extension}`;
}

function groupImageSequences(files, extensions = DEFAULT_MEDIA_EXTENSIONS) {
  const groups = new Map();
  for (const file of files) {
    const parsed = parseSequenceFrame(file.name || fileNameOf(file.path), extensions);
    const key = parsed ? sequenceKey(file, extensions) : null;
    if (!key) continue;
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        prefix: parsed.prefix,
        padding: parsed.padding,
        extension: parsed.extension,
        directory: normalizePath(file.relativeDirectory || dirnameOf(file.relativePath || file.path)),
        frames: []
      });
    }
    groups.get(key).frames.push({ file, frame: parsed.frame });
  }
  for (const group of groups.values()) {
    group.frames.sort((a, b) => a.frame - b.frame || pathKey(a.file.path).localeCompare(pathKey(b.file.path)));
    group.first = group.frames[0] ? group.frames[0].file : null;
    group.last = group.frames[group.frames.length - 1] ? group.frames[group.frames.length - 1].file : null;
  }
  return groups;
}

function cameraProfileForPath(relativePath) {
  const normalized = slashPath(relativePath).toLowerCase();
  const segments = splitRelativePath(normalized);
  for (const rule of CAMERA_FOLDER_RULES) {
    if (rule.suffix) {
      if (segments.some((part) => part.endsWith(rule.suffix))) return rule.id;
      continue;
    }
    const hasRoot = !rule.root || segments[0] === rule.root;
    const hasRequired = !rule.required || rule.required.every((part) => segments.includes(part));
    const hasAny = !rule.any || rule.any.some((part) => segments.includes(part) || normalized.includes(`.${part}`));
    if (hasRoot && hasRequired && hasAny) return rule.id;
  }
  return null;
}

function sanitizeLabelIndex(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 && number <= 14 ? number : null;
}

function sanitizeWatchSettings(settings = {}) {
  const mode = ["off", "auto", "on"].includes(settings.imageSequences)
    ? settings.imageSequences
    : DEFAULT_WATCH_SETTINGS.imageSequences;
  return {
    includeSubfolders: settings.includeSubfolders !== false,
    flatten: Boolean(settings.flatten),
    autoFlattenCameraFolders: settings.autoFlattenCameraFolders !== false,
    imageSequences: mode,
    labelIndex: sanitizeLabelIndex(settings.labelIndex),
    importExisting: settings.importExisting !== false,
    duplicateScan: settings.duplicateScan !== false
  };
}

function normalizeOverridePath(value) {
  return splitRelativePath(value).join("/");
}

function resolveFolderSettings(baseSettings, overrides, relativeDirectory) {
  let resolved = sanitizeWatchSettings(baseSettings);
  const parts = splitRelativePath(relativeDirectory);
  const byPath = overrides || {};
  for (let length = 1; length <= parts.length; length += 1) {
    const key = normalizeOverridePath(parts.slice(0, length).join("/"));
    if (byPath[key]) resolved = sanitizeWatchSettings({ ...resolved, ...byPath[key] });
  }
  return resolved;
}

function destinationSegmentsForFile(file, settings) {
  const relativeDirectory = normalizePath(file.relativeDirectory || dirnameOf(file.relativePath || ""));
  const parts = splitRelativePath(relativeDirectory);
  const isCameraFolder = settings.autoFlattenCameraFolders && cameraProfileForPath(
    file.cameraPath || file.relativePath || file.path
  );
  return settings.flatten || isCameraFolder ? [] : parts;
}

function uniqueByPath(files) {
  const seen = new Set();
  const unique = [];
  for (const file of files) {
    const key = pathKey(file.path);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(file);
  }
  return unique;
}

function filterFiles(files, options = {}) {
  const extensions = options.extensions || DEFAULT_MEDIA_EXTENSIONS;
  const ignoredFolders = options.ignoredFolders || DEFAULT_IGNORED_FOLDERS;
  const included = [];
  const ignored = [];
  for (const file of uniqueByPath(files || [])) {
    const name = file.name || fileNameOf(file.path);
    const relativePath = file.relativePath || name;
    let reason = null;
    if (isHiddenName(name)) reason = "hidden-file";
    else if (shouldIgnorePath(relativePath, ignoredFolders)) reason = "ignored-folder";
    else if (!isSupportedMedia(name, extensions)) reason = "unsupported-extension";
    if (reason) ignored.push({ file, reason });
    else included.push({ ...file, name, relativePath });
  }
  return { included, ignored };
}

function buildImportUnits(files, options = {}) {
  const extensions = options.extensions || DEFAULT_MEDIA_EXTENSIONS;
  const overrides = options.overrides || {};
  const baseSettings = sanitizeWatchSettings(options.settings);
  const sequenceGroups = groupImageSequences(files, extensions);
  const sequenceMembership = new Map();

  for (const group of sequenceGroups.values()) {
    const groupSettings = resolveFolderSettings(baseSettings, overrides, group.directory);
    const enabled = groupSettings.imageSequences === "on"
      || (groupSettings.imageSequences === "auto" && group.frames.length >= 2);
    if (!enabled) continue;
    for (const frame of group.frames) sequenceMembership.set(pathKey(frame.file.path), group);
  }

  const emittedSequences = new Set();
  const units = [];
  for (const file of files) {
    const relativeDirectory = normalizePath(file.relativeDirectory || dirnameOf(file.relativePath || ""));
    const settings = resolveFolderSettings(baseSettings, overrides, relativeDirectory);
    if (!settings.includeSubfolders && splitRelativePath(relativeDirectory).length > 0) continue;

    const group = sequenceMembership.get(pathKey(file.path));
    if (group) {
      if (emittedSequences.has(group.key)) continue;
      emittedSequences.add(group.key);
      const first = group.first;
      units.push({
        id: `sequence:${group.key}`,
        kind: "sequence",
        importPath: first.path,
        sourcePaths: group.frames.map((item) => item.file.path),
        relativePath: first.relativePath,
        destinationSegments: destinationSegmentsForFile(first, settings),
        labelIndex: settings.labelIndex,
        sequence: {
          key: group.key,
          frameCount: group.frames.length,
          firstFrame: group.frames[0].frame,
          lastFrame: group.frames[group.frames.length - 1].frame,
          padding: group.padding,
          extension: group.extension
        }
      });
      continue;
    }

    units.push({
      id: `file:${pathKey(file.path)}`,
      kind: "file",
      importPath: file.path,
      sourcePaths: [file.path],
      relativePath: file.relativePath,
      destinationSegments: destinationSegmentsForFile(file, settings),
      labelIndex: settings.labelIndex,
      sequence: null
    });
  }
  return units;
}

function planSync(files, options = {}) {
  const filtered = filterFiles(files, options);
  const existing = new Set((options.existingPaths || []).map(pathKey));
  const registry = new Set((options.registryPaths || []).map(pathKey));
  const units = buildImportUnits(filtered.included, options);
  const candidates = [];
  const duplicates = [];

  for (const unit of units) {
    const isDuplicate = unit.sourcePaths.some((value) => existing.has(pathKey(value)) || registry.has(pathKey(value)));
    if (isDuplicate) duplicates.push(unit);
    else candidates.push(unit);
  }

  return {
    candidates,
    duplicates,
    ignored: filtered.ignored,
    totals: {
      discovered: (files || []).length,
      candidates: candidates.length,
      duplicates: duplicates.length,
      ignored: filtered.ignored.length
    }
  };
}

function downgradePartialSequenceDuplicates(plan, options = {}) {
  const registry = new Set((options.registryPaths || []).map(pathKey));
  const existing = new Set((options.existingPaths || []).map(pathKey));
  const knownSequences = new Set(options.knownSequenceKeys || []);
  const candidates = [...(plan.candidates || [])];
  const duplicates = [];
  const downgradedSequences = [];

  for (const unit of plan.duplicates || []) {
    const knownSequence = unit.kind === "sequence"
      && unit.sequence
      && knownSequences.has(unit.sequence.key);
    const hasRegisteredFrame = unit.kind === "sequence"
      && unit.sourcePaths.some((filePath) => registry.has(pathKey(filePath)));

    if (unit.kind !== "sequence" || knownSequence || !hasRegisteredFrame) {
      duplicates.push(unit);
      continue;
    }

    const missingPaths = unit.sourcePaths.filter((filePath) => {
      const key = pathKey(filePath);
      return !registry.has(key) && !existing.has(key);
    });
    for (const filePath of missingPaths) {
      candidates.push({
        id: `file:${pathKey(filePath)}`,
        kind: "file",
        importPath: filePath,
        sourcePaths: [filePath],
        relativePath: filePath,
        destinationSegments: [...unit.destinationSegments],
        labelIndex: unit.labelIndex,
        sequence: null
      });
    }
    downgradedSequences.push({ ...unit, missingPaths });
  }

  return {
    ...plan,
    candidates,
    duplicates,
    downgradedSequences,
    totals: {
      ...(plan.totals || {}),
      candidates: candidates.length,
      duplicates: duplicates.length
    }
  };
}

function stableHash(value) {
  let hash = 0x811c9dc5;
  const text = String(value || "");
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

function persistJSON(storage, key, value) {
  if (!storage || typeof storage.setItem !== "function" || typeof storage.getItem !== "function") {
    throw new Error("Persistent storage is unavailable");
  }
  const serialized = JSON.stringify(value);
  storage.setItem(key, serialized);
  if (storage.getItem(key) !== serialized) throw new Error("Persistent storage did not retain the saved value");
  return serialized;
}

function watchFolderId(projectGuid, nativePath) {
  return `watch-${stableHash(`${projectGuid}\x00${pathKey(nativePath)}`)}`;
}

function relativePathBetween(basePath, targetPath) {
  const base = normalizePath(basePath);
  const target = normalizePath(targetPath);
  const baseParts = splitRelativePath(base);
  const targetParts = splitRelativePath(target);
  const windows = /^[a-z]:\//i.test(base) || /^[a-z]:\//i.test(target);
  const compare = (value) => windows ? value.toLowerCase() : value;
  let common = 0;
  while (
    common < baseParts.length
    && common < targetParts.length
    && compare(baseParts[common]) === compare(targetParts[common])
  ) {
    common += 1;
  }
  if (windows && common === 0) return null;
  const up = Array(Math.max(0, baseParts.length - common)).fill("..");
  return [...up, ...targetParts.slice(common)].join("/") || ".";
}

function resolveRelativePath(basePath, relativePath) {
  const prefixMatch = normalizePath(basePath).match(/^(\/|[a-z]:\/|\/\/[^/]+\/[^/]+)/i);
  const prefix = prefixMatch ? prefixMatch[1] : "";
  const baseParts = splitRelativePath(basePath);
  for (const part of splitRelativePath(relativePath)) {
    if (part === "..") baseParts.pop();
    else baseParts.push(part);
  }
  const joined = baseParts.join("/");
  if (prefix === "/") return `/${joined}`;
  if (/^[a-z]:\/$/i.test(prefix)) return `${prefix}${joined.replace(/^[a-z]:\//i, "")}`;
  if (prefix.startsWith("//")) return `//${joined.replace(/^\/\//, "")}`;
  return joined;
}

module.exports = {
  CAMERA_FOLDER_RULES,
  DEFAULT_IGNORED_FOLDERS,
  DEFAULT_MEDIA_EXTENSIONS,
  DEFAULT_WATCH_SETTINGS,
  IMAGE_EXTENSIONS,
  buildImportUnits,
  cameraProfileForPath,
  destinationSegmentsForFile,
  dirnameOf,
  downgradePartialSequenceDuplicates,
  extensionOf,
  fileNameOf,
  filterFiles,
  groupImageSequences,
  isSupportedMedia,
  joinPath,
  matchesFolderRule,
  normalizePath,
  observeFile,
  parseRegexRule,
  parseSequenceFrame,
  pathKey,
  persistJSON,
  planSync,
  relativePathBetween,
  resolveFolderSettings,
  resolveRelativePath,
  sanitizeWatchSettings,
  sequenceKey,
  shouldIgnoreFolder,
  shouldIgnorePath,
  signature,
  splitRelativePath,
  stableHash,
  watchFolderId
};
