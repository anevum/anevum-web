// ANEVUM-owned bank-transfer order and accounting model.
// THIS MODULE HANDLES ONLY OFFLINE/SYNTHETIC FINANCIAL REHEARSALS.
// It cannot receive bank transfers, read bank accounts or grant entitlements.
// A real transfer is never authenticated merely because its supplied fields match.
// The independent financial rail and checkout remain disabled in commerce-contract.mjs.
import { validatedProduct, canFulfillPaidOrder } from "./commerce-contract.mjs";

const CODE = /^[A-Z0-9]{8,32}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function safeString(value, length = 100) {
  if (typeof value !== "string" || value.length === 0 || value.length > length) return false;
  // Explicit code-point check avoids mistaken regex escaping in generated source.
  for (let i = 0; i < value.length; i++) {
    const cp = value.charCodeAt(i);
    if (cp < 32 || cp === 127) return false;
  }
  return true;
}

export function createUnpaidOrderDraft({ memberId, orderId, productCode, prices, reference, now }) {
  // memberId must be from verified Better Auth session when integrated.
  // Nothing here authenticates a caller or writes a database record.
  if (!safeString(memberId, 128) || !UUID.test(orderId || "") ||
      typeof reference !== "string" || !CODE.test(reference) ||
      !Number.isSafeInteger(now) || now < 0) {
    throw new Error("Invalid server-generated order fields");
  }
  const product = validatedProduct(productCode, prices);
  return Object.freeze({
    id: orderId, memberId, paymentReference: reference,
    productCode, amountCents: product.cents, currency: "USD",
    createdAtMs: now, expiresAtMs: now + MAX_AGE_MS,
    state: "draft", paymentInstructionsAvailable: false,
    settlementStatus: "unverified", paid: false
  });
}

export function evaluateBankCreditCandidate(order, entry, { now, knownBankEntryIds = [] } = {}) {
  // Bank-export-like fields MAY be spoofed. This function only detects an
  // accounting candidate, never certifies bank provenance or releases products.
  if (!order || order.state !== "draft" || order.paid !== false || 
      order.currency !== "USD" || !Number.isSafeInteger(now) ||
      now < order.createdAtMs || now > order.expiresAtMs) {
    return Object.freeze({ matched: false, reason: "invalid_or_expired_order", verified: false, canFulfill: false });
  }
  if (!entry || !safeString(entry.id, 128) || !safeString(entry.accountAlias, 80) ||
      !safeString(entry.institutionId, 80) ||
      knownBankEntryIds.includes(entry.id)) {
    return Object.freeze({ matched: false, reason: "invalid_or_duplicate_bank_entry", verified: false, canFulfill: false });
  }
  if (entry.direction !== "credit" || entry.postingStatus !== "posted" ||
      entry.currency !== "USD" || !Number.isSafeInteger(entry.amountCents) ||
      entry.amountCents <= 0) {
    return Object.freeze({ matched: false, reason: "not_a_posted_usd_credit", verified: false, canFulfill: false });
  }
  if (entry.amountCents !== order.amountCents || entry.reference !== order.paymentReference) {
    return Object.freeze({ matched: false, reason: "amount_or_reference_mismatch", verified: false, canFulfill: false });
  }
  // The source bank account and external provenance still require separately
  // verified configuration, permissions, independent confirmation and controls.
  return Object.freeze({
    matched: true, reason: "synthetic_candidate_only", verified: false,
    canFulfill: canFulfillPaidOrder(order, entry)
  });
}

export function simulateBalancedJournal(order, candidate, { entryId } = {}) {
  if (!order || !candidate?.matched || candidate.verified !== false ||
      candidate.canFulfill !== false || !safeString(entryId, 128)) {
    throw new Error("Synthetic journal requires an unverified candidate");
  }
  const cents = order.amountCents;
  if (!Number.isSafeInteger(cents) || cents <= 0) throw new Error("Invalid amount");
  // A rehearsal, NOT actual financial postings or a completed settlement.
  const entries = Object.freeze([
    Object.freeze({ entryId, account: "synthetic_bank_clearing", debitCents: cents, creditCents: 0 }),
    Object.freeze({ entryId, account: "synthetic_unearned_receipts", debitCents: 0, creditCents: cents })
  ]);
  if (entries.reduce((sum, x) => sum + x.debitCents - x.creditCents, 0) !== 0) {
    throw new Error("Unbalanced journal");
  }
  return Object.freeze({ orderId: order.id, synthetic: true, settled: false, entries });
}

export function bankReadinessGates(gates = {}) {
  const required = ["merchantAccountApproved","bankContractVerified","paymentRailSupported",
    "independentReconciliation","refundProcessReviewed","taxPolicyReviewed",
    "securityReviewPassed","tenantIsolationPassed","restoreRollbackPassed",
    "ownerGoNoGoRecorded"];
  return Object.freeze({
    readyToConsiderRelease: required.every(key => gates[key] === true),
    missing: Object.freeze(required.filter(key => gates[key] !== true)),
    liveAcceptanceEnabled: false // unconditionally false in this release.
  });
}
