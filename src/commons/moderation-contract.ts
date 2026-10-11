export const MODERATION_SCHEMA = "anevum.commons-review.v1";
export type Decision = "HIDE" | "DISMISS";
export type Report = {
  id: string; reason: string; createdAt: number;
  post: { id: string; title: string; body: string; status: string };
};
export type ReviewQueue = { pending: Report[]; olderPendingMayExist: boolean };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function object(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
function bound(value: unknown, memberId: string): value is Record<string, unknown> {
  return object(value) && !!memberId && value.schemaVersion === MODERATION_SCHEMA && value.reviewerMemberId === memberId;
}
export function parseReviewQueue(value: unknown, memberId: string): ReviewQueue {
  if (!bound(value, memberId) || !Array.isArray(value.pending) || value.pending.length > 30 ||
      value.pageCap !== 30 || typeof value.olderPendingMayExist !== "boolean" ||
      value.olderPendingMayExist !== (value.pending.length === 30)) throw new Error("Review queue could not be verified.");
  const seen = new Set<string>();
  const pending = value.pending.map(item => {
    if (!object(item) || typeof item.id !== "string" || !uuid.test(item.id) || seen.has(item.id.toLowerCase()) ||
        typeof item.reason !== "string" || !["spam", "harassment", "privacy", "misinformation", "other"].includes(item.reason) ||
        typeof item.createdAt !== "number" || !Number.isSafeInteger(item.createdAt) || item.createdAt < 0 ||
        !object(item.post) || typeof item.post.id !== "string" || !uuid.test(item.post.id) ||
        typeof item.post.title !== "string" || !item.post.title.trim() || item.post.title.length > 120 ||
        typeof item.post.body !== "string" || !item.post.body.trim() || item.post.body.length > 3000 ||
        typeof item.post.status !== "string" || !["PUBLISHED", "HIDDEN", "REMOVED"].includes(item.post.status)) throw new Error("Review queue could not be verified.");
    seen.add(item.id.toLowerCase());
    // Discard any additional private fields; the UI consumes only this projection.
    return { id: item.id, reason: String(item.reason), createdAt: item.createdAt,
      post: { id: item.post.id, title: item.post.title, body: item.post.body, status: String(item.post.status) } };
  });
  return { pending, olderPendingMayExist: value.olderPendingMayExist };
}
export function reviewedDecision(value: unknown, memberId: string, reportId: string, decision: Decision): boolean {
  return bound(value, memberId) && uuid.test(reportId) && value.reportId === reportId &&
    value.decision === decision && value.resolved === true && value.moderationAuditRecorded === true && value.executionEnabled === false;
}
export function validReviewReason(value: string): boolean {
  const length = value.trim().length;
  return length >= 8 && length <= 500 && !/[\u0000-\u001f\u007f]/.test(value);
}
