import { useEffect } from "react";
import "./OverflowPan.css";

type PanPhase = "rest" | "forward" | "end" | "back";

type PanState = {
  element: HTMLElement;
  maxScroll: number;
  phase: PanPhase;
  phaseStarted: number;
  restMs: number;
  travelMs: number;
  pausedAt?: number;
};

const MIN_OVERFLOW_PX = 3;
const END_HOLD_MS = 1400;
const MIN_TRAVEL_MS = 2800;
const MAX_TRAVEL_MS = 9000;
const PX_PER_SECOND = 16;

function textHash(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function readableText(element: HTMLElement) {
  return (element.textContent || "").replace(/\s+/g, " ").trim();
}

function restDuration(element: HTMLElement) {
  return 2600 + (textHash(readableText(element)) % 3600);
}

function travelDuration(maxScroll: number) {
  const natural = (maxScroll / PX_PER_SECOND) * 1000;
  return Math.max(MIN_TRAVEL_MS, Math.min(MAX_TRAVEL_MS, natural));
}

function easeInOut(value: number) {
  return value < 0.5
    ? 2 * value * value
    : 1 - Math.pow(-2 * value + 2, 2) / 2;
}

export function OverflowPan() {
  useEffect(() => {
    const states = new Map<HTMLElement, PanState>();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const hoverCapable = window.matchMedia("(hover: hover)");
    let animationFrame = 0;
    let scanFrame = 0;

    function removeGeneratedTitle(element: HTMLElement) {
      if (element.dataset.overflowPanTitle === "1") {
        element.removeAttribute("title");
        delete element.dataset.overflowPanTitle;
      }
    }

    function resetElement(element: HTMLElement, removeTitle = false) {
      element.classList.remove("overflow-pan-active");
      element.scrollLeft = 0;
      if (removeTitle) removeGeneratedTitle(element);
    }

    function addGeneratedTitle(element: HTMLElement) {
      if (element.hasAttribute("title")) return;
      const text = readableText(element);
      if (!text) return;
      element.title = text;
      element.dataset.overflowPanTitle = "1";
    }

    function inspect(element: HTMLElement) {
      const wasActive = element.classList.contains("overflow-pan-active");
      if (wasActive) element.classList.remove("overflow-pan-active");

      const clientWidth = element.clientWidth;
      const maxScroll = Math.max(0, element.scrollWidth - clientWidth);

      if (clientWidth === 0 || maxScroll < MIN_OVERFLOW_PX) {
        states.delete(element);
        resetElement(element, true);
        return;
      }

      const style = window.getComputedStyle(element);
      if (style.textOverflow !== "ellipsis") {
        states.delete(element);
        resetElement(element, true);
        return;
      }

      addGeneratedTitle(element);

      const existing = states.get(element);
      if (existing) {
        existing.maxScroll = maxScroll;
        existing.travelMs = travelDuration(maxScroll);
        if (wasActive && !reducedMotion.matches && existing.phase !== "rest") {
          element.classList.add("overflow-pan-active");
        }
        return;
      }

      const hash = textHash(readableText(element));
      states.set(element, {
        element,
        maxScroll,
        phase: "rest",
        phaseStarted: performance.now() + (hash % 1700),
        restMs: restDuration(element),
        travelMs: travelDuration(maxScroll)
      });
    }

    const pendingElements = new Set<HTMLElement>();
    let fullScanRequested = false;

    function pruneDisconnected() {
      states.forEach((state, element) => {
        if (!element.isConnected) {
          states.delete(element);
        }
      });
    }

    function scanAll() {
      document.body.querySelectorAll<HTMLElement>("*").forEach(inspect);
      pruneDisconnected();
    }

    function queueElement(element: HTMLElement | null) {
      let current = element;
      while (current && current !== document.body) {
        pendingElements.add(current);
        current = current.parentElement;
      }
    }

    function queueSubtree(element: HTMLElement) {
      queueElement(element);
      element.querySelectorAll<HTMLElement>("*").forEach((child) => pendingElements.add(child));
    }

    function scheduleScan(full = false) {
      if (full) fullScanRequested = true;
      if (scanFrame) return;
      scanFrame = window.requestAnimationFrame(() => {
        scanFrame = 0;
        if (fullScanRequested) {
          fullScanRequested = false;
          pendingElements.clear();
          scanAll();
          return;
        }

        const elements = Array.from(pendingElements);
        pendingElements.clear();
        elements.forEach((element) => {
          if (element.isConnected) inspect(element);
        });
        pruneDisconnected();
      });
    }

    function tick(now: number) {
      states.forEach((state, element) => {
        if (!element.isConnected) {
          states.delete(element);
          return;
        }

        if (reducedMotion.matches) {
          resetElement(element);
          state.phase = "rest";
          state.phaseStarted = now;
          return;
        }

        const interacting =
          element.contains(document.activeElement) ||
          (hoverCapable.matches && element.matches(":hover"));

        if (interacting) {
          if (state.pausedAt === undefined) state.pausedAt = now;
          return;
        }

        if (state.pausedAt !== undefined) {
          state.phaseStarted += now - state.pausedAt;
          state.pausedAt = undefined;
        }

        if (now < state.phaseStarted) return;

        const elapsed = now - state.phaseStarted;

        if (state.phase === "rest") {
          resetElement(element);
          if (elapsed >= state.restMs) {
            state.phase = "forward";
            state.phaseStarted = now;
            element.classList.add("overflow-pan-active");
          }
          return;
        }

        if (state.phase === "forward") {
          element.classList.add("overflow-pan-active");
          const progress = Math.min(1, elapsed / state.travelMs);
          element.scrollLeft = state.maxScroll * easeInOut(progress);
          if (progress >= 1) {
            element.scrollLeft = state.maxScroll;
            state.phase = "end";
            state.phaseStarted = now;
          }
          return;
        }

        if (state.phase === "end") {
          element.classList.add("overflow-pan-active");
          element.scrollLeft = state.maxScroll;
          if (elapsed >= END_HOLD_MS) {
            state.phase = "back";
            state.phaseStarted = now;
          }
          return;
        }

        element.classList.add("overflow-pan-active");
        const progress = Math.min(1, elapsed / state.travelMs);
        element.scrollLeft = state.maxScroll * (1 - easeInOut(progress));
        if (progress >= 1) {
          resetElement(element);
          state.phase = "rest";
          state.phaseStarted = now;
          state.restMs = restDuration(element);
        }
      });

      animationFrame = window.requestAnimationFrame(tick);
    }

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData") {
          queueElement(mutation.target.parentElement);
          continue;
        }

        queueElement(mutation.target instanceof HTMLElement ? mutation.target : mutation.target.parentElement);
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) queueSubtree(node);
          else queueElement(node.parentElement);
        });
      }
      scheduleScan();
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    const scheduleFullScan = () => scheduleScan(true);
    window.addEventListener("resize", scheduleFullScan, { passive: true });
    reducedMotion.addEventListener("change", scheduleFullScan);

    scheduleScan(true);
    animationFrame = window.requestAnimationFrame(tick);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", scheduleFullScan);
      reducedMotion.removeEventListener("change", scheduleFullScan);
      window.cancelAnimationFrame(animationFrame);
      if (scanFrame) window.cancelAnimationFrame(scanFrame);
      states.forEach((state) => resetElement(state.element, true));
      states.clear();
    };
  }, []);

  return null;
}
