#!/usr/bin/env bash
# Real Chromium acceptance against the same Worker and path rewrite deployed
# to backstage, using an in-process ASSETS simulator on loopback only.
set -euo pipefail
cd "$(dirname "$0")/../.."

bin_dir="$(mktemp -d)"
server_pid=""
cleanup() {
  if [[ -n "$server_pid" ]]; then
    kill "$server_pid" 2>/dev/null || true
    wait "$server_pid" 2>/dev/null || true
  fi
  rm -rf "$bin_dir"
}
trap cleanup EXIT

# Prefer the GitHub runner's already-installed Chrome. The optional
# Sparticuz binary is for isolated environments without system Chrome.
if ! command -v google-chrome >/dev/null 2>&1; then
  chrome_path="$(node --input-type=module -e \
    "import chromium from '@sparticuz/chromium'; console.log(await chromium.executablePath())")"
  ln -s "$chrome_path" "$bin_dir/google-chrome"
fi
node scripts/ops/local-original-works-review-server.mjs > /tmp/anevum-original-works-review-http.log 2>&1 &
server_pid="$!"

ready=0
for _ in $(seq 1 40); do
  if curl --silent --fail --max-time 2 --output /dev/null \
      http://127.0.0.1:4174/design/original-works; then
    ready=1
    break
  fi
  sleep 0.25
done
if [[ "$ready" != 1 ]]; then
  cat /tmp/anevum-original-works-review-http.log
  echo 'Protected review local Worker did not start' >&2
  exit 1
fi

asset_path="$(node --input-type=module -e "
import fs from 'node:fs';
const html=fs.readFileSync('dist/client/index.html','utf8');
const asset=html.match(/src=\"(\/design\/original-works\/assets\/[^\"]+\.js)\"/);
if(!asset)throw Error('Review script URL missing');
console.log(asset[1]);
")"
headers="$(curl --fail --silent --show-error --head "http://127.0.0.1:4174$asset_path")"
if ! grep -iq 'content-type: text/javascript' <<< "$headers"; then
  echo "Review asset did not return JavaScript MIME type: $headers" >&2
  exit 1
fi
PATH="$bin_dir:$PATH" BASE_URL=http://127.0.0.1:4174 \
  node scripts/original-works-browser-qa.mjs
echo 'ORIGINAL_WORKS_PROTECTED_PATH_BROWSER_QA_PASS'
