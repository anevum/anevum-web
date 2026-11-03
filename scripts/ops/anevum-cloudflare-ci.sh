#!/usr/bin/env bash
# Build and browser verification for an isolated Cloudflare Workers Builds runner.
# The associated Cloudflare deploy command must remain a no-op. This script never deploys.
set -euo pipefail

cd "$(dirname "$0")/../.."

# Match the pinned Python render dependencies used by the existing GitHub CI.
python -m pip install --disable-pip-version-check \
  'weasyprint==68.0' 'Pillow==11.3.0' 'cryptography==45.0.7'
npm install --no-audit --no-fund

# Preserve the already-established content, authorization, member and build gates.
node scripts/verify-transcosmic-reader-preview.mjs
node scripts/verify-transcosmic-wiki-expansion.mjs
node --experimental-strip-types --test \
  tests/original-works*.test.mjs tests/transcosmic*.test.mjs tests/wiki-directory.test.mjs
npm run test:members
npm run test:foundation
npm run build
node scripts/verify-original-works-preview-bundle.mjs --disabled

# Cloudflare's build image has no Chrome. This tested Chromium build runs entirely
# inside the temporary CI environment; neither website bundle is made public.
npm install --no-save --no-audit --no-fund '@sparticuz/chromium@153.0.0'
mkdir -p /tmp/anevum-ci-bin
chrome_path="$(node --input-type=module -e \
  "import chromium from '@sparticuz/chromium'; console.log(await chromium.executablePath())")"
ln -sf "$chrome_path" /tmp/anevum-ci-bin/google-chrome
export PATH="/tmp/anevum-ci-bin:$PATH"

preview_pid=''
stop_preview() {
  if [[ -n "$preview_pid" ]]; then
    kill "$preview_pid" 2>/dev/null || true
    wait "$preview_pid" 2>/dev/null || true
    preview_pid=''
  fi
}
trap stop_preview EXIT

run_local_browser_check() {
  local port="$1"
  shift
  npx vite preview --host 127.0.0.1 --port "$port" --strictPort \
    > "/tmp/anevum-browser-$port.log" 2>&1 &
  preview_pid=$!
  local ready=0
  for _ in $(seq 1 40); do
    if curl --silent --fail --max-time 2 --output /dev/null \
      "http://127.0.0.1:$port/design/original-works"; then
      ready=1
      break
    fi
    sleep 0.25
  done
  if [[ "$ready" != 1 ]]; then
    cat "/tmp/anevum-browser-$port.log"
    echo 'Local Vite preview did not become ready' >&2
    return 1
  fi
  BASE_URL="http://127.0.0.1:$port" "$@"
  stop_preview
}

# Public-bundle negative route and byte-leak test in a real browser.
run_local_browser_check 4173 env ORIGINAL_WORKS_VERIFY_DISABLED=1 \
  node scripts/original-works-browser-qa.mjs

# Review-only build: browser test locally, never publish the resulting assets.
VITE_ORIGINAL_WORKS_PREVIEW=true npx vite build
node scripts/verify-original-works-preview-bundle.mjs --enabled
run_local_browser_check 4174 node scripts/original-works-browser-qa.mjs

echo 'ANEVUM_CLOUDFLARE_CI_PASS: source, production bundle, and isolated browser QA; no deployment.'
