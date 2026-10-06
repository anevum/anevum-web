#!/usr/bin/env python3
from __future__ import annotations

import argparse
import html
import json
from pathlib import Path

try:
    from weasyprint import HTML
except ImportError as exc:
    raise SystemExit("WeasyPrint is required. Install with: pip install weasyprint==68.0") from exc

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DATA = ROOT / "src" / "data" / "releases.json"
DEFAULT_OUT = ROOT / "public" / "releases"

CSS = r"""
@page { size: Letter; margin: 0; }
* { box-sizing: border-box; }
html,body { margin:0; padding:0; background:#03070d; color:#dbe6ed; font-family: DejaVu Sans, Arial, sans-serif; }
.page { width:8.5in; height:11in; position:relative; overflow:hidden; padding:.56in .62in .54in; page-break-after:always; background:linear-gradient(180deg,#050b13,#02060b 72%); }
.page:last-child{ page-break-after:auto; }
.topline { position:absolute; left:.62in; right:.62in; top:.32in; height:1px; background:#557b94; }
.footer { position:absolute; left:.62in; right:.62in; bottom:.27in; display:flex; justify-content:space-between; color:#466173; font:700 7px/1.2 DejaVu Sans Mono, monospace; letter-spacing:.16em; text-transform:uppercase; }
.kicker,.eyebrow { color:#7298b0; font:700 8px/1.2 DejaVu Sans Mono, monospace; letter-spacing:.2em; text-transform:uppercase; }
h1,h2,h3,p{ margin:0; } h1 { font-size:61px; line-height:.9; letter-spacing:-.055em; font-weight:500; }
h2 { font-size:28px; line-height:1.05; letter-spacing:-.025em; font-weight:600; }
.lede { color:#8ea1ae; font-size:12px; line-height:1.66; max-width:6.65in; }
.bigquote { color:#c9d7df; font-size:20px; line-height:1.35; max-width:6.7in; }
.rule { height:1px; background:#20313d; margin:18px 0; }
.grid2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }.grid3 { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
.card { border:1px solid #20313d; border-radius:12px; background:#07111b; padding:14px; }
.card .label { color:#58788d; font:700 7px/1.25 DejaVu Sans Mono, monospace; letter-spacing:.15em; text-transform:uppercase; }
.card strong { display:block; margin-top:11px; color:#d8e2e8; font-size:14px; font-weight:600; }
.card p { margin-top:8px; color:#768995; font-size:8.8px; line-height:1.55; }
.badges { display:flex; gap:7px; flex-wrap:wrap; }.badge { border:1px solid #31536a; border-radius:999px; padding:6px 8px 5px; color:#91b9d1; font:700 7px/1 DejaVu Sans Mono, monospace; letter-spacing:.12em; text-transform:uppercase; background:#07131d; }
.statrow { display:grid; grid-template-columns:repeat(4,1fr); border-top:1px solid #20313d; border-bottom:1px solid #20313d; margin-top:20px; }
.stat { padding:13px 10px; border-right:1px solid #20313d; }.stat:last-child{border-right:0}.stat small { display:block; color:#536f81; font:700 6.7px/1.2 DejaVu Sans Mono, monospace; letter-spacing:.13em; text-transform:uppercase; }.stat b { display:block; margin-top:7px; font-size:12px; font-weight:600; color:#d2dde4; }
.stack { margin-top:18px; border-top:1px solid #20313d; }.row { display:grid; grid-template-columns:34px 1.35fr 2.15fr; gap:12px; padding:12px 0; border-bottom:1px solid #1b2a35; align-items:start; }.row .n { color:#446174; font:700 7px/1.3 DejaVu Sans Mono, monospace; }.row b { font-size:10px; color:#cfdce3; font-weight:600; }.row p { font-size:8.5px; line-height:1.48; color:#738793; }
.section-head { display:flex; justify-content:space-between; gap:16px; align-items:flex-end; margin:12px 0 24px; }.section-head .meta { text-align:right; color:#526d80; font:700 7px/1.5 DejaVu Sans Mono, monospace; letter-spacing:.1em; text-transform:uppercase; }
.callout { margin-top:18px; padding:16px 18px; border-left:2px solid #70a8c9; background:#08151f; }.callout b { color:#d7e2e8; font-size:11px; font-weight:600; }.callout p { margin-top:7px; color:#8194a0; font-size:9.3px; line-height:1.55; }
.manifest { display:grid; grid-template-columns:1.15fr 1.85fr; gap:0; margin-top:18px; border:1px solid #20313d; border-radius:10px; overflow:hidden; }.manifest div { padding:9px 11px; border-bottom:1px solid #182733; min-height:31px; }.manifest div:nth-last-child(-n+2){ border-bottom:0; }.manifest .k { color:#5b7789; font:700 6.8px/1.35 DejaVu Sans Mono, monospace; letter-spacing:.11em; text-transform:uppercase; }.manifest .v { color:#c2d0d8; font:500 8.1px/1.4 DejaVu Sans Mono, monospace; overflow-wrap:anywhere; }
.changes { columns:2; column-gap:22px; margin-top:10px; }.change { break-inside:avoid; padding:7px 0 8px; border-bottom:1px solid #192935; }.change .pr { color:#537287; font:700 6.8px/1 DejaVu Sans Mono, monospace; }.change b { display:block; margin-top:4px; color:#c8d5dc; font-size:8.5px; line-height:1.35; font-weight:600; }
.cover .brandline { display:flex; justify-content:space-between; align-items:center; margin-top:.02in; }.brandname { color:#8aa6b9; font:700 8px/1 DejaVu Sans Mono, monospace; letter-spacing:.24em; }.cover .hero { position:absolute; left:.62in; right:.62in; top:2.08in; }.cover .version { color:#6e93aa; font:700 9px/1.2 DejaVu Sans Mono, monospace; letter-spacing:.22em; }.cover .codename { margin-top:16px; font-size:80px; line-height:.84; letter-spacing:-.055em; font-weight:500; color:#edf3f6; }.cover .subtitle { margin-top:20px; max-width:5.8in; color:#8fa2ae; font-size:13px; line-height:1.55; }.cover .phase { position:absolute; left:.62in; bottom:1.12in; display:grid; gap:9px; }.cover .phase strong { color:#d7e2e8; font-size:17px; font-weight:600; }.cover .phase span { color:#6f8999; font:700 7px/1.3 DejaVu Sans Mono, monospace; letter-spacing:.17em; text-transform:uppercase; }
.mark { width:62px; height:62px; }
"""

