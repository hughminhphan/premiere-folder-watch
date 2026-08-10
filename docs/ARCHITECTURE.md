# Architecture

Folder Watch is a dependency-free Adobe UXP panel. Runtime code uses CommonJS because Premiere exposes the `uxp` and `premierepro` modules through `require()`.

## Repository layout

```text
.
├── manifest.json          Premiere UXP manifest
├── index.html             Panel structure
├── style.css              Panel design and responsive states
├── main.js                UXP lifecycle, Premiere adapter, storage, and UI
├── watch-core.js          Pure path, filter, sequence, camera, and sync planning logic
├── test/                  Node tests for watch-core.js
├── scripts/
│   ├── check.js           Version, syntax, and test validation
│   ├── package.js         Dependency-free CCX packager
│   └── load-via-udt.js    UXP Developer Tool validator and loader
└── docs/                  Installation, parity, and architecture notes
```

## State model

Folder Watch stores two kinds of state in UXP `localStorage`.

### Global configuration

Key: `folderWatch.config.v2`

- Automatic sync state
- Poll interval
- Stable-scan requirement
- Extension allowlist
- Ignored-folder rules
- Import-dialog preference
- Activity-log preference

### Per-project configuration

Key: `folderWatch.project.v2.<project-guid>`

Each project stores an array of watch folders:

- Persistent folder token
- Last known native path
- Optional path relative to the `.prproj` directory
- Destination-bin path
- Root settings
- Sparse child-folder overrides
- Imported-path registry
- Image-sequence range registry
- Last status and imported-item count

No state is sent off the machine.

## Sync pipeline

A sync pass follows these stages.

### 1. Resolve the active project

`Project.getActiveProject()` supplies the project. Folder Watch uses `project.guid` for storage isolation and listens for Premiere project opened, closed, and activated events.

### 2. Restore folder permission

`localFileSystem.getEntryForPersistentToken()` restores the folder selected by the user. If that fails and a relative path is available, Folder Watch attempts to resolve the path from the saved project directory. The user can always relink through the panel.

### 3. Walk the folder tree

UXP `Folder.getEntries()` recursively enumerates files and folders.

The walker:

- Applies ignored-folder rules before descending
- Honors inherited Include subfolders settings
- Records discovered child folders for the manager
- Skips hidden and disallowed files before metadata reads
- Avoids repeated metadata reads for media already in the registry

### 4. Wait for files to settle

A new file is observed by native path. Its signature is:

```text
<size>:<modified-time>
```

The signature must stay unchanged for the configured number of follow-up scans. Any size or timestamp change resets the counter.

### 5. Build a pure sync plan

`watch-core.js` converts stable files into import units.

It handles:

- Extension filtering
- Ignored folders
- Child setting inheritance
- Numbered image-sequence grouping
- Camera-card path recognition
- Flattened or mirrored bin destinations
- Registry and project duplicate checks

An import unit is either one regular file or one numbered sequence represented by its first frame.

### 6. Resolve Premiere bins

Folder Watch starts at the selected destination bin. For each required nested folder:

1. Read direct child items.
2. Reuse a matching bin if it exists.
3. Otherwise create it with `FolderItem.createBinAction(name, false)`.
4. Commit the action through `Project.lockedAccess()` and `Project.executeTransaction()`.

The `makeUnique` argument is `false` because Folder Watch checks for a matching name before it creates the bin and needs deterministic lookup afterward.

### 7. Import media

Folder Watch calls:

```js
project.importFiles(
  [nativePath],
  suppressUI,
  targetBin,
  importAsNumberedStills
)
```

Regular media sets `importAsNumberedStills` to `false`. Sequence imports set it to `true`.

### 8. Apply labels

If a label is configured, Folder Watch finds the imported project item and creates a `createSetColorLabelAction()` action. The action is committed inside the same Premiere transaction pattern used for bin creation.

### 9. Refresh growing sequences

A sequence registry records the last known frame number. When a later scan finds a larger number, Folder Watch locates the sequence project item by its first-frame media path and calls `refreshMedia()`.

Adobe documents `refreshMedia()` as updating a clip's media representation. Adobe does not explicitly document whether this always extends the duration of a numbered-still sequence, so this path remains experimental.

If a numbered still was already imported individually before another matching frame appeared, Folder Watch keeps later frames as individual stills. It does not misidentify the earlier project item as an imported sequence or silently skip the new frames.

### 10. Persist results

Only successful imports are added to the imported registry. Failed imports remain eligible for a future manual or automatic sync.

## Duplicate detection

Folder Watch uses two layers:

1. A lightweight per-watch registry prevents repeated work across scans.
2. A recursive Premiere project-tree index compares `ClipProjectItem.getMediaFilePath()` values across the entire project.

This catches media imported manually or through another watch folder.

Paths are normalized to forward slashes. Drive-letter and UNC comparisons are case-insensitive.

## Sequence registry compression

Regular media stores one normalized path per imported file.

Image sequences store:

- First-frame path
- Sequence key
- Last frame number
- Frame count
- Whether the sequence was intentionally ignored during a baseline scan

A sequence ignored during a watch-new baseline remains ignored as its frame range grows. Importing it later through the first frame would also import the earlier baseline frames, which would violate the baseline choice.

Older frames are recognized by sequence key and frame range. This avoids storing every frame path for large renders.

## Settings inheritance

Root settings are complete objects. Child overrides are sparse.

When the user edits a child folder, Folder Watch compares the chosen values with its inherited parent values and stores only the differences. Parent changes therefore continue to propagate to all fields that the child has not changed explicitly.

## Camera-card recognition

Folder Watch uses path signatures rather than proprietary media parsing. Recognized families include:

- AVCHD
- Canon XF
- Panasonic P2
- XDCAM-EX
- XDCAM-HD
- Sony HDV
- Sony XAVC
- RED `.RDC`
- ARRIRAW
- DCIM

Recognition only changes the default destination-bin flattening. Premiere still owns the actual media import.

## Security boundaries

- Folder access always starts with Adobe's picker.
- Folder permissions use UXP persistent tokens.
- No full-disk permission is requested.
- No network permission is requested.
- No subprocess is launched by the runtime plugin.
- The plugin does not write to media files.
- Creating a child folder is the only source-filesystem write exposed by the UI.

## Testing strategy

`watch-core.js` contains platform-neutral logic and runs under Node's built-in test runner.

The tests cover:

- Extensions and custom allowlists
- Stable-copy observations
- Windows and UNC normalization
- Exact, wildcard, and regular-expression ignore rules
- Image-sequence parsing and grouping
- Camera-card recognition
- Inherited settings
- Bin destination planning
- Duplicate prevention
- Relative path calculation
- Stable watch-folder identifiers

Premiere adapter behavior is validated by Adobe UXP Developer Tool and manual smoke tests because the `premierepro` host module only exists inside Premiere.
