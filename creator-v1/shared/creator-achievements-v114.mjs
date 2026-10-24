// Private creator definitions and LOCAL previews. This module never issues awards.
export const ACHIEVEMENT_MOTIFS=Object.freeze(['beacon','orbit','spark','atlas','key','constellation']);
export const ACHIEVEMENT_LIMITS=Object.freeze({active:50,total:100,editsPerHour:40,history:12});
export const ACHIEVEMENT_FIELDS=Object.freeze(['stableKey','title','description','triggerKey','targetCount','visibility','motif','rewardLabel']);
export const UUID_V4=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const CONTROL=/[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/;
export function exactFields(value,keys){
 return value!==null&&typeof value==='object'&&!Array.isArray(value)&&
  Object.keys(value).sort().join('|')===keys.slice().sort().join('|');
}
function text(value,min,max,name){
 if(typeof value!=='string'||value.length>max||CONTROL.test(value)||value.trim().length<min)
  throw new TypeError('Invalid '+name+'.');
 return value.trim();
}
export function normalizeAchievementDraft(input){
 if(!exactFields(input,ACHIEVEMENT_FIELDS))throw new TypeError('Unexpected or missing achievement fields.');
 const stableKey=text(input.stableKey,3,48,'stable key');
 const triggerKey=text(input.triggerKey,3,64,'event key');
 if(!/^[a-z][a-z0-9_]{2,47}$/.test(stableKey))throw new TypeError('Use lowercase letters, numbers and underscores for the stable key.');
 if(!/^[a-z][a-z0-9_.:]{2,63}$/.test(triggerKey))throw new TypeError('Invalid event key.');
 if(!Number.isSafeInteger(input.targetCount)||input.targetCount<1||input.targetCount>100000)
  throw new TypeError('Target must be a whole number from 1 to 100000.');
 if(!['visible','secret'].includes(input.visibility)||!ACHIEVEMENT_MOTIFS.includes(input.motif))
  throw new TypeError('Invalid visibility or emblem motif.');
 return {stableKey,title:text(input.title,3,80,'title'),description:text(input.description,10,600,'description'),
  triggerKey,targetCount:input.targetCount,visibility:input.visibility,motif:input.motif,
  rewardLabel:text(input.rewardLabel,0,120,'reward label')};
}
export function previewAchievement(input,event){
 const draft=normalizeAchievementDraft(input);
 if(!exactFields(event,['triggerKey','count'])||typeof event.triggerKey!=='string'||event.triggerKey.length>64||
  !Number.isSafeInteger(event.count)||event.count<0||event.count>100000)
  throw new TypeError('Invalid simulation event.');
 const count=event.triggerKey===draft.triggerKey?Math.min(event.count,draft.targetCount):0;
 const ready=count>=draft.targetCount,hidden=draft.visibility==='secret'&&!ready;
 return {simulation:true,ready,count,target:draft.targetCount,
  title:hidden?'Undiscovered project mark':draft.title,
  description:hidden?'This project mark is secret until its milestone is reached.':draft.description,
  motif:hidden?null:draft.motif,rewardLabel:ready?draft.rewardLabel:'',platformXp:0};
}
export const ACHIEVEMENT_STARTERS=Object.freeze([
 {label:'Complete a milestone',draft:{stableKey:'first_completion',title:'First Passage',description:'Complete the first chapter of this creation.',triggerKey:'chapter.completed',targetCount:1,visibility:'visible',motif:'beacon',rewardLabel:''}},
 {label:'Discover a secret',draft:{stableKey:'hidden_observatory',title:'Hidden Observatory',description:'Discover the observatory beyond the familiar path.',triggerKey:'secret.observatory',targetCount:1,visibility:'secret',motif:'atlas',rewardLabel:'Observatory explorer title'}},
 {label:'Reach a useful total',draft:{stableKey:'ten_creations',title:'Archive of Ten',description:'Finish ten original creations within this application.',triggerKey:'creation.completed',targetCount:10,visibility:'visible',motif:'constellation',rewardLabel:''}}
].map(x=>Object.freeze({...x,draft:Object.freeze(x.draft)})));
