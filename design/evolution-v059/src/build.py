"""Assemble the dependency-free offline workshop and complete artwork registry."""
from pathlib import Path
from PIL import Image
import json,gzip,base64,io,hashlib,copy,shutil,re
from geometry import ROOT,MAT,Scene
SESSION='ANEVUM.WEB.BUILD.2026-10-17.008.EVOLUTION-HYPERRES-ARTWORK'
CHAPTERS=['Before Form','First Matter','Stellar Dawn','Cosmic Architecture','Worlds & Life','Continuance']
SILHOUETTES=['Fractured upright obsidian splinter','Two torn interference veils','Cluster of short-lived iridescent cavities','Opposing folded symmetry blades','An expanding open causal membrane','Twisting asymmetric plasma plume','Three unequal charge knots connected by flux','A dense three-lobed bound nucleus','Paired probability lobes around a nucleus','A draped anisotropy fossil','A dark filamentary hydrogen cloud','A deep spacetime funnel','A kindling star with magnetic coronal arches','A granulated stellar ember','A wispy multicolored stellar nursery','An elemental crucible shedding luminous ejecta','An assembling spiral seed','An inclined four-arm stellar galaxy','A branching cosmic filament network','A primary star and four independent worlds','A rocky accretion body with orbiting debris','A deep ocean with interrupted atmospheric currents','A climbing molecular chain with reactive side groups','Two dividing translucent protocells','A living world encased by co-evolving fronds','An asymmetric branching neural organism','An offset monolith transmitter and outgoing waves','An inhabited cluster of archive towers','A fork-mounted archival optical instrument','An open orbital mark receiving five memory streams']
MOTIONS=['A near-imperceptible angular fluctuation and one slow incipient fissure pulse.','Independent field flutter and traveling interference fringes.','Cavities swell, contract and fade out of phase.','Opposed planes approach alignment around a glowing symmetry axis.','The causal membrane and released shards expand and settle.','Charge currents deform while luminous turbulence travels through them.','Charge knots move independently as binding flux flexes.','The bound lobes remain stable while pressure seams change luminosity.','Probability lobes and contours precess independently.','A low-frequency wave passes across a barely moving radiation fossil.','Cold hydrogen banks gather almost imperceptibly around dim density knots.','The curved geodesic funnel rotates around its dark focus.','An unstable photosphere breathes as coronal arches and streamers deform.','A stable photosphere rotates beneath independently changing prominences.','Independent density banks drift around an embedded newborn star.','Elemental ejecta expand from a pulsing stellar crucible.','Spiral inflows gather while the first stellar population turns.','Thousands of stars rotate with the inclined spiral geometry.','Luminosity propagates along independently deforming filaments.','Four worlds orbit at different speeds around a stellar primary.','Planetesimals drift inward while an accreting world turns.','Ocean texture and atmospheric arcs circulate at different rates.','A molecular backbone flexes while reactive groups pulse.','Twin membranes separate and return while internal strands move.','Canopy filaments flex around a rotating ocean substrate.','Dendrites flex while traveling electrochemical impulses illuminate terminals.','A resonator calibrates and sends distinct expanding transmission waves.','Inhabited windows light in groups while skybridges carry moving illumination.','Optical gimbals calibrate independently above preserved archive leaves.','Five evolutionary memory streams converge through open orbits; a new outward signal answers.']

# Reuse the repository's canonical brand mark in the header and recognition surface.
MARK=(ROOT/'references/anevum-mark.svg').read_text()
MARK=re.sub(r'<title[^>]*>.*?</title>','',MARK)
MARK=re.sub(r'role="img" aria-labelledby="[^"]+"','class="mark" aria-hidden="true"',MARK)

def b64(v):return base64.b64encode(v).decode()
def image64(path,size=None,fmt=None):
 if not size and not fmt:return b64(path.read_bytes())
 im=Image.open(path);im=im.resize((size,size),Image.Resampling.LANCZOS) if size else im;out=io.BytesIO();im.save(out,format=fmt or 'WEBP',quality=90);return b64(out.getvalue())
