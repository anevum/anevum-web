#!/usr/bin/env node
/** V136.014 Cinematic offline encoder: renders are inputs, no external services.
 * Usage: node creator-v1/graphics/encode-cinematic-v136.mjs --frames DIR --out DIR [--fps 24] [--skip-video]
 * Output is CANDIDATE ONLY; never edits public manifests or publishes content.
 */
import assert from 'node:assert/strict';
import {readdirSync,readFileSync,mkdirSync,statSync,writeFileSync,existsSync} from 'node:fs';
import {join,resolve,relative,sep} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const argv=process.argv.slice(2);
function option(name,fallback=null){
  const at=argv.indexOf('--'+name);
  if(at<0)return fallback;
  assert.ok(at+1<argv.length&&!argv[at+1].startsWith('--'),'Missing value for --'+name);
  return argv[at+1];
}
const skipVideo=argv.includes('--skip-video'),dir=option('frames'),target=option('out');
assert.ok(dir&&target,'Required: --frames DIR --out DIR');
const fps=Number(option('fps','24'));
assert.ok(Number.isInteger(fps)&&fps>=6&&fps<=30,'FPS must be 6..30');
const source=resolve(dir),out=resolve(target);
assert.notEqual(source,out,'Input and output must be separate');
assert.ok(!out.startsWith(source+sep),'Output must not be inside frame directory');
const inputs=readdirSync(source).filter(x=>/^frame-\d{4}\.png$/.test(x)).sort();
assert.ok(inputs.length>=4&&inputs.length<=180,'Only 4..180 numbered source frames');
inputs.forEach((name,i)=>assert.equal(name,'frame-'+String(i+1).padStart(4,'0')+'.png','Frame order must be continuous'));
const first=join(source,inputs[0]);
function command(bin,args){
  const result=spawnSync(bin,args,{encoding:'utf8',maxBuffer:1024*1024*3});
  if(result.error)throw result.error;
  assert.equal(result.status,0,bin+' failed: '+(result.stderr||result.stdout||'unknown').slice(-2500));
}
function probe(path){
 const r=spawnSync('ffprobe',['-v','error','-select_streams','v:0','-show_entries','stream=width,height,codec_name,nb_frames','-of','json',path],{encoding:'utf8'});
 assert.equal(r.status,0,'ffprobe failed for '+path+': '+r.stderr);
 const stream=JSON.parse(r.stdout).streams?.[0];assert.ok(stream?.width>0&&stream.height>0,'No visual media');
 return stream;
}
const raw=probe(first); assert.ok(raw.width>=320&&raw.height>=180,'Source resolution too small');
const shape=raw.width/raw.height;assert.ok(shape>1.1&&shape<2.5,'Expected cinematic landscape source');
const sourceHash=createHash('sha256');
for(const name of inputs)sourceHash.update(createHash('sha256').update(readFileSync(join(source,name))).digest());
mkdirSync(out,{recursive:true});
const sha256=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const record=path=>({path:relative(out,path).replaceAll('\\','/'),bytes:statSync(path).size,sha256:sha256(path)});
const profiles={desktop:{width:1536,height:864,quality:72,budget:8_500_000},mobile:{width:768,height:432,quality:66,budget:3_800_000}};
const makeScale=cfg=>'scale='+cfg.width+':'+cfg.height+':force_original_aspect_ratio=decrease:flags=lanczos,pad='+cfg.width+':'+cfg.height+':(ow-iw)/2:(oh-ih)/2';
const pattern=join(source,'frame-%04d.png');
const posters={},sequences={};
for(const [tier,cfg] of Object.entries(profiles)){
 const poster=join(out,'poster-'+tier+'.webp');
 command('ffmpeg',['-hide_banner','-loglevel','error','-nostdin','-y','-i',first,'-vf',makeScale(cfg),'-frames:v','1','-c:v','libwebp','-quality',String(cfg.quality),'-compression_level','5',poster]);
 assert.equal(probe(poster).width,cfg.width);posters[tier]={...record(poster),width:cfg.width,height:cfg.height};
 const frameDir=join(out,'frames',tier);mkdirSync(frameDir,{recursive:true});
 command('ffmpeg',['-hide_banner','-loglevel','error','-nostdin','-y','-framerate',String(fps),'-start_number','1','-i',pattern,'-vf',makeScale(cfg),'-frames:v',String(inputs.length),'-c:v','libwebp','-quality',String(cfg.quality),'-compression_level','5','-start_number','1',join(frameDir,'frame-%03d.webp')]);
 const frames=inputs.map((_,i)=>record(join(frameDir,'frame-'+String(i+1).padStart(3,'0')+'.webp')));
 const bytes=frames.reduce((total,f)=>total+f.bytes,0);
 assert.ok(bytes<=cfg.budget,'Sequence exceeds '+tier+' transfer budget: '+bytes+'/'+cfg.budget);
 sequences[tier]={width:cfg.width,height:cfg.height,bytes,frames};
}
const videos={};if(!skipVideo){
 const cfg={width:1280,height:720};
 for(const [kind,options] of Object.entries({
   mp4:['-c:v','libx264','-preset','medium','-crf','25','-pix_fmt','yuv420p','-movflags','+faststart'],
   webm:['-c:v','libvpx-vp9','-deadline','good','-cpu-used','4','-b:v','0','-crf','35','-pix_fmt','yuv420p']
 })){
  const path=join(out,'cinematic-'+kind+'.'+kind);
  command('ffmpeg',['-hide_banner','-loglevel','error','-nostdin','-y','-framerate',String(fps),'-start_number','1','-i',pattern,
   '-vf',makeScale(cfg),'-frames:v',String(inputs.length),'-an',...options,path]);
  assert.ok(statSync(path).size<12_000_000,'Video exceeds 12MB budget');
  const info=probe(path);assert.equal(info.width,cfg.width);assert.equal(info.height,cfg.height);
  videos[kind]={...record(path),width:info.width,height:info.height,codec:info.codec_name};
 }
}
const cameraFile=join(source,'camera-manifest.json'),camera=existsSync(cameraFile)?JSON.parse(readFileSync(cameraFile,'utf8')):null;
const report={
 schema:'anevum.cinematic.candidate.v1',status:'UNREVIEWED_NOT_FOR_PRODUCTION',
 generator:'creator-v1/graphics/encode-cinematic-v136.mjs',provenance:'ANEVUM authored render input (verify rights/source before approval)',
 source:{width:raw.width,height:raw.height,count:inputs.length,frameSourceDigest:sourceHash.digest('hex'),camera},
 fps,posters,sequence:{approved:false,count:inputs.length,desktop:sequences.desktop,mobile:sequences.mobile},
 video:{approved:false,assets:videos},
 safety:{noRemoteMedia:true,noLivePublicClaims:true,requiresArtReview:true,requiresVideoCspReview:true}
};
writeFileSync(join(out,'candidate-manifest.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,count:inputs.length,fps,source:report.source,posters,videos,sequenceBytes:{desktop:sequences.desktop.bytes,mobile:sequences.mobile.bytes}},null,2));
