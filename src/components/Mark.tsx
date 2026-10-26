/**
 * ANEVUM owner-approved 03 ORBITAL UNDERGROUND identity (2026-10-12).
 * Exactly the canonical contour and color from creator-v1/brand/anevum-mark.svg.
 * This is a compatibility adapter for the retained V131 company shell, not a
 * new logo. Keep visual effects outside the SVG and never add an atom glyph.
 */
export default function Mark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={"anevum-mark " + className}
      data-anevum-mark="orbital-underground"
      viewBox="0 0 512 512"
      role="img"
      aria-label="ANEVUM Orbital Underground"
      focusable="false"
    >
      <ellipse cx="256" cy="256" rx="188" ry="76" transform="rotate(-17 256 256)" fill="none" stroke="#e8e1d6" strokeWidth="34" strokeLinecap="round" />
      <path d="M256 56 274 211 326 256 274 301 256 456 238 301 186 256 238 211Z" fill="#e8e1d6" />
      <circle cx="256" cy="256" r="72" fill="#e8e1d6" />
      <circle cx="269" cy="251" r="34" fill="#0b0b0d" />
      <circle cx="239" cy="230" r="8" fill="#0b0b0d" opacity=".82" />
      <circle cx="391" cy="132" r="20" fill="#e8e1d6" />
    </svg>
  );
}
