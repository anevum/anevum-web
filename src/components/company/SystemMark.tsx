import { RhenModuleMark, type RhenModuleName } from "./RhenModuleIcon";

export type SystemName = "IREN" | "RHEN" | "NOSTRA" | "GRAEN" | "VELUM";

export const SYSTEM_TO_RHEN_MODULE: Record<SystemName, RhenModuleName> = {
  RHEN: "EXECUTION",
  IREN: "CONTROL",
  GRAEN: "RESEARCH",
  VELUM: "REPLAY",
  NOSTRA: "FORECAST"
};

type Props = {
  system: SystemName;
  className?: string;
  decorative?: boolean;
};

export default function SystemMark({ system, className = "", decorative = false }: Props) {
  const module = SYSTEM_TO_RHEN_MODULE[system];
  return (
    <RhenModuleMark
      module={module}
      decorative={decorative}
      className={"system-mark-svg system-mark-" + system.toLowerCase() + " " + className}
    />
  );
}
