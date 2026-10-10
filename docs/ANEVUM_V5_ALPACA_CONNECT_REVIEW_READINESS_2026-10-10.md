# ANEVUM V5 — Alpaca Connect reviewer readiness and browser-state guard

**Unified session:** `ANEVUM.ANEVUM.UPDATE.2026-10-10.001.V5-UNIFIED-OVERHAUL`  
**Master queue:** [anevum-web #259](https://github.com/anevum/anevum-web/issues/259)  
**Stack:** Commons public shell → private RHEN/member Command → paper OAuth review → moderated Commons.  
**State:** DRAFT / NOT DEPLOYED / NO REAL PROVIDER CONNECTION RECORDED.

## Source-backed review requirements (private source remains private)

On October 9, Alpaca requested (1) a completed OAuth Due Diligence Questionnaire and (2) a short non-Loom screen recording showing an actual account connection. The confidential DDQ v3 also requires a visible preauthorization disclosure **and acknowledgement before** broker authorization, appropriate business ownership and regulatory identity, end-user/fee/privacy/security supporting documents, and an accurate description of server and workstation malware controls.

Do **not** upload the confidential questionnaire, private business identifiers, provider access keys or personal account exports to this repository. Do not imply that Alpaca has approved the app, accepted a paper-only video, or authorized social/copy trading. Commons remains research/learning only; another member's posts, followers, positions, strategies or account information never grant trade execution authority.

## Implemented safeguards in this code-only slice

- Parse review brokerage response as explicitly paper-only. Invalid response shape, unusual account identifiers, unexpected elevated broker-write/paper/live/funding/withdrawal capabilities, or non-paper account block the connection controls and show an error. Only a masked four-character identifier may be rendered.
- Remount the entire stateful review screen by authenticated member ID; abort the previous member's request and clear status, pending acknowledgement and errors when the identity changes.
- Keep explicit disclosure and versioned acknowledgement before OAuth redirect. Fixed partner authorization origin and `env=paper`; the UI rejects an authorization URL requesting scopes.
- Public RHEN editorial copy uses generic brokerage market-data wording, preserving the dated research method. Provider references stay in the brokerage integration UI rather than marketing or Field Notes. The Commons topic screen states that following/reading another member never copies orders or activates strategies.
- Add negative tests to `npm run test:members`; failures block draft CI.

These changes are only defense in depth on the frontend. The separate server-side Better Auth/session, one-time state, scope denial, encrypted token vault and preview-only production locks remain authoritative.

## Staging acceptance to collect after separate authorization

1. Record exactly which approved app callback origin and environment Alpaca permits. Confirm with the provider whether a read-only PAPER connection satisfies the current DDQ video.
2. Owner-authorize the preview-only `0004` workspace D1 migration after independent backup, SHA, exact existing lineage and two-member/FK verification. Separately approve `0005` OAuth schema and staging-only secrets; default migrations and production remain unchanged.
3. Activate the OAuth reviewer flag **only** in the approved staging environment. Verify a second ordinary member cannot see, link, disconnect, export or infer the first member's brokerage identity.
4. Test signed-out, unverified, expired/replayed/mismatched-state, cross-member, provider-denied and elevated-scope paths. Record outcomes with no tokens or full account IDs.
5. Obtain a real signed-in successful provider connection: RHEN integration entry → disclosure → checked acknowledgement → neutral Allow → provider authorization → callback → masked paper account status. The source code and CI mock alone do not satisfy the requested recording.
6. Record a short video using the OS screen recorder or another non-Loom recorder. Show the full disclosure and checked acknowledgement, actual provider authorization screen and linked RHEN status. Hide email address and browser profiles where feasible; NEVER show raw credentials, cookies, auth URL code/state, provider secret, full account number, logs or private exports.
7. Submit only after the owner reviews the filled confidential questionnaire, current PDF Terms, fee/no-fee description, Privacy Policy, Cybersecurity Policy, entity/ownership/organizational answers and genuine recorded video. Never assert licensure, production security certifications, regulated status or paying customers without evidence.

## Remaining release hold

- [ ] Exact-head draft CI and authenticated browser QA (fixtures are not staging acceptance).
- [ ] Owner-verified legal company structure, regulatory status, >25% beneficial ownership, authorized contact and customer counts.
- [ ] Current Terms/Privacy and fee schedule PDFs signed off for new user-generated content and token-storage disclosures. Current website notices predate unreleased social and reviewer functionality.
- [ ] Independently verified technical cybersecurity policy describing actual endpoint controls, encryption, patching, physical access, recovery, incident response and vendor risk; do not substitute a proposed control for a deployed one.
- [ ] One approved **real** OAuth callback and two-account isolation test; verified provider acceptance of paper-only demonstration.
- [ ] A genuine non-Loom video and owner's explicit approval before sending any DDQ or legal packet.

**No production, preview D1, Railway, broker execution, or external communication is authorized by this document or its PR.**
