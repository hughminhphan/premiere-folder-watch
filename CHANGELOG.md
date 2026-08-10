# Changelog

All notable changes to Folder Watch are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and releases use [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.0.0] - 2026-08-10

### Added

- Public MIT-licensed release
- Multiple watch folders per Premiere project
- Automatic and manual synchronization
- Per-folder destination bins based on the selected Premiere bin
- Nested bin creation that mirrors disk folders
- Flattened-folder imports
- Hierarchical child-folder manager with inherited sparse overrides
- Child-folder creation from the settings panel
- Persistent folder permissions and relinking
- Portable paths relative to saved Premiere projects
- Existing-media baseline mode
- Full-project duplicate media-path scanning
- Stable copy-completion checks
- Configurable extension allowlist
- Exact, wildcard, and regular-expression ignored-folder rules
- Numbered image-sequence detection
- Safe still-image fallback when a sequence pattern appears after an earlier frame was imported separately
- Experimental growing-sequence refresh
- Camera-card flattening heuristics for common professional formats
- Premiere project-item labels
- Project activation event handling
- In-panel activity history
- Dependency-free deterministic CCX packaging
- Node test suite and GitHub Actions CI
- Public installation, architecture, parity, security, and contribution documentation

### Safety

- Source media is never moved, renamed, overwritten, or deleted.
- Removed disk media does not remove Premiere project items.
- No network permission, telemetry, account, or activation system is present.

## [0.1.0] - 2026-08-10

### Added

- Single recursively watched folder
- Persistent folder token
- Selected Premiere insertion-bin import
- Stable copy-completion polling
- Import-existing and watch-new modes
- Basic path registry and media extension filter

[Unreleased]: https://github.com/hughminhphan/premiere-folder-watch/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/hughminhphan/premiere-folder-watch/releases/tag/v1.0.0
