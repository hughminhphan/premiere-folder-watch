# Installation and development

## Install the release package

1. Open the [latest GitHub release](https://github.com/hughminhphan/premiere-folder-watch/releases/latest).
2. Download the `.ccx` file for the release.
3. Double-click the file.
4. Creative Cloud Desktop will show a trust warning because the plugin is distributed independently rather than through Marketplace. Review it and continue.
5. Launch or restart Premiere Pro.
6. Choose **Window > UXP Plugins > Folder Watch**.

Adobe documents direct `.ccx` distribution as a supported Premiere UXP installation method. UXP packages do not require the older ZXP signature and timestamp workflow.

If the package does not open, use [Adobe's external plugin installation troubleshooting](https://helpx.adobe.com/creative-cloud/kb/solve-external-plugin-installation-issues.html).

## Load the source for development

### Requirements

- Premiere Pro 25.6 or later
- Adobe UXP Developer Tool 2.2 or later
- Node.js 20 or later for tests and packaging

### Setup

1. Install **Adobe UXP Developer Tools** from Creative Cloud Desktop.
2. In Premiere, open **Settings > Plugins**.
3. Enable **Developer Mode**.
4. Restart Premiere.
5. Open Adobe UXP Developer Tool.
6. Choose **Add Plugin**.
7. Select this repository's `manifest.json`.
8. Choose **Load** or **Load & Watch**.
9. In Premiere, choose **Window > UXP Plugins > Folder Watch**.

When UXP Developer Tool is already running and connected to Premiere, the included loader can validate and load the source without clicking through the tool:

```sh
node scripts/load-via-udt.js
```

Set `UDT_PORT` if your developer service is not using port `14001`.

## Verify the checkout

```sh
npm test
npm run check
```

`npm run check` performs these checks:

- Manifest and package versions match
- Required runtime files exist
- Every JavaScript file parses
- The Node test suite passes

## Build a CCX package

```sh
npm run package
```

The output is written to:

```text
dist/folder-watch-<version>.ccx
```

The packaging script is dependency-free and writes a deterministic ZIP-compatible CCX archive. It includes only the runtime files:

- `manifest.json`
- `index.html`
- `style.css`
- `main.js`
- `watch-core.js`

## Validate through Adobe UXP Developer Tool

With Premiere and UXP Developer Tool running:

```sh
node scripts/load-via-udt.js
```

A successful response includes:

```json
{
  "validation": { "success": true },
  "load": { "pluginSessionId": "..." }
}
```

## Common problems

### Folder Watch does not appear in Premiere

- Confirm Premiere is version 25.6 or later.
- Confirm the plugin loaded successfully in UXP Developer Tool.
- Restart Premiere after enabling Developer Mode.
- Open **Window > UXP Plugins**, not the legacy Extensions menu.

### A saved folder needs permission again

Adobe persistent tokens can expire after a folder moves, a volume is remounted, or the operating system changes access. Open that watch folder's settings and choose **Relink folder**.

### Relative paths do not resolve

- Save the Premiere project first.
- Keep the watched folder on the same Windows drive as the project if you need a relative path.
- Grant folder access again after moving a template to a new machine.

### A file remains in Settling

The file is still changing, the copy has paused, or its timestamp is being updated by another application. Increase or decrease the stable-scan count in Global settings as appropriate.

### A growing image sequence does not extend

Premiere's public UXP documentation does not explicitly guarantee sequence-duration updates through `refreshMedia()`. Try a manual sync. If the clip still does not update, take it offline and relink it in Premiere, then report the format and Premiere version in a GitHub issue.

## Adobe references

- [Package a Premiere UXP plugin](https://developer.adobe.com/premiere-pro/uxp/plugins/distribution/package/)
- [Premiere UXP distribution overview](https://developer.adobe.com/premiere-pro/uxp/plugins/distribution/overview/)
- [Independent distribution](https://developer.adobe.com/premiere-pro/uxp/plugins/distribution/independent-distribution/)
- [Install UXP Developer Tool](https://developer.adobe.com/premiere-pro/uxp/introduction/essentials/dev-tools/)
