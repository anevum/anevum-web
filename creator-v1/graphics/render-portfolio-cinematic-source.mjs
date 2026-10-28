#!/usr/bin/env node
/**
 * Render the new Transcosmic fallback SVG into deterministic high-res source
 * frames, then hand off to the existing approved V136.014 FFmpeg encoder.
 * This creates only OFFLINE, UNREVIEWED candidates. No public assets are
 * written, no traffic or CSP rules are changed and no new runtime is added.
 *
 * Required: rsvg-convert, ffmpeg, ffprobe
 * Example:
 * node creator-v1/graphics/render-portfolio-cinematic-source.mjs \
 *   --out /tmp/anevum-portfolio-frames --frames 48 --fps 24
 */
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync,mkdirSync,statSync,writeFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
const here=dirname(fileURLToPath(import.meta.url));
const root=resolve(here,'../web/public/portfolio');
const source=join(root,'assets','transcosmic-continuum.svg');
const argv=process.argv.slice(2);
const opt=(name,fallback=null)=>{
 const n=argv.indexOf('--'+name);
 if(n<0)return fallback;
 assert.ok(n+1<argv.length&&!argv[n+1].startsWith('--'),'Missing --'+name+' value');
 return argv[n+1];
};
const frames=Number(opt('frames','48'));
const fps=Number(opt('fps','24'));
const out=opt('out');
assert.ok(out&&Number.isInteger(frames)&&frames>=4&&frames<=180,'Required --out and frames 4..180');
assert.ok(Number.isInteger(fps)&&fps>=6&&fps<=30,'FPS must be 6..30');
const target=resolve(out);
assert.ok(!target.startsWith(root),'Never write to public web directory');
assert.ok(!target.includes('/.git/'),'Never generate candidate in repository metadata');
assert.ok(existsSync(source),'Missing original portfolio art');
const svg=readFileSync(source,'utf8');
assert.match(svg,/viewBox="0 0 1920 1080"/);
assert.doesNotMatch(svg.replace('xmlns="http://www.w3.org/2000/svg"',''),/<script|<foreignObject|https?:\/\/|<image|onload=/i);
const run=(command,args)=>{
 const child=spawnSync(command,args,{encoding:'utf8',maxBuffer:8*1024*1024});
 if(child.error)throw child.error;
 assert.equal(child.status,0,command+' failed: '+(child.stderr||child.stdout||'').slice(-2400));
};
mkdirSync(target,{recursive:true});
const image=join(target,'source-master-3840x2160.png');
run('rsvg-convert',['--width','3840','--height','2160','--output',image,source]);
// Smooth cyclical camera drift. Motion parameters return to approximately
// their first-frame positions at the loop boundary; don't claim a true 3D camera
// match or physical geometry change. This is a 2.5D art-direction candidate.
const loop=frames;
const zoom=`1.047+0.012*sin(2*PI*on/${loop})`;
const x=`(iw-iw/zoom)/2+8*sin(2*PI*on/${loop})`;
const y=`(ih-ih/zoom)/2+6*cos(2*PI*on/${loop})`;
const filter=`zoompan=z='${zoom}':x='${x}':y='${y}':d=1:s=1920x1080:fps=${fps},format=rgb24`;
run('ffmpeg',['-hide_banner','-loglevel','error','-nostdin','-y',
 '-loop','1','-framerate',String(fps),'-i',image,
 '-vf',filter,'-frames:v',String(frames),'-start_number','1',
 join(target,'frame-%04d.png')]);
for(let i=1;i<=frames;i++){
 const p=join(target,'frame-'+String(i).padStart(4,'0')+'.png');
 assert.ok(statSync(p).size>1024,'Invalid rendered frame '+i);
}
const report={
 status:'UNREVIEWED_NOT_FOR_PRODUCTION',
 project:'portfolio.anevum.com / canonical anevum.com/portfolio/',
 kind:'Transcosmic static-fallback SVG-to-2.5D camera-study frames (NOT live WebGL scene)',
 source:'creator-v1/web/public/portfolio/assets/transcosmic-continuum.svg',
 sourceSha256:createHash('sha256').update(svg).digest('hex'),
 sourceVector:true,
 masterRaster:{width:3840,height:2160,bytes:statSync(image).size},
 frames, fps, frameWidth:1920,frameHeight:1080,
 cameraMatch:'NONE — artistic 2.5D motion only',
 audio:'NONE — UI ambience is muted',
 requiresOwnerReview:true,requiresProductionCspReview:true,
 runtimeAssetsApproved:false
};
writeFileSync(join(target,'portfolio-source-manifest.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
