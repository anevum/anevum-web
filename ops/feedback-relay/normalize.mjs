// ANEVUM Feedback Relay V001 - source-only; no network, storage or action side effects.
import { createHash } from 'node:crypto';

export const RECEIPT_SCHEMA = 'anevum.feedback-relay.receipt.v1';
const HOSTS = Object.freeze({
  reddit: ['reddit.com', 'www.reddit.com', 'old.reddit.com'],
  facebook: ['facebook.com', 'www.facebook.com', 'm.facebook.com', 'web.facebook.com'],
  linkedin: ['linkedin.com', 'www.linkedin.com'],
  anevum: ['anevum.com', 'www.anevum.com'],
});
const INTAKE = new Set(['gmail_notification', 'manual_link', 'approved_platform_api', 'in_product']);
const EVIDENCE = new Set(['mail_preview', 'manual_excerpt', 'source_verified', 'in_product_report']);
const KINDS = new Set(['comment', 'reply', 'post', 'volunteer_interest', 'feedback', 'reaction', 'follow']);
const SAFE_QUERY = Object.freeze({
  reddit: [],
  facebook: ['story_fbid', 'post_id', 'id', 'comment_id', 'reply_comment_id'],
  linkedin: ['commentUrn'],
  anevum: [],
});

function requiredString(value, label, max = 512) {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > max) {
    throw new TypeError(`${label} must be a nonempty string (max ${max})`);
  }
  return value.trim();
}

function knownPlatform(platform) {
  if (typeof platform !== 'string' || !Object.hasOwn(HOSTS, platform)) {
    throw new TypeError('Unsupported source platform');
  }
  return platform;
}

/** Decode only the URL nested in Reddit email tracking links. Never fetch redirects. */
export function unwrapRedditMailLink(link) {
  if (typeof link !== 'string') return null;
  try {
    const wrapper = new URL(link);
    if (wrapper.hostname !== 'click.redditmail.com' || wrapper.protocol !== 'https:') return link;
    const match = wrapper.pathname.match(/\/(https:(?:%2f){2}.+?)\/\d+\/[a-f0-9-]{12,}\//i);
    if (!match) return null;
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

/** Validate an allowlisted origin and remove marketing/tracking parameters and fragments. */
export function canonicalSourceUrl(platform, rawUrl) {
  knownPlatform(platform);
  if (rawUrl == null || rawUrl === '') return null;
  if (typeof rawUrl !== 'string' || rawUrl.length > 8192) throw new TypeError('Invalid source URL');
  const expanded = platform === 'reddit' ? unwrapRedditMailLink(rawUrl) : rawUrl;
  if (!expanded) throw new TypeError('Unrecognized notification link');
  let url;
  try { url = new URL(expanded); } catch { throw new TypeError('Invalid source URL'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.port || !HOSTS[platform].includes(url.hostname.toLowerCase())) {
    throw new TypeError('Source URL is outside the allowlisted platform');
  }
  const keep = new URLSearchParams();
  for (const key of SAFE_QUERY[platform]) {
    const val = url.searchParams.get(key);
    if (val && val.length <= 512) keep.set(key, val);
  }
  const host = platform === 'anevum' ? 'anevum.com' : `www.${platform}.com`;
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const query = keep.toString();
  return `https://${host}${path}${query ? '?' + query : ''}`;
}

/** Source-specific comment keys, but never guesses a person's identity. */
export function nativeCommentId(platform, normalizedUrl) {
  if (!normalizedUrl) return null;
  const url = new URL(normalizedUrl);
  if (platform === 'reddit') {
    return url.pathname.match(/\/comments\/[a-z0-9]+\/(?:[^/]+\/)?([a-z0-9]{5,})(?:\/|$)/i)?.[1] ?? null;
  }
  if (platform === 'facebook') return url.searchParams.get('reply_comment_id') || url.searchParams.get('comment_id');
  if (platform === 'linkedin') return url.searchParams.get('commentUrn');
  return null;
}

/** Extract candidate links from Reddit notification Markdown without trusting its text. */
export function extractRedditCommentPermalink(markdown) {
  if (typeof markdown !== 'string') return null;
  for (const match of markdown.matchAll(/\]\((https:\/\/[^\s)]+)\)/g)) {
    try {
      const url = canonicalSourceUrl('reddit', match[1]);
      if (nativeCommentId('reddit', url)) return url;
    } catch { /* Not a Reddit comment permalink. */ }
  }
  return null;
}

function maybeIso(iso) {
  if (iso == null || iso === '') return null;
  const source = requiredString(iso, 'occurredAt', 60);
  if (!/(?:Z|[+-]\d\d:\d\d)$/.test(source) || Number.isNaN(Date.parse(source))) {
    throw new TypeError('occurredAt must have a UTC offset or Z');
  }
  return new Date(source).toISOString();
}

/** A private-only normalized receipt. External text remains inert data. */
export function normalizeFeedbackReceipt(input, now = new Date().toISOString()) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new TypeError('Receipt input must be an object');
  const platform = knownPlatform(input.platform);
  const kind = requiredString(input.kind, 'kind', 40);
  const method = requiredString(input.intakeMethod, 'intakeMethod', 40);
  const evidence = requiredString(input.evidence, 'evidence', 40);
  if (!KINDS.has(kind) || !INTAKE.has(method) || !EVIDENCE.has(evidence)) throw new TypeError('Unsupported type, intake, or evidence');
  const sourceUrl = canonicalSourceUrl(platform, input.sourceUrl);
  const providerCommentId = nativeCommentId(platform, sourceUrl);
  const notificationId = input.notificationId == null ? null : requiredString(input.notificationId, 'notificationId', 256);
  // Neither message text nor social display names is ever used to assert a unique person.
  const stableSource = providerCommentId ? `comment:${providerCommentId}` : sourceUrl ? `url:${sourceUrl}` : notificationId ? `notification:${notificationId}` : null;
  if (!stableSource) throw new TypeError('A source permalink or notification ID is required');
  const receiptKey = createHash('sha256').update(`${RECEIPT_SCHEMA}\n${platform}\n${stableSource}`).digest('hex');
  const summary = input.summary == null ? '' : requiredString(input.summary, 'summary', 1500);
  const occurredAt = maybeIso(input.occurredAt);
  const capturedAt = maybeIso(now);
  if (!capturedAt) throw new TypeError('capturedAt required');
  return Object.freeze({
    schema_version: RECEIPT_SCHEMA,
    receipt_key: receiptKey,
    platform,
    kind,
    intake_method: method,
    evidence,
    source_url: sourceUrl,
    provider_comment_id: providerCommentId,
    // Source-grouping identity is handled separately in a protected human-review process.
    unique_respondent_count: null,
    summary,
    occurred_at: occurredAt,
    captured_at: capturedAt,
    triage_status: 'unreviewed',
    privacy_class: 'STAFF_ONLY',
    automatic_actions_allowed: false,
  });
}
