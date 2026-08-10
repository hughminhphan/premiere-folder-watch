# Folder Watch

[![CI](https://github.com/hughminhphan/premiere-folder-watch/actions/workflows/ci.yml/badge.svg)](https://github.com/hughminhphan/premiere-folder-watch/actions/workflows/ci.yml)
[![GitHub release](https://img.shields.io/github/v/release/hughminhphan/premiere-folder-watch)](https://github.com/hughminhphan/premiere-folder-watch/releases/latest)
[![License: MIT](https://img.shields.io/badge/license-MIT-7c6cf2.svg)](LICENSE)

**Folder Watch is a free and open-source Adobe Premiere Pro panel that keeps project bins in sync with folders on disk.**

Choose one or more folders, choose their destination bins, and keep editing. Folder Watch waits until each file has finished copying before it asks Premiere to import it. It never moves, renames, or deletes source media.

## Highlights

- Watch multiple folders per Premiere project
- Import new media automatically or sync on demand
- Import existing files, or establish a baseline and watch only new files
- Mirror subfolders as nested Premiere bins
- Flatten ordinary folders or recognized camera-card structures
- Link each watch folder to the selected Premiere bin
- Detect numbered image sequences with three or more trailing digits
- Refresh growing image sequences through Premiere's `refreshMedia()` API
- Wait for file size and modification time to stabilize before import
- Search the whole project for media that is already imported
- Filter files with a configurable extension allowlist
- Ignore folder names, wildcards, and case-insensitive regular expressions
- Apply one of Premiere's 15 project-item labels to created bins and imported media
- Store portable paths relative to a saved Premiere project
- Relink unavailable watch folders without rebuilding their settings
- Configure child-folder overrides that inherit parent settings
- Create empty child folders from the watch-folder manager
- Remember all settings per Premiere project
- Continue automatic polling while the panel is hidden
- Work on macOS and Windows through Adobe's UXP filesystem APIs

Folder Watch is an independent project. It is not affiliated with Adobe or Knights of the Editing Table.

## Requirements

- Adobe Premiere Pro 25.6 or later
- macOS or Windows
- A local Premiere project for portable relative paths

## Install

1. Download `folder-watch-1.0.0.ccx` from the [latest release](https://github.com/hughminhphan/premiere-folder-watch/releases/latest).
2. Double-click the `.ccx` file.
3. Accept the Creative Cloud trust prompt for an independently distributed plugin.
4. Open Premiere Pro.
5. Choose **Window > UXP Plugins > Folder Watch**.

If Creative Cloud does not open the installer, follow [Adobe's external plugin troubleshooting guide](https://helpx.adobe.com/creative-cloud/kb/solve-external-plugin-installation-issues.html) or use the development install in [docs/INSTALLATION.md](docs/INSTALLATION.md).

## First sync

1. Open a Premiere project.
2. Select the destination bin in the Project panel.
3. Open Folder Watch and choose **Add folder**.
4. Pick a folder on disk.
5. Choose whether to import existing media.
6. Save the folder settings.
7. Choose **Start auto-sync**, or use **Sync** whenever you want a manual pass.

A file must produce the same size and modification timestamp across the configured number of scans before it can be imported. The default is two stable follow-up scans at 2.5-second intervals.

A numbered image sequence that already exists when a watch-new baseline is created is treated as one existing media item. Later frames extend that ignored baseline and are not imported. This avoids importing the earlier baseline frames indirectly through Premiere's sequence importer.

## Folder settings

Each watched root has these settings:

| Setting | Behavior |
| --- | --- |
| Import existing media | Imports supported files that are already present. Turn it off to establish a baseline and watch only future additions. |
| Include subfolders | Scans the folder recursively. |
| Flatten hierarchy | Imports nested media into the selected destination bin instead of creating nested bins. |
| Auto-flatten camera cards | Recognizes common AVCHD, Canon XF, Panasonic P2, XDCAM, Sony XAVC, RED, ARRIRAW, and DCIM layouts. |
| Image sequences | Detect automatically, always group numbered stills, or import every still separately. |
| Premiere label | Applies a project-item label after import. |
| Portable relative path | Resolves the watch folder relative to the saved `.prproj` location. |
| Search project for duplicates | Walks the project tree and skips matching media paths. |

After the first scan, the settings panel lists discovered child folders. Choose a child to create an override. Any value you do not change continues to inherit from its parent.

## Safety model

Folder Watch reads watched directories and calls Premiere's import APIs. Its only filesystem write is an explicit **Create** action that makes a new empty child folder.

It does not:

- Move source files
- Rename source files
- Delete source files
- Delete Premiere project items when files disappear
- Copy or transcode media
- Upload media or analytics
- Contact a remote service

Filesystem access is granted through Adobe's folder picker and stored as a UXP persistent permission token.

## Watchtower parity

Folder Watch implements the public Premiere-focused Watchtower workflow without copying proprietary code or assets. Adobe UXP does not expose every integration used by the commercial extension. The detailed matrix is in [docs/FEATURE_PARITY.md](docs/FEATURE_PARITY.md).

The main platform limits are:

- Premiere UXP does not expose Finder, Explorer, or Project-panel drag and drop to third-party panels.
- Premiere UXP does not expose scriptable Photoshop or Illustrator layer import choices.
- Premiere UXP does not expose native operating-system notifications.
- Premiere's Import Date column is not documented in the public metadata API.
- Growing image-sequence refresh uses `ClipProjectItem.refreshMedia()`, which Adobe does not explicitly document as frame-range aware. This behavior is marked experimental until it has broader real-world coverage.
- Team Projects do not have a public UXP scripting surface.

## Development

```sh
npm test
npm run check
npm run package
```

Load the source through Adobe UXP Developer Tool:

```sh
node scripts/load-via-udt.js
```

See [docs/INSTALLATION.md](docs/INSTALLATION.md) for the complete development setup and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the sync model.

## Contributing

Bug reports, compatibility results, documentation fixes, and pull requests are welcome. Start with [CONTRIBUTING.md](CONTRIBUTING.md).

If you discover a security issue, follow [SECURITY.md](SECURITY.md) instead of opening a public issue.

## License

Folder Watch is available under the [MIT License](LICENSE).

Adobe and Premiere Pro are trademarks of Adobe. Watchtower is a product name used by Knights of the Editing Table. All names are used only to describe compatibility and comparative functionality.
