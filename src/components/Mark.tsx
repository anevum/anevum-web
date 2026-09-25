export default function Mark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={"anevum-mark " + className}
      viewBox="0 0 100 100"
      role="img"
      aria-label="ANEVUM"
    >
      <path className="mark-ring" d="M50 4a46 46 0 1 1 0 92a46 46 0 1 1 0-92Z" />
      <path className="mark-outer" d="M50 14C47 34 39 58 20 78" />
      <path className="mark-outer" d="M50 14C53 34 61 58 80 78" />
      <path className="mark-inner" d="M50 31C45 49 40 62 33 69" />
      <path className="mark-inner" d="M50 31C55 49 60 62 67 69" />
      <path className="mark-stem" d="M50 52V78" />
      <circle cx="50" cy="81" r="4.8" />
    </svg>
  );
}
