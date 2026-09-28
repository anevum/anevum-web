import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import RhenMark from "./RhenMark";

type LaunchService = {
  id: string;
  label: string;
  wheel: [number, number];
  mark: [number, number];
};

const launchServices: LaunchService[] = [
  { id: "openai", label: "OpenAI", wheel: [50, 9], mark: [50, 16] },
  { id: "github", label: "GitHub", wheel: [79, 21], mark: [38, 29] },
  { id: "railway", label: "Railway", wheel: [91, 50], mark: [63, 30] },
  { id: "supabase", label: "Supabase", wheel: [79, 79], mark: [51, 43] },
  { id: "alpaca", label: "Alpaca", wheel: [50, 91], mark: [39, 64] },
  { id: "slack", label: "Slack", wheel: [21, 79], mark: [61, 64] },
  { id: "cloudflare", label: "Cloudflare", wheel: [9, 50], mark: [29, 80] },
  { id: "python", label: "Python", wheel: [21, 21], mark: [71, 80] }
];

const particles = Array.from({ length: 22 }, (_, index) => ({
  id: index,
  left: 7 + ((index * 19) % 86),
  top: 8 + ((index * 31) % 82),
  driftX: ((index % 5) - 2) * 8,
  driftY: -10 - (index % 7) * 4,
  delay: (index % 9) * 0.13,
  size: 1 + (index % 3) * 0.7
}));

