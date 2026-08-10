# Watchtower feature parity

Folder Watch is an independent, open-source Premiere Pro implementation of the public folder-to-bin workflow documented for [Watchtower](https://knightsoftheeditingtable.com/watchtower). It does not copy Watchtower code, assets, branding, or private behavior.

This matrix is deliberately precise about Adobe UXP limits. A green status means the workflow is available in Folder Watch. A yellow status means it is implemented through a different UXP-safe workflow or depends on behavior Adobe has not documented fully. A grey status means Adobe does not expose the required API to third-party Premiere UXP panels.

## Core synchronization

| Watchtower workflow | Folder Watch status | Folder Watch behavior |
| --- | --- | --- |
| Automatic synchronization | Available | Configurable polling continues while the panel is hidden. Project activation events switch the active project state. |
| Manual synchronization | Available | Sync every watch folder or a single watch folder on demand. |
| Multiple watched folders | Available | Each Premiere project has an independent list of watched roots. |
| Several open projects | Partial | Folder Watch switches settings immediately when Premiere activates a different project. It does not poll inactive open projects concurrently. |
| Wait for disk writes to finish | Available | Size and modification time must remain unchanged across the configured number of scans. |
| Avoid duplicate imports | Available | Searches the full project tree by native media path and keeps a per-project registry. |
| Detect manually imported or relinked media | Available | Full-project path scanning treats matching project items as duplicates. |
| Keep working after the panel closes | Available | The timer remains active after the panel is hidden. Closing or unloading the plugin stops it. |
| Never remove project items when disk files disappear | Available | Folder Watch is import-only. Source deletions never trigger project deletions. |

## Folder and bin management

| Watchtower workflow | Folder Watch status | Folder Watch behavior |
| --- | --- | --- |
| Mirror disk folders as bins | Available | Nested disk folders create matching nested Premiere bins. |
| Flatten subfolders | Available | Flatten every nested folder into the selected destination bin. |
| Include or exclude subfolders | Available | Set at the root or inherited child-folder level. |
| Hierarchical folder manager | Available | Discovered child folders appear in the settings picker. |
| Child settings inherit from parents | Available | Child overrides store only changed values, so unchanged values continue to inherit. |
| Create folders from the manager | Available | Creates a child folder inside the selected watched directory. |
| Link an existing Premiere bin | Available with different UI | Select a bin in Premiere, then choose **Selected bin**. Premiere UXP does not expose Project-panel drag and drop. |
| Drag Finder or Explorer folders into the panel | Unavailable in UXP | Adobe does not expose external file drag and drop to Premiere UXP panels. Use **Add folder**. |
| Drag Premiere bins into the panel | Unavailable in UXP | Adobe does not expose internal Project-panel drag payloads. Use the selected-bin workflow. |
| Relink unavailable folders | Available | Choose **Relink folder** and keep the existing bin mapping and settings. |
| Windows junction folders | Platform-dependent | Folder traversal is delegated to UXP. Junction-specific behavior needs Windows compatibility reports. |

## Paths and project templates

| Watchtower workflow | Folder Watch status | Folder Watch behavior |
| --- | --- | --- |
| Absolute watched paths | Available | Stored through an Adobe UXP persistent permission token. |
| Relative paths for project templates | Available with UXP constraints | Stores a relative path from the saved `.prproj` location and attempts to resolve it when a token expires. Adobe may still require a permission prompt after a project moves. |
| Cross-platform separators | Available | Internal comparisons normalize Windows backslashes and macOS path separators. |
| Paths on different Windows drives | Absolute only | A portable relative path cannot cross drive letters. The absolute permission token still works on the original machine. |
| UNC paths | Normalized, unverified | Folder Watch normalizes UNC comparison keys, but Adobe does not document UXP behavior for every network-share configuration. |

## Media handling

| Watchtower workflow | Folder Watch status | Folder Watch behavior |
| --- | --- | --- |
| Configurable file extensions | Available | Comma-separated allowlist in global settings. |
| Ignore folder names | Available | Exact matching is case-insensitive. |
| Ignore folder regular expressions | Available | Use `/pattern/` syntax. Matching is case-insensitive by default. |
| Ignore folder wildcards | Available | `*` and `?` are supported in addition to Watchtower-style regular expressions. |
| Suppress PSD and AI dialogs | Available at generic API level | Folder Watch controls Premiere's generic `suppressUI` import flag. UXP does not expose layer-specific PSD or AI choices. |
| Import camera-card structures | Available through heuristics | Recognizes AVCHD, Canon XF, Panasonic P2, XDCAM-EX, XDCAM-HD, Sony HDV, Sony XAVC, RED, ARRIRAW, and DCIM path signatures, then flattens their media bins. |
| Media Browser-equivalent spanned-clip logic | Partial | Premiere receives the media files through `Project.importFiles()`. Adobe UXP does not expose the Media Browser's full card-parser controls. |
| Apply project-item labels | Available | Supports all 15 labels exposed by `Constants.ProjectItemColorLabel` on created bins and imported media. |
| Add Import Date metadata | Unavailable in public UXP | Adobe's public metadata samples do not expose a documented Import Date project column. Folder Watch records activity time in its own panel instead. |

## Image sequences

| Watchtower workflow | Folder Watch status | Folder Watch behavior |
| --- | --- | --- |
| Detect numbered image sequences | Available | Groups supported stills that share a folder, prefix, extension, padding, and at least three trailing digits. |
| Force sequence or still import behavior | Available | Choose automatic, always group, or import as stills. |
| Import a sequence through Premiere | Available | Calls `Project.importFiles()` with `importAsNumberedStills` enabled. |
| Refresh a growing sequence | Experimental | Calls `ClipProjectItem.refreshMedia()` when a known sequence gains frames. Adobe documents media refresh, but does not explicitly guarantee that a sequence's duration will extend. |

## Ingest and proxies

| Workflow | Folder Watch status | Notes |
| --- | --- | --- |
| Premiere Create Proxies ingest mode | Compatible | Folder Watch does not disable project ingest settings, so Premiere can create proxies after import. |
| Copy ingest mode | Not recommended | Copying changes the imported media path and can cause the original watched source to be detected again. |
| Transcode ingest mode | Not recommended | Use an Adobe Media Encoder output folder as the watched folder instead. |
| Copy and Create Proxies | Not recommended | Copy the source into a watched destination first, then let Premiere create proxies. |
| Attach an existing proxy directly | Not automated | UXP exposes `attachProxy()`, but Folder Watch does not guess proxy pairings. |

## Integrations and hosts

| Watchtower feature | Folder Watch status | Reason |
| --- | --- | --- |
| Premiere Pro | Available | Premiere 25.6 or later. |
| After Effects | Out of scope | Folder Watch is a Premiere UXP project. |
| Team Projects scripting | Unavailable in UXP | Adobe exposes no Team Projects scripting API to Premiere UXP panels. |
| Productions scratch-disk awareness | Not required | Folder Watch imports by explicit native path and destination bin. |
| Spell Book commands | Out of scope | Spell Book is a separate commercial integration. Folder Watch's controls are available directly in the panel. |
| Jumper media analysis | Out of scope | Jumper is a separate third-party product. |
| Native operating-system notifications | Unavailable in UXP | Folder Watch uses an in-panel activity log. |
| Licensing and activation | Not applicable | Folder Watch is free under the MIT License and has no activation system. |

## Public references used

- [Watchtower product page](https://knightsoftheeditingtable.com/watchtower)
- [What is Watchtower for?](https://manuscript.knightsoftheeditingtable.com/extensions/watchtower/what-is-it-for)
- [Watchtower main panel](https://manuscript.knightsoftheeditingtable.com/extensions/watchtower/main-panel)
- [Watch-Folders Manager](https://manuscript.knightsoftheeditingtable.com/extensions/watchtower/watch-folders-manager)
- [Watchtower settings](https://manuscript.knightsoftheeditingtable.com/extensions/watchtower/settings)
- [Watchtower pro tips](https://manuscript.knightsoftheeditingtable.com/extensions/watchtower/pro-tips)
- [Watchtower changelog](https://manuscript.knightsoftheeditingtable.com/extensions/watchtower/change-log)
- [Adobe Premiere Pro UXP reference](https://developer.adobe.com/premiere-pro/uxp/ppro-reference/)
- [Adobe Premiere Pro UXP samples](https://github.com/AdobeDocs/uxp-premiere-pro-samples)
- [Adobe Premiere Pro type declarations](https://github.com/adobe/premierepro-types)
