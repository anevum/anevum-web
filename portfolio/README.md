# Devon Akins — UI/UX design portfolio

Canonical URL: https://portfolio.anevum.com/
Worker: anevum-designer-portfolio
Session: ANEVUM.WEB.BUILD.2026-10-13.001.DESIGNER-PORTFOLIO

Independent static portfolio, intentionally isolated from ANEVUM Creator V1, Member Auth, RHEN, and the Access-protected Lab. Not a client-work portfolio: every entry is an explicitly described founder-built project and every UI preview is illustrative.

## Source
- index.html — semantic portfolio content, project links, SEO and contact CTA
- style.css — original responsive visual system, reduced-motion and accessible focus styles
- script.js — project filter and optional clipboard behavior
- worker.js — generated/snapshotted single-file Classic Worker to serve the three text assets; update when changing any asset
- Contact: devon@anevum.com (Cloudflare Email Routing rule verified enabled 2026-10-13)

## Release and safety
Dedicated Cloudflare Worker and custom domain; no dependencies, auth state, databases, secret bindings, analytics, forms or cookies. GET/HEAD only; hostname allowlist; strict CSP, anti-framing and privacy headers. Main anevum.com and lab.anevum.com deployments remain unchanged.

Manual publish procedure: edit assets, re-embed source strings in worker.js, test syntax and responsive/browser behavior, upload worker.js via Cloudflare API, confirm 100% active deployment and custom-domain ownership. CI release workflow can be added later. Never describe illustrated visuals as screenshots or self-initiated projects as paid client work.
