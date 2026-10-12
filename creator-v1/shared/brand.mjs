// ANEVUM brand lock. Approved cinematic identity from the original creator portal concept.
// This is a shared *identity*, not a license to re-theme each product screen.
// For the visual source of truth, see docs/creator-platform/APPROVED-CINEMATIC-IDENTITY.md.
export const BRAND_VERSION = 'cinematic-2026-10-11-v1';
export const BRAND_MARK = `<svg class="anevum-brand-mark" viewBox="0 0 60 60" aria-hidden="true" focusable="false"><defs><linearGradient id="anevumMarkGold" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffe1a2"/><stop offset=".53" stop-color="#ffb043"/><stop offset="1" stop-color="#ff6c24"/></linearGradient></defs><path d="M5 49 30 8l25 41h-8L30 22 13 49z" fill="url(#anevumMarkGold)"/><path d="m23 44 7-11 7 11" fill="none" stroke="#ffcf7d" stroke-width="4" stroke-linejoin="round"/><path d="M45 15h8M49 11v8" stroke="#ffbd54" stroke-width="2"/></svg>`;
export const BRAND_CSS = `
/* ANEVUM locked cinematic design tokens; shared by every member/staff surface. */
:root{
  --anevum-bg:#080b13;
  --anevum-panel:#101522;
  --anevum-line:#292e40;
  --anevum-text:#f7f7fc;
  --anevum-muted:#a1a8bd;
  --anevum-orange:#ff9d50;
  --anevum-gold:#ffb043;
  --anevum-violet:#9582e3;
  --bg:var(--anevum-bg);
  --panel:var(--anevum-panel);
  --line:var(--anevum-line);
  --border:var(--anevum-line);
  --stroke:var(--anevum-line);
  --text:var(--anevum-text);
  --ink:var(--anevum-text);
  --muted:var(--anevum-muted);
  --orange:var(--anevum-orange);
  --ember:var(--anevum-orange);
  --accent:var(--anevum-orange);
  --gold:var(--anevum-gold);
  --violet:var(--anevum-violet);
  --purple:var(--anevum-violet);
  --focus:#ffe1a2;
}
.anevum-brand-mark{display:block;width:32px;height:32px;flex:none;max-width:none;filter:drop-shadow(0 0 4px rgba(255,157,80,.18))}
:where(header .brand,header .wordmark,header .identity){color:var(--anevum-text);font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-weight:800;letter-spacing:.11em}
:where(header .brand,header .wordmark,header .identity) .anevum-brand-mark{width:32px;height:32px}
@media(max-width:430px){.anevum-brand-mark,:where(header .brand,header .wordmark,header .identity) .anevum-brand-mark{width:27px;height:27px}}
`;
