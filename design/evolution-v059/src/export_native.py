"""Export editable glTF 2.0 meshes/materials and loopable node animation.
Shader deformations are additionally preserved in .scene.json and GLSL.
"""
import json,numpy as np,math
from geometry import Scene,MAT,ROOT,packed_scene,norm

def export(scene):
 blob=bytearray();views=[];acc=[]
 def put(a,kind,ctype=5126,target=None):
  a=np.ascontiguousarray(a,dtype='<f4' if ctype==5126 else '<u2');blob.extend(b'\0'*(-len(blob)%4));offset=len(blob);blob.extend(a.tobytes());view={'buffer':0,'byteOffset':offset,'byteLength':a.nbytes}
  if target:view['target']=target
  views.append(view);item={'bufferView':len(views)-1,'componentType':ctype,'count':len(a),'type':kind}
  if kind=='VEC3' and ctype==5126:item.update(min=a.min(0).tolist(),max=a.max(0).tolist())
  if kind=='SCALAR' and ctype==5126:item.update(min=[float(a.min())],max=[float(a.max())])
  acc.append(item);return len(acc)-1
 materials=[];mi={};images=[{'uri':'../textures/obsidian-albedo-source.jpg'},{'uri':'../textures/mineral-height-4096.png'},{'uri':'../textures/mineral-normal-4096.png'},{'uri':'../textures/membrane-normal-4096.png'},{'uri':'../textures/aqueous-normal-4096.png'},{'uri':'../textures/ceramic-metal-normal-4096.png'}];textures=[{'source':j,'sampler':0} for j in range(len(images))]
 meshes=[];nodes=[];samplers=[];channels=[];times=np.linspace(0,24,49).astype(np.float32);ta=put(times,'SCALAR')
 for j,p in enumerate(scene.parts):
  m=p['mat'];rgb,rough,metal,em,alpha,fam=MAT[m]
  if m not in mi:
   mi[m]=len(materials);material={'name':m,'doubleSided':True,'pbrMetallicRoughness':{'baseColorFactor':rgb+[alpha],'roughnessFactor':rough,'metallicFactor':metal}}
   if fam in [1,3]:material['pbrMetallicRoughness']['baseColorTexture']={'index':0 if fam==1 else 1}
   if fam in [1,3,5,6]:material['normalTexture']={'index':{1:2,3:5,5:4,6:3}[fam],'scale':.35}
   if em:material['emissiveFactor']=[min(1,x*em) for x in rgb]
   if alpha<1:material['alphaMode']='BLEND'
   material['extras']={'shaderEmissionStrength':em,'proceduralFamily':fam,'source':'src/material.frag'};materials.append(material)
  attrs={'POSITION':put(p['v'],'VEC3',target=34962),'NORMAL':put(p['n'],'VEC3',target=34962),'TEXCOORD_0':put(p['uv'],'VEC2',target=34962)}
  indices=put(p['f'].reshape(-1),'SCALAR',5123,34963);meshes.append({'name':p['name'],'primitives':[{'attributes':attrs,'indices':indices,'material':mi[m]}]});nodes.append({'name':p['name'],'mesh':j,'extras':{k:p[k] for k in ['motion','speed','phase','axis','pivot']}})
  mode=p['motion'];phase=p['phase'];speed=p['speed']
  if mode:
   # A portable 24s pose loop. The WebGL source retains phenomenon-specific deformation.
   if mode in [11,14,17,21,22,24,25,27,28,39,41]:
    axis=norm(p['axis']);angle=times/24*math.tau*(1 if speed>0 else -1);q=np.column_stack((np.sin(angle[:,None]/2)*axis,np.cos(angle/2)));path='rotation'
   elif mode in [5,7,13,15,16,18,19,20,26,33,36,43,44]:
    amp=.035 if mode!=5 else .12;sc=1+amp*np.sin(times/24*math.tau+phase);q=np.repeat(sc[:,None],3,axis=1);path='scale'
   else:
    q=np.zeros((len(times),3));q[:,1]=.012*np.sin(times/24*math.tau+phase);path='translation'
   q[-1]=q[0];a=put(q,'VEC4' if path=='rotation' else 'VEC3');samplers.append({'input':ta,'output':a,'interpolation':'LINEAR'});channels.append({'sampler':len(samplers)-1,'target':{'node':j,'path':path}})
 gltf={'asset':{'version':'2.0','generator':'ANEVUM native specimen workshop V059'},'scene':0,'scenes':[{'nodes':list(range(len(nodes)))}],'nodes':nodes,'meshes':meshes,'materials':materials,'buffers':[{'uri':f'level-{scene.i:02}.bin','byteLength':len(blob)}],'bufferViews':views,'accessors':acc,'images':images,'textures':textures,'samplers':[{'magFilter':9729,'minFilter':9987,'wrapS':10497,'wrapT':10497}],'animations':[{'name':'Specimen / portable 24 second loop','samplers':samplers,'channels':channels}],'extras':{'session':'ANEVUM.WEB.BUILD.2026-10-17.008.EVOLUTION-HYPERRES-ARTWORK','renderer':'src/material.vert + src/material.frag preserve full procedural animation; glTF node loop is a portable subset','level':scene.i}}
 out=ROOT/'artwork/native';(out/f'level-{scene.i:02}.gltf').write_text(json.dumps(gltf,separators=(',',':')));(out/f'level-{scene.i:02}.bin').write_bytes(blob)
 (out/f'level-{scene.i:02}.scene.json').write_text(json.dumps(packed_scene(scene),separators=(',',':')))

def vector_layer(i):
 # Editable path-based field layer, used in live inspection; it never embeds a raster.
 s=Scene(i).build();paths=[]
 for j,p in enumerate(s.parts):
  if p['motion'] in [2,4,10,12,23,34,36,37,38,42,44]:
   verts=p['v'][::max(1,len(p['v'])//25)];d='M'+'L'.join(f'{512+x*410:.2f} {512-y*410:.2f}' for x,y,z in verts);paths.append(f'<path d="{d}" style="animation-delay:-{j*.37:.2f}s"/>')
 if not paths:
  for j in range(3):paths.append(f'<path d="M{310+j*36} 710 Q{720-j*25} 550 {600-j*30} 310" style="animation-delay:-{j}s"/>')
 return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" role="img" aria-label="Level {i:02} editable field overlay"><style>path{{fill:none;stroke:#c8dacc;stroke-width:.6;stroke-dasharray:2 80;opacity:.4;animation:field{ i } 16s linear infinite}}@keyframes field{i}{{to{{stroke-dashoffset:-300}}}}@media(prefers-reduced-motion:reduce){{path{{animation:none}}}}</style>{''.join(paths)}</svg>'''
if __name__=='__main__':
 for i in range(1,31):
  s=Scene(i).build();export(s);(ROOT/'artwork/vector'/f'level-{i:02}-field.svg').write_text(vector_layer(i));print('NATIVE',i,flush=True)
