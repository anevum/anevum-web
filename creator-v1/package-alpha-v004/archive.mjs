/* ANEVUM.WEB.BUILD.2026-10-18.001.UNIVERSAL-PACKAGE-PLAYER
 * Deterministic, dependency-free ZIP preflight/extraction for browser builds.
 * Explicit alpha ceilings protect the 128 MiB Worker memory limit.
 */
export const ZIP_LIMITS = Object.freeze({
  archive: 20 * 1048576,
  inflated: 48 * 1048576,
  singleFile: 12 * 1048576,
  files: 180,
  path: 240,
  ratio: 400
});

const MIME = Object.freeze({
  html: "text/html; charset=utf-8", htm: "text/html; charset=utf-8",
  js: "text/javascript; charset=utf-8", mjs: "text/javascript; charset=utf-8",
  css: "text/css; charset=utf-8", json: "application/json; charset=utf-8",
  webmanifest: "applicatio --- TRUNCATED --- 56,290 chars