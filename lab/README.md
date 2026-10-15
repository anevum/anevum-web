# ANEVUM Private Lab — deployment and project registry

**Dedicated hostname:** `https://lab.anevum.com/`  
**Worker:** `anevum-private-lab` (Cloudflare account owning `anevum.com`)  
**GitHub review:** [anevum-web PR #355](https://github.com/anevum/anevum-web/pull/355), a draft against `production/creator-v1`; **not merged**.  
**Implemented:** October 13, 2026; manual Worker upload and custom-domain attachment were authorized for an owner-only playtest. Public Creator V1, RHEN trading and the main ANEVUM production route were not modified.

## Access boundaries (must remain true)

1. Cloudflare Access self-hosted application **ANEVUM Private Lab** is scoped to the whole `lab.anevum.com` hostname, with one explicit allowlisted identity: `devon@anevum.com`. App ID: `63f63f79-3591-46ef-83c9-20d018743e6c`.
2. Worker **`anevum-private-lab`** has **workers.dev disabled** and **preview URLs disabled**. These settings were read back from the provider after upload.
3. Dedicated Cloudflare Worker custom domain `lab.anevum.com` is attached to **`anevum-private-lab`**, not to `anevum.com/*` or the public Creator Worker. Cloudflare created a proxied AAAA DNS record.
4. The Worker rejects all hostnames other than `lab.anevum.com` and serves a pinned static Fold game plus a read-only RHEN research source console. It has **no broker, database or personal email secrets**, no trading route, no external member-session proxy and no access to user-generated uploads.
5. Cloudflare Access enforcement happens **before** the Worker. The Worker's hostname check is additional hardening, not a replacement for Access; do not reuse it as a standalone security boundary.
6. Both the Lab pages and game are marked `noindex` and return restricted CSP / no-store / anti-framing / referrer headers. The real-world map remains the game's explicitly opt-in third-party MapLibre/OpenFreeMap feature.
7. Do not widen the allowlist, expose preview hostnames, attach the public `anevum.com` route or remove Access simply to resolve a mobile login problem.

## Routes and catalog

| Route | Project | Behavior |
| --- | --- | --- |
| `/` | Project hub | Distinct ANEVUM Lab directory with project statuses and navigation |
| `/projects/the-fold/` | The Fold | **Play the full-screen V2.1 static game**; a small Lab back link is added by the Worker |
| `/projects/rhen/` | RHEN | **Working read-only V5 Research Console**, simple mobile UI, assumption-only paper cost lens and exact source preview; **no running RHEN engine or broker link** |
| `/projects/rhen/source/*` | RHEN source | Five allowlisted text/plain modules, pinned to integrated F1–F3f RHEN PR #488 (no code execution or secrets) |
| `/projects/transcosmic` | Transcosmic | Project record only; no invented app/repository or manuscript |
| `/health` | Minimal operations | Build/version status, behind the same Cloudflare Access application |

The game snapshot is generated from the **exact draft commit** of `anevum/family-adventure-book`:

`e693c53621b07dcf32175c706fef2da8612790d2`

Files are vendored in `lab/fold-snapshot.mjs` and served under `/projects/the-fold/`: `index.html`, `fold.css`, `fold-v2.css`, `fold.js`, `core.mjs`, `atlas.mjs`, `icons.svg`.

This is a **playtest copy**, not a merge or automatic CI deployment of the Fold repo. When the game's source advances, consciously refresh the pinned snapshot, test and upload to the same protected Worker. Do not publish unpublished family activity data in a static source copy.

## RHEN V5 source-review console (October 13)

- **Owner-requested route:** `https://lab.anevum.com/projects/rhen/`; linked directly from the Lab project card. `/projects/rhen` redirects.
- **Source:** `anevum/rhen` integrated [draft #488](https://github.com/anevum/rhen/pull/488), exact review commit `d68ac5ec4df6378364dfd1b893ee4d5862a834e4`, **not merged/deployed to a live engine**.
- **Source modules pinned into Lab:** `next_rhen/evidence_journal.py`, `source_attestation.py`, `paper_market_feed.py`, `research/outcomes.py`, `replay/scorecard.py`. Byte-for-byte content served as `text/plain` from `lab/rhen-snapshot.mjs`.
- **UI:** `lab/rhen-ui.mjs`: Overview, Research, Cost Lens, Source. The cost-lens tool is a real client-side calculation mirroring `scorecard.py`'s **gross reference − (spread + entry slippage + exit slippage + round-trip fees)** formula on user-entered hypothetical numbers; missing results remain blank. **It is not a Python replay job, strategy signal, live market data, validated alpha or real broker performance.**
- **Engine boundary:** Railway RHEN, RHEN Archive and ANEVUM Core production projects currently have **zero active services**. Do not recreate obsolete founder live trading as a side effect of Lab UI development.
- **Safety:** No server execution, credentials, Alpaca routes, account balances, chart data, orders, positions, OAuth, account provisioning or external network requests from the research console. All user-entered calculations remain in-browser and are not stored.
- **CI:** Static route/source assertions and actual Chromium checks for mobile/desktop RHEN Overview and Cost Lens, including invalid costs and no-source states. This is not an authenticated iPhone Safari acceptance test.
- **Future:** To run real research jobs and view accurate accounts, provision an independently reviewed, authenticated RHEN successor runtime and per-user data boundaries. Never infer a running backend from green source tests.


## RHEN Reserve and RHEN-10-2026-001 (proposed; source update October 15, 2026)

**Source-only update, not deployed:** The Lab branch extends the existing `/projects/rhen/` source-review console with **Reserve** and **$10 Test** tabs. Neither is a financial service, broker integration, real performance dashboard or bank account. The original read-only Overview, Research, Cost Lens and Source panels remain in place. The private Lab home card acknowledges the research proposal.

- **Working product name:** RHEN Reserve (future); existing RHEN research engine stays distinct.
- **Selected visual reference:** the owner's second Reserve logo concept: quiet orbital R, near-black/navy, cold blue light, champagne titanium and restrained Continuance Institute/Transcosmic typography. It is a *direction*, not a final approved logo file or trademark.
- **Cash / investments:** Future partner-held bank cash and independently custodied broker investments are separate amounts; no double-counting transfers. Member-controlled consent capsules and protected minimum cash are proposed safeguards. Investment losses are possible, and bank/deposit insurance does not cover market losses.
- **TPD:** Trading Percentage Daily means measured daily investment return net of applicable trading costs and adjusted for contributions/withdrawals. Negative days must be visible. The +0.10% daily number is an **unvalidated stretch research target** rather than APY, a forecast, or guaranteed interest.
- **$10 study:** RHEN-10-2026-001 proposes $10.44 initial funding, $10 more on each monthly anniversary, 12 months of recordkeeping and comparisons against cash and a diversified low-cost baseline. Paper-only until a successor runtime, evidence gate, broker authorization and a separate owner funding approval are verified. The read-only interactive compounding calculator models assumed constant returns, not observed RHEN trades.
- **Security thesis:** independent deterministic policy gate, separate financial custody and withdrawal authority, versioned member permissions, IREN oversight, passkeys, audit/proof ledger and NIST-aligned post-quantum algorithm migration planning. These are **design requirements, not existing Lab protections**.
- **Revenue caution:** charging $10 per month for software to invest $10 per month overwhelms the nominal first-year capital; show fees and member net outcome instead of manufacturing TPD.
- **Release gate:** No regulated financial claims, member onboarding, public offers, broker keys, bank connectivity, fund movement or production deploy are authorized by this update.

The source branch update must pass `node --check` for the changed JS modules and `node --test lab/test-worker.mjs` plus Chromium smoke, including tab navigation, negative-rate handling, zero-return baseline, calculation fee sensitivity and absence of actual account data, before another Cloudflare Worker deployment. Keep the existing Access owner allowlist and disabled Worker preview endpoints intact.

## Reproducible source and provider operations

`lab/worker.mjs`, `lab/fold-snapshot.mjs`, `lab/rhen-snapshot.mjs`, and `lab/rhen-ui.mjs` are the four Worker ES modules. Upload them together via Cloudflare Workers Script API in multipart form, using `worker.mjs` as `main_module`, `fold-snapshot.mjs`, `rhen-snapshot.mjs` and `rhen-ui.mjs` as named imported modules and a pinned compatibility date. This does not need a new Railway service, database or R2 bucket.

Before re-uploading:

- Verify the Access application and owner email policy with Cloudflare's API.
- Confirm both Workers subdomain flags remain `false`.
- Run `node --check lab/worker.mjs`, `node --check lab/fold-snapshot.mjs`, and `node --test lab/test-worker.mjs`.
- Verify the game snapshot's GitHub source revision and the intended project launch state.
- Upload the modules and confirm **100% active** deployment via Workers Deployments API.
- Verify the Lab custom domain maps to this Worker and no other Worker/domain is unexpectedly exposed.

**Provider evidence as of October 13, 2026:**
- Owner-only Access app created and read back; no `lab.anevum.com` app preexisted.
- Cloudflare Worker uploaded, direct preview and `workers.dev` disabled and read back.
- Worker Custom Domain attached: `lab.anevum.com` → `anevum-private-lab`, domain ID `ba9d063c8bd10ce93f38534ff0d9293512b6910f`.
- Worker Deployments API showed the source Worker at 100%.
- DNS read-back showed `lab.anevum.com AAAA 100::`, proxied.
- Source test workflow succeeded. **External unauthenticated/owner Safari HTTP reachability not independently verified** from this environment (external checker could not resolve the newly created hostname). Do not equate provider success with an actual completed iPhone playtest.

## Owner iPhone acceptance checklist

1. In Safari, open `https://lab.anevum.com/`.
2. Sign in to Cloudflare Access using the exact allowlisted `devon@anevum.com` identity.
3. Confirm the three catalog entries render The Fold has **Play**, RHEN has **Open Console**, and Transcosmic remains **Not Connected**.
4. Open The Fold and confirm no page scroll, intact custom icons, map pins, Level 0 onboarding, daily/starter quests and Adventure Book.
5. Close and reopen Safari and check that local progress remains saved on the same origin; test optional save export without adding private family data.
6. Verify normal no-GPS play first, then permission denied and optional live map tiles/attribution on a real iPhone.
7. Ensure unauthorized email attempts cannot view any Lab HTML or assets. Do not accept a test if a Workers preview URL serves the game without Access.
8. Confirm the Back to Lab control returns to the project catalog.

**Not included:** multiplayer or cross-device Fold save, real party invitations, public Creator publication, server-authenticated XP, actual RHEN research execution, brokerage access, or member brokerage workspace integration.

**Related:** [ANEVUM Lab #349](https://github.com/anevum/anevum-web/issues/349), [The Fold PR #7](https://github.com/anevum/family-adventure-book/pull/7).
