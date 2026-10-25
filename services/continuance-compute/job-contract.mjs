// Offline synthetic state machine ONLY. This module is not a job queue, lease authority,
// identity provider, executor, RPC bridge, or approval-verification boundary.
import {TASKS} from './policy.mjs';

const ID=/^cc_[0-9a-f]{32}$/;
const SHA=/^[0-9a-f]{64}$/;
const LEASE=/^[0-9a-f]{32}$/;
const ACTIVE=new Set(['awaiting_approval','queued','leased','running']);
const FAILURES=new Set(['backend_unavailable','task_timeout','invalid_output']);
const fail=code=>{throw Error('job_contract_'+code);};
const validTime=x=>Number.isSafeInteger(x)&&x>=0;
const freeze=value=>Object.freeze(value);

export function createSyntheticJob(value={}) {
  if(!value||typeof value!=='object'||Array.isArray(value)||
     Object.keys(value).some(key=>!['id','task','inputDigest','createdAt','expiresAt'].includes(key)))fail('unexpected_field');
  const {id,task,inputDigest,createdAt,expiresAt}=value;
  if(!ID.test(id??'')||!Object.hasOwn(TASKS,task)||!SHA.test(inputDigest??''))fail('invalid_input');
  if(!validTime(createdAt)||!validTime(expiresAt)||expiresAt<=createdAt||expiresAt-createdAt>600_000)fail('invalid_expiry');
  return freeze({schema:'anevum.synthetic-job.v0011',id,task,dataClass:'synthetic',
    inputDigest,createdAt,updatedAt:createdAt,expiresAt,state:'awaiting_approval',revision:0,
    approvedAt:null,leaseId:null,leaseUntil:null,resultDigest:null,failureCode:null});
}

export function advanceSyntheticJob(job,action) {
  if(!job||job.schema!=='anevum.synthetic-job.v0011'||!Object.isFrozen(job)||!ACTIVE.has(job.state))fail('terminal_or_invalid');
  if(!action||typeof action!=='object'||Array.isArray(action))fail('invalid_action');
  const type=action.type;
  const eventFields={approve:['type','at'],lease:['type','at','leaseId'],
    start:['type','at','leaseId'],succeed:['type','at','leaseId','resultDigest'],
    fail:['type','at','leaseId','failureCode'],cancel:['type','at'],expire:['type','at']};
  if(!Object.hasOwn(eventFields,type))fail('invalid_event');
  if(Object.keys(action).some(key=>!eventFields[type].includes(key)))fail('unexpected_field');
  if(!validTime(action.at)||action.at<job.updatedAt)fail('invalid_timestamp');
  const expired=action.at>=job.expiresAt;
  const leaseExpired=Boolean(job.leaseUntil!==null&&action.at>=job.leaseUntil);
  if(type==='expire') {
    if(!expired && !leaseExpired)fail('premature_expiry');
    return freeze({...job,state:'expired',updatedAt:action.at,revision:job.revision+1});
  }
  if(expired)fail('expired');
  if(type==='cancel')return freeze({...job,state:'cancelled',updatedAt:action.at,revision:job.revision+1});
  if(type==='approve') {
    if(job.state!=='awaiting_approval')fail('invalid_transition');
    // The CALLER, not this module, must verify any actual human authorization.
    return freeze({...job,state:'queued',approvedAt:action.at,updatedAt:action.at,revision:job.revision+1});
  }
  if(type==='lease') {
    if(job.state!=='queued'||!LEASE.test(action.leaseId??''))fail('invalid_transition');
    return freeze({...job,state:'leased',leaseId:action.leaseId,
      leaseUntil:Math.min(job.expiresAt,action.at+30_000),updatedAt:action.at,revision:job.revision+1});
  }
  if(!LEASE.test(action.leaseId??'')||action.leaseId!==job.leaseId||leaseExpired)fail('invalid_lease');
  if(type==='start') {
    if(job.state!=='leased')fail('invalid_transition');
    return freeze({...job,state:'running',updatedAt:action.at,revision:job.revision+1});
  }
  if(job.state!=='running')fail('invalid_transition');
  if(type==='succeed') {
    if(!SHA.test(action.resultDigest??''))fail('invalid_result_digest');
    return freeze({...job,state:'succeeded',resultDigest:action.resultDigest,updatedAt:action.at,revision:job.revision+1});
  }
  if(!FAILURES.has(action.failureCode))fail('invalid_failure_code');
  return freeze({...job,state:'failed',failureCode:action.failureCode,updatedAt:action.at,revision:job.revision+1});
}
