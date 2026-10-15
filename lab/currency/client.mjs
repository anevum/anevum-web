import {initialState,execute,parseAmount} from './model.mjs';
let state=initialState(), pending=null, last=null, rejections=[];
const $=id=>document.getElementById(id);
const fmt=n=>(n/100).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
function message(text,error=false){$('status').textContent=text;$('status').dataset.error=String(error);}
function render(){
 for(const key of ['owner','collaborator','merchant']) $(key).textContent=fmt(state.balances[key]);
 for(const key of ['reserves','supply','goal']) $(key).textContent=fmt(state[key]);
 $('available').textContent=fmt(state.balances.owner-state.goal);
 $('health').textContent=state.reconciled?'MATCHED / SIMULATED':'PAUSED / TEST INCIDENT';
 $('policy').textContent=`Automation ${state.policy.enabled?'on':'off'} · version ${state.policy.version}`;
 $('spending').textContent=`Transferred this session: ${fmt(state.transferred)} SIM. Per transfer: ${fmt(state.policy.perTransferLimit)} SIM. Session cap: ${fmt(state.policy.sessionTransferLimit)} SIM. Editing permissions does not reset spending.`;
 $('rejections').replaceChildren();
 for(const item of rejections.toReversed()){const li=document.createElement('li');li.textContent=`REJECTED · ${item.type} · ${item.reason}`;$('rejections').append(li);}
 if(!rejections.length){const li=document.createElement('li');li.textContent='No rejected instructions.';$('rejections').append(li);}
$('revoke').disabled=!state.policy.enabled;
 $('repeat').disabled=!last;
 $('recipient').disabled=$('operation').value!=='transfer';
 $('receipts').replaceChildren();
 if(!state.receipts.length){const li=document.createElement('li');li.textContent='No simulated transactions yet.';$('receipts').append(li);}
 for(const receipt of state.receipts.toReversed()){
  const li=document.createElement('li');
  li.textContent=`#${receipt.sequence} · SIMULATION · ${receipt.type.toUpperCase()}${receipt.amount?' · '+fmt(receipt.amount)+' SIM':''} · policy v${receipt.policyVersion}. ${receipt.detail}`;
  $('receipts').append(li);
 }
}
function apply(request){
 try{const previous=state;state=execute(state,request);last=request;render();message(previous===state?'Duplicate request recognized. Nothing moved twice.':state.receipts.at(-1).detail);}
 catch(error){rejections.push({type:request.type,reason:error.message,provenance:'SIMULATION',id:request.id});render();message(error.message,true);}
}
function command(type){apply({id:crypto.randomUUID(),type});}
$('transaction').addEventListener('submit',event=>{
 event.preventDefault();
 try{
  const type=$('operation').value, n=parseAmount($('amount').value);
  pending={id:crypto.randomUUID(),type,amount:n,policyVersion:state.policy.version,...(type==='transfer'?{recipient:$('recipient').value}:{})};
  $('review-copy').textContent=`${type==='issue'?'Issue against simulated backing':type==='redeem'?'Redeem and burn':'Transfer to demo '+pending.recipient}: ${fmt(n)} SIM units. Fee: 0.00 SIM. Permission version: ${pending.policyVersion}. No real money moves.`;
  $('review').hidden=false;$('confirm').focus();
 }catch(error){pending=null;$('review').hidden=true;message(error.message,true);}
});
$('confirm').addEventListener('click',()=>{if(pending){const request=pending;pending=null;$('review').hidden=true;apply(request);}});
$('cancel').addEventListener('click',()=>{pending=null;$('review').hidden=true;message('Instruction canceled.');});
$('repeat').addEventListener('click',()=>{if(last)apply(last);});
$('operation').addEventListener('change',()=>{pending=null;$('review').hidden=true;render();});
$('approve').addEventListener('click',()=>{
 try{
  const value=$('goal-percent').value;
  if(!/^\d{1,3}$/.test(value)||Number(value)>100)throw Error('Choose a whole goal percentage from 0 to 100.');
  pending={id:crypto.randomUUID(),type:'policy',policyVersion:state.policy.version,goalPercent:Number(value),perTransferLimit:parseAmount($('payment-limit').value),sessionTransferLimit:parseAmount($('session-limit').value)};
  $('review-copy').textContent=`Allocate ${pending.goalPercent}% of future simulated receipts. Per-transfer limit: ${fmt(pending.perTransferLimit)} SIM. Session transfer cap: ${fmt(pending.sessionTransferLimit)} SIM. Already transferred: ${fmt(state.transferred)} SIM. Existing goal money is unchanged.`;
  $('review').hidden=false;$('review').scrollIntoView({block:'center',behavior:'instant'});$('confirm').focus();
 }catch(error){pending=null;$('review').hidden=true;message(error.message,true);}
});
for(const [id,type] of [['revoke','revoke'],['release','release-goal'],['pause','pause'],['reconcile','reconcile']]) $(id).addEventListener('click',()=>command(type));
$('reset').addEventListener('click',()=>{state=initialState();pending=null;last=null;rejections=[];$('review').hidden=true;render();message('Simulation reset. No data was stored.');});
$('export').addEventListener('click',()=>{
 const url=URL.createObjectURL(new Blob([JSON.stringify({classification:'SIMULATION_NO_MONETARY_VALUE',session:'ANEVUM.RHEN.BUILD.2026-10-15.001.CURRENCY-SANDBOX',...state,rejectedInstructions:rejections},null,2)],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download='RHEN-simulation.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
render();
