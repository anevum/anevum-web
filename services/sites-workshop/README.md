# ANEVUM Sites Workshop — Commissioned Websites

**Session:** `ANEVUM.WEB.BUILD.2026-10-19.001.CLIENT-SITES-WORKSHOP`

This is a **separate, owner-only production Cloudflare Worker** for building client website concepts. It does **not** replace the public ANEVUM website or the private Lab.

| Surface | Role |
| --- | --- |
| `https://sites.anevum.com` | Private commissioned-site dashboard |
| `https://sites.anevum.com/preview/<project-slug>/` | Authenticated, real HTTPS preview |
| `https://lab.anevum.com` | Existing private ANEVUM Lab, unchanged |
| `https://anevum.com` | Existing public ANEVUM community, unchanged |

## Deployed resources

- Worker: `anevum-sites-workshop-v001`.
- Cloudflare Access: independent self-hosted application protecting **all** paths on `sites.anevum.com`, allowlist limited to the ANEVUM owner address.
- The Worker **verifies Access JWT signature, issuer, audience, expiration and owner email** before serving HTML, static assets, previews or API responses.
- Worker `workers.dev` and preview subdomains are disabled.
- Cloudflare D1: isolated database `anevum-commission-sites-workshop`; binding `DB`.
- No public publishing endpoint, no checkout, no customer records and no live loyalty ledger.

## Using the workshop

1. Sign in through Cloudflare Access at `https://sites.anevum.com`.
2. Open **Tobacco Vapor Time** (first concept), or choose **New commission**.
3. Edit the business copy, location, hours, contact information and primary color.
4. Choose a visual direction:
   - **Signature:** midnight editorial;
   - **Archive:** warm, pale editorial;
   - **Technical:** high-contrast, structured/industrial.
5. Preview the project inside the workshop or open its HTTPS address in a new browser tab. The iPhone preview controls and standalone preview show the **same saved site**; unsaved changes are sent to the embedded iframe for provisional visual inspection.
6. Select **Save changes** to persist content to D1, which creates a recoverable previous revision.
7. Use **History** to restore an earlier revision. D1 saves the current content before restoring.

The current prototype can be explored on a phone and has a web manifest, 192/512 PNG icons, and a no-cache service worker. It remains behind owner authentication. The `Add to Home Screen` preview is **not a customer-facing release**.

## Separation and publication rules

Commission work is independent of ANEVUM public pages, its creator community, and the Lab's existing projects. A concept is not a business-owned production site merely because the staff has approved its design.

To hand off or publish, first confirm client ownership and written approval, independently verify business name, address, hours, contact and any use of brand assets, decide on client-controlled domain/hosting, and perform a separate production build and accessibility/security QA. Never turn off owner-only Access for this whole workshop just to let one client review a draft; deliver an explicitly scoped, separate review deployment after permission.

Do not launch nicotine/tobacco promotions, coupons, points, purchase incentives or checkout from the current Tobacco Vapor Time concept. The prototype is informational; any marketing, sales or rewards feature needs jurisdiction-appropriate review and the business owner's approval.

## Schema

The existing isolated D1 database has:

- `sites` — `id`, unique `slug`, `title`, `kind`, `status`, JSON `payload`, `created_at`, `updated_at`.
- `site_revisions` — `id`, `site_id`, JSON `payload`, `created_at` (previous saved content).
- Index `idx_sites_updated`.

Project statuses are `concept`, `building`, `review`, `approved`. These are *internal tracking states*, not publication controls.

## Operational verification

Inspect the Worker source with `node --check services/sites-workshop/worker.mjs` in Node 22+, then verify the Cloudflare Access policy, Worker custom domain, D1 binding and disabled `workers.dev` route in Cloudflare. A live authenticated browser check with the owner account is required for final login, editing and Home Screen acceptance.

The Cloudflare Worker was deployed independently of the main `anevum.com` Worker. Avoid changing ANEVUM production routes or the existing multi-module Lab Worker as part of routine site concepts.

## Current constraints

- Direct hosted previews work only for the authenticated owner. They cannot be freely shared with a client yet.
- The studio edits structured website copy, theme and essential business details; it is **not** a full drag-and-drop website builder.
- Generated design and business copy are concept material pending client validation.
- PWA installability and browser session persistence differ across devices, especially behind Cloudflare Access.
- No automated production release or customer billing pipeline has been implemented.
