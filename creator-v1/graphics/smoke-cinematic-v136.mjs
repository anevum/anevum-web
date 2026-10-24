/** Real FFmpeg encode/probe smoke with temporary synthetic footage. Does NOT create shipping website assets. */
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,readdirSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
const root=mkdtempSync(join(tmpdir(),'cinematic-v136-')),input=join(root,'input'),output=join(root,'output');
mkdirSync(input,{recursive:true});
function run(cmd,args){
 const r=spawnSync(cmd,args,{encoding:'utf8',maxBuffer:2_000_000});
 assert.equal(r.status,0,(r.stderr||r.stdout).slice(-1500));
}
try{
 run('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','lavfi','-i','testsrc2=size=640x360:rate=8','-frames:v','6',join(input,'frame-%04d.png')]);
 run(process.execPath,['creator-v1/graphics/encode-cinematic-v136.mjs','--frames',input,'--out',output,'--fps','8']);
 const data=JSON.parse(readFileSync(join(output,'candidate-manifest.json'),'utf8'));
 assert.equal(data.status,'UNREVIEWED_NOT_FOR_PRODUCTION');
 assert.equal(data.source.width,640);assert.equal(data.source.height,360);
 assert.equal(data.sequence.approved,false);assert.equal(data.video.approved,false);
 assert.equal(data.sequence.desktop.frames.length,6);
 assert.equal(data.sequence.mobile.frames.length,6);
 assert.equal(Object.keys(data.video.assets).length,2);
 assert.ok(data.posters.desktop.bytes>0);assert.ok(data.video.assets.webm.bytes>0);
 assert.equal(readdirSync(join(output,'frames','desktop')).length,6);
 const fail=spawnSync(process.execPath,['creator-v1/graphics/encode-cinematic-v136.mjs','--frames',output,'--out',output],{encoding:'utf8'});
 assert.notEqual(fail.status,0,'Invalid input cannot self overwrite');
 console.log('PASS: real FFmpeg desktop/mobile 6-frame encode, video MP4/WebM, offline unreviewed manifest and path defense');
}finally{rmSync(root,{recursive:true,force:true})}
