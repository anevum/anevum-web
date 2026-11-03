#!/usr/bin/env bash
# This builds an Access-protected reviewer artifact only. It does not deploy.
set -euo pipefail
cd "$(dirname "$0")/../.."
node scripts/verify-transcosmic-reader-preview.mjs
node scripts/verify-transcosmic-wiki-expansion.mjs
node --test tests/original-works-review-worker.test.mjs
npm run check
VITE_ORIGINAL_WORKS_PREVIEW=true npx vite build --base=/design/original-works/
node scripts/verify-original-works-preview-bundle.mjs --enabled
node --input-type=module -e "import fs from 'node:fs';const h=fs.readFileSync('dist/client/index.html','utf8');if(!h.includes('/design/original-works/assets/'))throw Error('Bundle base path not isolated');"
echo "ORIGINAL_WORKS_REVIEW_BUILD_VERIFIED: Access required before route creation"
