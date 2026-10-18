# Porchlight — Synthetic Offline Review

This review artifact lets the founder and an adult organizer inspect the actual Porchlight public interface without any server, Cloudflare database, credentials, household information or map provider.

**Review boundary:** this is a fictional event, not the real 2026 Halloween directory, a neighborhood safety service or production acceptance.

## Generate

From the repository root with Node 22+:

```sh
node safety/porchlight/review/build-preview.mjs evidence/porchlight-v001/porchlight-offline-review.html
```

For automated browser checks (Chromium/Chrome installed):

```sh
node safety/porchlight/review/offline-smoke.mjs --chrome /usr/bin/google-chrome --output evidence/porchlight-v001
```

GitHub Actions [Porchlight isolated source review](https://github.com/anevum/anevum-web/actions/workflows/porchlight-v001-review.yml) packages the file as a downloadable `porchlight-v001-synthetic-browser` artifact in every successful PR run. Open `porchlight-offline-review.html` in a browser to review it. Some mobile Files/Quick Look viewers do not execute local JavaScript; use a proper browser on a computer for the interactive simulation, or arrange a private local-network review without exposing it publicly.

## Scenario

1. **Look at the directory:** two entries are marked fictional. One has a mock exact point at `0,0` (not a real neighborhood); the area-only entry has no pin. No street map or GPS is used.
2. **Insert fictional host:** click **1 · Insert fictional host**. Only `DEMO Household`, `household@example.test` and `000 FAKE PLACE — FICTIONAL` are accepted. Do not enter a real address or personal contact.
3. **Submit for review:** verify an on-screen pending state and one-time code. There is no real account or persistent submission.
4. **Simulate approval:** click **2 · Simulate approval**. The new area-only host becomes a generic card in the list without revealing a home address or creating a map pin. This is an in-memory state change, **not real organizer verification**.
5. **Report and remove:** submit a fictional report against an existing mock host, then submit the prefilled removal ID and code. Its card disappears; demo report text is discarded immediately.
6. **Emergency close:** click **3 · Emergency close**. The visible list and pins disappear; review resets when the page is reloaded.

The standalone HTML has an embedded Content Security Policy that disables HTTP fetch, third-party resources, camera, geolocation, persistent storage and external navigation. Its mock replaces only the public Porchlight API inside the current page. It cannot write to D1, create real users, invoke Cloudflare or contact local authorities.

## What this verifies—and what it does not

Automated Chromium smoke checks confirm that the offline file loads, the 390px viewport has no horizontal overflow, the fictional submission stays pending, simulated approval creates an area-only card, reporting/removal work, and network access remains blocked. Existing source tests separately verify real Worker authorization, transactional D1 changes, deletion, retention and privacy.

**Not verified:** actual mobile Safari physical-device support, Cloudflare D1 and Worker deployments, owner-host authority, real neighborhood enrollment, child-protection effectiveness, community organizer availability, map accuracy or production costs.

## Acceptance record template

| Reviewer | Date | Browser/device | Directory legible? | Consent understood? | Pending/approval clear? | Removal easy? | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Adult reviewer A |  |  |  |  |  |  |  |
| Adult reviewer B |  |  |  |  |  |  |  |

Do not fill these fields with simulated reviewers or claim real pilot acceptance from automated tests. The safe next stage is a cost-reviewed, isolated, private backend preview with the real adult organizer identified and explicit permission to collect household information.
