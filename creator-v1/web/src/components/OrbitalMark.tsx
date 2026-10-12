interface Props {
  className?: string;
  title?: string;
}

export function OrbitalMark({ className = "", title }: Props) {
  const labelled = Boolean(title);
  return (
    <svg
      className={className}
      viewBox="0 0 512 512"
      role={labelled ? "img" : undefined}
      aria-hidden={labelled ? undefined : true}
      aria-label={labelled ? title : undefined}
      focusable="false"
    >
      <ellipse cx="256" cy="256" rx="188" ry="76" transform="rotate(-17 256 256)" fill="none" stroke="currentColor" strokeWidth="34" strokeLinecap="round" />
      <path d="M256 56 274 211 326 256 274 301 256 456 238 301 186 256 238 211Z" fill="currentColor" />
      <circle cx="256" cy="256" r="72" fill="currentColor" />
      <circle className="mark-core-cut" cx="269" cy="251" r="34" />
      <circle className="mark-core-cut" cx="239" cy="230" r="8" opacity=".82" />
      <circle cx="391" cy="132" r="20" fill="currentColor" />
    </svg>
  );
}
