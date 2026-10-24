/**
 * V136.007 GPU acceptance: compile the actual production GLSL in Chromium,
 * draw four architectural families and capture deterministic viewport samples.
 * SwiftShader is permitted in CI. A missing WebGL2 implementation is recorded
 * as NOT COVERED; separate vector-fallback browser QA remains required.
 */
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import assert from 'node:assert/strict';
import {vertexSource,fragmentSource} from '../web/src/parity/living-world-shaders.ts';
import {sceneProfile} from '../web/src/parity/SceneDirectorV136.ts';

const {chromium}=createRequire(import.meta.url)('playwright');
const out=resolve(process.env.PARITY_QA_OUTPUT||'evidence/parity-v136/spatial-architecture');
mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:[
  '--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader'
]});
const page=await browser.newPage({viewport:{width:960,height:540},deviceScaleFactor:1});
const records=[];
try{
  await page.setContent('<!doctype html><style>html,body{margin:0;background:#020713}canvas{display:block;width:960px;height:540px}</style>');
  const init=await page.evaluate(({vertexSource,fragmentSource})=>{
    const canvas=document.createElement('canvas');
    canvas.width=960;canvas.height=540;document.body.append(canvas);
    const gl=canvas.getContext('webgl2',{alpha:false,depth:false,stencil:false,
      antialias:false,preserveDrawingBuffer:true,powerPreference:'low-power'});
    if(!gl)return {supported:false};
    function compile(type,source){
      const shader=gl.createShader(type);
      if(!shader)throw Error('No WebGL shader handle');
      gl.shaderSource(shader,source);
      gl.compileShader(shader);
      if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader)||'GLSL compile failed');
      return shader;
    }
    const vs=compile(gl.VERTEX_SHADER,vertexSource);
    const fs=compile(gl.FRAGMENT_SHADER,fragmentSource);
    const program=gl.createProgram();
    if(!program)throw Error('No WebGL program');
    gl.attachShader(program,vs);gl.attachShader(program,fs);
    gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program)||'GLSL link failed');
    gl.deleteShader(vs);gl.deleteShader(fs);
    gl.useProgram(program);
    const buffer=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
    const pos=gl.getAttribLocation(program,'a_position');
    if(pos<0)throw Error('Missing position attribute');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
    const uniforms=['u_resolution','u_pointer','u_time','u_density','u_verified',
      'u_tone','u_pulse','u_center','u_shape','u_signature'];
    const locations=uniforms.map(name=>gl.getUniformLocation(program,name));
    if(locations.some(x=>x===null))throw Error('Missing uniform: '+uniforms[locations.findIndex(x=>x===null)]);
    window.__parityShaderTest={gl,locations};
    return {supported:true,version:gl.getParameter(gl.VERSION),
      vendor:gl.getParameter(gl.VENDOR)};
  },{vertexSource,fragmentSource});
  if(!init.supported){
    const report={status:'not-covered',reason:'No WebGL2 context on runner; vector browser fallback tested separately'};
    writeFileSync(join(out,'webgl2-acceptance.json'),JSON.stringify(report,null,2)+'\n');
    console.log('NOT COVERED: WebGL2 shader compilation; vector fallback is still tested');
  }else{
    for(const sector of ['hero','portal','studio','community']){
      const profile=sceneProfile(sector);
      const result=await page.evaluate(({profile})=>{
        const {gl,locations}=window.__parityShaderTest;
        gl.viewport(0,0,960,540);
        gl.uniform2f(locations[0],960,540);
        gl.uniform2f(locations[1],.08,-.1);
        gl.uniform1f(locations[2],1.2);
        gl.uniform1f(locations[3],.55);
        gl.uniform1f(locations[4],1);
        gl.uniform3f(locations[5],...profile.tone);
        gl.uniform1f(locations[6],.12);
        gl.uniform3f(locations[7],...profile.camera);
        gl.uniform4f(locations[8],...profile.silhouette);
        gl.uniform1f(locations[9],profile.signature);
        gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
        gl.finish();
        const error=gl.getError();
        const pixels=new Uint8Array(960*540*4);
        gl.readPixels(0,0,960,540,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
        let checksum=2166136261,lum=0;
        for(let i=0;i<pixels.length;i+=97){
          checksum=Math.imul(checksum^pixels[i],16777619)>>>0;
          if(i%4!==3)lum+=pixels[i];
        }
        return {sector:profile.sector,geometry:profile.geometry,error,checksum,luminance:lum};
      },{profile});
      assert.equal(result.error,0,'WebGL should draw '+sector+' without GL errors');
      assert.ok(result.luminance>0,'Architecture cannot render entirely black');
      records.push(result);
      await page.screenshot({path:join(out,sector+'.png'),animations:'disabled'});
      console.log('PASS WebGL2 '+sector+' '+profile.geometry+' '+result.checksum);
    }
    assert.equal(new Set(records.map(x=>x.checksum)).size,records.length,
      'Different architectural families must render different frames');
    writeFileSync(join(out,'webgl2-acceptance.json'),
      JSON.stringify({status:'compiled-and-rendered',webgl:init,records},null,2)+'\n');
  }
}finally{await browser.close()}
