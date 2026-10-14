// V007 public creator identity projection. No client-provided XP, awards or
// ownership claims. Read-only output contains no member IDs, emails or drafts.
// Public release builder is zero-dependency and flattens this source into
// the public worker. These exact canonical names/rules are mirrored from
// auth/community.mjs and auth/social.mjs; showcase-v007 parity tests MUST
// fail if the authoritative XP curve, issued artifacts or achievements change.
const SHOWCASE_RELICS=[
  'Foundry Spark','Copper Key','Blackglass Seed','Ivory Compass','Iron Moth','Brass Dial','Quartz Spool','Ember Lantern','Prism Mask','Cobalt Coil',
  'Silver Needle','Aether Bell','Obsidian Feather','Sunken Astrolabe','Clockwork Finch','Glass Meridian','Furnace Rose','Amber Tuning Fork','Marble Eye','Paper Engine',
  'Ceramic Ghost','Mercury Hourglass','Saffron Beacon','Gilded Gear','Basalt Crown','Lunar Caliper','Magnetic Rose','Aurora Cartridge','Bronze Orrery','Midnight Atlas',
  'Jade Relay','Tidal Key','Hollow Star','Crystal Loom','Auric Beetle','Sundial Heart','Sable Pendant','Velvet Catalyst','Amber Gyroscope','Echo Prism',
  'Forged Telescope','Arc Lantern','Ivory Sextant','Molten Cipher','Silver Harp','Cobalt Furnace','Night Compass','Dawn Engine','Glass Cathedral','Radiant Crucible',
  'Solar Orrery','Gravity Spindle','Quantum Leaf','Iron Comet','Aether Vessel','Obsidian Crown','Aurora Monolith','Starforge Dial','Celestial Engine','The First Light'
];
const SHOWCASE_ACHIEVEMENTS=Object.freeze([
 Object.freeze({key:'first-signal',name:'First Signal',description:'Rate your first published project',metric:'ratings',target:1,symbol:'✦'}),
 Object.freeze({key:'keen-eye',name:'Keen Eye',description:'Rate five published projects',metric:'ratings',target:5,symbol:'◇'}),
 Object.freeze({key:'portal-guide',name:'Portal Guide',description:'Rate twenty-five published projects',metric:'ratings',target:25,symbol:'✳'}),
 Object.freeze({key:'first-launch',name:'First Launch',description:'Publish your first project after staff review',metric:'publishedProjects',target:1,symbol:'⟡'}),
 Object.freeze({key:'three-builds',name:'Three Builds',description:'Publish three projects after staff review',metric:'publishedProjects',target:3,symbol:'⬡'}),
 Object.freeze({key:'release-steward',name:'Release Steward',description:'Ship a versioned update to a published project',metric:'releases',target:1,symbol:'✺'})
]);
function showcaseProgressionFromXp(raw){
 const amount=Number(raw);
 const xp=Number.isFinite(amount)&&amount>0?Math.min(Number.MAX_SAFE_INTEGER,Math.floor(amount)):0;
 const level=Math.floor(Math.sqrt(xp/20))+1;
 const artifact=level<=SHOWCASE_RELICS.length?SHOWCASE_RELICS[level-1]:null;
 return {level,artifact,artifactEarned:artifact!==null};
}
function showcaseEarnedArtifactsThroughLevel(level){
 if(!Number.isSafeInteger(level)||level<1)return [];
 return SHOWCASE_RELICS.slice(0,Math.min(level,SHOWCASE_RELICS.length));
}
function showcaseDerivedAchievements(stats){
 return SHOWCASE_ACHIEVEMENTS.map(({key,name,description,metric,target,symbol})=>({
  key,name,description,symbol,earned:Number(stats?.[metric]||0)>=target,
  progress:Math.min(target,Math.max(0,Number(stats?.[metric]||0))),target
 }));
}

