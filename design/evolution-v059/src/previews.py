from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,subprocess
from geometry import ROOT
M=json.loads((ROOT/'docs/ARTWORK-MANIFEST.json').read_text());FT='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';SER='/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf'
def f(n):return ImageFont.truetype(FT,n)
board=Image.new('RGB',(1600,2240),(5,11,17));d=ImageDraw.Draw(board);d.text((44,34),'ANEVUM / EVOLUTION OF EVERYTHING',font=f(29),fill='#e6decb');d.text((44,82),'V059 · ALL 30 RECONSTRUCTED SPECIMENS · ARTWORK REVIEW',font=f(13),fill='#a4b7c0')
for i,l in enumerate(M['levels']):
 x=31+(i%5)*312;y=136+(i//5)*340;im=Image.open(ROOT/'artwork/web'/f'level-{i+1:02}-512.webp').convert('RGBA');im.thumbnail((286,280));board.paste(im,(x+(286-im.width)//2,y),im);d.text((x+11,y+281),f'{i+1:02} / {l["name"]}',font=f(14),fill='#e5decf');d.text((x+11,y+305),f'{l["xp"]:,} XP',font=f(11),fill='#8da6b3')
d.text((44,2201),'30 permanent levels / 6 chapters / Level 30: 63,075 XP / not deployed',font=f(14),fill='#b9c3bc');board.save(ROOT/'previews/V059-COMPLETE-COLLECTION.jpg',quality=94)
compact=Image.new('RGB',(1600,750),(5,11,17));d=ImageDraw.Draw(compact);d.text((35,24),'ANEVUM / COMPACT ICON REVIEW',font=f(24),fill='#e6decb');d.text((35,63),'32px + 64px / separate compact geometry pass',font=f(13),fill='#a0b6bd')
for i in range(30):
 x=30+i%10*157;y=105+i//10*208
 for size,offset in [(64,5),(32,92)]:
  im=Image.open(ROOT/'artwork/compact'/f'level-{i+1:02}-{size}.png');compact.paste(im,(x+offset,y+25+(64-size)//2),im)
 d.text((x+15,y+112),f'LEVEL {i+1:02}',font=f(12),fill='#d4d5cc')
compact.save(ROOT/'previews/V059-COMPACT-ICONS.jpg',quality=94)
# The reel is decoded from the real per-level animation files, not animated stills.
for c in range(6):
 ids=list(range(c*5+1,c*5+6));dec=[]
 for i in ids:dec.append(subprocess.Popen(['ffmpeg','-loglevel','error','-i',str(ROOT/'previews'/f'level-{i:02}-motion.mp4'),'-f','rawvideo','-pix_fmt','rgb24','-'],stdout=subprocess.PIPE))
 target=ROOT/'previews'/f'chapter-{c+1:02}-motion.mp4';enc=subprocess.Popen(['ffmpeg','-loglevel','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s','1280x720','-r','24','-i','-','-an','-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','-movflags','+faststart',str(target)],stdin=subprocess.PIPE)
 for frame in range(72):
  img=Image.new('RGB',(1280,720),(5,11,17));draw=ImageDraw.Draw(img);draw.text((42,40),'ANEVUM / THE FIRST CONTINUANCE',font=f(17),fill='#b5c4c8');draw.text((42,88),f'{["I","II","III","IV","V","VI"][c]} / {M["chapters"][c]}',font=ImageFont.truetype(SER,38),fill='#e7dfca');draw.line((42,157,1238,157),fill='#263b45')
  for j,(i,proc) in enumerate(zip(ids,dec)):
   raw=proc.stdout.read(448*448*3);assert len(raw)==448*448*3;art=Image.frombytes('RGB',(448,448),raw).resize((246,246),Image.Resampling.LANCZOS);img.paste(art,(15+j*251,225));l=M['levels'][i-1];draw.text((25+j*251,498),f'{i:02} / {l["name"]}',font=f(13),fill='#e4ddce');draw.text((25+j*251,526),f'{l["xp"]:,} XP',font=f(12),fill='#8ca4b0')
  draw.line((42,620,1238,620),fill='#263b45');draw.text((42,650),'ACTUAL SHADER MOTION / 24 FPS / EXPRESSIVE INSPECTION / NOT DEPLOYED',font=f(12),fill='#b9b49c');enc.stdin.write(img.tobytes())
 enc.stdin.close();assert enc.wait()==0
 for p in dec:p.stdout.close();p.wait()
 print('CHAPTER_REEL',c+1,flush=True)
listing=ROOT/'previews/reel-list.txt';listing.write_text(''.join(f"file 'chapter-{c:02}-motion.mp4'\n" for c in range(1,7)))
subprocess.run(['ffmpeg','-loglevel','error','-y','-f','concat','-safe','0','-i',str(listing),'-c','copy','-movflags','+faststart',str(ROOT/'previews/V059-ALL-30-MOTION.mp4')],check=True);listing.unlink()
