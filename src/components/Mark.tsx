export default function Mark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={"anevum-mark " + className}
      viewBox="0 0 100 100"
      role="img"
      aria-label="ANEVUM"
    >
      <path d="M50 10C47 33 41 56 24 83" />
      <path d="M50 10C53 33 59 56 76 83" />
      <path className="mark-inner" d="M50 29C45 49 40 63 33 74" />
      <path className="mark-inner" d="M50 29C55 49 60 63 67 74" />
      <circle cx="50" cy="82" r="4.6" />
    </svg>
  );
}
