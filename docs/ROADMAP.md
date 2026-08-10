# Roadmap

Folder Watch 1.0 focuses on safe, local, import-only synchronization for Premiere Pro.

## Compatibility work

- Verify Windows 11 behavior on internal drives, removable ExFAT media, UNC shares, and junction folders
- Build public camera-card fixtures that contain directory names and empty placeholder files without copyrighted footage
- Track Premiere 25.6, 26.x, and future UXP API changes
- Add automated checks against Adobe's published Premiere type declarations

## Image sequences

- Verify whether `ClipProjectItem.refreshMedia()` extends sequence duration in every supported Premiere version
- Record behavior for missing frames, replaced frames, non-zero starting frames, and frame-number rollovers
- Add an explicit sequence-refresh health state in the panel

## Project workflows

- Evaluate concurrent polling for inactive open projects through `ProjectUtils.getProjectViewIds()` after its minimum supported Premiere version is clear
- Add an export and import format for watch-folder presets that excludes machine-specific permission tokens
- Add optional per-watch scan intervals for very large network folders

## Performance

- Add incremental directory snapshots to reduce repeated traversal work on very large trees
- Measure polling behavior on NAS and cloud-synced folders
- Add bounded concurrency for metadata reads if Adobe's UXP host proves stable under parallel calls

## User experience

- Add accessible label color previews once UXP rendering is verified across light and dark Premiere themes
- Add a compact mode for narrow docked panels
- Add optional activity export for debugging, with native paths redacted by default

## Explicit non-goals

- Moving, renaming, overwriting, or deleting source media
- Deleting Premiere project items when a disk file disappears
- Hidden telemetry or analytics
- Account creation, licensing, or activation
- Copy or transcode ingest orchestration
- Guessing proxy pairings
- After Effects support inside the Premiere plugin
- Reimplementing proprietary third-party integrations
