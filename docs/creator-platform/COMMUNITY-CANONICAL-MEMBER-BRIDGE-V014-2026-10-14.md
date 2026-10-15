# ANEVUM Community V014 — canonical session to Creator V1 read-only bridge

Session: ANEVUM.WEB.BUILD.2026-10-14.010.CANONICAL-MEMBER-READ-BRIDGE
Dependency stack: #388 visual, #392 Community V007, #395 V008, #396 V009, #398 V010, #399 V011, #400 V012, #401 V013, V014.
State: SOURCE ONLY / NOT MERGED / NOT DEPLOYED. No new OAuth account, D1, production routes, link grant, signup permission or Creator V1 migration applied.

## Scope implemented

V014 provides a strictly read-only interpretation of a member's *already verified* canonical-to-Creator V1 mapping. It does not create the mapping. The future V012 signed, consent-based two-authenticated-session linking ceremony is still unimplemented and must never be replaced with matching email, handle, verified email, provider profile or a user-supplied ID.

New files/changes:
- creator-v1/canonical-auth/member-bridge.mjs implements a read-only link resolver. The only lookup key comes from the independently validated Better Auth getSession response whose user ID must match the session's userId, have verified email, an unexpired session, and a syntactically valid opaque subject.
- GET/HEAD /api/v1/member/creator-link in the disabled V013 canonical Worker is an exact-origin, exact-route, no-query endpoint, with independent CREATOR_BRIDGE_DB. It is NOT GET /api/v1/member/me and it intentionally does not satisfy V011 legacy MemberGate. No project, post, draft, rewards, account, staff, support, moderation or broker authorization is exposed.
- Creator V1 lookup uses only SELECT through the unique canonical_subject + fixed issuer on creator_canonical_identity_links, joined to ACTIVE legacy member_accounts and ACTIVE non-staff creator_profiles. It explicitly rejects suspended, deleted, official/staff, revoked and unverified profiles.
- Successful response returns only public profile handle, display name, bio, and a creatorReadOnly capability with privateMemberWrites=false and linkChanges=false. There are no internal IDs, email addresses, proof digests, tokens or permissions in the public DTO.
- If a verified user has no active link, a safe 409 unlinked response gives no personally identifying details. If the service is disabled, schema missing, D1 failed, or row malformed, it returns 503 unavailable. Missing/invalid canonical sessions get 401. Requests to unrelated hosts and endpoints return 404. The Worker forbids all bridge POST/PATCH/DELETE; GET/HEAD replies are private no-store, frame-denied and CORS-free.
- candidate Wrangler configuration now explicitly sets ANEVUM_CANONICAL_CREATOR_BRIDGE_READ_ENABLED=false and CREATOR_BRIDGE_SCHEMA_APPROVED=false; it has no CREATOR_BRIDGE_DB binding, no MEMBER_DB binding, no route, and no workers.dev domain. No route or DB changed on Cloudflare.
- creator-v1/test/canonical-member-bridge-v014.test.mjs includes actual in-memory SQLite migrations 0001+0003+0006+0015, two synthetic unrelated accounts and one synthetic staff account, real parameterized lookup, inter-member/session isolation, forged identity fields, email collision, wrong-host and write denial, expired/invalid/mismatched sessions, suspension/deletion/revocation, missing schema and unavailable DB.
- The test is part of the full Creator V1 CI. Passing the unit/in-process tests is NOT hosted OAuth/real-member acceptance.

## Important identity boundaries

The new canonical identity Worker is not live. The isolated Creator V1 member Worker on next.anevum.com is a separate email-code identity and currently owns member-generated projects and XP. a.anevum.com is the cinematic staging site without a verified same-origin canonical/member route. The public anevum.com route remains the January 1, 2027 construction page.

The proposed V012 0015 one-to-one explicit identity-link table has NOT been applied to the real Creator V1 staging D1. Current staging is known (read-only audit Oct 14) to have applied only 0001–0006 and to have one member account and two creator profiles. No real linked member exists based on that evidence; synthetic test users are not production identities.

The runtime requires all conditions together:
- V013 canonical Better Auth operational and its isolated D1 issuer manifest verified;
- CREATOR_BRIDGE_DB bound separately to exactly the reviewed Creator V1 staging D1, with the id in CREATOR_BRIDGE_D1_ID pin matching the approved staging id;
- explicit read-only bridge and schema approval flags;
- Creator V1 schema_migrations containing 0003, 0006 and 0015, and an ACTIVE legacy member/profile;
- Better Auth own verified, nonexpired session, with a unique verified link and no staff privilege;
- correct exact a.anevum.com origin, read-only method, no query/body-selected identity.

Even if these conditions pass, this is public-profile lookup only; it does not transfer authenticated Creator V1 write permissions. Privileged founder, staff, RHEN trading terminal and brokerage data remain entirely outside this bridge.

## Actual remaining blockers

1. Provision/validate a brand-new canonical Better Auth staging D1 and independent OAuth pilot behind reviewed separate host. Do not use Creator/V5 or current member D1s. Test real login/logout and recovery with invited independent accounts and owner isolation.
2. Approve a backed-up, reversible *isolated* Creator V1 staging schema migration trial for 0007, 0008, 0013, 0014 and 0015. Do not run it on current D1 without separate owner authorization and recovery evidence.
3. Implement a secure dual-session, explicit-consent, single-use proof ceremony to populate 0015 after BOTH the old Creator V1 email-code account and new canonical Better Auth account have been independently authenticated. No email-based automatic linking.
4. Build a **server-side canonical member write adapter** for /me, profiles, drafts, projects, moderation, XP and library, enforcing legacy owner permissions after the approved link; this must be reviewed separately and is not included in V014.
5. Test guest visibility and two truly independent members plus a separate staff moderator end-to-end; validate content revision, review/publish, revocation, account switching, account deletion/export and no owner/RHEN privilege inheritance.
6. Refresh the staging Cloudflare route/binding inventory and owner UX acceptance at 1440/1024/390/320. Obtain explicit approval for future same-origin /api/v1/member/* routing on a.anevum.com.
7. Keep public signup closed and production anevum.com construction terminal unchanged until explicitly authorized.

**V014 is a staged source contract, not real member authentication or permission to merge or deploy.**