function BrandMark({ id }: { id: string }) {
  switch (id) {
    case "railway":
      return (
        <svg className="service-brand-svg" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M.113 10.27A13.026 13.026 0 000 11.48h18.23c-.064-.125-.15-.237-.235-.347-3.117-4.027-4.793-3.677-7.19-3.78-.8-.034-1.34-.048-4.524-.048-1.704 0-3.555.005-5.358.01-.234.63-.459 1.24-.567 1.737h9.342v1.216H.113v.002zm18.26 2.426H.009c.02.326.05.645.094.961h16.955c.754 0 1.179-.429 1.315-.96zm-17.318 4.28s2.81 6.902 10.93 7.024c4.855 0 9.027-2.883 10.92-7.024H1.056zM11.988 0C7.5 0 3.593 2.466 1.531 6.108l4.75-.005v-.002c3.71 0 3.849.016 4.573.047l.448.016c1.563.052 3.485.22 4.996 1.364.82.621 2.007 1.99 2.712 2.965.654.902.842 1.94.396 2.934-.408.914-1.289 1.458-2.353 1.458H.391s.099.42.249.886h22.748A12.026 12.026 0 0024 12.005C24 5.377 18.621 0 11.988 0z" />
        </svg>
      );
    case "supabase":
      return (
        <svg className="service-brand-svg" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M11.9 1.036c-.015-.986-1.26-1.41-1.874-.637L.764 12.05C-.33 13.427.65 15.455 2.409 15.455h9.579l.113 7.51c.014.985 1.259 1.408 1.873.636l9.262-11.653c1.093-1.375.113-3.403-1.645-3.403h-9.642z" />
        </svg>
      );
    case "github":
      return (
        <svg className="service-brand-svg" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
        </svg>
      );
    case "cloudflare":
      return (
        <svg className="service-brand-svg" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M16.5088 16.8447c.1475-.5068.0908-.9707-.1553-1.3154-.2246-.3164-.6045-.499-1.0615-.5205l-8.6592-.1123a.1559.1559 0 0 1-.1333-.0713c-.0283-.042-.0351-.0986-.021-.1553.0278-.084.1123-.1484.2036-.1562l8.7359-.1123c1.0351-.0489 2.1601-.8868 2.5537-1.9136l.499-1.3013c.0215-.0561.0293-.1128.0147-.168-.5625-2.5463-2.835-4.4453-5.5499-4.4453-2.5039 0-4.6284 1.6177-5.3876 3.8614-.4927-.3658-1.1187-.5625-1.794-.499-1.2026.119-2.1665 1.083-2.2861 2.2856-.0283.31-.0069.6128.0635.894C1.5683 13.171 0 14.7754 0 16.752c0 .1748.0142.3515.0352.5273.0141.083.0844.1475.1689.1475h15.9814c.0909 0 .1758-.0645.2032-.1553l.12-.4268zm2.7568-5.5634c-.0771 0-.1611 0-.2383.0112-.0566 0-.1054.0415-.127.0976l-.3378 1.1744c-.1475.5068-.0918.9707.1543 1.3164.2256.3164.6055.498 1.0625.5195l1.8437.1133c.0557 0 .1055.0263.1329.0703.0283.043.0351.1074.0214.1562-.0283.084-.1132.1485-.204.1553l-1.921.1123c-1.041.0488-2.1582.8867-2.5527 1.914l-.1406.3585c-.0283.0713.0215.1416.0986.1416h6.5977c.0771 0 .1474-.0489.169-.126.1122-.4082.1757-.837.1757-1.2803 0-2.6025-2.125-4.727-4.7344-4.727" />
        </svg>
      );
    case "python":
      return (
        <svg className="service-brand-svg" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M14.25.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.3.31-.33.25-.35.19-.35.14-.33.1-.3.07-.26.04-.21.02H8.77l-.69.05-.59.14-.5.22-.41.27-.33.32-.27.35-.2.36-.15.37-.1.35-.07.32-.04.27-.02.21v3.06H3.17l-.21-.03-.28-.07-.32-.12-.35-.18-.36-.26-.36-.36-.35-.46-.32-.59-.28-.73-.21-.88-.14-1.05-.05-1.23.06-1.22.16-1.04.24-.87.32-.71.36-.57.4-.44.42-.33.42-.24.4-.16.36-.1.32-.05.24-.01h.16l.06.01h8.16v-.83H6.18l-.01-2.75-.02-.37.05-.34.11-.31.17-.28.25-.26.31-.23.38-.2.44-.18.51-.15.58-.12.64-.1.71-.06.77-.04.84-.02 1.27.05zm-6.3 1.98l-.23.33-.08.41.08.41.23.34.33.22.41.09.41-.09.33-.22.23-.34.08-.41-.08-.41-.23-.33-.33-.22-.41-.09-.41.09zm13.09 3.95l.28.06.32.12.35.18.36.27.36.35.35.47.32.59.28.73.21.88.14 1.04.05 1.23-.06 1.23-.16 1.04-.24.86-.32.71-.36.57-.4.45-.42.33-.42.24-.4.16-.36.09-.32.05-.24.02-.16-.01h-8.22v.82h5.84l.01 2.76.02.36-.05.34-.11.31-.17.29-.25.25-.31.24-.38.2-.44.17-.51.15-.58.13-.64.09-.71.07-.77.04-.84.01-1.27-.04-1.07-.14-.9-.2-.73-.25-.59-.3-.45-.33-.34-.34-.25-.34-.16-.33-.1-.3-.04-.25-.02-.2.01-.13v-5.34l.05-.64.13-.54.21-.46.26-.38.3-.32.33-.24.35-.2.35-.14.33-.1.3-.06.26-.04.21-.02.13-.01h5.84l.69-.05.59-.14.5-.21.41-.28.33-.32.27-.35.2-.36.15-.36.1-.35.07-.32.04-.28.02-.21V6.07h2.09l.14.01zm-6.47 14.25l-.23.33-.08.41.08.41.23.33.33.23.41.08.41-.08.33-.23.23-.33.08-.41-.08-.41-.23-.33-.33-.23-.41-.08-.41.08z" />
        </svg>
      );
    case "slack":
      return (
        <img
          className="service-brand-image"
          src="https://a.slack-edge.com/80588/marketing/img/meta/slack_hash_256.png"
          alt=""
          aria-hidden="true"
          draggable={false}
        />
      );
    case "openai":
      return (
        <img
          className="service-brand-image service-brand-image-openai"
          src="https://images.ctfassets.net/kftzwdyauwt9/3hUGLn3ypllZ0oa01qOYVq/28e8188e6f11b84c3e876569d492734f/Blossom_Light.svg"
          alt=""
          aria-hidden="true"
          draggable={false}
        />
      );
    case "alpaca":
      return (
        <img
          className="service-brand-image"
          src="https://alpaca.markets/img/newsroom/brand-assets/yellow-symbol-alpaca-logo.png"
          alt=""
          aria-hidden="true"
          draggable={false}
        />
      );
    default:
      return null;
  }
}

