export default function ArchitectureFlow({ steps, label }: { steps: string[]; label?: string }) {
  return (
    <div className="architecture-flow" aria-label={label || "System flow"}>
      {steps.map((step, index) => (
        <div className="architecture-flow-step" key={step}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <strong>{step}</strong>
          {index < steps.length - 1 ? <i aria-hidden="true">→</i> : null}
        </div>
      ))}
    </div>
  );
}
