# V5 Member Beta Onboarding — October 11

Session: ANEVUM.WEB.BUILD.2026-10-11.005.MEMBER-BETA-ONBOARDING
Program: ANEVUM.V5.FOUNDATION.2026-10-09.001
Master WEB #259; reconstruction WEB #265; source parent WEB #297 at 02c8a0b5fed945caaa125180bb2d1d552080acb4.

This draft creates a member-only beta diagnostics page at /me/beta, linked from authenticated Command and the Commons account navigation. It checks the actual current member profile, RHEN workspace, non-executing draft and discussion pilot using read-only, no-store, same-origin requests. It validates identity and denies malformed, crossed-member or elevated-authority responses. It neither creates accounts nor places orders. Signup availability is no longer cached negatively for the entire browser session; it can be checked again explicitly and on window focus.

Cloudflare read-only observation on 2026-10-11:
- Production Worker anevum-web-nextgen has account flag true and Better Auth/Google credential names configured. Production member D1 ledger: 0001 and 0002.
- Isolated reviewer/member staging has members, drafts and workspace flags true; staging D1 ledger: 0001 through 0005. Commons 0006/0007 are not applied. Restricted Alpaca reviewer staging must not be repinned or redeployed for this work.
- Configuration and database presence do not establish a verified first-time Google sign-up journey, real two-member acceptance or full V5 release.

Next actual-user acceptance: Google first-time signup, signed-out reentry, profile save/reload, program save/follow, two independent member profiles and exports, isolated draft/workspace operations only where explicitly enabled, and owner Access denial. Use disposable test accounts for deletion. Do not submit passwords, cookies, secrets, tokens or personal exports to source control.

No production/staging deployment, migration, member identity provisioning, OAuth activation, public UGC flag, broker key exchange, trade execution or automatic merge is included. Release owner authorization and actual D1 recovery remain separate gates.