MARK = """<svg class='mark' viewBox='0 0 100 100' aria-label='ANEVUM'><circle cx='50' cy='50' r='43' fill='none' stroke='#8db9d5' stroke-opacity='.5' stroke-width='1.2'/><path d='M50 14C47 34 39 58 20 78M50 14C53 34 61 58 80 78' fill='none' stroke='#eef3f6' stroke-width='5' stroke-linecap='round'/><path d='M50 31C45 49 40 62 33 69M50 31C55 49 60 62 67 69' fill='none' stroke='#eef3f6' stroke-width='2.2' stroke-linecap='round'/><path d='M50 52V78' fill='none' stroke='#eef3f6' stroke-opacity='.58' stroke-width='1.2' stroke-linecap='round'/><circle cx='50' cy='81' r='5' fill='#eef3f6'/></svg>"""

def e(value: object) -> str:
    return html.escape(str(value), quote=True)

def page(inner: str, footer: str, number: int, extra: str = "") -> str:
    return f"<section class='page {extra}'><div class='topline'></div>{inner}<div class='footer'><span>{e(footer)}</span><span>{number:02d}</span></div></section>"

def cards(items: list[dict], cols: int = 2) -> str:
    klass = "grid3" if cols == 3 else "grid2"
    return f"<div class='{klass}'>" + "".join(
        f"<div class='card'><span class='label'>{e(item.get('label',''))}</span><strong>{e(item.get('title',''))}</strong><p>{e(item.get('body',''))}</p></div>" for item in items
    ) + "</div>"

