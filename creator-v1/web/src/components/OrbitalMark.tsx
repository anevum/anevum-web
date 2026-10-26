interface Props {
  className?: string;
  title?: string;
}

/**
 * ANEVUM's approved 03 ORBITAL UNDERGROUND identity, 2026-10-12.
 * Do not replace this shared vector with the V136 three-plane atom concept.
 * The cinematic orbits, depth lighting, and environmental animations are
 * separate decorative layers; header, menu, player, and stage keep this mark.
 * Geometries and palette mirror ../brand/anevum-mark.svg.
 */
export function OrbitalMark({ className = "", title }: Props) {
  const labelled = Boolean(title);
  return (
    <svg
      className={className}
      viewBox="0 0 512 512"
      data-anevum-mark="orbital-underground"
      role={labelled ? "img" : undefined}
      aria-hidden={labelled ? undefined : true}
      aria-label={labelled ? title : undefined}
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
