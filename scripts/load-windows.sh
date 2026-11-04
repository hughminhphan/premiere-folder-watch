#!/usr/bin/env bash
# Validate and load the deployed plugin through Adobe UXP Developer Tool using the
# existing scripts/load-via-udt.js, run by Windows Node (WSL cannot reach the
# Windows loopback service in NAT mode).
# Usage: scripts/load-windows.sh [destination]
# Env: FOLDER_WATCH_WIN_DIR, UDT_PORT (default 14001)
# Exit codes: 0 loaded, 2 prerequisite missing, 3 UDT validation/load failed.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="${1:-${FOLDER_WATCH_WIN_DIR:-/mnt/c/Tools/PremiereFolderWatch}}"
PORT="${UDT_PORT:-14001}"

prereq() { echo "load: PREREQUISITE MISSING: $*" >&2; exit 2; }

command -v wslpath >/dev/null 2>&1 || prereq "wslpath not found; this script must run inside WSL"
NODE_EXE="$(command -v node.exe || true)"
[ -z "$NODE_EXE" ] && [ -x "/mnt/c/Program Files/nodejs/node.exe" ] && NODE_EXE="/mnt/c/Program Files/nodejs/node.exe"
[ -n "$NODE_EXE" ] || prereq "Windows Node.js (node.exe) not found. Install Node 20+ on Windows, or enable WSL interop."
[ -f "$DEST/manifest.json" ] || prereq "no deployed manifest at $DEST. Run: npm run deploy:windows"

WIN_MANIFEST="$(wslpath -w "$DEST/manifest.json")"
WIN_LOADER="$(wslpath -w "$ROOT/scripts/load-via-udt.js")"

echo "load: node.exe $("$NODE_EXE" -v 2>/dev/null | tr -d '\r'), port $PORT"
echo "load: manifest $WIN_MANIFEST"

# Run from a Windows drive: cmd/node reject UNC working directories.
cd /mnt/c || prereq "/mnt/c is not available"
if UDT_PORT="$PORT" WSLENV="${WSLENV:-}:UDT_PORT" "$NODE_EXE" "$WIN_LOADER" "$WIN_MANIFEST"; then
  echo "load: OK - plugin validated and loaded by UXP Developer Tool."
  echo "load: NOTE: this does not verify panel UI behavior. Test in Premiere."
else
  cat >&2 <<MSG
load: FAILED (UDT validation/load). Check that:
  - Adobe UXP Developer Tool is running
  - Premiere Pro is running, with Developer Mode enabled
  - the UDT service port is $PORT (override with UDT_PORT)
  - the plugin is not showing a manifest error in UDT
Manual fallback: add $WIN_MANIFEST in UDT and click Load.
MSG
  exit 3
fi
