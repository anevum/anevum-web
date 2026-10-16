/**
 * QUANTO PROTOCOL v0.1 — isolated demonstration ledger.
 * Nothing here represents money, stored value, deposits or redeemable credits.
 * No accounts, network requests, keys, storage or external dependencies.
 */
export const QUANTO_PROTOCOL = "quanto-simulation-v0.1";
export const QUANTO_WALLETS = Object.freeze(["operator", "creator", "studio"]);
export const QUANTO_MAX_OPERATION_CENTS = 1_000_000;
export const QUANTO_MAX_ENTRIES = 500;
export const QUANTO_MAX_SUPPLY_CENTS = 100_000_000;

const QTO_ACCOUNTS = Object.freeze(["issuer", ...QUANTO_WALLETS]);
const USD_ACCOUNTS = Object.freeze(["reserves", "source"]);
const REQUEST_ID = /^[A-Za-z0-9_-]{8,80}$/;

function fail(message) {
  throw new Error("Quanto simulation: " + message);
}
function safeCents(value) {
  if (!Number.isSafeInteger(value) || value <= 0 || value > QUANTO_MAX_OPERATION_CENTS) {
    fail("amount must be a positive whole number of cents within the demo limit");
  }
  return value;
}
function isWallet(value) {
  return typeof value === "string" && QUANTO_WALLETS.includes(value);
}
function parseInstruction(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail("invalid instruction");
  const {requestId, type, amountCents, from, to} = value;
  if (typeof requestId !== "string" || !REQUEST_ID.test(requestId)) fail("invalid request ID");
  if (!["issue", "transfer", "redeem"].includes(type)) fail("unsupported instruction");
  safeCents(amountCents);
  const required = type === "issue" ? ["requestId", "type", "amountCents", "to"]
    : type === "transfer" ? ["requestId", "type", "amountCents", "from", "to"]
    : ["requestId", "type", "amountCents", "from"];
  if (Object.keys(value).sort().join("|") !== required.slice().sort().join("|")) {
    fail("instruction contains missing or unexpected fields");
  }
  if (type === "issue") {
    if (!isWallet(to)) fail("invalid receiving demo wallet");
    return {requestId, type, amountCents, to};
  }
  if (!isWallet(from)) fail("invalid sending demo wallet");
  if (type === "transfer") {
    if (!isWallet(to) || from === to) fail("invalid transfer destination");
    return {requestId, type, amountCents, from, to};
  }
  return {requestId, type, amountCents, from};
}
function assertAccounts(actual, expected) {
  if (!actual || typeof actual !== "object" || Array.isArray(actual) ||
      Object.keys(actual).sort().join("|") !== expected.slice().sort().join("|")) {
    fail("account structure is not valid");
  }
  for (const id of expected) {
    if (!Number.isSafeInteger(actual[id])) fail("unsafe account amount");
  }
}
export function createQuantoLedger() {
  return {
    protocol: QUANTO_PROTOCOL,
    sequence: 0,
    balances: {
      QTO: {issuer: 0, operator: 0, creator: 0, studio: 0},
      SIM_USD: {reserves: 0, source: 0}
    },
    journal: []
  };
}
export function assertQuantoInvariants(state) {
  if (!state || state.protocol !== QUANTO_PROTOCOL ||
      !Number.isSafeInteger(state.sequence) ||
      !Array.isArray(state.journal) || state.sequence !== state.journal.length ||
      state.sequence > QUANTO_MAX_ENTRIES ||
      !state.balances || typeof state.balances !== "object" ||
      Object.keys(state.balances).sort().join("|") !== "QTO|SIM_USD") {
    fail("invalid ledger envelope");
  }
  const {QTO, SIM_USD} = state.balances;
  assertAccounts(QTO, QTO_ACCOUNTS);
  assertAccounts(SIM_USD, USD_ACCOUNTS);
  if (Object.values(QTO).reduce((a, b) => a + b, 0) !== 0 ||
      Object.values(SIM_USD).reduce((a, b) => a + b, 0) !== 0) fail("unbalanced postings");
  for (const wallet of QUANTO_WALLETS) {
    if (QTO[wallet] < 0) fail("negative demo wallet balance");
  }
  const outstanding = -QTO.issuer;
  if (outstanding < 0 || outstanding > QUANTO_MAX_SUPPLY_CENTS ||
      SIM_USD.reserves !== outstanding || SIM_USD.source !== -outstanding) {
    fail("simulated reserves and circulating units diverged");
  }
  return true;
}
function posting(unit, account, deltaCents) {
  return {unit, account, deltaCents};
}
function instructionPostings(command) {
  const amount = command.amountCents;
  switch (command.type) {
    case "issue":
      return [
        posting("QTO", "issuer", -amount),
        posting("QTO", command.to, amount),
        posting("SIM_USD", "reserves", amount),
        posting("SIM_USD", "source", -amount)
      ];
    case "transfer":
      return [
        posting("QTO", command.from, -amount),
        posting("QTO", command.to, amount)
      ];
    case "redeem":
      return [
        posting("QTO", command.from, -amount),
        posting("QTO", "issuer", amount),
        posting("SIM_USD", "reserves", -amount),
        posting("SIM_USD", "source", amount)
      ];
    default:
      fail("unsupported instruction");
  }
}
export function applyQuantoInstruction(state, input) {
  assertQuantoInvariants(state);
  const command = parseInstruction(input);
  const existing = state.journal.find(item => item.requestId === command.requestId);
  if (existing) {
    if (JSON.stringify(existing.command) === JSON.stringify(command)) return state;
    fail("request ID was already used for a different instruction");
  }
  if (state.sequence >= QUANTO_MAX_ENTRIES) fail("demo journal capacity reached");
  if (command.type !== "issue" &&
      state.balances.QTO[command.from] < command.amountCents) {
    fail("insufficient demo wallet balance");
  }
  if (command.type === "issue" &&
      -state.balances.QTO.issuer + command.amountCents > QUANTO_MAX_SUPPLY_CENTS) {
    fail("demo supply cap exceeded");
  }
  const postings = instructionPostings(command);
  const sums = new Map();
  for (const row of postings) {
    sums.set(row.unit, (sums.get(row.unit) || 0) + row.deltaCents);
  }
  if ([...sums.values()].some(sum => sum !== 0)) fail("unbalanced journal entry");
  const nextBalances = {
    QTO: {...state.balances.QTO},
    SIM_USD: {...state.balances.SIM_USD}
  };
  for (const row of postings) {
    const balance = nextBalances[row.unit][row.account] + row.deltaCents;
    if (!Number.isSafeInteger(balance)) fail("unsafe resulting balance");
    nextBalances[row.unit][row.account] = balance;
  }
  const receipt = {
    sequence: state.sequence + 1,
    requestId: command.requestId,
    type: command.type,
    amountCents: command.amountCents,
    command,
    postings
  };
  const next = {
    protocol: QUANTO_PROTOCOL,
    sequence: receipt.sequence,
    balances: nextBalances,
    journal: [...state.journal, receipt]
  };
  assertQuantoInvariants(next);
  return next;
}
/**
 * Checks self-consistency of a demo export by replaying every instruction.
 * Not a signature, external audit, reserve attestation or proof of ownership.
 */
export function verifyQuantoExport(exported) {
  try {
    assertQuantoInvariants(exported);
    let rebuilt = createQuantoLedger();
    for (const entry of exported.journal) {
      rebuilt = applyQuantoInstruction(rebuilt, entry.command);
      if (JSON.stringify(rebuilt.journal.at(-1)) !== JSON.stringify(entry)) return false;
    }
    return JSON.stringify(rebuilt) === JSON.stringify(exported);
  } catch {
    return false;
  }
}
export function formatQuantoCents(value) {
  if (!Number.isSafeInteger(value)) fail("invalid display amount");
  return (value / 100).toFixed(2);
}