export default function RhenLaunchSequence() {
  const reduceMotion = Boolean(useReducedMotion());
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const node = stageRef.current;
    if (!node) return;

    const updateSize = () => {
      const rect = node.getBoundingClientRect();
      setStageSize({ width: rect.width, height: rect.height });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const px = (percent: number, axis: "x" | "y") =>
    (axis === "x" ? stageSize.width : stageSize.height) * percent / 100;

  return (
    <div
      ref={stageRef}
      className={"rhen-launch-sequence rhen-launch-sequence-v2" + (reduceMotion ? " is-reduced-motion" : "")}
      role="img"
      aria-label="ANEVUM presents RHEN, assembled from the connected services behind the system."
    >
      <div className="rhen-launch-deep-glow" aria-hidden="true" />
      <div className="rhen-launch-grid" aria-hidden="true" />

      {!reduceMotion && stageSize.width > 0 ? (
        <>
          <motion.div
            className="rhen-launch-shockwave rhen-launch-shockwave-a"
            initial={{ opacity: 0, scale: 0.2 }}
            animate={{ opacity: [0, 0.8, 0], scale: [0.2, 1, 1.24] }}
            transition={{ delay: 0.3, duration: 2.2, ease: "easeOut" }}
            aria-hidden="true"
          />
          <motion.div
            className="rhen-launch-shockwave rhen-launch-shockwave-b"
            initial={{ opacity: 0, scale: 0.2 }}
            animate={{ opacity: [0, 0.42, 0], scale: [0.2, 1, 1.42] }}
            transition={{ delay: 0.75, duration: 2.4, ease: "easeOut" }}
            aria-hidden="true"
          />
          <motion.div
            className="rhen-launch-core"
            initial={{ opacity: 0, scale: 0.15 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0.15, 1.06, 0.8, 0.2] }}
            transition={{ duration: 6.8, times: [0, 0.16, 0.76, 1], ease: "easeInOut" }}
            aria-hidden="true"
          >
            <i />
          </motion.div>

          <motion.div
            className="rhen-launch-orbit rhen-launch-orbit-outer"
            initial={{ opacity: 0, scale: 0.55, rotate: -18 }}
            animate={{ opacity: [0, 0.75, 0.42, 0], scale: [0.55, 1, 1.02, 0.78], rotate: [-18, 8, 24, 48] }}
            transition={{ duration: 7.0, times: [0, 0.25, 0.78, 1], ease: "easeInOut" }}
            aria-hidden="true"
          />
          <motion.div
            className="rhen-launch-orbit rhen-launch-orbit-inner"
            initial={{ opacity: 0, scale: 0.55, rotate: 24 }}
            animate={{ opacity: [0, 0.56, 0.3, 0], scale: [0.55, 1, 0.92, 0.7], rotate: [24, -8, -26, -44] }}
            transition={{ duration: 6.9, delay: 0.15, times: [0, 0.25, 0.78, 1], ease: "easeInOut" }}
            aria-hidden="true"
          />

          <svg className="rhen-launch-network" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <filter id="rhen-network-glow" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="0.65" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            {launchServices.map((service, index) => (
              <motion.line
                key={"spoke-" + service.id}
                className="rhen-launch-spoke"
                x1="50"
                y1="50"
                x2={service.wheel[0]}
                y2={service.wheel[1]}
                initial={{ opacity: 0, pathLength: 0 }}
                animate={{ opacity: [0, 0.88, 0.38, 0], pathLength: [0, 1, 1, 1] }}
                transition={{ duration: 5.6, delay: 0.75 + index * 0.08, times: [0, 0.28, 0.78, 1], ease: "easeInOut" }}
              />
            ))}
            {launchServices.map((service, index) => {
              const next = launchServices[(index + 1) % launchServices.length];
              const skip = launchServices[(index + 2) % launchServices.length];
              return (
                <g key={"connections-" + service.id}>
                  <motion.line
                    className="rhen-launch-edge"
                    x1={service.wheel[0]}
                    y1={service.wheel[1]}
                    x2={next.wheel[0]}
                    y2={next.wheel[1]}
                    initial={{ opacity: 0, pathLength: 0 }}
                    animate={{ opacity: [0, 0.76, 0.42, 0], pathLength: [0, 1, 1, 1] }}
                    transition={{ duration: 4.8, delay: 2.1 + index * 0.08, times: [0, 0.28, 0.82, 1], ease: "easeInOut" }}
                  />
                  <motion.line
                    className="rhen-launch-edge rhen-launch-edge-faint"
                    x1={service.wheel[0]}
                    y1={service.wheel[1]}
                    x2={skip.wheel[0]}
                    y2={skip.wheel[1]}
                    initial={{ opacity: 0, pathLength: 0 }}
                    animate={{ opacity: [0, 0.26, 0.18, 0], pathLength: [0, 1, 1, 1] }}
                    transition={{ duration: 4.4, delay: 2.4 + index * 0.06, times: [0, 0.28, 0.82, 1], ease: "easeInOut" }}
                  />
                </g>
              );
            })}
            <motion.path
              className="rhen-launch-lattice-mark"
              d="M50 16V84 M38 29Q50 13 62 29 M38 29Q28 48 39 64 M62 29Q72 48 61 64 M39 64Q50 77 61 64 M28 80Q50 69 72 80"
              initial={{ opacity: 0, pathLength: 0 }}
              animate={{ opacity: [0, 0.95, 0.72, 0], pathLength: [0, 1, 1, 1] }}
              transition={{ delay: 6.15, duration: 2.15, times: [0, 0.34, 0.78, 1], ease: "easeInOut" }}
            />
          </svg>

          {particles.map((particle) => (
            <motion.i
              key={particle.id}
              className="rhen-launch-particle"
              style={{
                left: particle.left + "%",
                top: particle.top + "%",
                width: particle.size,
                height: particle.size
              }}
              initial={{ opacity: 0, x: 0, y: 8 }}
              animate={{
                opacity: [0, 0.7, 0.15, 0],
                x: [0, particle.driftX, particle.driftX * 1.7],
                y: [8, particle.driftY, particle.driftY * 1.55]
              }}
              transition={{ delay: 1 + particle.delay * 1.35, duration: 4.5 + (particle.id % 4) * 0.32, ease: "easeOut" }}
              aria-hidden="true"
            />
          ))}

          {launchServices.map((service, index) => (
            <motion.div
              key={service.id}
              className={"rhen-launch-node brand-" + service.id}
              initial={{ x: px(50, "x"), y: px(50, "y"), opacity: 0, scale: 0.18 }}
              animate={{
                x: [px(50, "x"), px(service.wheel[0], "x"), px(service.wheel[0], "x"), px(service.mark[0], "x"), px(service.mark[0], "x")],
                y: [px(50, "y"), px(service.wheel[1], "y"), px(service.wheel[1], "y"), px(service.mark[1], "y"), px(service.mark[1], "y")],
                opacity: [0, 1, 1, 0.92, 0],
                scale: [0.18, 1.08, 1, 0.72, 0.12]
              }}
              transition={{
                duration: 8.0,
                delay: 0.35 + index * 0.07,
                times: [0, 0.24, 0.64, 0.86, 1],
                ease: [0.22, 0.8, 0.2, 1]
              }}
              aria-hidden="true"
            >
              <motion.div
                className="rhen-launch-node-halo"
                animate={{ scale: [0.88, 1.18, 0.88], opacity: [0.28, 0.62, 0.28] }}
                transition={{ duration: 1.65 + (index % 3) * 0.2, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className="rhen-launch-node-icon">
                <BrandMark id={service.id} />
              </div>
              <span>{service.label}</span>
            </motion.div>
          ))}

          <motion.div
            className="rhen-launch-energy-beam"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: [0, 1, 0], scaleX: [0, 1, 1.2] }}
            transition={{ delay: 7.15, duration: 1.35, times: [0, 0.3, 1], ease: "easeOut" }}
            aria-hidden="true"
          />
          <motion.div
            className="rhen-launch-flare"
            initial={{ opacity: 0, scale: 0.2 }}
            animate={{ opacity: [0, 1, 0.22], scale: [0.2, 1.35, 0.8] }}
            transition={{ delay: 7.1, duration: 1.65, times: [0, 0.34, 1], ease: "easeOut" }}
            aria-hidden="true"
          />
        </>
      ) : null}

      <motion.div
        className="rhen-launch-mark"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.42, filter: "blur(8px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ delay: reduceMotion ? 0 : 7.55, duration: reduceMotion ? 0 : 1.0, ease: [0.16, 0.88, 0.2, 1] }}
        aria-hidden="true"
      >
        <div className="rhen-launch-mark-aura" />
        <RhenMark decorative />
      </motion.div>

      <motion.div
        className="rhen-launch-presents"
        initial={reduceMotion ? false : { opacity: 0, y: 12, letterSpacing: "0.42em" }}
        animate={{ opacity: 1, y: 0, letterSpacing: "0.24em" }}
        transition={{ delay: reduceMotion ? 0 : 8.65, duration: reduceMotion ? 0 : 0.75, ease: "easeOut" }}
      >
        ANEVUM PRESENTS…
      </motion.div>

      <motion.div
        className="rhen-launch-name"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.38, y: 30, filter: "blur(10px)" }}
        animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
        transition={{ delay: reduceMotion ? 0 : 9.8, duration: reduceMotion ? 0 : 1.0, ease: [0.12, 0.9, 0.2, 1] }}
      >
        <span>RHEN</span>
      </motion.div>
    </div>
  );
}
