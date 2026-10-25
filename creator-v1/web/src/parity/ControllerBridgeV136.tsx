import {useEffect, useState} from 'react';
import {advanceControllerRepeat, controllerTargetScore, nextConsoleStationIndex, noControllerRepeat, readControllerIntent, type ControllerDirection} from './controller-input-v136';
import './controller-bridge-v136.css';

type Connection = 'absent' | 'ready' | 'unmapped';
const INTERACTIVE = 'a[href],button:not([disabled]),[role="button"][tabindex="0"],[role="link"][tabindex="0"]';

function visibleInteractive(element: HTMLElement): boolean {
  if (element.closest('[hidden],[inert],[aria-hidden="true"],[aria-disabled="true"]')) return false;
  if (element.getAttribute('tabindex') === '-1' || element.getClientRects().length === 0) return false;
  const style = getComputedStyle(element);
  return style.display !== 'none' && style.visibility !== 'hidden';
}
function activeScope(): Document | HTMLElement {
  // A native modal remains the sole focus region; never activate obscured page links.
  const dialogs = Array.from(document.querySelectorAll<HTMLElement>('dialog[open],[role="dialog"][aria-modal="true"]'));
  return dialogs.filter(element => element.getClientRects().length > 0).at(-1) ?? document;
}
function isTextEntry(element: Element | null): boolean {
  return Boolean(element instanceof HTMLElement && (element.isContentEditable || element.matches('input,textarea,select,[role="textbox"]')));
}
function playableFrameOpen(): boolean {
  // The creator-hosted game owns the controller when it is mounted.
  return document.activeElement instanceof HTMLIFrameElement ||
    Boolean(document.querySelector('.av095-player iframe[allow*="gamepad"]'));
}

