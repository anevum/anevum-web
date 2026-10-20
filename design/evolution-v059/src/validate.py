"""Artifact, geometry, animation, transparency, and offline-delivery validation."""
from pathlib import Path
from PIL import Image
from xml.etree import ElementTree as ET
import json,hashlib,base64,numpy as np,subprocess,re,gzip
from geometry import ROOT
checks=[]
def check(ok,name,**details):
 checks.append({'name':name,'pass':bool(ok),**details})
 if not ok:print('FAIL',name,details)
manifest=json.loads((ROOT/'docs/ARTWORK-MANIFEST.json').read_text());levels=manifest['levels']
check(len(levels)==30,'Exactly 30 levels');check(manifest['chapterCount']==6,'Exactly six chapters');check(levels[-1]['xp']==63075,'Level 30 XP');check(all(l['xp']==75*(l['level']-1)**2 for l in levels),'Every threshold matches locked formula')
asset=[]
for l in levels:
 i=l['level'];prefix=f'level-{i:02}'
 gltf=json.loads((ROOT/'artwork/native'/f'{prefix}.gltf').read_text());binary=(ROOT/'artwork/native'/f'{prefix}.bin').read_bytes();scene=json.loads((ROOT/'artwork/native'/f'{prefix}.scene.json').read_text())
 check(gltf['asset']['version']=='2.0' and len(binary)==gltf['buffers'][0]['byteLength'],f'{prefix} native glTF buffer')
 check(len(gltf['nodes'])==len(scene['parts'])==l['nativeParts'],f'{prefix} editable named mesh parts')
 check(bool(gltf.get('animations')) and len(gltf['animations'][0]['channels'])>0,f'{prefix} portable native animation')
 for img in gltf['images']:check((ROOT/'artwork/native'/img['uri']).resolve().is_file(),f'{prefix} texture reference {img["uri"]}')
 for p in scene['parts']:
  v=np.frombuffer(base64.b64decode(p['vertices']),dtype='<f4').reshape(-1,8);ind=np.frombuffer(base64.b64decode(p['indices']),dtype='<u2');check(np.isfinite(v).all() and ind.max()<len(v),f'{prefix} finite geometry / {p["name"]}')
 paths=[ROOT/'artwork/masters'/f'{prefix}-2048.png']+[ROOT/'artwork/web'/f'{prefix}-{sz}.webp' for sz in [256,512,1024]]+[ROOT/'artwork/compact'/f'{prefix}-{sz}.png' for sz in [32,64,128,256]]
 for p in paths:
  im=Image.open(p);im.load();expected=2048 if 'masters' in p.parts else int(p.stem.split('-')[-1]);check(im.size==(expected,expected),f'{p.relative_to(ROOT)} dimensions');check(im.mode=='RGBA',f'{p.relative_to(ROOT)} RGBA');a=im.getchannel('A');corners=[a.getpixel(x) for x in [(0,0),(expected-1,0),(0,expected-1),(expected-1,expected-1)]];check(max(corners)==0 and a.getbbox() is not None,f'{p.relative_to(ROOT)} transparent corners / nonempty')
 svg=(ROOT/'artwork/vector'/f'{prefix}-field.svg').read_text();ET.fromstring(svg);check('<image' not in svg and '<script' not in svg,f'{prefix} genuine editable vector overlay');check('prefers-reduced-motion' in svg,f'{prefix} vector motion accessibility')
 movie=ROOT/'previews'/f'{prefix}-motion.mp4'
 if movie.exists():
  info=json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=width,height,nb_frames,r_frame_rate','-of','json',str(movie)]));st=info['streams'][0];check(st['width']==448 and st['height']==448 and int(st['nb_frames'])==72,f'{prefix} actual motion preview 72 frames')
 else:check(False,f'{prefix} actual motion preview missing')
for p in sorted((ROOT/'artwork').rglob('*')):
 if p.is_file():asset.append({'path':str(p.relative_to(ROOT)),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
motion=json.loads((ROOT/'docs/MOTION-RENDER-RESULTS.json').read_text());check(len(motion)==30 and all(x['firstLastMeanPixelDelta']>.001 for x in motion),'All 30 motion previews have measured pixel change')
html=(ROOT/'ANEVUM-V059-INTERACTIVE.html').read_text();check('__DATA__' not in html and '__JS__' not in html,'Offline HTML completely assembled');check(not re.search(r'<(?:script|link)[^>]+(?:src|href)=["\']https?://',html),'No runtime CDN dependency');check('prefers-reduced-motion' in html and 'webglcontextlost' in html,'Reduced motion and graphics-loss fallbacks included')
text=(ROOT/'src/app.js').read_text();check('fetch(' not in text or 'fetch(DATA.scenes' in text,'Only selected static-scene GET path');check(not any(x in text for x in ['XMLHttpRequest','sendBeacon','method: \'POST\'','localStorage','/api/']),'No account mutations or persistent XP')
for p in (ROOT/'dist/assets').glob('*.scene.gz'):check(json.loads(gzip.decompress(p.read_bytes()))['level'] in range(1,31),f'Web compressed scene {p.name}')
# WCAG relative-luminance checks on primary text pairs; decorative art excluded.
def lum(h):
 c=np.array([int(h[j:j+2],16)/255 for j in (1,3,5)]);c=np.where(c<=.04045,c/12.92,((c+.055)/1.055)**2.4);return float(c@[.2126,.7152,.0722])
for name,a,b in [('body','#b3c2c8','#0b151d'),('muted','#8da2ac','#09141e'),('gold','#dcc79e','#0b151d'),('primary button','#101a20','#c6b187')]:
 ratio=(max(lum(a),lum(b))+.05)/(min(lum(a),lum(b))+.05);check(ratio>=4.5,f'Text contrast {name}',ratio=round(ratio,2))
result={'session':manifest['session'],'status':'passed' if all(c['pass'] for c in checks) else 'failed','passed':sum(c['pass'] for c in checks),'total':len(checks),'checks':checks,'renderPerformance':{'environment':'448px headless Mesa llvmpipe; not physical-device performance','meanMs':round(float(np.mean([x['meanRenderMs'] for x in motion])),2),'worstP95Ms':max(x['p95RenderMs'] for x in motion)},'browserAcceptance':'See qa-browser/results.json when present; native Safari and assistive technology remain outstanding'}
(ROOT/'docs/ASSET-INVENTORY.json').write_text(json.dumps({'count':len(asset),'assets':asset},indent=2));(ROOT/'docs/ARTIFACT-QA.json').write_text(json.dumps(result,indent=2));print(json.dumps({k:v for k,v in result.items() if k!='checks'}));assert result['status']=='passed'
