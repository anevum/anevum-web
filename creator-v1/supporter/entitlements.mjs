/** Historical provider-neutral entitlement projection. No paid entitlement is active. */
export const SUPPORTER_PLAN=Object.freeze({id:'founding-supporter',available:false});
export function supporterState(){return {supporter:false,state:'retired',until:null};}
export function publicSupporterView(){return {supporter:false,kind:null};}
export function allowedPlan(){return null;}
