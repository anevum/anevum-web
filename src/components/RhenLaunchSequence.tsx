import { motion, useReducedMotion } from "motion/react";
import RhenMark from "./RhenMark";

type LaunchService = {
  id: string;
  label: string;
  wheel: [number, number];
  mark: [number, number];
};

const launchServices: LaunchService[] = [
  { id: "openai", label: "OpenAI", wheel: [50, 13], mark: [50, 18] },
  { id: "github", label: "GitHub", wheel: [76, 24], mark: [38, 31] },
  { id: "railway", label: "Railway", wheel: [87, 50], mark: [62, 31] },
  { id: "supabase", label: "Supabase", wheel: [76, 76], mark: [50, 43] },
  { id: "alpaca", label: "Alpaca", wheel: [50, 87], mark: [39, 63] },
  { id: "slack", label: "Slack", wheel: [24, 76], mark: [61, 63] },
  { id: "cloudflare", label: "Cloudflare", wheel: [13, 50], mark: [30, 79] },
  { id: "python", label: "Python", wheel: [24, 24], mark: [70, 79] }
];

function ServiceGlyph({ id }: { id: string }) {
  switch (id) {
    case "openai":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="5" r="2.4" />
          <circle cx="18" cy="8.5" r="2.4" />
          <circle cx="18" cy="15.5" r="2.4" />
          <circle cx="12" cy="19" r="2.4" />
          <circle cx="6" cy="15.5" r="2.4" />
          <circle cx="6" cy="8.5" r="2.4" />
          <circle cx="12" cy="12" r="2.2" />
        </svg>
      );
    case "github":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="7" cy="6" r="2.1" />
          <circle cx="7" cy="18" r="2.1" />
          <circle cx="17" cy="12" r="2.1" />
          <path d="M7 8v8M9 7c5 0 6 2 6 5M9 17c5 0 6-2 6-5" />
        </svg>
      );
    case "railway":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 16.5 13 7.5M8 19l9-9M13 19l7-7" />
          <path d="M5 6.5h14" />
        </svg>
      );
    case "supabase":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path className="is-fill" d="M13.2 2.8 5.7 13h6.1L10.8 21.2 18.3 11h-6.1Z" />
        </svg>
      );
    case "alpaca":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 17.5 9 13l3 2.5 7-8" />
          <path d="M15.5 7.5H19V11" />
          <path d="M5 20h14" />
        </svg>
      );
    case "slack":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 3v7M15 14v7M3 15h7M14 9h7" />
          <circle cx="9" cy="15" r="2" />
          <circle cx="15" cy="9" r="2" />
        </svg>
      );
    case "cloudflare":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 16.5h15.5M5.5 16.5c-.2-.5-.3-1-.3-1.5a4.2 4.2 0 0 1 7.8-2.2A3.3 3.3 0 0 1 19.4 14c0 .9-.3 1.8-.9 2.5" />
        </svg>
      );
    case "python":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 11V7.5A3.5 3.5 0 0 1 10.5 4H14a3 3 0 0 1 3 3v4H9a3 3 0 0 0-3 3v1.5" />
          <path d="M17 13v3.5a3.5 3.5 0 0 1-3.5 3.5H10a3 3 0 0 1-3-3v-4h8a3 3 0 0 0 3-3V8.5" />
          <circle className="is-fill" cx="13.5" cy="7.2" r="1" />
          <circle className="is-fill" cx="10.5" cy="16.8" r="1" />
        </svg>
      );
    default:
      return <span>{id.slice(0, 2).toUpperCase()}</span>;
  }
}

