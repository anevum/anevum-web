/** Exercises the recovered, existing legacy Worker in a disposable browser.
 * Every document, API response and creator runtime below is synthetic. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../operations/anevum-native-project-player-v006.mjs',import.meta.url),'utf8');
const extract=name=>{
 const match=source.match(new RegExp('const '+name+'=("(?:\\\\.|[^"\\\\])*");'));
 assert.ok(match,'Missing recovered Worker '+name);
 return JSON.parse(match[1]);
};
const css=extract('CSS'),bootstrap=extract('JS');
const id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const projectPath='/projects/alpha_'+id.replaceAll('-','');
const filePath='/api/v1/alpha/projects/'+id+'/file';
const html='<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">'+
 '<style>html,body{margin:0;background:#080e19;color:#f3f0e9;font:16px system-ui}main{margin:16px}h1{font-size:24px}'+css+'</style></head><body>'+
 '<div id="root" class="av9-shell"><main class="portal-project avp-project"><section class="avp-stage avp-stage--external-game" style="transform:translateZ(0);overflow:hidden;contain:paint">'+
 '<div class="avp-stage-top"><span>ANEVUM</span><span class="avp-state">SYNTHETIC</span></div><div class="avp-stage-body">'+
 '<h1>Continuance player acceptance</h1><a class="avp-primary-action" href="/play/'+id+'">Play</a></div></section></main></div></body></html>';

export function legacyFixtureResponse(url,base,demo){
 if(url.origin!==base)return null;
 if(url.pathname===projectPath)return {type:'text/html',body:html};
 if(url.pathname===filePath)return {type:'text/html',body:demo};
 if(url.pathname==='/api/v1/alpha/projects')return {type:'application/json',body:JSON.stringify({projects:[{id,kind:'html'}]})};
 return null;
}

export async function verifyLegacyPlayerContinuity({client,evaluate,screenshot,until,clickText,base,simulateReload=false}){
 const runtime=async expression=>{
  const targets=await client.send('Target.getTargets');
  const target=targets.targetInfos.find(x=>x.type==='iframe'&&x.url.includes(filePath));
  if(target){
   const {sessionId}=await client.send('Target.attachToTarget',{targetId:target.targetId,flatten:true});
   try{return await evaluate(expression,sessionId);}
   finally{await client.send('Target.detachFromTarget',{sessionId});}
  }
  const frames=await client.send('Page.getFrameTree');
  const frame=frames.frameTree.childFrames?.find(x=>x.frame.url.includes(filePath));
  assert.ok(frame,'Synthetic legacy runtime frame required');
  const world=await client.send('Page.createIsolatedWorld',{frameId:frame.frame.id,worldName:'legacy-player-acceptance'});
  const reply=await client.send('Runtime.evaluate',{contextId:world.executionContextId,expression,returnByValue:true});
  if(reply.exceptionDetails)throw Error(reply.exceptionDetails.exception?.description||reply.exceptionDetails.text);
  return reply.result?.value;
 };
 const continues=async action=>{
  assert.equal(await evaluate('document.querySelector(".anp-media iframe")===window.__legacyFrame'),true,'LEGACY_PLAYER_FRAME_REPLACED: '+action);
  assert.equal(await runtime('document.documentElement.dataset.session+":"+document.getElementById("count")?.textContent'),'in-progress:1','LEGACY_PLAYER_STATE_LOST: '+action);
 };
 const closed=()=>evaluate('!document.querySelector(".anp-immersive-host")&&location.hash!=="#play"');
 const results=[];
 for(const topLayer of [true,false])for(const [width,height] of [[1440,900],[390,844],[320,720]]){
  await client.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<641});
  const before=await evaluate('performance.timeOrigin');
  await client.send('Page.navigate',{url:base+projectPath});
  await until(()=>evaluate('document.readyState==="complete"&&performance.timeOrigin!=='+before),'Legacy fixture document');
  await evaluate('HTMLElement.prototype.requestFullscreen=undefined;'+(!topLayer?'HTMLElement.prototype.showPopover=undefined;':''));
  await evaluate(bootstrap);
  await until(()=>runtime('!!document.getElementById("send")'),'Synthetic legacy runtime');
  assert.equal(await evaluate('document.querySelector(".anp-media iframe").getAttribute("sandbox")'),'allow-scripts');
  assert.equal(await evaluate('document.querySelector(".anp-media iframe").getAttribute("referrerpolicy")'),'no-referrer');
  const styles='(()=>{const s=document.querySelector(".avp-stage").style;return ["transform","translate","rotate","scale","perspective","filter","backdrop-filter","contain","overflow-x","overflow-y","isolation","clip-path","will-change"].map(k=>[k,s.getPropertyValue(k),s.getPropertyPriority(k)]);})()';
  const initialStyles=await evaluate(styles);
  await runtime('document.documentElement.dataset.session="in-progress";document.getElementById("send").click()');
  await evaluate('window.__legacyFrame=document.querySelector(".anp-media iframe");true');
  const enter=async()=>{
   await clickText('Expand','button[data-action="expand"]');
   await until(()=>evaluate('!!document.querySelector(".anp-immersive-host")'),'Legacy immersive view');
   await evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
   const layout=await evaluate('(()=>{const h=document.querySelector(".anp-immersive-host"),r=h.getBoundingClientRect(),b=h.querySelector("button[data-action=expand]").getBoundingClientRect();return {width:r.width,height:r.height,x:r.x,y:r.y,buttonVisible:b.width>0&&b.height>0&&b.left>=0&&b.right<=innerWidth+1&&b.top>=0&&b.bottom<=innerHeight+1,topLayer:h.matches(":popover-open")};})()');
   assert.ok(layout.width>=width-1&&layout.height>=height-1&&Math.abs(layout.x)<=1&&Math.abs(layout.y)<=1,JSON.stringify(layout));
   assert.equal(layout.buttonVisible,true,'Exit control must stay visible');
   assert.equal(layout.topLayer,topLayer,'Exercise both top-layer and older-browser fallback');
  };
  await enter();
  if(simulateReload){
   await evaluate('document.querySelector(".anp-media iframe").src=document.querySelector(".anp-media iframe").src');
   await until(()=>runtime('document.getElementById("count")?.textContent==="0"'),'Intentional same-URL reload');
  }
  await continues('expand');
  await screenshot('legacy-player-'+(topLayer?'popover':'css')+'-'+width);
  await clickText('Exit','button[data-action="expand"]');
  await until(closed,'Exit and restore history');await continues('exit button');
  await enter();
  await client.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  await client.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  await until(closed,'Escape and restore history');await continues('Escape');
  await enter();await evaluate('history.back()');
  await until(closed,'Back navigation exits player');await continues('browser Back');
  assert.deepEqual(await evaluate(styles),initialStyles,'Restore original ancestor styles');
  assert.equal(await evaluate('document.body.classList.contains("anp-lock-scroll")'),false);
  assert.equal(await evaluate('document.activeElement===document.querySelector("button[data-action=expand]")'),true,'Restore keyboard focus');
  await clickText('Restart','button[data-action="restart"]');
  await until(()=>runtime('document.getElementById("count")?.textContent==="0"&&!document.documentElement.dataset.session'),'Explicit restart resets runtime');
  results.push({case:'legacy-player-session-'+(topLayer?'popover':'css'),width,height,frameAndStatePreserved:true,escape:true,back:true,restart:true,passed:true});
 }
 return results;
}
