import type {FocusKey,WorldTheme,SupporterAppearance} from './canonical-beta';
import type {EarnedBadge,BadgeDisplay,PublicDistinctions,PlayerAura,ConstellationIdentity,VerifiedRole,PublicReputation,ReputationTier} from './player-recognition';
export type PublicMember={handle:string;displayName:string;headline:string;worldTheme:WorldTheme;focus:FocusKey[];avatar:boolean;avatarVersion?:number;joinedAt:number;level:number|null;featuredAwards:string[];earnedBadges?:EarnedBadge[];badgeDisplay?:BadgeDisplay;distinctions?:PublicDistinctions;aura?:PlayerAura;constellation?:ConstellationIdentity;role?:VerifiedRole;reputation?:PublicReputation;earnedAura?:ReputationTier;supporterAppearance?:SupporterAppearance};
export type PublicWallUpdate=PublicMember&{id:string;excerpt:string;createdAt:number;updatedAt:number};
export type MemberIndex<T>={items:T[];nextCursor:string|null};
export async function readMemberCommunity<T>(kind:'members'|'activity',filters:{q?:string;focus?:string;after?:string}={},signal?:AbortSignal):Promise<MemberIndex<T>>{
 const query=new URLSearchParams();for(const [key,value] of Object.entries(filters))if(value)query.set(key,value);
 const response=await fetch('/api/v1/community/'+kind+(query.size?'?'+query:''),{method:'GET',mode:'same-origin',credentials:'omit',cache:'no-store',redirect:'error',signal,headers:{Accept:'application/json'}});
 if(!response.ok||!response.headers.get('content-type')?.includes('application/json'))throw Error('Member activity is temporarily unavailable.');
 return response.json() as Promise<MemberIndex<T>>;
}
