#!/usr/bin/env bash
# Validate, deploy, then try to load. Reports each stage separately.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
bash "$ROOT/scripts/deploy-windows.sh" "$@" || { echo "dev: DEPLOY STAGE FAILED" >&2; exit 1; }
bash "$ROOT/scripts/load-windows.sh" "$@"; code=$?
case $code in
  0) echo "dev: validate OK | deploy OK | UDT load OK | Premiere UI: NOT TESTED (manual)";;
  *) echo "dev: validate OK | deploy OK | UDT load FAILED (exit $code). Files are deployed; load manually in UDT." >&2;;
esac
exit $code
