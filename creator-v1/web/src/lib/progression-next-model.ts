/** Review-only proposals. No client event can award XP or unlock artwork. */
export type Track = 'discovery' | 'community' | 'creation' | 'collaboration';
export type Activity = Readonly<{
  id:string; title:string; track:Track; xp:number; limit:string;
  evidence:string; detail:string; href:string; stage:'proposal'|'staging-only';
}>;
export const TRACKS: ReadonlyArray<{id:Track;name:string;verb:string}> = [
  {id:'discovery',name:'Discovery',verb:'Explore & understand'},
  {id:'community',name:'Community',verb:'Listen & help'},
  {id:'creation',name:'Creation',verb:'Make & release'},
  {id:'collaboration',name:'Collaboration',verb:'Build together'}
];
export const ACTIVITIES:ReadonlyArray<Activity> = [
  {id:'rating',title:'Give an honest rating',track:'discovery',xp:2,limit:'Five first-time ratings per UTC day.',evidence:'Published third-party project; unique eligible rating.',detail:'Changing a rating never pays again. Creator V1 staging only; not canonical member XP.',href:'/discover',stage:'staging-only'},
  {id:'save',title:'Start a personal library',track:'discovery',xp:0,limit:'A personal milestone, not an XP source.',evidence:'An authentic saved project.',detail:'Save something worth returning to. No points for collecting links.',href:'/saved',stage:'proposal'},
  {id:'review',title:'Write a useful field report',track:'discovery',xp:15,limit:'Two accepted reports per UTC day; once per project.',evidence:'Independently reviewed, actionable, non-self feedback.',detail:'Explain what you examined, what worked and what could improve. Length alone does not qualify.',href:'/discover',stage:'proposal'},
  {id:'first-review',title:'Complete your first field report',track:'discovery',xp:25,limit:'One first-report bonus per member.',evidence:'First independently accepted substantive project review.',detail:'A proposed one-time bonus, separate from the ordinary review award.',href:'/discover',stage:'proposal'},
  {id:'bug',title:'Reproduce a real problem',track:'discovery',xp:30,limit:'Three accepted distinct reports per UTC week.',evidence:'Reproducible issue independently confirmed by the review team.',detail:'Clear steps, expected behavior and actual behavior. Duplicate reports do not earn again.',href:'/community',stage:'proposal'},
  {id:'accessibility',title:'Remove an accessibility barrier',track:'discovery',xp:40,limit:'Two accepted findings per UTC week.',evidence:'Verified, nonduplicated accessibility finding.',detail:'Help a project work for more people without requiring disclosure of a disability.',href:'/community',stage:'proposal'},
  {id:'collection',title:'Curate a useful collection',track:'discovery',xp:40,limit:'One independently accepted collection per calendar month.',evidence:'Original commentary and distinct real projects.',detail:'Explain why the works belong together. Raw saves and copied lists do not qualify.',href:'/discover',stage:'proposal'},
  {id:'thread',title:'Open a thoughtful conversation',track:'community',xp:25,limit:'First qualifying discussion only.',evidence:'Independently approved published discussion.',detail:'An original question, research note or useful discussion, not an empty greeting.',href:'/community',stage:'proposal'},
  {id:'reply',title:'Give your first helpful response',track:'community',xp:20,limit:'First qualifying response only.',evidence:'Independently approved helpful response to another member.',detail:'Give a specific answer grounded in the question. Self-replies do not qualify.',href:'/community',stage:'proposal'},
  {id:'answer',title:'Help someone move forward',track:'community',xp:15,limit:'Three accepted answers per week; no first-response double award.',evidence:'Distinct, independently accepted non-self answer.',detail:'Practical guidance matters more than message volume or likes.',href:'/community',stage:'proposal'},
  {id:'solution',title:'Resolve a creator request',track:'community',xp:35,limit:'Once per unique resolved request.',evidence:'Creator confirmation plus independent review.',detail:'Demonstrate what changed and how the problem was resolved.',href:'/community',stage:'proposal'},
  {id:'first-project',title:'Release your first creation',track:'creation',xp:150,limit:'Once; replaces rather than stacks with the ordinary release award.',evidence:'Staff-approved original release, verified ownership and provenance.',detail:'Drafts, uploads and submission alone do not pay. Publication must be verified.',href:'/studio',stage:'proposal'},
  {id:'project',title:'Release another original creation',track:'creation',xp:100,limit:'One additional qualifying release per rolling 14 days.',evidence:'Distinct approved original project; first release excluded.',detail:'Reposts, cosmetic variants and split uploads are not distinct original projects.',href:'/studio',stage:'proposal'},
  {id:'release',title:'Ship a meaningful improvement',track:'creation',xp:60,limit:'Once per project per UTC calendar month.',evidence:'Independently accepted release with meaningful versioned changes.',detail:'A renamed version or metadata edit is not a substantive update.',href:'/studio',stage:'proposal'},
  {id:'tutorial',title:'Teach something useful',track:'creation',xp:40,limit:'Two accepted original tutorials per month.',evidence:'Reviewed guidance, attribution and working examples.',detail:'Make a real technique understandable and usable by someone else.',href:'/community',stage:'proposal'},
  {id:'resource',title:'Share an original resource',track:'creation',xp:75,limit:'Once per distinct accepted resource.',evidence:'Reviewed original template or resource with a clear license.',detail:'A reusable contribution, not an unlicensed upload or duplicate project reward.',href:'/studio',stage:'proposal'},
  {id:'collaboration',title:'Build with another creator',track:'collaboration',xp:75,limit:'Once per distinct verified contribution.',evidence:'Consent-based credit, provenance and independent anti-collusion review.',detail:'Credit the actual work. Mutual endorsements alone do not qualify.',href:'/community',stage:'proposal'},
  {id:'open-source',title:'Contribute to an open project',track:'collaboration',xp:60,limit:'Three verified contributions per month.',evidence:'Accepted upstream contribution, identity link and original work.',detail:'A merge is evidence to review, not automatic proof of value or ownership.',href:'/discover?category=libraries',stage:'proposal'},
  {id:'jam',title:'Finish a creative expedition',track:'collaboration',xp:60,limit:'One qualifying entry per event.',evidence:'Published event rules and independently accepted entry.',detail:'Free participation and clear eligibility. No paid entry, lottery or spending multiplier.',href:'/community',stage:'proposal'}
];
export const EXPEDITIONS = [
  {id:'field',title:'Follow a new signal',subtitle:'Discover a work. Leave a useful observation.',activity:'review',steps:['Find a genuine published project','Try or examine the work','Submit actionable feedback for independent review']},
  {id:'maker',title:'Leave something real',subtitle:'Turn a private draft into an original release.',activity:'first-project',steps:['Prepare original, rights-cleared work','Submit through Creator Studio','Reach independently approved publication']},
  {id:'bridge',title:'Build a bridge',subtitle:'Help a creator solve a real problem.',activity:'solution',steps:['Find a specific creator request','Provide a verifiable solution','Receive confirmation and independent review']}
] as const;
export function selectActivities(track:string,query:string):Activity[]{
  const q=query.trim().toLowerCase().slice(0,100);
  return ACTIVITIES.filter(a=>(track==='all'||a.track===track)&&(!q||[a.title,a.detail,a.evidence].join(' ').toLowerCase().includes(q)));
}
export function threshold(level:number):number{
  if(!Number.isSafeInteger(level)||level<1||level>30)throw Error('Invalid Evolution level');
  return 75*(level-1)**2;
}
export function summarizeProgress(raw:unknown){
  if(!raw||typeof raw!=='object')return null;
  const p=raw as Record<string,unknown>;
  if(!Number.isSafeInteger(p.xp)||Number(p.xp)<0||!Number.isInteger(p.level))return null;
  const xp=Number(p.xp),level=Number(p.level);
  if(level<1||level>30||xp<threshold(level)||(level<30&&xp>=threshold(level+1)))return null;
  const start=threshold(level),next=level===30?null:threshold(level+1);
  if(p.levelStart!==start||p.nextLevel!==next)return null;
  return {xp,level,start,next,percent:next===null?100:Math.floor(100*(xp-start)/(next-start))};
}
export const PACING = [
  {id:'occasional',name:'Occasional reviewer',weeklyXp:15},
  {id:'explorer',name:'Explorer',weeklyXp:40},
  {id:'contributor',name:'Regular contributor',weeklyXp:95},
  {id:'creator',name:'Creator with reviewed releases',weeklyXp:80}
] as const;
export function simulatePacing(weeklyXp:number,weeks:number){
  if(!Number.isFinite(weeklyXp)||weeklyXp<0||!Number.isInteger(weeks)||weeks<0||weeks>5200)throw Error('Invalid simulation');
  const xp=Math.floor(weeklyXp*weeks);
  if(!Number.isSafeInteger(xp))throw Error('Unsafe total');
  return {xp,level:Math.min(30,1+Math.floor(Math.sqrt(xp/75)))};
}
