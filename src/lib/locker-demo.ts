/**
 * Browser-only USD transfer simulation for RHEN Locker product research.
 * This module NEVER moves real funds, creates an account, or contacts a provider.
 * It must not be reused as a source of truth for a financial ledger.
 */
export type DemoDirection = "into-locker" | "out-of-locker";
export type DemoLocation = "external" | "locker";
export type DemoTransfer = Readonly<{
  sequence: number;
  direction: DemoDirection;
  amountCents: number;
  feeCents: 0;
  from: DemoLocation;
  to: DemoLocation;
}>;
export type LockerDemoState = Readonly<{
  externalCents: number;
  lockerCents: number;
  transfers: readonly DemoTransfer[];
}>;

export const EXAMPLE_EXTERNAL_CENTS = 100_000;

export function createLockerDemo(): LockerDemoState {
  return Object.freeze({
    externalCents: EXAMPLE_EXTERNAL_CENTS,
    lockerCents: 0,
    transfers: Object.freeze([] as DemoTransfer[])
  });
}

/** Strict positive USD amount, at most two decimal places. No FX or tokens. */
export function parseDemoUsdCents(raw: string): number | null {
  if (typeof raw !== "string") return null;
  const input = raw.trim();
  if (!/^(0|[1-9][0-9]{0,8})(\.[0-9]{1,2})?$/.test(input)) return null;
  const [whole, fraction = ""] = input.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null;
}

export function formatDemoUsd(cents: number): string {
  if (!Number.isSafeInteger(cents) || cents < 0) throw new Error("Invalid demo balance.");
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

/** A reversible, zero-fee demonstration. Source and destination must conserve USD cents. */
export function transferDemoUsd(
  state: LockerDemoState,
  direction: DemoDirection,
  amountText: string
): LockerDemoState {
  const cents = parseDemoUsdCents(amountText);
  if (cents === null) throw new Error("Enter a positive USD amount with no more than two decimals.");
  if (direction !== "into-locker" && direction !== "out-of-locker") {
    throw new Error("Unknown simulated transfer direction.");
  }
  if (!Number.isSafeInteger(state.externalCents) || !Number.isSafeInteger(state.lockerCents) ||
      state.externalCents < 0 || state.lockerCents < 0) {
    throw new Error("Invalid simulated balances.");
  }
  const from: DemoLocation = direction === "into-locker" ? "external" : "locker";
  const to: DemoLocation = direction === "into-locker" ? "locker" : "external";
  const available = from === "external" ? state.externalCents : state.lockerCents;
  if (cents > available) throw new Error("The simulated source does not have enough dollars.");
  const next = Object.freeze({
    externalCents: state.externalCents + (from === "external" ? -cents : cents),
    lockerCents: state.lockerCents + (from === "locker" ? -cents : cents),
    transfers: Object.freeze([...state.transfers, Object.freeze({
      sequence: state.transfers.length + 1,
      direction, amountCents: cents, feeCents: 0 as const, from, to
    })])
  });
  if (next.externalCents + next.lockerCents !== state.externalCents + state.lockerCents) {
    throw new Error("Simulation conservation invariant failed.");
  }
  return next;
}
