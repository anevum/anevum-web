// Browser-only simulation. Integer minor units; no keys, issuer, chain, or money APIs.
export const LIMIT = 100_000_000;
export function initialState() {
  return {version:1, reserves:0, supply:0, balances:{owner:0, collaborator:0, merchant:0}, goal:0,
    policy:{enabled:false, version:0, goalPercent:20}, reconciled:true, receipts:[], requests:{}};
}
function amount(value) {
  if (!Number.isSafeInteger(value) || value <= 0 || value > LIMIT) throw Error('Enter a positive amount of at most 1,000,000.00.');
  return value;
}
export function parseAmount(value) {
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(String(value))) throw Error('Use a positive amount with up to two decimal places.');
  const [whole, fraction=''] = String(value).split('.');
  return amount(Number(whole)*100 + Number(fraction.padEnd(2,'0')));
}
export function assertState(s) {
  const values=[s.reserves,s.supply,s.goal,...Object.values(s.balances)];
  if (values.some(v=>!Number.isSafeInteger(v)||v<0||v>LIMIT)) throw Error('Ledger limit or balance invariant failed.');
  if (s.reserves!==s.supply || Object.values(s.balances).reduce((a,b)=>a+b,0)!==s.supply || s.goal>s.balances.owner) throw Error('Ledger reconciliation failed.');
}
export function execute(state, request) {
  assertState(state);
  if (!request || typeof request.id!=='string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(request.id)) throw Error('A valid request identifier is required.');
  const types=['issue','transfer','redeem','policy','revoke','release-goal','pause','reconcile'];
  if (!types.includes(request.type)) throw Error('Unsupported operation.');
  const intent={type:request.type, amount:request.amount??null, recipient:request.recipient??null, policyVersion:request.policyVersion??null};
  const fingerprint=JSON.stringify(intent);
  if (Object.hasOwn(state.requests,request.id)) {
    if(state.requests[request.id]!==fingerprint) throw Error('Request identifier already belongs to a different operation.');
    return state;
  }
  if (!state.reconciled && ['issue','transfer','redeem','release-goal'].includes(request.type)) throw Error('Simulation paused: reconcile the records before moving units.');
  if (request.type==='issue' && request.policyVersion!==undefined && request.policyVersion!==state.policy.version) throw Error('Permissions changed. Review and submit a new request.');
  const next=structuredClone(state);
  let detail='';
  if (request.type==='issue') {
    const n=amount(request.amount);
    next.reserves+=n; next.supply+=n; next.balances.owner+=n;
    const allocation=next.policy.enabled?Math.floor(n*next.policy.goalPercent/100):0;
    next.goal+=allocation;
    detail=`Simulated backing received; units issued. ${allocation} minor units earmarked for equipment.`;
  } else if (request.type==='transfer'||request.type==='redeem') {
    const n=amount(request.amount);
    if (request.policyVersion!==state.policy.version) throw Error('Permissions changed. Review and submit a new request.');
    if (n>state.balances.owner-state.goal) throw Error('Insufficient available units. Goal money stays protected until released.');
    next.balances.owner-=n;
    if(request.type==='transfer') {
      if(!['collaborator','merchant'].includes(request.recipient)) throw Error('Choose a supported demonstration recipient.');
      next.balances[request.recipient]+=n;
      detail=`Transferred simulated units to ${request.recipient}.`;
    } else {
      next.supply-=n; next.reserves-=n;
      detail='Units burned and matching simulated backing released. No real payout occurred.';
    }
  } else if(request.type==='policy'||request.type==='revoke') {
    next.policy={...next.policy,enabled:request.type==='policy',version:next.policy.version+1};
    detail=next.policy.enabled?'Approved: earmark 20% of future simulated receipts for equipment.':'Future automatic earmarking revoked. Existing goal funds remain yours.';
  } else if(request.type==='release-goal') {
    detail='Equipment earmark released to available units.'; next.goal=0;
  } else if(request.type==='pause') {
    next.reconciled=false; detail='Injected reconciliation incident. Unit movement paused.';
  } else {
    next.reconciled=true; detail='Local ledger invariants checked; simulated movement resumed.';
  }
  assertState(next);
  next.requests[request.id]=fingerprint;
  next.receipts.push({sequence:next.receipts.length+1,id:request.id,...intent,policyVersion:next.policy.version,provenance:'SIMULATION',detail});
  return next;
}
