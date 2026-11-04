#!/usr/bin/env bash
# Deploy the Folder Watch runtime files from this WSL repository to a Windows folder.
# Usage: scripts/deploy-windows.sh [destination]
# Destination precedence: argument > FOLDER_WATCH_WIN_DIR > /mnt/c/Tools/PremiereFolderWatch
# Set SKIP_CHECK=1 to skip `npm run check` (used by automated tests).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="${1:-${FOLDER_WATCH_WIN_DIR:-/mnt/c/Tools/PremiereFolderWatch}}"

fail() { echo "deploy: ERROR: $*" >&2; exit 1; }

# Runtime file list is read from scripts/package.js so it is never duplicated here.
mapfile -t FILES < <(node -e '
  const src = require("fs").readFileSync(process.argv[1], "utf8");
  const match = src.match(/const files = \[([^\]]*)\]/);
  if (!match) process.exit(1);
  for (const m of match[1].matchAll(/"([^"]+)"/g)) console.log(m[1]);
' "$ROOT/scripts/package.js") || fail "could not read runtime file list from scripts/package.js"
[ "${#FILES[@]}" -gt 0 ] || fail "runtime file list is empty"

for file in "${FILES[@]}"; do
  [ -f "$ROOT/$file" ] || fail "missing runtime file: $file"
done

if [ "${SKIP_CHECK:-0}" != "1" ]; then
  echo "deploy: stage 1/2 validating (npm run check)"
  (cd "$ROOT" && npm run --silent check) || fail "validation failed; nothing was deployed"
fi

echo "deploy: stage 2/2 copying ${#FILES[@]} files to $DEST"
mkdir -p "$DEST" || fail "cannot create $DEST (is the Windows drive mounted?)"
for file in "${FILES[@]}"; do
  cp -f "$ROOT/$file" "$DEST/$file" || fail "copy failed: $file"
  cmp -s "$ROOT/$file" "$DEST/$file" || fail "verification failed: $file"
done

if command -v wslpath >/dev/null 2>&1; then WIN_DEST="$(wslpath -w "$DEST")"; else WIN_DEST="$DEST"; fi
echo "deploy: OK ($WIN_DEST)"
cat <<MSG

To load manually: open Adobe UXP Developer Tool (Premiere running, Developer Mode on),
choose Add Plugin, select:
  $WIN_DEST\\manifest.json
then Load/Reload. Or run: npm run load:windows
MSG
