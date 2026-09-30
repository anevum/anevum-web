import SystemMark, { type SystemName } from "./SystemMark";

type Size = "xs" | "sm" | "md" | "lg";

type IconProps = {
  system: SystemName;
  size?: Size;
  label?: boolean;
  className?: string;
};

export default function SystemIcon({ system, size = "md", label = false, className = "" }: IconProps) {
  return (
    <span
      className={"system-icon system-icon-" + system.toLowerCase() + " system-icon-" + size + " " + className}
      aria-label={label ? system : undefined}
      aria-hidden={label ? undefined : true}
    >
      <span className="system-icon-orbit" aria-hidden="true" />
      <SystemMark system={system} decorative />
      {label ? <strong>{system}</strong> : null}
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
