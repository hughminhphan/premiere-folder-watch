# Security Policy

## Supported versions

Security fixes are applied to the latest published release.

## Report a vulnerability

Please do not open a public issue for a vulnerability.

Use the repository's **Security > Advisories > Report a vulnerability** flow on GitHub. Include:

- Folder Watch version
- Premiere and operating-system versions
- A clear impact statement
- Minimal reproduction steps
- Any proof of concept using disposable files and a throwaway project
- Suggested mitigation, if known

Do not include client media, credentials, private project names, or sensitive file paths.

## Security boundaries

A security issue includes behavior that can:

- Read files outside folders granted through Adobe's picker
- Write, move, rename, overwrite, or delete source media unexpectedly
- Import media into a project or bin without an explicit watch-folder configuration
- Expose native paths or project details to a remote party
- Introduce hidden network access, analytics, or credential collection
- Execute commands outside Premiere's UXP sandbox
- Corrupt persistent watch-folder state in a way that causes unintended imports

## Expected local behavior

The following are expected and are not vulnerabilities by themselves:

- Folder Watch stores watch configuration and persistent UXP tokens in local plugin storage.
- Folder Watch recursively reads metadata inside a folder the user selected.
- Folder Watch creates child folders only when the user chooses the Create control.
- Folder Watch creates Premiere bins and project items through Premiere's transaction and import APIs.
- Relative paths may require the user to grant folder access again after moving a project.

## Disclosure

Please allow reasonable time to reproduce, fix, test, and release a security update before public disclosure.
