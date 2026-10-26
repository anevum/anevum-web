/** Pure Gamepad API adapter. No device IDs, storage, analytics or server writes. */
export type ControllerDirection = 'up' | 'down' | 'left' | 'right';
export type ControllerIntent = {direction: ControllerDirection | null; select: boolean};
export type StandardGamepad = Pick<Gamepad, 'mapping' | 'buttons' | 'axes'>;
export type ControllerRepeat = {direction: ControllerDirection | null; startedAt: number; lastAt: number};
export type ControllerRect = Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>;

export const noControllerRepeat: ControllerRepeat = {direction: null, startedAt: 0, lastAt: 0};

/** Match native Wayfinder arrow navigation, regardless of responsive dock orientation.
 * Invalid or hidden/unmounted starting stations are not silently redirected. */
export function nextConsoleStationIndex(current: number, count: number, direction: ControllerDirection): number | null {
  if (!Number.isInteger(count) || count < 1 || !Number.isInteger(current) || current < 0 || current >= count) return null;
  const delta = direction === 'right' || direction === 'down' ? 1 : -1;
  return (current + delta + count) % count;
}

export function readControllerIntent(pad: StandardGamepad): ControllerIntent {
  if (pad.mapping !== 'standard') return {direction: null, select: false};
  const down = (index: number) => Boolean(pad.buttons[index]?.pressed || (pad.buttons[index]?.value ?? 0) >= 0.65);
  // The W3C standard mapping reserves 12–15 for the D-pad and 0 for primary action.
  if (down(12)) return {direction: 'up', select: down(0)};
  if (down(13)) return {direction: 'down', select: down(0)};
  if (down(14)) return {direction: 'left', select: down(0)};
  if (down(15)) return {direction: 'right', select: down(0)};
  const x = Number.isFinite(pad.axes[0]) ? pad.axes[0] : 0;
  const y = Number.isFinite(pad.axes[1]) ? pad.axes[1] : 0;
  if (Math.max(Math.abs(x), Math.abs(y)) < 0.62) return {direction: null, select: down(0)};
  return {direction: Math.abs(x) > Math.abs(y) ? (x > 0 ? 'right' : 'left') : (y > 0 ? 'down' : 'up'), select: down(0)};
}

/** Immediate first move, 340 ms initial delay, then a bounded 160 ms repeat. */
export function advanceControllerRepeat(previous: ControllerRepeat, direction: ControllerDirection | null, now: number): {state: ControllerRepeat; fire: boolean} {
  if (direction === null) return {state: noControllerRepeat, fire: false};
  if (direction !== previous.direction) return {state: {direction, startedAt: now, lastAt: now}, fire: true};
  if (now - previous.startedAt < 340 || now - previous.lastAt < 160) return {state: previous, fire: false};
  return {state: {...previous, lastAt: now}, fire: true};
}

/** The same DOM controls serve keyboard, touch and controller users. */
export function controllerTargetScore(from: ControllerRect, to: ControllerRect, direction: ControllerDirection): number {
  const dx = to.left + to.width / 2 - from.left - from.width / 2;
  const dy = to.top + to.height / 2 - from.top - from.height / 2;
  const primary = direction === 'right' ? dx : direction === 'left' ? -dx : direction === 'down' ? dy : -dy;
  if (primary <= 3) return Infinity;
  const cross = direction === 'left' || direction === 'right' ? Math.abs(dy) : Math.abs(dx);
  return primary + cross * 2 + Math.max(0, cross - primary) * 2;
}