/** Presentation-only controller bridge; no canonical auth, Studio or API state. */
export function ControllerBridgeV136({navigationEnabled}: {navigationEnabled: boolean}) {
  const [connection, setConnection] = useState<Connection>('absent');
  useEffect(() => {
    if (typeof navigator.getGamepads !== 'function') return;
    let cancelled = false;
    let frame = 0;
    let idleTimer = 0;
    let observed: Connection = 'absent';
    let focused: HTMLElement | null = null;
    let lastPadIndex: number | null = null;
    let repeat = noControllerRepeat;
    let selectHeld = false;
    const clearFocus = () => {
      focused?.removeAttribute('data-av-controller-focus');
      focused = null;
    };
    const clearControllerMode = () => {
      if (document.documentElement.dataset.avInput === 'gamepad') {
        delete document.documentElement.dataset.avInput;
      }
    };
    const noteControllerInput = () => {document.documentElement.dataset.avInput = 'gamepad';};
    const updateConnection = (next: Connection) => {
      if (observed === next) return;
      observed = next;
      setConnection(next);
      if (next !== 'ready') {clearFocus(); clearControllerMode();}
    };
    const setFocus = (element: HTMLElement) => {
      if (focused !== element) clearFocus();
      focused = element;
      element.setAttribute('data-av-controller-focus', '');
      element.focus({preventScroll: true});
      element.scrollIntoView({block: 'nearest', inline: 'nearest', behavior: 'auto'});
    };
    const move = (direction: ControllerDirection) => {
      const scope = activeScope();
      const current = document.activeElement;
      // An editor or text entry retains ordinary keyboard and input semantics.
      if (isTextEntry(current)) return;
      // The five-station console is an ordered navigation group. Respect its
      // native arrow-key order in both the phone dock and desktop side rail;
      // arbitrary nearby cards must never steal a focused station move.
      if (scope === document && current instanceof HTMLElement &&
          current.matches('.p136-console-wayfinder a[data-station]')) {
        const wayfinder = current.closest<HTMLElement>('.p136-console-wayfinder');
        const stations = Array.from(wayfinder?.querySelectorAll<HTMLElement>('a[data-station]') ?? [])
          .filter(visibleInteractive);
        const next = nextConsoleStationIndex(stations.indexOf(current), stations.length, direction);
        if (next !== null) {setFocus(stations[next]); return;}
      }
      const candidates = Array.from(scope.querySelectorAll<HTMLElement>(INTERACTIVE))
        .filter(visibleInteractive).slice(0, 450);
      if (!candidates.length) return;
      const active = current instanceof HTMLElement && candidates.includes(current) ? current : null;
      if (!active) {
        setFocus(candidates.find(e => e.matches('.p136-console-station.is-active')) ??
          candidates.find(e => e.matches('.p136-console-station')) ??
          candidates.find(e => Boolean(e.closest('main'))) ?? candidates[0]);
        return;
      }
      const origin = active.getBoundingClientRect();
      let best: HTMLElement | null = null;
      let bestScore = Infinity;
      for (const candidate of candidates) {
        if (candidate === active) continue;
        const score = controllerTargetScore(origin, candidate.getBoundingClientRect(), direction);
        if (score < bestScore) {best = candidate; bestScore = score;}
      }
      if (best) setFocus(best);
    };
    const select = () => {
      const scope = activeScope();
      const element = document.activeElement;
      if (!(element instanceof HTMLElement) || !element.matches(INTERACTIVE) || !visibleInteractive(element)) return;
      if (scope !== document && !scope.contains(element)) return;
      element.click(); // The same native link/button action as mouse or keyboard.
    };
    const gamepads = (): Gamepad[] => {
      try {return Array.from(navigator.getGamepads()).filter((pad): pad is Gamepad => Boolean(pad?.connected));}
      catch {return [];} // Permissions Policy or unsupported browser: no access.
    };
    const schedule = (active: boolean): void => {
      if (cancelled) return;
      if (active && document.visibilityState === 'visible') frame = requestAnimationFrame(tick);
      else idleTimer = window.setTimeout(() => tick(performance.now()), 650);
    };
    const tick = (now: number): void => {
      frame = 0;
      idleTimer = 0;
      if (cancelled) return;
      const pads = document.visibilityState === 'visible' ? gamepads() : [];
      const pad = pads.find(p => p.mapping === 'standard') ?? pads[0];
      updateConnection(!pad ? 'absent' : pad.mapping === 'standard' ? 'ready' : 'unmapped');
      if (!pad || pad.mapping !== 'standard') {
        lastPadIndex = null; repeat = noControllerRepeat; selectHeld = false;
        schedule(false); return;
      }
      const intent = readControllerIntent(pad);
      if (lastPadIndex !== pad.index) {
        lastPadIndex = pad.index;
        repeat = noControllerRepeat;
        selectHeld = intent.select; // No accidental click from connecting button.
        schedule(true); return;
      }
      if (navigationEnabled && document.hasFocus() && !playableFrameOpen()) {
        const next = advanceControllerRepeat(repeat, intent.direction, now);
        repeat = next.state;
        if (next.fire && intent.direction) {noteControllerInput(); move(intent.direction);}
        // Avoid selecting a target in the very frame that moves focus.
        if (intent.select && !selectHeld && !intent.direction) {noteControllerInput(); select();}
      } else {
        repeat = noControllerRepeat;
      }
      selectHeld = intent.select;
      schedule(true);
    };
    const cancelPolling = () => {cancelAnimationFrame(frame); clearTimeout(idleTimer); frame = 0; idleTimer = 0;};
    const kick = () => {cancelPolling(); tick(performance.now());};
    const clearOnManualInput = () => {clearFocus(); clearControllerMode();};
    window.addEventListener('gamepadconnected', kick);
    window.addEventListener('gamepaddisconnected', kick);
    document.addEventListener('visibilitychange', kick);
    document.addEventListener('pointerdown', clearOnManualInput);
    document.addEventListener('keydown', clearOnManualInput);
    kick();
    return () => {
      cancelled = true;
      cancelPolling();
      window.removeEventListener('gamepadconnected', kick);
      window.removeEventListener('gamepaddisconnected', kick);
      document.removeEventListener('visibilitychange', kick);
      document.removeEventListener('pointerdown', clearOnManualInput);
      document.removeEventListener('keydown', clearOnManualInput);
      clearFocus();
      clearControllerMode();
    };
  }, [navigationEnabled]);
  if (connection === 'absent') return null;
  return <div className="p136-controller-indicator" role="status" aria-live="polite" data-av-controller-status={connection}>
    <span aria-hidden="true" className="p136-controller-indicator-light"/>
    <span>{connection === 'ready' ? 'CONTROLLER DETECTED' : 'CONTROLLER DETECTED / UNMAPPED'}
      <small>{connection !== 'ready' ? 'Standard browser mapping required' :
        navigationEnabled ? 'D-PAD / STICK TO MOVE · A TO SELECT' : 'Browsing controls active on supported pages'}</small>
    </span>
  </div>;
}