export const MAX_FEATURED_AWARDS=3;
const SHOWCASE_HANDLE=/^[a-z][a-z0-9_]{2,29}$/i;
const showcaseQuery=(db,sql,params=[])=>{const s=db.prepare(sql);return params.length?s.bind(...params):s;};
async function showcaseRows(db,sql,params=[]){
 const result=await showcaseQuery(db,sql,params).all();
 if(result?.success===false||!Array.isArray(result?.results))throw Error('Public showcase unavailable');
 return result.results;
}
export async function showcaseSchema(db){
 const found=await showcaseRows(db,"SELECT name FROM sqlite_master WHERE type='table' AND name IN ('member_showcase_selections','community_posts')");
 const names=new Set(found.map(x=>x.name));
 return {selections:names.has('member_showcase_selections'),posts:names.has('community_posts')};
}
const SHOWCASE_APPROVED_PROJECT="EXISTS(SELECT 1 FROM projects p WHERE p.owner_member_id=c.member_id AND p.status='published' AND julianday(p.published_at)<=julianday('now'))";
const SHOWCASE_APPROVED_POST="EXISTS(SELECT 1 FROM community_posts cp WHERE cp.author_member_id=c.member_id AND cp.status='published' AND julianday(cp.published_at)<=julianday('now'))";
export function publicSelection(saved,stats){
 const progression=showcaseProgressionFromXp(stats.xp);
 const achievements=showcaseDerivedAchievements(stats);
 const earned=achievements.filter(a=>a.earned);
 const artifacts=showcaseEarnedArtifactsThroughLevel(progression.level);
 let awardKeys=[];
 try{
  const decoded=JSON.parse(saved?.award_keys_json??'[]');
  if(Array.isArray(decoded)&&decoded.length<=MAX_FEATURED_AWARDS&&decoded.every(x=>typeof x==='string'))
   awardKeys=decoded;
 }catch{}
 const unique=new Set();
 const featuredAwards=awardKeys.filter(key=>{
   if(unique.has(key)||!earned.some(a=>a.key===key))return false;
   unique.add(key);return true;
 }).map(key=>{
  const {name,description}=earned.find(a=>a.key===key);
  return {key,name,description};
 });
 const equippedArtifact=typeof saved?.artifact_key==='string'&&artifacts.includes(saved.artifact_key)
  ?{name:saved.artifact_key,series:'SERIES ONE'}:null;
 return {level:progression.level, currentArtifact:progression.artifactEarned?progression.artifact:null,
  equippedArtifact,featuredAwards,earnedAwardCount:earned.length};
}
export async function readPublicShowcase(db,handle,schema){
 if(!SHOWCASE_HANDLE.test(handle))return null;
 const safeSchema=schema||await showcaseSchema(db);
 if(!safeSchema.selections)return null; // No consent store means no public member progression.
 const conditions=safeSchema.posts?'('+SHOWCASE_APPROVED_PROJECT+' OR '+SHOWCASE_APPROVED_POST+')':SHOWCASE_APPROVED_PROJECT;
 const found=await showcaseRows(db,`SELECT c.member_id AS id,c.handle FROM creator_profiles c
 LEFT JOIN member_accounts a ON a.id=c.member_id
 WHERE c.handle=? COLLATE NOCASE AND c.status='active'
 AND a.status='active'
 AND ${conditions} LIMIT 1`,[handle]);
 const creator=found[0];if(!creator)return null;
 const entries=await showcaseRows(db,'SELECT artifact_key,award_keys_json,is_public FROM member_showcase_selections WHERE member_id=?',[creator.id]);
 const saved=entries[0]||null;
 if(!saved||Number(saved.is_public)!==1)return null; // Positive opt-in only.
 const [ratings,publications,releases,xp]=await Promise.all([
  showcaseRows(db,"SELECT COUNT(*) AS n FROM community_project_votes WHERE member_id=? AND status='active'",[creator.id]),
  showcaseRows(db,`SELECT COUNT(*) AS n FROM projects p JOIN creator_profiles c ON c.member_id=p.owner_member_id
      WHERE p.owner_member_id=? AND p.status='published' AND c.status='active'
      AND julianday(p.published_at)<=julianday('now')`,[creator.id]),
  showcaseRows(db,`SELECT COUNT(*) AS n FROM project_releases r JOIN projects p ON p.id=r.project_id
      JOIN creator_profiles c ON c.member_id=p.owner_member_id WHERE p.owner_member_id=?
      AND p.status='published' AND c.status='active' AND julianday(p.published_at)<=julianday('now')`,[creator.id]),
  showcaseRows(db,'SELECT COALESCE(SUM(amount),0) AS n FROM community_xp_events WHERE member_id=?',[creator.id])
 ]);
 const stats={ratings:Number(ratings[0]?.n||0),publishedProjects:Number(publications[0]?.n||0),
  releases:Number(releases[0]?.n||0),xp:Number(xp[0]?.n||0)};
 return {handle:creator.handle,...publicSelection(saved,stats)};
}
/** One bounded SQL aggregation for at most 10 author identities.
 * Never issues one database roundtrip per post or exposes account IDs publicly.
 */
