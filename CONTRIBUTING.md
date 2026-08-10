# Contributing

Thanks for helping improve Folder Watch.

## Good contributions

- Reproducible Premiere compatibility reports
- Windows, network-volume, junction, and removable-drive testing
- Camera-card structure fixtures and detection improvements
- Image-sequence behavior reports
- Bug fixes with tests
- Accessibility improvements
- Documentation fixes
- Focused feature proposals that fit an import-only safety model

## Before opening an issue

1. Search existing issues.
2. Confirm Premiere is version 25.6 or later.
3. Run the latest Folder Watch release.
4. Try a manual sync and record the exact result.
5. Remove private file names, client names, and project paths from screenshots or logs.

A useful bug report includes:

- Folder Watch version
- Premiere version
- Operating system and version
- Storage type, such as internal SSD, ExFAT drive, NAS, or cloud-synced folder
- Relevant folder settings
- File extension or camera-card format
- Exact visible error
- Minimal reproduction steps

## Development workflow

1. Fork the repository.
2. Create a focused branch.
3. Make the smallest coherent change.
4. Add or update tests for pure logic.
5. Run:

```sh
npm run check
npm run package
```

6. Validate and load the panel through Adobe UXP Developer Tool.
7. Test with a throwaway Premiere project and disposable media.
8. Open a pull request with the evidence.

## Code style

- Keep the runtime dependency-free unless a dependency has a strong, documented benefit.
- Keep Premiere-specific calls in `main.js`.
- Keep platform-neutral planning logic in `watch-core.js` so it remains testable in Node.
- Use explicit names and small functions.
- Preserve source-media safety. Never add automatic move, rename, overwrite, or delete behavior.
- Treat undocumented Premiere behavior as experimental and document it accurately.
- Avoid analytics, telemetry, remote services, and account requirements.

## Tests

Use Node's built-in test runner:

```sh
npm test
```

New path, filter, camera, inheritance, sequence, or sync-planning behavior should have a regression test in `test/`.

Premiere API changes also need Adobe UXP Developer Tool validation. Include the Premiere and UXP versions in the pull request.

## Pull request checklist

- [ ] The change is focused and described clearly.
- [ ] `npm run check` passes.
- [ ] The plugin validates through UXP Developer Tool.
- [ ] New behavior has tests where practical.
- [ ] Documentation matches actual behavior.
- [ ] No source-media deletion, moving, or renaming was introduced.
- [ ] No credentials, project media, or private paths are committed.

## Security reports

Do not open a public issue for a vulnerability that could expose files, bypass folder permissions, or modify project or source data unexpectedly. Follow [SECURITY.md](SECURITY.md).

## Code of conduct

Participation is governed by [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
