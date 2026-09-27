type RhenMarkProps = {
  className?: string;
  decorative?: boolean;
  label?: string;
};

export default function RhenMark({
  className = "",
  decorative = false,
  label = "RHEN"
}: RhenMarkProps) {
  return (
    <svg
      className={`rhen-mark ${className}`}
      viewBox="0 0 120 104"
      role={decorative ? undefined : "img"}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : label}
    >
      <path className="rhen-ring" d="M17 70C17 37 35 15 60 15s43 22 43 55" />
      <path className="rhen-axis" d="M60 3v91" />
      <path className="rhen-wing" d="M60 35c-1 22-9 39-27 53" />
      <path className="rhen-wing" d="M60 35c1 22 9 39 27 53" />
      <path className="rhen-inner" d="M60 45c-2 21-5 34-10 43" />
      <path className="rhen-inner" d="M60 45c2 21 5 34 10 43" />
      <path className="rhen-horizon" d="M5 92Q60 78 115 92" />
      <g className="rhen-star">
        <path d="M60 8v14" />
        <path d="M53 15h14" />
        <path d="m60 10 2.2 5-2.2 5-2.2-5Z" />
      </g>
    </svg>
  );
}

export function RhenSectionLabel({ context }: { context: string }) {
  return (
    <div className="rhen-section-label">
      <RhenMark className="rhen-section-mark" decorative />
      <div>
        <span>RHEN / {context}</span>
        <small>OBSERVE&nbsp;&nbsp;//&nbsp;&nbsp;DISCOVER&nbsp;&nbsp;//&nbsp;&nbsp;EXECUTE</small>
      </div>
    </div>
  );
}
