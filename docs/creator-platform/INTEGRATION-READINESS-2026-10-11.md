# ANEVUM V1 services and integration readiness

Verified on 2026-10-11. This record distinguishes available ChatGPT connectors from services that have actually been integrated into the product.

| Provider | Observed condition | V1 role | Next action |
|---|---|---|---|
| Cloudflare Workers | `anevum.com/*` routes to `anevum-creator-v1`; `next.anevum.com` hosts separate preview | Public hosting | Require distinct staging/production D1 and independent owner Studio |
| Cloudflare D1 | V1 production DB and separate V1 staging DB now exist | Project storage and moderation | Apply versioned migrations independently; never reuse V5 data |
| Cloudflare Access | Backstage owner-only app exists; stage Studio app to be created | Staff-only control plane | Verify signed JWT and both allowed/denied identities |
| Cloudflare R2 | Evidence/backup bucket exists; no V1 creator media bucket yet | Media and encrypted backups | Create bounded image bucket only when upload path implements scanning/quotas |
| GitHub | App connected, source at `anevum/anevum-web`, archive branch preserved; `anevum/creator-platform` repository not found | Source, CI, public repo import and GitHub sign-in | Create independent repo and narrow creator GitHub OAuth/App scopes |
| Resend | Connected, `auth.anevum.com` verified and sending-enabled | Signup, recovery, notification | Stage email templates and secure sending credentials; no bulk send without opt-in |
| PostHog | ChatGPT connector installed | Privacy-respecting activation analytics and release QA | Confirm project and event taxonomy before collecting, mask sensitive fields |
| Railway | Existing ANEVUM/RHEN Railway environments reported no live services | Optional batch processing | Leave idle for launch until a workload needs Python or long-lived processing |
| Discord | ChatGPT community bot connector not verified | Optional announcements, jams and IREN-like staff alert bot | Integrate after onsite community works; avoid Discord-only membership |
| Stripe | Available connector and payments provider, no ANEVUM V1 monetization acceptance | Optional future payments and payouts | Defer billing and Connect payouts until moderation and compliance ready |
| Google OAuth | Existing V5 worker had Google credentials, not authorized for V1 automatically | Member social login | Create dedicated V1 client/callback allowlist; do not reuse V5 secrets unreviewed |

## Proposed API events (must not be treated as already collected)

`discover_viewed`, `project_detail_viewed`, `external_demo_opened`, `signup_started`, `signup_verified`, `creator_profile_completed`, `project_draft_created`, `project_submitted`, `project_approved`, `project_published`, `project_voted`, `project_saved`, `review_submitted`, `abuse_report_submitted`, `session_error`.

Avoid raw emails, session tokens, source access credentials, financial details and project private drafts in analytics payloads. Opt out of session recording and sensitive autocapture until privacy review. Use separate environments and explicit release labels.

## Integration rule

A ChatGPT plugin being connected is NOT the same as API keys, domain validation, least-privilege permissions, monitoring and delivery being live inside ANEVUM. Every integration requires individual staging tests and operator rollback.