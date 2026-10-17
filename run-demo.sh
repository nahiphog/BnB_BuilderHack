#!/usr/bin/env bash
# One command from the repo root:  bash run-demo.sh
set -e
cd "$(dirname "$0")"
echo "Installing (first run only takes a minute)..."
(cd core && npm install --silent)
(cd executor && npm install --silent)
(cd core && npm test --silent >/dev/null && echo "Unit tests: all passing")
cd executor && npm run --silent demo 2>&1 | tee ../demo-output.txt
echo; echo "Full output saved to demo-output.txt. Paste it to Claude."