def build_html(r: dict) -> str:
    title = f"RHEN {r['version']} - {r['codename']}"
    badge_html = "".join(f"<span class='badge'>{e(x)}</span>" for x in r.get("badges", []))
    capability = r.get("capabilities", [])
    architecture = r.get("architecture", [])
    verification = r.get("verification", [])
    limitations = r.get("limitations", [])
    changelog = r.get("changelog", [])
    pages: list[str] = []

    pages.append(page(f"""
      <div class='brandline'>{MARK}<span class='brandname'>ANEVUM / RHEN RELEASE PROGRAM</span></div>
      <div class='hero'><div class='version'>RHEN {e(r['version'])} / NAMED RELEASE</div><div class='codename'>{e(r['codename'])}</div><p class='subtitle'>{e(r['abstract'])}</p><div class='badges' style='margin-top:24px'>{badge_html}</div></div>
      <div class='phase'><span>Lifecycle state</span><strong>{e(r['lifecycle'])}</strong><span>{e(r['releaseClass'])} / {e(r['date'])}</span></div>
    """, title, 1, "cover"))

    pages.append(page(f"""
      <div class='kicker'>01 / Abstract</div><div class='section-head'><h2>{e(r['headline'])}</h2><div class='meta'>{e(r['releaseClass'])}</div></div>
      <p class='bigquote'>{e(r['thesis'])}</p><div class='rule'></div><p class='lede'>{e(r['abstract'])}</p>
      <div class='statrow'><div class='stat'><small>System</small><b>RHEN {e(r['version'])}</b></div><div class='stat'><small>Lifecycle</small><b>{e(r['lifecycle'])}</b></div><div class='stat'><small>Strategy</small><b>{e(r['activeStrategy'].split(' / ')[0])}</b></div><div class='stat'><small>Status</small><b>FROZEN SNAPSHOT</b></div></div>
      <div style='margin-top:18px'>{cards(capability[:2], 2)}</div>
      <div class='callout'><b>Release discipline</b><p>This packet describes the system as it existed at a frozen release boundary. It does not imply that unreleased research, predictive models, or experiments have production authority.</p></div>
    """, title, 2))

    arch_rows = "".join(f"<div class='row'><span class='n'>{e(x.get('label',''))}</span><b>{e(x.get('title',''))}</b><p>{e(x.get('body',''))}</p></div>" for x in architecture)
    pages.append(page(f"<div class='kicker'>02 / Architecture</div><div class='section-head'><h2>One live authority. Separate evidence and research layers.</h2><div class='meta'>Fail-closed boundaries</div></div><div class='stack'>{arch_rows}</div><div class='callout'><b>Production boundary</b><p>The live executor remains the exclusive production authority. Research may observe, classify, propose, and recommend, but protected research transitions and production changes remain separately controlled.</p></div>", title, 3))

    cap_rest = capability[2:] if len(capability) > 2 else capability
    pages.append(page(f"<div class='kicker'>03 / Capability boundary</div><div class='section-head'><h2>What this release can do.</h2><div class='meta'>Released capability</div></div>{cards(cap_rest, 2)}<div class='callout'><b>Operational meaning</b><p>{e(r['headline'])} The point of this release is not to claim a finished system; it is to establish a coherent, observable generation that can be tested without silently changing its own rules.</p></div>", title, 4))

    ver_cards = [{"label":x.get("label",""),"title":x.get("value",""),"body":x.get("body","")} for x in verification]
    pages.append(page(f"<div class='kicker'>04 / Verification</div><div class='section-head'><h2>What was verified at the release boundary.</h2><div class='meta'>Release gate</div></div>{cards(ver_cards, 2)}<div class='callout'><b>Source identity</b><p>Canonical RHEN source commit: {e(r['sourceCommit'])}</p></div>", title, 5))

    limitation_rows = "".join(f"<div class='row'><span class='n'>{i:02d}</span><b>{e(x.get('title',''))}</b><p>{e(x.get('body',''))}</p></div>" for i,x in enumerate(limitations,1))
    pages.append(page(f"<div class='kicker'>05 / Known limitations</div><div class='section-head'><h2>What this release cannot claim.</h2><div class='meta'>Explicit uncertainty</div></div><div class='stack'>{limitation_rows}</div><div class='callout'><b>Evidence standard</b><p>Limitations are part of the release record. They should be corrected by later evidence or later releases, not silently removed from historical packets.</p></div>", title, 6))

    manifest = [
        ("System", "RHEN"), ("System version", r["version"]), ("Codename", r["codename"]), ("Lifecycle", r["lifecycle"]),
        ("Release class", r["releaseClass"]), ("Canonical source commit", r["sourceCommit"]),
        ("Production deployment", r.get("productionDeployment","unrecorded")), ("Shadow deployment", r.get("shadowDeployment","unrecorded")),
        ("Pre-Open deployment", r.get("preopenDeployment","unrecorded")), ("Active strategy", r["activeStrategy"]), ("Release date", r["date"]),
    ]
    manifest_html = "".join(f"<div class='k'>{e(k)}</div><div class='v'>{e(v)}</div>" for k,v in manifest)
    pages.append(page(f"<div class='kicker'>06 / Release manifest</div><div class='section-head'><h2>Immutable identity for {e(r['codename'])}.</h2><div class='meta'>Canonical snapshot</div></div><div class='manifest'>{manifest_html}</div><div class='callout'><b>Release record</b><p>Later releases may supersede behavior, but this manifest preserves the exact generation represented by this packet.</p></div>", title, 7))

    change_html = "".join(f"<div class='change'><span class='pr'>PR #{e(x.get('pr',''))}</span><b>{e(x.get('title',''))}</b></div>" for x in changelog)
    pages.append(page(f"<div class='kicker'>07 / Selected changelog</div><div class='section-head'><h2>Major merged changes represented by this release.</h2><div class='meta'>anevum/rhen</div></div><div class='changes'>{change_html}</div>", title, 8))

    pages.append(page(f"<div class='kicker'>08 / What comes next</div><div class='section-head'><h2>A release is a boundary, not an endpoint.</h2><div class='meta'>Next capability</div></div><p class='bigquote'>{e(r['next'])}</p><div class='rule'></div><div class='grid3'><div class='card'><span class='label'>PATCH</span><strong>{e(r['version'])} + patch</strong><p>Operational hardening, bug fixes, telemetry corrections, and documentation normally remain under the active codename.</p></div><div class='card'><span class='label'>MINOR</span><strong>Next capability boundary</strong><p>A meaningful new operating capability receives a new minor version and normally a new codename.</p></div><div class='card'><span class='label'>MAJOR</span><strong>1.0.0+</strong><p>A generational architecture milestone requires a new codename, full packet, verification record, and explicit limitations.</p></div></div><div class='callout'><b>Historical purpose</b><p>The release archive should make it possible to understand what RHEN was believed to be at each major stage - not merely reconstruct source code.</p></div>", title, 9))

    return "<!doctype html><html><head><meta charset='utf-8'><title>" + e(title) + "</title><style>" + CSS + "</style></head><body>" + "".join(pages) + "</body></html>"

def filename_for(r: dict) -> str:
    safe_name = "".join(ch if ch.isalnum() or ch in "-_" else "-" for ch in str(r["codename"]).upper())
    return f"RHEN-{r['version']}-{safe_name}.pdf"

def main() -> int:
    parser = argparse.ArgumentParser(description="Render RHEN release packets from the canonical release data.")
    parser.add_argument("--data", type=Path, default=DEFAULT_DATA)
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--slug", default=None, help="Render only one release slug")
    args = parser.parse_args()
    registry = json.loads(args.data.read_text(encoding="utf-8"))
    releases = registry.get("releases", [])
    if args.slug:
        releases = [r for r in releases if r.get("slug") == args.slug]
        if not releases:
            raise SystemExit(f"Release not found: {args.slug}")
    args.out_dir.mkdir(parents=True, exist_ok=True)
    for release in releases:
        out_path = args.out_dir / filename_for(release)
        HTML(string=build_html(release), base_url=str(ROOT)).write_pdf(out_path)
        print(out_path)
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
