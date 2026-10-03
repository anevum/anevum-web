"""Build compact review sheets; full resolution screenshots remain in the CI artifact."""
from pathlib import Path
from PIL import Image, ImageDraw
import base64
import io
import os

root = Path(os.environ["RUNNER_TEMP"]) / "anevum-visuals"
routes = ["home", "live", "products", "command-overview", "command-iren", "command-rhen", "command-graen", "command-nostra", "command-velum", "home-systems"]
for viewport, size in [("desktop", (480, 334)), ("mobile", (195, 422))]:
    sheet = Image.new("RGB", (size[0] * 3, (size[1] + 26) * 4), "#04070D")
    draw = ImageDraw.Draw(sheet)
    for index, route in enumerate(routes):
        shot = Image.open(root / f"visual-{route}-{viewport}.png").convert("RGB")
        shot.thumbnail(size, Image.Resampling.LANCZOS)
        x, y = (index % 3) * size[0], (index // 3) * (size[1] + 26)
        draw.text((x + 8, y + 6), route, fill="#B8D2FF")
        sheet.paste(shot, (x, y + 26))
    sheet.save(root / f"contact-{viewport}.png")
    output = io.BytesIO()
    sheet.save(output, format="WEBP", quality=72)
    print(f"VISUAL_CONTACT_{viewport.upper()}=" + base64.b64encode(output.getvalue()).decode())

for viewport in ["desktop", "mobile"]:
    shot = Image.open(root / f"visual-command-overview-{viewport}.png").convert("RGB")
    output = io.BytesIO()
    shot.save(output, format="WEBP", quality=80)
    print(f"VISUAL_OVERVIEW_{viewport.upper()}=" + base64.b64encode(output.getvalue()).decode())
