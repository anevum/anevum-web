#!/usr/bin/env python3
"""Install the approved Evolution of Everything V059 renders as Creator V1 V060 assets.
No account, database, migration, role, consent, or XP ledger changes.
"""
import json,re,shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
source=ROOT/"design/evolution-v059/dist"
target=ROOT/"creator-v1/web/public/evolution"
catalog=json.loads((ROOT/"creator-v1/shared/level-artifacts.json").read_text())
manifest=json.loads((ROOT/"design/evolution-v059/docs/ARTWORK-MANIFEST.json").read_text())
assert len(catalog)==len(manifest["levels"])==30
assert [x["name"] for x in catalog]==[x["name"] for x in manifest["levels"]]
assert [x["xp"] for x in catalog]==[75*(i-1)**2 for i in range(1,31)]
assert catalog[-1]["name"]=="ANEVUM" and catalog[-1]["xp"]==63075
assert source.joinpath("index.html").is_file()
assets=list((source/"assets").iterdir())
assert len(assets)==152,len(assets)
for i in range(1,31):
    name=f"level-{i:02}"
    for suffix in ["-scene.gz","-1024.webp","-256.webp","-compact-128.png","-field.svg"]:
        assert (source/"assets"/(name+suffix)).stat().st_size>300
shutil.rmtree(target,ignore_errors=True)
target.mkdir(parents=True,exist_ok=True)
shutil.copytree(source/"assets",target/"assets")
html=(source/"index.html").read_text()
css_match=re.search(r"<style>([\s\S]*?)</style>",html)
js_match=re.search(r"<script>([\s\S]*?)</script>(?=</body>)",html)
assert css_match and js_match
css,js=css_match.group(1),js_match.group(1)
html=html.replace(css_match.group(0),'<link rel="stylesheet" href="/evolution/app.css">',1)
html=html.replace(js_match.group(0),'<script defer src="/evolution/app.js"></script>',1)
html=html.replace('content="noindex,nofollow"','content="index,follow"')
html=html.replace('An unreleased ANEVUM Evolution of Everything collection for artwork review.','The permanent 30-level ANEVUM Evolution of Everything collection. Explore living, animated 3D specimens.')
html=html.replace('SPECIMEN ARCHIVE / 059','EVOLUTION / 030')
html=html.replace('<a href="#community">In the community</a>','<a href="/levels">My levels</a><a href="/community">Community</a>')
html=html.replace('Unreleased · Artwork review','30 permanent levels')
html=html.replace('SESSION 008 · 2026-10-17 · REVIEW COPY / NOT DEPLOYED','PERMANENT COLLECTION / LIVE')
html=html.replace('This artwork review has no connection to account balances or XP grants.','Earned levels and XP are calculated by the ANEVUM member service. This visual inspector and notification preview never grant XP.')
html=re.sub(r'<section class="community" id="community"[\s\S]*?</section>', '<section class="community" id="community" aria-labelledby="community-title"><div class="sectionhead"><div><span class="eyebrow">Member evolution</span><h2 id="community-title">Carry your signal forward.</h2></div><p><a href="/member">Visit your member space ↗</a></p></div><div id="members" hidden></div></section>',html,count=1)
assert "Unreleased · Artwork review" not in html
assert "REVIEW COPY / NOT DEPLOYED" not in html
assert html.count('<script defer src="/evolution/app.js"></script>')==1
assert html.count('id="workshop-data"')==1
old="renderGallery();renderMembers();syncMotion();selectLevel(30);"
new="""const levelQuery=new URLSearchParams(location.search).get('level');
const firstLevel=levelQuery&&/^(?:[1-9]|[12][0-9]|30)$/.test(levelQuery)?Number(levelQuery):30;
renderGallery();renderMembers();syncMotion();selectLevel(firstLevel);"""
assert old in js
js=js.replace(old,new,1)
# V062. Native materials, calibrated lights, bloom and object-specific motions
# are exported once from the exact V059 source used by the interactive archive.
# Dynamic member cards then fetch only the scene they actually need.
import sys
sys.path.insert(0,str(ROOT/"design/evolution-v059/src"))
from geometry import MAT
runtime={
    "version":"anevum.mini-native.v062",
    "vertex":(ROOT/"design/evolution-v059/src/material.vert").read_text(),
    "fragment":(ROOT/"design/evolution-v059/src/material.frag").read_text(),
    "bloomVertex":(ROOT/"design/evolution-v059/src/bloom.vert").read_text(),
    "materials":MAT,
    "height":"/evolution/assets/height.png",
    "albedo":"/evolution/assets/albedo.webp",
    "accents":[item["accent"] for item in manifest["levels"]],
}
assert len(runtime["accents"])==30
assert all(re.fullmatch(r"#[0-9a-fA-F]{6}",x) for x in runtime["accents"])
assert all(runtime[key].strip() for key in ["vertex","fragment","bloomVertex"])
(target/"mini-runtime.json").write_text(json.dumps(runtime,separators=(",",":")))
assert (target/"mini-runtime.json").stat().st_size>6000
(target/"app.css").write_text(css)
(target/"app.js").write_text(js)
(target/"index.html").write_text(html)
assert len(list((target/"assets").iterdir()))==152
print(json.dumps({"status":"ready","levels":30,"assets":152,"htmlBytes":len(html.encode()),"javascriptBytes":len(js.encode()),"cssBytes":len(css.encode()),"galleryRoute":"/evolution/","xpFinal":63075}))
