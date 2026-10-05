export const RHEN_MODULES = [
  "EXECUTION",
  "CONTROL",
  "RESEARCH",
  "REPLAY",
  "FORECAST",
  "CORE",
  "WORKER",
  "COMMAND"
] as const;

export type RhenModuleName = typeof RHEN_MODULES[number];
type Size = "xs" | "sm" | "md" | "lg";

type MarkProps = {
  module: RhenModuleName;
  className?: string;
  decorative?: boolean;
};

type IconProps = MarkProps & {
  size?: Size;
  label?: boolean;
};

function ModuleGlyph({ module }: { module: RhenModuleName }) {
  if (module === "EXECUTION") {
    return (
      <>
        <path className="rm-line" d="M31 82L48 65l12 6 25-30" />
        <path className="rm-line" d="M76 41h9v9" />
        <circle className="rm-node" cx="31" cy="82" r="3.4" />
        <circle className="rm-node" cx="60" cy="71" r="3.4" />
      </>
    );
  }

  if (module === "CONTROL") {
    return (
      <>
        <rect className="rm-line" x="46" y="46" width="28" height="28" rx="6" />
        <path className="rm-line" d="M60 25v21M60 74v21M25 60h21M74 60h21" />
        <circle className="rm-core" cx="60" cy="60" r="5" />
        <circle className="rm-node" cx="60" cy="25" r="3" />
        <circle className="rm-node" cx="95" cy="60" r="3" />
        <circle className="rm-node" cx="60" cy="95" r="3" />
        <circle className="rm-node" cx="25" cy="60" r="3" />
      </>
    );
  }

  if (module === "RESEARCH") {
    return (
      <>
        <path className="rm-line" d="M60 27L87 44 78 77 60 93 33 77 25 44Z" />
        <path className="rm-line rm-faint" d="M60 27v66M25 44l53 33M87 44L33 77M25 44l35 16 27-16M33 77l27-17 18 17" />
        <circle className="rm-core" cx="60" cy="60" r="4.8" />
        <circle className="rm-node" cx="60" cy="27" r="3" />
        <circle className="rm-node" cx="87" cy="44" r="3" />
        <circle className="rm-node" cx="78" cy="77" r="3" />
        <circle className="rm-node" cx="33" cy="77" r="3" />
        <circle className="rm-node" cx="25" cy="44" r="3" />
      </>
    );
  }

  if (module === "REPLAY") {
    return (
      <>
        <path className="rm-line" d="M39 34a32 32 0 1 1-10 29" />
        <path className="rm-line" d="M29 63l1 12 11-5" />
        <path className="rm-line" d="M60 42v19l15 9" />
        <circle className="rm-core" cx="60" cy="61" r="4.5" />
      </>
    );
  }

  if (module === "FORECAST") {
    return (
      <>
        <path className="rm-line" d="M29 60c17 0 27-25 43-25 7 0 13 2 19 7" />
        <path className="rm-line" d="M29 60c18 0 30 0 62 0" />
        <path className="rm-line rm-faint" d="M29 60c17 0 27 25 43 25 7 0 13-2 19-7" />
        <circle className="rm-core" cx="29" cy="60" r="4.5" />
        <circle className="rm-node" cx="91" cy="42" r="3.3" />
        <circle className="rm-node" cx="91" cy="60" r="3.3" />
        <circle className="rm-node" cx="91" cy="78" r="3.3" />
      </>
    );
  }

  if (module === "CORE") {
    return (
      <>
        <path className="rm-line" d="M35 39c0-6 11-11 25-11s25 5 25 11v42c0 6-11 11-25 11S35 87 35 81Z" />
        <path className="rm-line" d="M35 39c0 6 11 11 25 11s25-5 25-11M35 59c0 6 11 11 25 11s25-5 25-11M35 79c0 6 11 11 25 11s25-5 25-11" />
        <circle className="rm-core" cx="60" cy="60" r="3.8" />
      </>
    );
  }

  if (module === "WORKER") {
    return (
      <>
        <path className="rm-line" d="M60 33v13M60 74v13M33 60h13M74 60h13M41 41l10 10M69 69l10 10M79 41 69 51M51 69 41 79" />
        <path className="rm-line" d="M60 46l12 7v14l-12 7-12-7V53Z" />
        <circle className="rm-core" cx="60" cy="60" r="4.5" />
        <circle className="rm-node" cx="60" cy="33" r="2.8" />
        <circle className="rm-node" cx="87" cy="60" r="2.8" />
        <circle className="rm-node" cx="60" cy="87" r="2.8" />
        <circle className="rm-node" cx="33" cy="60" r="2.8" />
      </>
    );
  }

  return (
    <>
      <rect className="rm-line" x="29" y="35" width="62" height="50" rx="7" />
      <path className="rm-line" d="M39 49l9 8-9 8M55 65h20" />
      <path className="rm-line rm-faint" d="M42 93h36M60 85v8" />
      <circle className="rm-node" cx="82" cy="45" r="2.7" />
    </>
  );
}

export function RhenModuleMark({ module, className = "", decorative = false }: MarkProps) {
  return (
    <svg
      className={"rhen-module-mark rhen-module-mark-" + module.toLowerCase() + " " + className}
      viewBox="0 0 120 120"
      role={decorative ? undefined : "img"}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : "RHEN " + module.toLowerCase() + " module"}
    >
      <circle className="rm-shell" cx="60" cy="60" r="45" />
      <circle className="rm-shell rm-shell-inner" cx="60" cy="60" r="35" />
      <path className="rm-ticks" d="M60 15v7M60 98v7M15 60h7M98 60h7" />
      <ModuleGlyph module={module} />
    </svg>
  );
}

export default function RhenModuleIcon({
  module,
  size = "md",
  label = false,
  className = "",
  decorative = false
}: IconProps) {
  return (
    <span
      className={
        "system-icon system-icon-rhen rhen-module-icon rhen-module-icon-" +
        module.toLowerCase() +
        " system-icon-" +
        size +
        " " +
        className
      }
      aria-label={label && !decorative ? "RHEN " + module.toLowerCase() : undefined}
      aria-hidden={label || !decorative ? undefined : true}
    >
      <span className="system-icon-orbit" aria-hidden="true" />
      <RhenModuleMark module={module} decorative />
      {label ? <strong>{module}</strong> : null}
    </span>
  );
}
