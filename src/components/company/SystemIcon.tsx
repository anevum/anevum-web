import type { SystemName } from "./SystemMark";
import { RhenSystemGlyph } from "./RhenModuleGlyph";

type Size = "xs" | "sm" | "md" | "lg";

type IconProps = {
  system: SystemName;
  size?: Size;
  label?: boolean;
  className?: string;
};

export default function SystemIcon({ system, size = "md", label = false, className = "" }: IconProps) {
  if (!label) {
    return <RhenSystemGlyph system={system} size={size} className={className} decorative />;
  }

  return (
    <span className={"system-icon-with-label " + className} aria-label={system}>
      <RhenSystemGlyph system={system} size={size} decorative />
      <strong>{system}</strong>
    </span>
  );
}

export function SystemChip({ system, className = "" }: { system: SystemName; className?: string }) {
  return (
    <span className={"system-chip system-chip-" + system.toLowerCase() + " " + className}>
      <SystemIcon system={system} size="xs" />
      <strong>{system}</strong>
    </span>
  );
}
