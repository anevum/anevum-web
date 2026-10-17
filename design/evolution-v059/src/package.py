from pathlib import Path
import zipfile,json,hashlib,shutil
from geometry import ROOT
OUT=ROOT.parent/'deliverables';OUT.mkdir(exist_ok=True)
# The web distribution has individual GET-loaded assets; the offline file is separate.
web=OUT/'ANEVUM-EVOLUTION-V059-WEB-REVIEW.zip'
with zipfile.ZipFile(web,'w',zipfile.ZIP_DEFLATED,compresslevel=4) as z:
 for p in sorted((ROOT/'dist').rglob('*')):
  if p.is_file():z.write(p,str(p.relative_to(ROOT/'dist')))
 for name in ['README.md','docs/PRODUCTION-HANDOFF.md','docs/WEB-DELIVERY-QA.json']:
  z.write(ROOT/name,name)
shutil.copy2(ROOT/'ANEVUM-V059-INTERACTIVE.html',OUT/'ANEVUM-V059-INTERACTIVE.html')
shutil.copy2(ROOT/'previews/V059-ALL-30-MOTION.mp4',OUT/'V059-ALL-30-MOTION.mp4')
shutil.copy2(ROOT/'previews/V059-COMPLETE-COLLECTION.jpg',OUT/'V059-COMPLETE-COLLECTION.jpg')
shutil.copy2(ROOT/'docs/PRODUCTION-HANDOFF.md',OUT/'V059-PRODUCTION-HANDOFF.md')
full=OUT/'ANEVUM-EVOLUTION-V059-FULL-SOURCE.zip'
with zipfile.ZipFile(full,'w',zipfile.ZIP_DEFLATED,compresslevel=4) as z:
 for p in sorted(ROOT.rglob('*')):
  if not p.is_file():continue
  rel=p.relative_to(ROOT);parts=rel.parts
  if '__pycache__' in parts or parts[0]=='qa-browser-initial' or p.suffix=='.pending':continue
  if parts[0]=='docs' and p.name.startswith('github-'):continue
  if p.name=='test_egl.py':continue
  if parts[0]=='previews' and not (p.name.startswith(('level-','chapter-','V059-'))):continue
  z.write(p,str(rel))
for p in [web,full]:
 with zipfile.ZipFile(p) as z:assert z.testzip() is None;print('ZIP',p.name,len(z.namelist()),p.stat().st_size)
items=[]
for p in sorted(OUT.glob('*')):
 if p.is_file() and p.name!='DELIVERY-CHECKSUMS.json':items.append({'filename':p.name,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
(OUT/'DELIVERY-CHECKSUMS.json').write_text(json.dumps({'session':'ANEVUM.WEB.BUILD.2026-10-17.008.EVOLUTION-HYPERRES-ARTWORK','artifacts':items},indent=2))
