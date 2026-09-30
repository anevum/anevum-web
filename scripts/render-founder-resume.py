from __future__ import annotations

import html
import json
from pathlib import Path

from weasyprint import HTML

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "src" / "data" / "founder.json"
OUTPUT = ROOT / "public" / "devon-akins-resume.pdf"

data = json.loads(SOURCE.read_text(encoding="utf-8"))


def clean(value: object) -> str:
    text = str(value or "")
    text = text.replace("–", "-").replace("—", "-").replace(" · ", " | ")
    return html.escape(text)


def skill_groups() -> str:
    rows: list[str] = []
    for group in data["skills"]:
        rows.append(
            "<div class='skill-row'><strong>"
            + clean(group["group"])
            + "</strong><span>"
            + clean(" | ".join(group["items"]))
            + "</span></div>"
        )
    return "".join(rows)


def experience() -> str:
    rows: list[str] = []
    for item in data["experience"]:
        bullets = "".join("<li>" + clean(bullet) + "</li>" for bullet in item["bullets"])
        rows.append(
            "<section class='experience'>"
            "<header><div><strong>"
            + clean(item["organization"])
            + "</strong><span>"
            + clean(item["role"])
            + "</span></div><time>"
            + clean(item["period"])
            + "</time></header><ul>"
            + bullets
            + "</ul></section>"
        )
    return "".join(rows)


def systems() -> str:
    return "".join(
        "<div class='system'><strong>"
        + clean(item["name"])
        + "</strong><p>"
        + clean(item["description"])
        + "</p></div>"
        for item in data["systems"]
    )


def education() -> str:
    return "".join(
        "<div class='education-row'><strong>"
        + clean(item["school"])
        + "</strong><span>"
        + clean(item["study"])
        + "</span><p>"
        + clean(item["detail"])
        + "</p></div>"
        for item in data["education"]
    )


document = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>{clean(data["name"])} - Resume</title>
<style>
@page {{
  size: Letter;
  margin: 0.52in 0.58in 0.55in;
  @bottom-right {{
    content: "anevum.com  |  " counter(page) " / " counter(pages);
    font-family: Arial, Helvetica, sans-serif;
    font-size: 7pt;
    color: #687783;
  }}
}}
* {{ box-sizing: border-box; }}
html, body {{ margin: 0; padding: 0; }}
body {{
  color: #14202a;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 9.2pt;
  line-height: 1.37;
}}
a {{ color: #1d5977; text-decoration: none; }}
header.hero {{
  display: flex;
  justify-content: space-between;
  gap: 28px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ccd5da;
}}
.brand {{
  font-size: 7pt;
  font-weight: 700;
  letter-spacing: 1.6pt;
  color: #2a6a8d;
}}
h1 {{
  margin: 6px 0 3px;
  font-size: 27pt;
  line-height: 1;
  letter-spacing: -1.2pt;
  font-weight: 700;
}}
h2 {{
  margin: 0;
  font-size: 10pt;
  color: #536572;
  font-weight: 600;
}}
.contact {{
  text-align: right;
  align-self: end;
  font-size: 8.2pt;
  line-height: 1.55;
}}
section.block {{
  margin-top: 15px;
}}
section.block > h3 {{
  margin: 0 0 7px;
  font-size: 7.5pt;
  letter-spacing: 1.2pt;
  text-transform: uppercase;
  color: #2a6a8d;
  border-bottom: 1px solid #d9e0e4;
  padding-bottom: 4px;
}}
.summary {{
  margin: 0;
  color: #334652;
}}
.experience {{
  margin-top: 9px;
  break-inside: avoid;
}}
.experience header {{
  display: flex;
  justify-content: space-between;
  gap: 20px;
}}
.experience header div {{
  display: flex;
  gap: 9px;
  align-items: baseline;
}}
.experience header strong {{
  font-size: 10.4pt;
}}
.experience header span,
.experience time {{
  color: #5d6f7a;
  font-size: 8.4pt;
}}
ul {{
  margin: 7px 0 0 16px;
  padding: 0;
}}
li {{
  margin: 0 0 3px;
  color: #334652;
}}
.skill-row {{
  display: grid;
  grid-template-columns: 1.35in 1fr;
  gap: 10px;
  padding: 4px 0;
  border-bottom: 1px solid #edf1f3;
}}
.skill-row strong {{
  font-size: 8.5pt;
}}
.skill-row span {{
  color: #41545f;
  font-size: 8.3pt;
}}
.system-grid {{
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 7px 18px;
}}
.system {{
  break-inside: avoid;
  border-top: 1px solid #d9e0e4;
  padding-top: 5px;
}}
.system strong {{
  font-size: 8.8pt;
  color: #203b4b;
}}
.system p {{
  margin: 2px 0 0;
  color: #485a65;
  font-size: 8pt;
  line-height: 1.34;
}}
.education-grid {{
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}}
.education-row {{
  break-inside: avoid;
}}
.education-row strong {{
  display: block;
  font-size: 9pt;
}}
.education-row span {{
  display: block;
  margin-top: 2px;
  color: #566874;
  font-size: 8.2pt;
}}
.education-row p {{
  margin: 3px 0 0;
  color: #485a65;
  font-size: 8pt;
}}
.footer-note {{
  margin-top: 14px;
  padding-top: 8px;
  border-top: 1px solid #d9e0e4;
  color: #61717c;
  font-size: 7.5pt;
}}
</style>
</head>
<body>
<header class="hero">
  <div>
    <div class="brand">ANEVUM</div>
    <h1>{clean(data["name"])}</h1>
    <h2>{clean(data["headline"])}</h2>
  </div>
  <div class="contact">
    <a href="mailto:{clean(data["email"])}">{clean(data["email"])}</a><br>
    <a href="https://anevum.com">anevum.com</a>
  </div>
</header>

<section class="block">
  <h3>Professional Summary</h3>
  <p class="summary">{clean(data["summary"])}</p>
</section>

<section class="block">
  <h3>Current Experience</h3>
  {experience()}
</section>

<section class="block">
  <h3>Technical Skills</h3>
  {skill_groups()}
</section>

<section class="block">
  <h3>Selected Systems</h3>
  <div class="system-grid">{systems()}</div>
</section>

<section class="block">
  <h3>Education</h3>
  <div class="education-grid">{education()}</div>
</section>

<p class="footer-note">Portfolio and current system documentation: anevum.com. Performance results are intentionally excluded from employment claims.</p>
</body>
</html>
"""

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
HTML(string=document, base_url=str(ROOT)).write_pdf(str(OUTPUT))
print(f"Rendered {OUTPUT} ({OUTPUT.stat().st_size} bytes)")