def build():
 original=json.loads((ROOT/'references/V058-ALL-SPECIMENS.json').read_text())
 levels=[]
 for i,old in enumerate(original,1):
  s=Scene(i).build();d={k:v for k,v in old.items() if k in ['level','name','chapter','subtitle','description','detail','material','accent','xp','next']};d.update(chapterIndex=(i-1)//5+1,chapterName=CHAPTERS[(i-1)//5],silhouette=SILHOUETTES[i-1],motion=MOTIONS[i-1],nativeParts=len(s.parts),triangles=sum(len(p['f']) for p in s.parts),source=f'src/geometry.py: Scene.build / level {i}',assets={'scene':f'artwork/native/level-{i:02}.scene.json','gltf':f'artwork/native/level-{i:02}.gltf','master':f'artwork/masters/level-{i:02}-2048.png','web':{str(sz):f'artwork/web/level-{i:02}-{sz}.webp' for sz in [256,512,1024]},'compact':{str(sz):f'artwork/compact/level-{i:02}-{sz}.png' for sz in [32,64,128,256]},'vectorField':f'artwork/vector/level-{i:02}-field.svg','animation':f'previews/level-{i:02}-motion.mp4'})
  d['detail']=d['detail'].replace('emblem','visual metaphor');levels.append(d)
 manifest={'schema':'anevum.evolution.artwork.v059','session':SESSION,'branch':'design/evolution-hyperres-v059-20261017-008','status':'reconstruction-review-candidate-not-deployed','levelCap':30,'chapterCount':6,'xpFormula':'75*(L-1)^2','level30XP':63075,'chapters':CHAPTERS,'levels':levels,'renderPipeline':{'nativeGeometry':'procedural 3D + glTF 2.0','material':'GGX direct lighting + procedural fields + sampled albedo/height','masters':'2048px straight-alpha PNG rendered with EGL OpenGL using the live GLSL','web':'256/512/1024px WebP; selected-only WebGL scene','textures':'four 4096px procedural height/normal/roughness families; 1254px generated obsidian albedo source','vector':'30 independently editable SVG field overlays; no embedded raster'},'accountWrites':False,'publicDeployment':False,'microPresentation':'V060 native compact scene source rendered at 1024 pixels and alpha-aware downsampled to 32/48/64 PNG + 128/192/256 WebP; no XP changes', 'nativeAnimationLimit':'glTF portable loop contains node motion; phenomenon-specific deformation/emission stays in editable GLSL + scene JSON','limitations':['Real-time materials are artistic approximations; no path tracing, true participating-media transport or physical refraction.','All 30 are reconstructed; artistic approval is pending. No claim that the final long-term visual standard has been approved.','Native iPhone Safari and assistive-technology acceptance require device review.','No account, achievement, XP or production site integration.']}
 (ROOT/'docs/ARTWORK-MANIFEST.json').write_text(json.dumps(manifest,indent=2))
 data={'levels':levels,'chapters':CHAPTERS,'materials':MAT,'mark':MARK,'vertex':(ROOT/'src/material.vert').read_text(),'fragment':(ROOT/'src/material.frag').read_text(),'bloomVertex':(ROOT/'src/bloom.vert').read_text(),'bloomFragment':(ROOT/'src/bloom.frag').read_text(),'scenes':[],'thumbs':[],'poster':[],'compact':[],'micro':[],'microSources':[],'fields':[],'height':image64((ROOT/'artwork/textures/mineral-height-web.png') if (ROOT/'artwork/textures/mineral-height-web.png').exists() else (ROOT/'artwork/textures/mineral-height-4096.png'),512,'PNG'),'albedo':image64(ROOT/'artwork/textures/obsidian-albedo-source.jpg',1024,'WEBP')}
 for i in range(1,31):
  data['scenes'].append(b64(gzip.compress((ROOT/f'artwork/native/level-{i:02}.scene.json').read_bytes(),mtime=0)))
  data['thumbs'].append(image64(ROOT/f'artwork/web/level-{i:02}-256.webp'))
  data['poster'].append(image64(ROOT/f'artwork/web/level-{i:02}-1024.webp'))
  data['compact'].append(image64(ROOT/f'artwork/compact/level-{i:02}-128.png'))
  data['micro'].append(image64(ROOT/f'artwork/micro/level-{i:02}-256.webp'))
  data['microSources'].append(None)
  data['fields'].append(b64((ROOT/f'artwork/vector/level-{i:02}-field.svg').read_bytes()))
 page=(ROOT/'src/app.html').read_text().replace('__CSS__',(ROOT/'src/app.css').read_text()).replace('__JS__',(ROOT/'src/app.js').read_text()).replace('__MARK__',MARK).replace('__DATA__',json.dumps(data,separators=(',',':')).replace('</','<\\/'))
 (ROOT/'ANEVUM-V059-INTERACTIVE.html').write_text(page);(ROOT/'dist/index.html').write_text(page)
 web=copy.deepcopy(data);web['external']=True;asset=ROOT/'dist/assets';asset.mkdir(parents=True,exist_ok=True)
 for key,ext in [('scenes','scene.gz'),('thumbs','256.webp'),('poster','1024.webp'),('compact','compact-128.png'),('fields','field.svg')]:
  for j,encoded in enumerate(data[key]):
   name=f'level-{j+1:02}-{ext}';(asset/name).write_bytes(base64.b64decode(encoded));web[key][j]='assets/'+name
 for j in range(1,31):
  for sz in [128,192,256]:
   dest=f'level-{j:02}-micro-{sz}.webp'
   shutil.copyfile(ROOT/f'artwork/micro/level-{j:02}-{sz}.webp',asset/dest)
  web['micro'][j-1]=f'assets/level-{j:02}-micro-256.webp'
  web['microSources'][j-1]=', '.join(f'assets/level-{j:02}-micro-{sz}.webp {sz}w' for sz in [128,192,256])
 for key,ext in [('height','png'),('albedo','webp')]:
  (asset/f'{key}.{ext}').write_bytes(base64.b64decode(data[key]));web[key]=f'assets/{key}.{ext}'
 web_page=(ROOT/'src/app.html').read_text().replace('__CSS__',(ROOT/'src/app.css').read_text()).replace('__JS__',(ROOT/'src/app.js').read_text()).replace('__MARK__',MARK).replace('__DATA__',json.dumps(web,separators=(',',':')).replace('</','<\\/'))
 (ROOT/'dist/index.html').write_text(web_page)
 (ROOT/'docs/PAYLOAD-BUDGET.json').write_text(json.dumps({'offlineHTMLBytes':len(page.encode()),'webHTMLBytes':len(web_page.encode()),'webInitialSelectedSceneBytes':len(base64.b64decode(data['scenes'][29])),'offlineGzipBytes':len(gzip.compress(page.encode())),'compressedSceneBytes':[len(base64.b64decode(s)) for s in data['scenes']],'note':'Offline review embeds all fallbacks and scenes. Production integration should fetch the selected scene and responsive poster only, using the separate web assets.'},indent=2))
 print('BUILT',len(page.encode()),'bytes; gzip',len(gzip.compress(page.encode())),flush=True)
if __name__=='__main__':build()
