#!/bin/sh
set -eu
cd "$(dirname "$0")"
echo "PORCHLIGHT FICTIONAL PHONE REVIEW - never enter real information"
echo "Press Ctrl+C to stop."
node server.mjs --lan --minutes 60
