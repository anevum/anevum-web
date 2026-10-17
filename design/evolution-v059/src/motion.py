"""Render real shader animation, independently for all 30 specimens, at 24fps."""
import subprocess,time,json,numpy as np,sys
from PIL import Image,ImageDraw,ImageFont
from geometry import Scene,ROOT
from render import Renderer
FPS=24;FRAMES=72;SIZE=448
if __name__=='__main__':
 ids=list(map(int,sys.argv[1:])) or list(range(1,31));r=Renderer(SIZE);result_path=ROOT/'docs/MOTION-RENDER-RESULTS.json';metrics=json.loads(result_path.read_text()) if result_path.exists() else []
 for i in ids:
  s=Scene(i).build();dst=ROOT/'previews'/f'level-{i:02}-motion.mp4';tmp=dst.with_suffix('.tmp.mp4')
  ff=subprocess.Popen(['ffmpeg','-loglevel','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{SIZE}x{SIZE}','-r',str(FPS),'-i','-','-an','-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','-movflags','+faststart',str(tmp)],stdin=subprocess.PIPE)
  times=[];first=None;diff=0
  for j in range(FRAMES):
   begin=time.perf_counter();im=r.render(s,t=j/FPS,expressive=1);times.append(time.perf_counter()-begin)
   bg=Image.new('RGB',im.size,(5,11,17));bg.paste(im,mask=im.getchannel('A'));ff.stdin.write(bg.tobytes())
   if j==0:first=np.array(bg).astype(np.int16)
   if j==FRAMES-1:diff=float(np.abs(first-np.array(bg).astype(np.int16)).mean())
  ff.stdin.close();assert ff.wait()==0;tmp.replace(dst)
  metrics=[m for m in metrics if m['level']!=i];metrics.append({'level':i,'frames':FRAMES,'fps':FPS,'durationSeconds':FRAMES/FPS,'meanRenderMs':round(np.mean(times)*1000,2),'p95RenderMs':round(np.percentile(times,95)*1000,2),'firstLastMeanPixelDelta':round(diff,4),'renderer':'Mesa llvmpipe / actual shared GLSL / expressive inspection','file':str(dst.relative_to(ROOT))})
  (ROOT/'docs/MOTION-RENDER-RESULTS.json').write_text(json.dumps(sorted(metrics,key=lambda m:m['level']),indent=2));print('MOTION',i,'ms',round(np.mean(times)*1000,1),'delta',round(diff,3),flush=True)
