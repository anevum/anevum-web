import test from 'node:test';
import assert from 'node:assert/strict';
import {advanceControllerRepeat, controllerTargetScore, nextConsoleStationIndex, noControllerRepeat, readControllerIntent} from '../web/src/parity/controller-input-v136.ts';
import {isSiteLinkSelected} from '../web/src/lib/site-navigation.ts';
import {readFileSync} from 'node:fs';

const gamepad = ({buttons={},axes=[0,0],mapping='standard'}={}) => ({
  mapping, axes, buttons:Array.from({length:17},(_,i)=>({pressed:Boolean(buttons[i]),value:buttons[i]?1:0}))
});
test('standard browser gamepad controls map D-pad, left stick, and A without browser-owned back shortcuts',()=>{
  for(const [button,direction] of [[12,'up'],[13,'down'],[14,'left'],[15,'right']]){
    assert.deepEqual(readControllerIntent(gamepad({buttons:{[button]:true}})),{direction,select:false});
  }
  assert.deepEqual(readControllerIntent(gamepad({axes:[.85,-.1],buttons:{0:true}})),{direction:'right',select:true});
  assert.deepEqual(readControllerIntent(gamepad({axes:[.2,-.85]})),{direction:'up',select:false});
  assert.deepEqual(readControllerIntent(gamepad({axes:[.3,.3]})),{direction:null,select:false});
  assert.deepEqual(readControllerIntent(gamepad({mapping:'',buttons:{0:true,15:true}})),{direction:null,select:false});
  assert.deepEqual(readControllerIntent(gamepad({buttons:{1:true,2:true,3:true,4:true,5:true}})),{direction:null,select:false},'browser shortcuts are not remapped');
});
test('directional repeat is bounded and releases without delayed navigation',()=>{
  let v=advanceControllerRepeat(noControllerRepeat,'right',1000);
  assert.equal(v.fire,true);
  v=advanceControllerRepeat(v.state,'right',1150);assert.equal(v.fire,false);
  v=advanceControllerRepeat(v.state,'right',1360);assert.equal(v.fire,true);
  v=advanceControllerRepeat(v.state,'right',1430);assert.equal(v.fire,false);
  v=advanceControllerRepeat(v.state,'up',1440);assert.equal(v.fire,true,'direction change acts immediately');
  v=advanceControllerRepeat(v.state,null,1490);assert.equal(v.fire,false);
  v=advanceControllerRepeat(v.state,'right',1500);assert.equal(v.fire,true,'fresh press works immediately');
});
test('spatial target scoring follows real DOM geometry rather than invented routes',()=>{
  const from={left:100,top:100,width:80,height:40};
  const nearRight={left:210,top:105,width:80,height:40};
  const farRight={left:550,top:100,width:80,height:40};
  const below={left:110,top:220,width:80,height:40};
  assert.ok(controllerTargetScore(from,nearRight,'right')<controllerTargetScore(from,farRight,'right'));
  assert.equal(controllerTargetScore(from,nearRight,'left'),Infinity);
  assert.ok(Number.isFinite(controllerTargetScore(from,below,'down')));
  assert.equal(controllerTargetScore(from,below,'up'),Infinity);
});

test('controller Wayfinder follows native station order on any dock orientation',()=>{
  const count=5; // Arrival / Discover / Commons / Creators / Studio
  assert.equal(nextConsoleStationIndex(0,count,'right'),1);
  assert.equal(nextConsoleStationIndex(0,count,'down'),1);
  assert.equal(nextConsoleStationIndex(1,count,'left'),0);
  assert.equal(nextConsoleStationIndex(1,count,'up'),0);
  assert.equal(nextConsoleStationIndex(4,count,'right'),0,'Forward movement wraps');
  assert.equal(nextConsoleStationIndex(0,count,'left'),4,'Backward movement wraps');
  for(const invalid of [-1,5,1.5,Number.NaN])
    assert.equal(nextConsoleStationIndex(invalid,count,'right'),null,'Invalid source does not move focus');
  assert.equal(nextConsoleStationIndex(0,0,'right'),null);
});

test('Wayfinder keeps one canonical selection on nested Studio and public section routes',()=>{
 for(const [path,section] of [
  ['/','/'],['/discover','/discover'],['/community/posts/'+ 'a'.repeat(32),'/community'],
  ['/community/threads/'+ 'b'.repeat(32),'/community'],['/creators/nova_demo','/creators'],
  ['/studio/packages/new','/studio'],['/studio/records','/studio']
 ]){
  assert.equal(isSiteLinkSelected(path,section),true,path+' should belong to '+section);
 }
 for(const path of ['/community-other','/creators-archive','/studiofake','/create-anything']){
  assert.equal(['/community','/creators','/studio'].some(section=>isSiteLinkSelected(path,section)),false,
   path+' must not be treated as a canonical section');
 }
 assert.equal(isSiteLinkSelected('/projects/package/'+'a'.repeat(36),'/studio'),false);
 const source=readFileSync(new URL('../web/src/parity/ConsoleWayfinderV136.tsx',import.meta.url),'utf8');
 assert.match(source,/stations\.findIndex\(s=>isSiteLinkSelected\(location\.pathname,s\.to\)\)/);
});
