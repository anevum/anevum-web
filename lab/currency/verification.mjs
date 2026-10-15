import {initialState,execute} from './model.mjs';
export const MAX_EXPORT_BYTES=2*1024*1024;
export const MAX_RECEIPTS=1000;
export const SESSION='ANEVUM.RHEN.BUILD.2026-10-15.001.CURRENCY-SANDBOX';
const classification='SIMULATION_NO_MONETARY_VALUE';
export function createExport(state,rejectedInstructions=[]){
 if(state.receipts.length>MAX_RECEIPTS)throw Error('Export verification supports up to 1,000 accepted instructions. Reset to start another study.');
 const text=JSON.stringify({classification,session:SESSION,...state,rejectedInstructions},null,2);
 if(new TextEncoder().encode(text).length>MAX_EXPORT_BYTES)throw Error('Simulation export exceeds the 2 MiB limit.');
 return text;
}
function same(a,b,depth=0){
 if(depth>12) return false;
 if(a===null||b===null||typeof a!=='object'||typeof b!=='object')return a===b;
 if(Array.isArray(a)!==Array.isArray(b))return false;
 const keys=Object.keys(a),other=Object.keys(b);
 return keys.length===other.length&&keys.every(key=>Object.hasOwn(b,key)&&same(a[key],b[key],depth+1));
}
export function verifyExport(text){
 if(typeof text!=='string'||new TextEncoder().encode(text).length>MAX_EXPORT_BYTES)throw Error('Choose a simulation JSON file no larger than 2 MiB.');
 let data;
 try{data=JSON.parse(text);}catch{throw Error('The selected file is not valid JSON.');}
 if(!data||data.classification!==classification||data.session!==SESSION||data.version!==2)throw Error('Unsupported simulation format. Use a current RHEN simulation export.');
 if(!Array.isArray(data.receipts)||data.receipts.length>MAX_RECEIPTS)throw Error('Receipt history must contain at most 1,000 entries.');
 let replay=initialState();
 for(const [index,receipt] of data.receipts.entries()){
  if(!receipt||receipt.sequence!==index+1||receipt.provenance!=='SIMULATION')throw Error('Receipt order or simulation provenance is invalid.');
  const request={id:receipt.id,type:receipt.type};
  for(const field of ['amount','recipient','goalPercent','perTransferLimit','sessionTransferLimit'])if(receipt[field]!==null)request[field]=receipt[field];
  if(receipt.requestPolicyVersion!==null)request.policyVersion=receipt.requestPolicyVersion;
  try{
   const next=execute(replay,request);
   if(next===replay||!same(next.receipts.at(-1),receipt))throw Error('Receipt does not match its replay.');
   replay=next;
  }catch{throw Error(`Receipt ${index+1} failed deterministic replay. No session data was changed.`);}
 }
 for(const key of Object.keys(replay))if(!same(replay[key],data[key]))throw Error(`Exported ${key} differs from the replayed ledger.`);
 return {acceptedInstructions:replay.receipts.length,supply:replay.supply,reserves:replay.reserves,reconciled:replay.reconciled};
}
