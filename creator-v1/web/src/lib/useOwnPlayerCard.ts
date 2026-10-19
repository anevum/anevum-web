import {useEffect,useState} from "react";
import {canonicalAuthClient,canonicalMe,canonicalSpace} from "./canonical-beta";
import type {PublicIdentity} from "../components/CompactMemberIdentity";

/**
 * The owner's actual verified player identity.
 * This is only rendered to the signed-in owner; nothing is synthesized.
 */
export function useOwnPlayerCard(enabled=true):PublicIdentity|null {
  const {data:session}=canonicalAuthClient.useSession();
  const memberId=session?.user?.emailVerified===true?session.user.id:null;
  const [current,setCurrent]=useState<{owner:string;card:PublicIdentity}|null>(null);

  useEffect(()=>{
    setCurrent(null);
    if(!enabled||!memberId)return;
    let active=true;
    const controller=new AbortController();
    void Promise.all([canonicalMe(controller.signal),canonicalSpace(controller.signal)])
      .then(([record,space])=>{
        if(!active||record.memberId!==memberId||!record.profile)return;
        const profile=record.profile;
        setCurrent({owner:memberId,card:{
          handle:profile.handle,
          displayName:profile.displayName,
          avatar:Boolean(space.media.avatar),
          level:space.showStats&&space.stats?space.stats.level:null,
          featuredAwards:space.featuredAwards||[],
          earnedBadges:space.earnedBadges,
          badgeDisplay:space.badgeDisplay,
          distinctions:space.distinctions,
          aura:space.aura,
          role:space.role,
          reputation:space.showStats?space.reputation:undefined,
          earnedAura:space.showStats?space.earnedAura:undefined,
          constellation:space.constellation,
          supporterAppearance:space.supporterAppearance,
          progress:space.showStats?space.stats:undefined,
          source:"canonical-member"
        }});
      })
      .catch(()=>{if(active)setCurrent(null);});
    return()=>{active=false;controller.abort();};
  },[enabled,memberId]);
  return enabled&&memberId&&current?.owner===memberId?current.card:null;
}