export async function readPublicShowcases(db,handles){
 const wanted=[...new Set(handles.map(x=>x.toLowerCase()).filter(x=>SHOWCASE_HANDLE.test(x)))].slice(0,10);
 if(!wanted.length)return {};
 const schema=await showcaseSchema(db);
 if(!schema.selections)return {}; // Not migrated = no public reveal.
 const placeholders=wanted.map(()=>'?').join(',');
 const publishedPost=schema.posts?` OR EXISTS(SELECT 1 FROM community_posts cp
    WHERE cp.author_member_id=c.member_id AND cp.status='published'
      AND julianday(cp.published_at)<=julianday('now'))`:'';
 const found=await showcaseRows(db,`SELECT c.member_id AS id,c.handle,
   (SELECT COUNT(*) FROM community_project_votes v
      WHERE v.member_id=c.member_id AND v.status='active') AS ratings,
   (SELECT COUNT(*) FROM projects p
      WHERE p.owner_member_id=c.member_id AND p.status='published'
        AND julianday(p.published_at)<=julianday('now')) AS publishedProjects,
   (SELECT COUNT(*) FROM project_releases r JOIN projects p ON p.id=r.project_id
      WHERE p.owner_member_id=c.member_id AND p.status='published'
        AND julianday(p.published_at)<=julianday('now')) AS releases,
   (SELECT COALESCE(SUM(x.amount),0) FROM community_xp_events x
      WHERE x.member_id=c.member_id) AS xp
   FROM creator_profiles c JOIN member_accounts a ON a.id=c.member_id
   WHERE c.status='active' AND a.status='active'
    AND c.handle COLLATE NOCASE IN (${placeholders})
    AND (EXISTS(SELECT 1 FROM projects p
      WHERE p.owner_member_id=c.member_id AND p.status='published'
      AND julianday(p.published_at)<=julianday('now'))${publishedPost})
   LIMIT 10`,wanted);
 const saved=new Map();
 if(schema.selections&&found.length){
  const ids=found.map(row=>row.id);
  const selected=await showcaseRows(db,`SELECT member_id,artifact_key,award_keys_json,is_public
    FROM member_showcase_selections WHERE member_id IN (${ids.map(()=>'?').join(',')})`,ids);
  for(const entry of selected)saved.set(entry.member_id,entry);
 }
 const items=Object.create(null);
 for(const row of found){
  const preference=saved.get(row.id)||null;
  if(!preference||Number(preference.is_public)!==1)continue;
  const {id:_,...stats}=row;
  const handle=String(row.handle).toLowerCase();
  items[handle]={handle,...publicSelection(preference,stats)};
 }
 return items;
}
