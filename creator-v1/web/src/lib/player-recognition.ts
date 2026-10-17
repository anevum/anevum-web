import type {EmblemMotif} from './artifact-art';

/**
 * ANEVUM recognition vocabulary V065.
 * Definitions are NOT grants. Only signed-in server ledgers may issue or
 * revoke recognition. Planned definitions remain invisible until issued.
 */
export type BadgeFamily = 'origin'|'community'|'creation'|'discovery'|'collaboration'|'craft'|'stewardship'|'continuance';
export type BadgeDefinition = {
 id:string; name:string; family:BadgeFamily; description:string;
 criterion:string; motif:EmblemMotif; status:'active'|'planned';
};
const b=(id:string,name:string,family:BadgeFamily,description:string,criterion:string,motif:EmblemMotif,status:'active'|'planned'='planned'):BadgeDefinition=>({id,name,family,description,criterion,motif,status});
export const BADGE_CATALOG:Readonly<Record<string,BadgeDefinition>>=Object.freeze(Object.fromEntries([
 // Existing server-issued milestones. They remain earned-only and retain their IDs.
 b('first_signal','First Signal','origin','The first trace left in the Continuance.','First accepted member wall entry','beacon','active'),
 b('world_shaper','World Shaper','origin','An identity made one's own.','Verified introduction, portrait and banner','trinity','active'),
 b('first_orbit','First Orbit','origin','The beginning of a public journey.','First opted-in public profile','atlas'),
 b('returning_signal','Returning Signal','continuance','A presence that returns.','Meaningful activity in four different weeks','chronometer'),
 b('first_thread','First Transmission','community','A conversation worth starting.','First approved discussion','beacon'),
 b('first_reply','First Response','community','An answer sent back across the distance.','First approved reply','spark'),
 b('conversationalist','Open Channel','community','A record of constructive participation.','Ten substantive approved discussions across separate days','lens'),
 b('signal_booster','Signal Booster','community','Helpful introductions that bring creators together.','Five independently endorsed helpful introductions','compass'),
 b('first_creation','First Creation','creation','A first original work shared.','First accepted published original project','launch'),
 b('maker_five','Five Worlds','creation','Five distinct creations brought into view.','Five accepted published original projects','trinity'),
 b('maker_twenty','Architect of Worlds','creation','A lasting collection of original work.','Twenty accepted published original projects, excluding duplicate releases','atlas'),
 b('revision_keeper','Revision Keeper','craft','The discipline of improving real work.','Five meaningful approved project revisions','chronometer'),
 b('first_source','Open Source Signal','creation','A project with usable source and clear attribution.','First verified rights-cleared open-source release','key'),
 b('sound_weaver','Sound Weaver','craft','Original audio in the archive.','First accepted original audio release','spark'),
 b('image_maker','Image Maker','craft','An original visual creation.','First accepted original artwork','light'),
 b('story_teller','Story Keeper','craft','A work of words preserved.','First accepted story or written work','beacon'),
 b('playwright','World in Motion','craft','An interactive experience others can explore.','First accepted playable interactive project','launch'),
 b('first_collection','First Constellation','discovery','Curiosity turned into a personal collection.','First saved public collection','atlas'),
 b('thoughtful_review','Clear-Eyed Critic','discovery','Feedback grounded in detail.','Five helpful creator-acknowledged reviews, anti-farming rules apply','lens'),
 b('pathfinder','Pathfinder','discovery','A discovery others found worth following.','Curated original discovery, reviewed by independent staff','compass'),
 b('first_collab','Shared Orbit','collaboration','A creation with acknowledged co-authors.','First accepted co-created project with confirmed collaborator consent','trinity'),
 b('cross_discipline','Bridge Builder','collaboration','Creative work across disciplines.','Three accepted cross-medium collaborations with verified credits','atlas'),
 b('good_neighbor','Good Neighbor','stewardship','Care for the quality of this community.','Independent review of sustained constructive community support','light'),
 b('accessibility_builder','Open Door','stewardship','Someone made the work easier to access.','Verified accessible improvement to a published project','key'),
 b('archive_keeper','Archive Keeper','continuance','A body of work that has endured.','One year of meaningful approved participation with no punitive activity farming','chronometer'),
 b('annual_return','Another Orbit','continuance','Another year of continuing to make.','An annual participation anniversary with qualifying contribution','atlas')
].map(x=>[x.id,x])));

export type DistinctionKind='ribbon'|'medal';
export type DistinctionDefinition={
 id:string;kind:DistinctionKind;name:string;description:string;
 criterion:string;authority:'rules-reviewed'|'independent-panel';accent:'copper'|'silver'|'violet'|'gold'|'coral';
};
const d=(id:string,kind:DistinctionKind,name:string,description:string,criterion:string,authority:DistinctionDefinition['authority'],accent:DistinctionDefinition['accent']):DistinctionDefinition=>({id,kind,name,description,criterion,authority,accent});
export const DISTINCTION_CATALOG:Readonly<Record<string,DistinctionDefinition>>=Object.freeze(Object.fromEntries([
 d('steadfast_signal','ribbon','Steadfast Signal','Sustained constructive presence across the community.','Meaningful participation sustained for a full year','rules-reviewed','silver'),
 d('makers_service','ribbon','Maker\'s Service','A long record of useful original releases.','Sustained verified contributions and maintained projects over multiple cycles','rules-reviewed','copper'),
 d('open_hand','ribbon','The Open Hand','Consistent generosity with knowledge and tools.','Repeated, verifiable public-good contributions independently confirmed','rules-reviewed','coral'),
 d('bridge_of_worlds','ribbon','Bridge of Worlds','Collaboration that brought distinct creative communities together.','Significant sustained cross-discipline collaboration','independent-panel','violet'),
 d('stewards_watch','ribbon','Steward\'s Watch','Care for the community while entrusted with its safety.','Reviewable and audited service; moderator role alone is insufficient','independent-panel','silver'),
 d('living_archive','ribbon','Living Archive','A body of original work still useful to others.','Long-lived maintained and accessible public creative archive','independent-panel','gold'),
 d('first_light','medal','First Light','An exceptional original creation that opened a new direction.','Rare, independently evaluated creative breakthrough','independent-panel','coral'),
 d('constellation_laureate','medal','Constellation Laureate','An outstanding collaborative work of lasting consequence.','Demonstrated transformative collaboration, independent jury','independent-panel','violet'),
 d('continuance_medal','medal','The Continuance','Extraordinary lasting contribution to ANEVUM and its people.','Documented multi-year service and exceptional community impact','independent-panel','gold'),
 d('atlas_medal','medal','Atlas of the Commons','A body of public knowledge that helped many others create.','Exceptional verified teaching or open research contribution','independent-panel','silver'),
 d('worldbuilder_medal','medal','Worldbuilder','An original world of outstanding craft and influence.','Peer-reviewed, demonstrably exceptional original work','independent-panel','gold'),
 d('lightkeeper_medal','medal','Lightkeeper','An exceptional act of inclusive and responsible stewardship.','Independent community safety and service evaluation','independent-panel','coral')
].map(x=>[x.id,x])));

export type EarnedBadge={id:string;earnedAt:number};
export type DisplayMode='automatic'|'curated'|'hidden';
export type BadgeDisplay={mode:DisplayMode;ids?:string[]};
export type PublicDistinctions={medals:string[];ribbons:string[]};
export type PlayerAura='none'|'aurora'|'eclipse'|'ember'|'nebula'|'transcosmic';
export type ConstellationIdentity={slug:string;name:string;emblem:string};

const validId=(id:unknown):id is string=>typeof id==='string'&&/^[a-z][a-z0-9_]{1,47}$/.test(id);
/** Never promotes an unearned badge from a manually curated list. */
export function selectFeaturedBadges(featured:string[],earned?:EarnedBadge[],display?:BadgeDisplay):string[]{
 if(display?.mode==='hidden')return [];
 const saved=Array.isArray(featured)?featured.filter(validId):[];
 // V061 public payload only carries the already server-vetted selected IDs.
 if(!Array.isArray(earned))return [...new Set(saved)].slice(0,3);
 const ordered=earned.filter(row=>row&&validId(row.id)&&Number.isSafeInteger(row.earnedAt)&&row.earnedAt>0)
   .sort((a,z)=>z.earnedAt-a.earnedAt||a.id.localeCompare(z.id));
 const held=new Set(ordered.map(row=>row.id));
 if(display?.mode==='curated')return [...new Set(display.ids||[])].filter(id=>validId(id)&&held.has(id)).slice(0,3);
 return ordered.filter(row=>!display||display.mode==='automatic').map(row=>row.id)
   .filter((id,index,all)=>all.indexOf(id)===index).slice(0,3);
}
export function selectedDistinctions(input?:PublicDistinctions):{medal:DistinctionDefinition|null;ribbons:DistinctionDefinition[]}{
 if(!input)return {medal:null,ribbons:[]};
 const medals=Array.isArray(input.medals)?input.medals:[];
 const ribbons=Array.isArray(input.ribbons)?input.ribbons:[];
 const medal=medals.map(id=>DISTINCTION_CATALOG[id]).find(v=>v?.kind==='medal')||null;
 return {medal,ribbons:[...new Set(ribbons)].map(id=>DISTINCTION_CATALOG[id]).filter((v):v is DistinctionDefinition=>v?.kind==='ribbon').slice(0,2)};
}
export function safePlayerAura(input:unknown):PlayerAura{
 return typeof input==='string'&&['aurora','eclipse','ember','nebula','transcosmic'].includes(input)?input as PlayerAura:'none';
}
export function safeConstellation(input:ConstellationIdentity|undefined):ConstellationIdentity|null{
 if(!input||!(/^[a-z][a-z0-9-]{2,39}$/).test(input.slug)||input.name.trim().length<2||input.name.length>60)return null;
 return {slug:input.slug,name:input.name,emblem:/^[a-z][a-z0-9_-]{1,32}$/.test(input.emblem)?input.emblem:'orbit'};
}
