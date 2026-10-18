# ANEVUM V072 — Bounded verified-session polling

Session: `ANEVUM.WEB.PATCH.2026-10-18.002.SESSION-POLLING`

Owner: functional completion [#480](https://github.com/anevum/anevum-web/issues/480); IREN staff [#373](https://github.com/anevum/anevum-web/issues/373).

## Reproducible functional defect

The canonical Better Auth deployment limits normal requests to **20/IP/minute**. IREN's two-person peer signaling polls roughly every 2.6 seconds per active staff client, in addition to staff snapshots, authenticated mutations and moderation review. One staff member can reach the old general cap through routine signaling alone; two humans on the same home Wi-Fi/NAT share one IP rate-limit group. Source tests observed the actual Better Auth session verifier responding with a rate-limit denial which the isolated staff Worker surfaced as HTTP 401, misleadingly resembling a revoked login.

The isolated IREN staff fix [PR #505](https://github.com/anevum/anevum-web/pull/505) forwards only the real bounded Cloudflare edge connecting IP to the private apex session binding, preventing unrelated IPs from collapsing into a single shared bucket. It does **not** solve the within-one-household 20/minute budget, so a separate apex authentication policy improvement is necessary.

## Bounded configuration change

- Add a **read-only** `/get-session` custom rule of **120 requests per 60 seconds per trusted Cloudflare client IP**.
- Retain globally enabled, database-backed Better Auth rate limiting at 20 requests/minute for all other requests unless a narrower existing rule applies.
- Retain strict `/email-otp/send-verification-otp` 3 per 600 seconds, `/sign-in/email-otp` 5/minute, social sign-in 5/minute and token linking 3/minute. No rate limiting is disabled.
- Keep the exact existing cookie, origin, session expiration, email verification and CSRF rules unchanged.
- Verify with two real Better Auth sessions created against fake email + disposable D1 SQLite; alternate more than 20 signed-in session requests on the **same** synthetic IP and require success, then prove the finite 120/minute cap still rejects exhaustion.

120/min is a V1 capacity ceiling for a small review team, not a permanent scaling architecture. Audit D1 request costs and adopt authenticated WebSocket/Durable Object signaling only after the project can support it. No paid service is introduced in this patch.

## Release dependencies

This is a narrowly scoped **source-only review** stacked on V071 [PR #501](https://github.com/anevum/anevum-web/pull/501), preserving V069 recognition. It is not a substitute for IREN V005's separately reviewed service-binding header fix or a real signed-in founder/reviewer acceptance. The server-side approval/worker rollout remains disabled pending security/rollback review.

Before any apex deployment: source test and full Creator V1 CI green, compare the exact current apex Worker version and all 24 bindings, preserve all four opaque secrets and two D1 bindings, independent human staff sign-in and observed working queue, ability to switch back to 20/min without losing member sessions, and an actual iPhone test. A global authentication change requires a broader release review than an isolated IREN Worker update.

References: [Better Auth rate-limit configuration](https://better-auth.com/docs/concepts/rate-limit), [Cloudflare Connecting IP contract](https://developers.cloudflare.com/fundamentals/reference/http-headers/).

**No production Worker route, binding, code, D1 schema, roles, account, publication or payment was altered by this source change.**
