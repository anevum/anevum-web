/**
 * ANEVUM V034 / SUPPORTER COLLECTIBLES
 * Cosmetic, revocable recognition. Never XP, earned levels, moderation power,
 * discovery priority or rights over another creator's work.
 * Tier age is measured from the verified Stripe subscription start, not from
 * checkout redirects or user-provided timestamps; annual plans don't skip tiers.
 */
export const SUPPORTER_SEALS=Object.freeze([
  Object.freeze({id:'signal',name:'First Signal',afterDays:0,detail:'The founding mark of an independent network'}),
  Object.freeze({id:'orbit',name:'Established Orbit',afterDays:90,detail:'Three months since this subscription began'}),
  Object.freeze({id:'constellation',name:'Constellation',afterDays:180,detail:'Six months since this subscription began'}),
  Object.freeze({id:'continuance',name:'Continuance',afterDays:365,detail:'A year since this subscription began'})
]);
export const SUPPORTER_FRAMES=Object.freeze([
  Object.freeze({id:'orbital',name:'Orbital Alloy',afterDays:0}),
  Object.freeze({id:'rose',name:'Roseglass',afterDays:0}),
  Object.freeze({id:'lumen',name:'Lumen',afterDays:0}),
  Object.freeze({id:'stellar',name:'Stellar Crown',afterDays:90}),
  Object.freeze({id:'continuance',name:'Continuance Halo',afterDays:365})
]);
export const SUPPORTER_AURAS=Object.freeze([
  Object.freeze({id:'aurora',name:'Aurora',afterDays:0}),
  Object.freeze({id:'eclipse',name:'Eclipse',afterDays:0}),
  Object.freeze({id:'ember',name:'Ember',afterDays:0}),
  Object.freeze({id:'nebula',name:'Nebula',afterDays:180}),
  Object.freeze({id:'transcosmic',name:'Transcosmic',afterDays:365})
]);
export const DEFAULT_SUPPORTER_APPEARANCE=Object.freeze({
  seal:'signal',frame:'orbital',aura:'aurora'
});
export function tierDays(startedAtMs,now=Date.now()){
  // Without a verified subscription start, only the initial day-zero
  // options are unlocked. Elapsed years are never inferred from user age.
  if(!Number.isSafeInteger(startedAtMs)||startedAtMs<=0||
     startedAtMs>now||!Number.isSafeInteger(now))return 0;
  return Math.max(0,Math.floor((now-startedAtMs)/86400000));
}
export function supporterUnlocks(startedAtMs,now=Date.now()){
  const days=tierDays(startedAtMs,now);
  const seals=SUPPORTER_SEALS.filter(x=>x.afterDays<=days).map(x=>x.id);
  const frames=SUPPORTER_FRAMES.filter(x=>x.afterDays<=days).map(x=>x.id);
  const auras=SUPPORTER_AURAS.filter(x=>x.afterDays<=days).map(x=>x.id);
  return {days,seals,frames,auras,tier:seals.at(-1)};
}
export function validSupporterAppearance(requested,unlocks){
  if(!requested||typeof requested!=='object'||Array.isArray(requested)||!unlocks)return false;
  if(Object.keys(requested).sort().join(',')!=='aura,frame,seal')return false;
  return ['seal','frame','aura'].every((key)=>{
    const value=requested[key];
    const category=key==='seal'?'seals':key==='frame'?'frames':'auras';
    return typeof value==='string'&&unlocks[category].includes(value);
  });
}
export function selectedSupporterAppearance(pref,unlocks){
  if(!unlocks)return {...DEFAULT_SUPPORTER_APPEARANCE};
  return {
    seal:unlocks.seals.includes(pref?.seal)?pref.seal:'signal',
    frame:unlocks.frames.includes(pref?.frame)?pref.frame:'orbital',
    aura:unlocks.auras.includes(pref?.aura)?pref.aura:'aurora'
  };
}
export function rewardCatalog(){
  return {seals:SUPPORTER_SEALS,frames:SUPPORTER_FRAMES,auras:SUPPORTER_AURAS};
}