export default function RhenLaunchSequence() {
  const reduceMotion = Boolean(useReducedMotion());

  return (
    <div
      className={"rhen-launch-sequence" + (reduceMotion ? " is-reduced-motion" : "")}
      role="img"
      aria-label="ANEVUM presents RHEN, formed from the connected tools and services behind the system."
    >
      {!reduceMotion ? (
        <>
          <svg className="rhen-launch-network" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {launchServices.map((service) => (
              <motion.line
                key={"spoke-" + service.id}
                x1="50"
                y1="50"
                x2={service.wheel[0]}
                y2={service.wheel[1]}
                initial={{ opacity: 0, pathLength: 0 }}
                animate={{ opacity: [0, 0.72, 0.72, 0], pathLength: [0, 1, 1, 1] }}
                transition={{ duration: 2.9, times: [0, 0.32, 0.72, 1], ease: "easeInOut" }}
              />
            ))}
            {launchServices.map((service, index) => {
              const next = launchServices[(index + 1) % launchServices.length];
              return (
                <motion.line
                  key={"edge-" + service.id}
                  x1={service.wheel[0]}
                  y1={service.wheel[1]}
                  x2={next.wheel[0]}
                  y2={next.wheel[1]}
                  initial={{ opacity: 0, pathLength: 0 }}
                  animate={{ opacity: [0, 0.48, 0.48, 0], pathLength: [0, 1, 1, 1] }}
                  transition={{ duration: 2.95, delay: 0.08 + index * 0.025, times: [0, 0.36, 0.72, 1], ease: "easeInOut" }}
                />
              );
            })}
            <motion.circle
              cx="50"
              cy="50"
              r="3.1"
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{ opacity: [0, 0.95, 0.95, 0], scale: [0.3, 1, 1, 0.45] }}
              transition={{ duration: 3.1, times: [0, 0.3, 0.72, 1], ease: "easeInOut" }}
            />
            <motion.path
              className="rhen-launch-lattice-mark"
              d="M50 18V82 M38 31Q50 15 62 31 M38 31Q30 48 39 63 M62 31Q70 48 61 63 M39 63Q50 74 61 63 M30 79Q50 69 70 79"
              initial={{ opacity: 0, pathLength: 0 }}
              animate={{ opacity: [0, 0.78, 0.78, 0], pathLength: [0, 1, 1, 1] }}
              transition={{ delay: 2.35, duration: 1.65, times: [0, 0.42, 0.76, 1], ease: "easeInOut" }}
            />
          </svg>

          {launchServices.map((service, index) => (
            <motion.div
              key={service.id}
              className="rhen-launch-node"
              initial={{ left: "50%", top: "50%", opacity: 0 }}
              animate={{
                left: ["50%", service.wheel[0] + "%", service.wheel[0] + "%", service.mark[0] + "%", service.mark[0] + "%"],
                top: ["50%", service.wheel[1] + "%", service.wheel[1] + "%", service.mark[1] + "%", service.mark[1] + "%"],
                opacity: [0, 1, 1, 0.84, 0]
              }}
              transition={{
                duration: 3.95,
                delay: index * 0.035,
                times: [0, 0.22, 0.54, 0.82, 1],
                ease: "easeInOut"
              }}
              aria-hidden="true"
            >
              <div className="rhen-launch-node-icon">
                <ServiceGlyph id={service.id} />
              </div>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 1, 0] }}
                transition={{ duration: 3.05, delay: 0.12 + index * 0.025, times: [0, 0.25, 0.68, 1] }}
              >
                {service.label}
              </motion.span>
            </motion.div>
          ))}
        </>
      ) : null}

      <motion.div
        className="rhen-launch-mark"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.66 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: reduceMotion ? 0 : 3.18, duration: reduceMotion ? 0 : 0.76, ease: [0.2, 0.8, 0.2, 1] }}
        aria-hidden="true"
      >
        <RhenMark decorative />
      </motion.div>

      <motion.div
        className="rhen-launch-presents"
        initial={reduceMotion ? false : { opacity: 0, y: 8, letterSpacing: "0.34em" }}
        animate={{ opacity: 1, y: 0, letterSpacing: "0.24em" }}
        transition={{ delay: reduceMotion ? 0 : 3.88, duration: reduceMotion ? 0 : 0.58, ease: "easeOut" }}
      >
        ANEVUM PRESENTS…
      </motion.div>

      <motion.div
        className="rhen-launch-name"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.62, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: reduceMotion ? 0 : 4.45, duration: reduceMotion ? 0 : 0.78, ease: [0.15, 0.85, 0.2, 1] }}
      >
        RHEN
      </motion.div>
    </div>
  );
}
