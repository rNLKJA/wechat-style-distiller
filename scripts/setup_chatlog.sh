#!/usr/bin/env bash
#
# Install + run chatlog to extract your WeChat history on macOS.
# chatlog: https://github.com/sjzar/chatlog  (MIT)
#
# This script only sets up the tool. The actual decrypt step needs WeChat to be
# running and logged in, and on Apple Silicon may require granting chatlog
# permission to read the WeChat process memory.
#
set -euo pipefail

echo "==> Installing chatlog via Go..."
if ! command -v go >/dev/null 2>&1; then
  echo "Go not found. Install with: brew install go" >&2
  exit 1
fi
go install github.com/sjzar/chatlog@latest

CHATLOG="$(go env GOPATH)/bin/chatlog"
echo "==> Installed: $CHATLOG"
echo
cat <<'EOF'
Next steps (do these yourself — they touch your live WeChat):

  1. Make sure the WeChat desktop app is running and logged in.

  2. Get the decryption key (chatlog reads it from the running WeChat process):
         chatlog key

  3. Decrypt the local database into a workspace:
         chatlog decrypt

  4. Either export to JSON, or serve over HTTP for the pipeline:
         chatlog server          # then in another shell:
         python -m wechat_style_distiller.cli run --from-api --out output

     ...or point the pipeline at a JSON dump you exported:
         python -m wechat_style_distiller.cli run --input data/raw/chatlog.json --out output

Notes:
  * On Apple Silicon you may be prompted to allow memory access, or to run the
    `chatlog` TUI (just run `chatlog`) which walks you through key + decrypt.
  * Everything stays on your machine. Nothing here uploads your data.
EOF
