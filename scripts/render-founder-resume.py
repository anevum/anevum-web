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


def certifications() -> str:
    return "".join(
        "<div class='education-row'><strong>"
        + clean(item["name"])
        + "</strong><span>"
        + clean(item["status"])
        + "</span><p>"
        + clean(item["detail"])
        + "</p></div>"
        for item in data["certifications"]
    )


document = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>{clean(data["name"])} - Resume</title>
<style>
@page {{
  size: Letter;
  margin: 0.48in 0.56in 0.5in;
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
  font-size: 8.8pt;
  line-height: 1.34;
}}
a {{ color: #1d5977; text-decoration: none; }}
header.hero {{
  display: flex;
  justify-content: space-between;
  gap: 28px;
  padding-bottom: 14px;
  border-bottom: 1px solid #ccd5da;
}}
.brand {{
  font-size: 6.7pt;
  font-weight: 700;
  letter-spacing: 1.5pt;
  color: #2a6a8d;
}}
h1 {{
  margin: 6px 0 3px;
  font-size: 26pt;
  line-height: 1;
  letter-spacing: -1.1pt;
  font-weight: 700;
}}
h2 {{
  margin: 0;
  font-size: 9.4pt;
  color: #536572;
  font-weight: 600;
}}
.contact {{
  text-align: right;
  align-self: end;
  font-size: 8pt;
  line-height: 1.5;
  color: #536572;
}}
section.block {{
  margin-top: 13px;
}}
section.block > h3 {{
  margin: 0 0 6px;
  font-size: 7.3pt;
  letter-spacing: 1.15pt;
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
.experience:first-child {{
  margin-top: 0;
}}
.experience header {{
  display: flex;
  justify-content: space-between;
  gap: 20px;
}}
.experience header div {{
  display: flex;
  gap: 8px;
  align-items: baseline;
  flex-wrap: wrap;
}}
.experience header strong {{
  font-size: 10pt;
}}
.experience header span,
.experience time {{
  color: #5d6f7a;
  font-size: 8pt;
}}
ul {{
  margin: 6px 0 0 15px;
  padding: 0;
}}
li {{
  margin: 0 0 2.5px;
  color: #334652;
}}
.skill-row {{
  display: grid;
  grid-template-columns: 1.42in 1fr;
  gap: 10px;
  padding: 3.5px 0;
  border-bottom: 1px solid #edf1f3;
}}
.skill-row strong {{
  font-size: 8.2pt;
}}
.skill-row span {{
  color: #41545f;
  font-size: 8pt;
}}
.education-grid {{
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 18px;
}}
.education-row {{
  break-inside: avoid;
}}
.education-row strong {{
  display: block;
  font-size: 8.8pt;
}}
.education-row span {{
  display: block;
  margin-top: 2px;
  color: #566874;
  font-size: 8pt;
}}
.education-row p {{
  margin: 2px 0 0;
  color: #485a65;
  font-size: 7.8pt;
}}
.footer-note {{
  margin-top: 12px;
  padding-top: 7px;
  border-top: 1px solid #d9e0e4;
  color: #61717c;
  font-size: 7.3pt;
}}
</style>
</head>
<body>
<header class="hero">
  <div>
    <div class="brand">PROFESSIONAL RÉSUMÉ</div>
    <h1>{clean(data["name"])}</h1>
    <h2>{clean(data["headline"])}</h2>
  </div>
  <div class="contact">
    {clean(data["location"])}<br>
    <a href="mailto:{clean(data["email"])}">{clean(data["email"])}</a><br>
    <a href="https://anevum.com">anevum.com</a>
  </div>
</header>

<section class="block">
  <h3>Professional Summary</h3>
  <p class="summary">{clean(data["summary"])}</p>
</section>

<section class="block">
  <h3>Experience</h3>
  {experience()}
</section>

<section class="block">
  <h3>Core Skills</h3>
  {skill_groups()}
</section>

<section class="block">
  <h3>Education</h3>
  <div class="education-grid">{education()}</div>
</section>

<section class="block">
  <h3>Certification</h3>
  <div class="education-grid">{certifications()}</div>
</section>

<p class="footer-note">Selected technical work and current projects: anevum.com</p>
</body>
</html>
"""

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
HTML(string=document, base_url=str(ROOT)).write_pdf(str(OUTPUT))
print(f"Rendered {OUTPUT} ({OUTPUT.stat().st_size} bytes)")
