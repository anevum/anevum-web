"""Guarded, local-only installer for V060 small-format V062 fallback posters.
This never contacts Cloudflare or member APIs. Dry-run is the default.
"""
from pathlib import Path
import argparse,hashlib,json,io
from PIL import Image

SESSION='ANEVUM.WEB.BUILD.2026-10-17.009.EVOLUTION-MICRO-BADGES'
DEFAULT_SOURCE=Path(__file__).resolve().parents[1]/'artwork/micro'

def install(source,target,apply=False,backup=None):
    source,target=Path(source),Path(target)
    if apply and (backup is None or Path(backup).resolve()==target.resolve()):
        raise ValueError('An independent backup directory is required with --apply')
    original=[]
    new=[]
    for level in range(1,31):
        s=source/f'level-{level:02}-128.webp'
        d=target/f'level-{level:02}-compact-128.png'
        if not s.is_file() or not d.is_file():
            raise FileNotFoundError(f'Missing level {level:02} source/fallback; build the V062 30-level assets first')
        with Image.open(s) as image:
            art=image.convert('RGBA')
        if art.size!=(128,128) or not art.getchannel('A').getbbox():
            raise ValueError(f'Invalid micro artwork level {level}')
        if any(art.getpixel(p)[3]!=0 for p in ((0,0),(0,127),(127,0),(127,127))):
            raise ValueError(f'Nontransparent border in level {level}')
        dst=io.BytesIO();art.save(dst,format='PNG',optimize=True)
        old=d.read_bytes();content=dst.getvalue()
        if hashlib.sha256(old).digest()==hashlib.sha256(content).digest():
            raise ValueError(f'Unchanged poster level {level}; check V060 source quality')
        original.append((d,old));new.append((d,content))
    if apply:
        backup=Path(backup)
        backup.mkdir(parents=True,exist_ok=True)
        if any((backup/p.name).exists() for p,_ in original):
            raise FileExistsError('Backup already has poster files; choose a new empty directory')
        for p,content in original:(backup/p.name).write_bytes(content)
        for p,content in new:
            temp=p.with_suffix(p.suffix+'.v060-temp')
            temp.write_bytes(content);temp.replace(p)
    return {'session':SESSION,'status':'applied' if apply else 'dry-run',
            'assetCount':30,'accountWrites':False,'nativeWebGLUnchanged':True,
            'assets':[{'name':d.name,'newSHA256':hashlib.sha256(content).hexdigest(),
                       'bytes':len(content)} for d,content in new]}

if __name__=='__main__':
    p=argparse.ArgumentParser()
    p.add_argument('--source',type=Path,default=DEFAULT_SOURCE)
    p.add_argument('--target',type=Path,required=True)
    p.add_argument('--apply',action='store_true')
    p.add_argument('--backup-dir',type=Path)
    a=p.parse_args()
    print(json.dumps(install(a.source,a.target,a.apply,a.backup_dir),indent=2))
