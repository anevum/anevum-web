"""CI/web-only exports. This does not generate or label transparent master files."""
from PIL import Image
from geometry import ROOT,Scene
from render import Renderer,save_image
r=Renderer(1024)
for i in range(1,31):
 im=r.render(Scene(i).build())
 for sz in [256,512,1024]:save_image(im.resize((sz,sz),Image.Resampling.LANCZOS),ROOT/'artwork/web'/f'level-{i:02}-{sz}.webp',quality=90,method=4)
 im=r.render(Scene(i,True).build(),zoom=1.07)
 save_image(im.resize((128,128),Image.Resampling.LANCZOS),ROOT/'artwork/compact'/f'level-{i:02}-128.png')
 print('WEB_RENDER',i,flush=True)
