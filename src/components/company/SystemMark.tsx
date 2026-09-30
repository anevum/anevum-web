import RhenMark from "../RhenMark";

type SystemName = "IREN" | "RHEN" | "NOSTRA" | "GRAEN" | "VELUM";

type Props = {
  system: SystemName;
  className?: string;
  decorative?: boolean;
};

export default function SystemMark({ system, className = "", decorative = false }: Props) {
  if (system === "RHEN") {
    return <RhenMark className={"system-mark-svg system-mark-rhen " + className} decorative={decorative} label="RHEN" />;
  }

  const common = {
    role: decorative ? undefined : "img",
    "aria-hidden": decorative || undefined,
    "aria-label": decorative ? undefined : system,
    viewBox: "0 0 120 120",
    className: "system-mark-svg system-mark-" + system.toLowerCase() + " " + className
  } as const;

  if (system === "IREN") {
    return (
      <svg {...common}>
        <circle cx="60" cy="60" r="31" className="sm-ring sm-ring-outer" />
        <circle cx="60" cy="60" r="19" className="sm-ring sm-ring-inner" />
        <circle cx="60" cy="60" r="7" className="sm-core" />
        <path className="sm-line" d="M60 9v30M60 81v30M9 60h30M81 60h30" />
        <path className="sm-line sm-faint" d="M24 24l21 21M75 75l21 21M96 24L75 45M45 75L24 96" />
        <circle cx="60" cy="9" r="3" className="sm-node" />
        <circle cx="111" cy="60" r="3" className="sm-node" />
        <circle cx="60" cy="111" r="3" className="sm-node" />
        <circle cx="9" cy="60" r="3" className="sm-node" />
      </svg>
    );
  }

  if (system === "GRAEN") {
    return (
      <svg {...common}>
        <circle cx="60" cy="60" r="45" className="sm-ring sm-faint" />
        <path className="sm-line" d="M60 15L96 39v42L60 105 24 81V39Z" />
        <path className="sm-line sm-faint" d="M60 15v90M24 39l72 42M96 39L24 81M24 39l36 21 36-21M24 81l36-21 36 21" />
        <circle cx="60" cy="60" r="7" className="sm-core" />
        {[["60","15"],["96","39"],["96","81"],["60","105"],["24","81"],["24","39"]].map(([cx,cy]) => <circle key={cx+cy} cx={cx} cy={cy} r="3.4" className="sm-node" />)}
      </svg>
    );
  }

  if (system === "NOSTRA") {
    return (
      <svg {...common}>
        <path className="sm-line" d="M60 9v102" />
        <path className="sm-wave" d="M18 92c16-26 28-26 42 0s26 26 42 0" />
        <path className="sm-wave sm-faint" d="M18 72c16-23 28-23 42 0s26 23 42 0" />
        <path className="sm-wave sm-faint" d="M18 52c16-20 28-20 42 0s26 20 42 0" />
        <circle cx="60" cy="92" r="4" className="sm-node" />
        <circle cx="60" cy="72" r="3.5" className="sm-node" />
        <circle cx="60" cy="52" r="3" className="sm-node" />
        <circle cx="60" cy="30" r="2.5" className="sm-node" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <circle cx="60" cy="60" r="45" className="sm-ring sm-faint" />
      <path className="sm-line" d="M60 10v100" />
      <path className="sm-trajectory" d="M28 98C86 92 88 36 54 20C35 11 25 30 41 42C61 57 85 64 92 82" />
      <path className="sm-trajectory sm-alt" d="M92 98C34 92 32 36 66 20C85 11 95 30 79 42C59 57 35 64 28 82" />
      <path className="sm-line sm-faint" d="M47 29l13-18 13 18" />
      <circle cx="60" cy="60" r="5" className="sm-core" />
    </svg>
  );
}
