export type RhenModuleGlyphName =
  | "EXECUTION"
  | "CONTROL"
  | "RESEARCH"
  | "REPLAY"
  | "FORECAST"
  | "CORE"
  | "WORKER"
  | "COMMAND";

type Props = {
  module: RhenModuleGlyphName;
  className?: string;
  decorative?: boolean;
};

function Glyph({ module }: { module: RhenModuleGlyphName }) {
  if (module === "EXECUTION") {
    return (
      <>
        <path d="M18 42l12-12 9 7 17-20" />
        <path d="M48 17h8v8" />
      </>
    );
  }
  if (module === "CONTROL") {
    return (
      <>
        <rect x="21" y="21" width="30" height="30" rx="7" />
        <path d="M36 10v11M36 51v11M10 36h11M51 36h11" />
        <circle cx="36" cy="36" r="4" />
      </>
    );
  }
  if (module === "RESEARCH") {
    return (
      <>
        <path d="M36 12l22 13-7 25-15 12-22-12-7-25z" />
        <path d="M36 12v50M7 25l44 25M58 25L14 50M7 25l29 17 22-17" />
      </>
    );
  }
  if (module === "REPLAY") {
    return (
      <>
        <path d="M20 18a24 24 0 1 1-8 21" />
        <path d="M12 39l1 10 9-4" />
        <path d="M36 24v14l11 6" />
      </>
    );
  }
  if (module === "FORECAST") {
    return (
      <>
        <path d="M10 36c13 0 21-18 34-18 6 0 11 2 16 6" />
        <path d="M10 36h50" />
        <path d="M10 36c13 0 21 18 34 18 6 0 11-2 16-6" />
      </>
    );
  }
  if (module === "CORE") {
    return (
      <>
        <ellipse cx="36" cy="17" rx="18" ry="7" />
        <path d="M18 17v34c0 4 8 7 18 7s18-3 18-7V17" />
        <path d="M18 34c0 4 8 7 18 7s18-3 18-7M18 50c0 4 8 7 18 7s18-3 18-7" />
      </>
    );
  }
  if (module === "WORKER") {
    return (
      <>
        <path d="M36 15v9M36 48v9M15 36h9M48 36h9M22 22l7 7M43 43l7 7M50 22l-7 7M29 43l-7 7" />
        <path d="M36 25l10 6v11l-10 6-10-6V31z" />
      </>
    );
  }
  return (
    <>
      <rect x="12" y="17" width="48" height="38" rx="6" />
      <path d="M21 29l7 7-7 7M34 43h13M25 62h22M36 55v7" />
    </>
  );
}

export default function RhenModuleGlyph({ module, className = "", decorative = false }: Props) {
  return (
    <span
      className={"system-icon rhen-functional-icon rhen-functional-icon-" + module.toLowerCase() + " " + className}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : "RHEN " + module.toLowerCase() + " module"}
    >
      <svg
        className={"system-mark-svg rhen-module-glyph rhen-module-glyph-" + module.toLowerCase()}
        viewBox="0 0 72 72"
        role={decorative ? undefined : "img"}
        aria-hidden={decorative || undefined}
      >
        <Glyph module={module} />
      </svg>
    </span>
  );
}
