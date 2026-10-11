/** Server allowlist; curriculum parity is checked before release. No access grants. */
export const RHEN_LESSON_VERSIONS = Object.freeze({
  "market-orders-and-quotes": "1.0.0",
  "risk-math-and-strategy-evidence": "1.0.0"
});
export function knownLessonVersion(slug) {
  return typeof slug === "string" && Object.hasOwn(RHEN_LESSON_VERSIONS, slug)
    ? RHEN_LESSON_VERSIONS[slug] : null;
}
