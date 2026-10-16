/** Type contract for the adjacent browser-safe .mjs demo ledger. */
export type QuantoWallet = "operator" | "creator" | "studio";
export type QuantoAccount = QuantoWallet | "issuer" | "reserves" | "source";
export type QuantoInstruction =
  | {requestId: string; type: "issue"; amountCents: number; to: QuantoWallet}
  | {requestId: string; type: "transfer"; amountCents: number; from: QuantoWallet; to: QuantoWallet}
  | {requestId: string; type: "redeem"; amountCents: number; from: QuantoWallet};
export interface QuantoPosting {
  unit: "QTO" | "SIM_USD";
  account: QuantoAccount;
  deltaCents: number;
}
export interface QuantoReceipt {
  sequence: number;
  requestId: string;
  type: QuantoInstruction["type"];
  amountCents: number;
  command: QuantoInstruction;
  postings: QuantoPosting[];
}
export interface QuantoLedger {
  protocol: "quanto-simulation-v0.1";
  sequence: number;
  balances: {
    QTO: Record<QuantoWallet | "issuer", number>;
    SIM_USD: {reserves: number; source: number};
  };
  journal: QuantoReceipt[];
}
export const QUANTO_PROTOCOL: "quanto-simulation-v0.1";
export const QUANTO_WALLETS: readonly QuantoWallet[];
export const QUANTO_MAX_OPERATION_CENTS: number;
export const QUANTO_MAX_ENTRIES: number;
export const QUANTO_MAX_SUPPLY_CENTS: number;
export function createQuantoLedger(): QuantoLedger;
export function assertQuantoInvariants(state: QuantoLedger): true;
export function applyQuantoInstruction(state: QuantoLedger, input: QuantoInstruction): QuantoLedger;
export function verifyQuantoExport(state: unknown): boolean;
export function formatQuantoCents(value: number): string;
