import SystemMark, { SYSTEM_TO_RHEN_MODULE, type SystemName } from "./SystemMark";

type Size = "xs" | "sm" | "md" | "lg";

type IconProps = {
  system: SystemName;
  size?: Size;
  label?: boolean;
  className?: string;
};

export default function SystemIcon({ system, size = "md", label = false, className = "" }: IconProps) {
  const module = SYSTEM_TO_RHEN_MODULE[system];
  const accessibleLabel = `RHEN ${module.toLowerCase()} module`;

  return (
    <span
      className={"system-icon system-icon-" + system.toLowerCase() + " system-icon-" + size + " " + className}
      aria-label={label ? accessibleLabel : undefined}
      aria-hidden={label ? undefined : true}
      data-rhen-module={module}
    >
      <span className="system-icon-orbit" aria-hidden="true" />
      <SystemMark system={system} decorative />
      {label ? <strong>{module}</strong> : null}
    </span>
  );
}

export function SystemChip({ system, className = "" }: { system: SystemName; className?: string }) {
  const module = SYSTEM_TO_RHEN_MODULE[system];
  return (
    <span className={"system-chip system-chip-" + system.toLowerCase() + " " + className} data-rhen-module={module}>
      <SystemIcon system={system} size="xs" />
      <strong>{module}</strong>
    </span>
  );
}
