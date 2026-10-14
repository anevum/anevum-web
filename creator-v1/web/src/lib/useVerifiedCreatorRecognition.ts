import { useResource } from "./useResource";
import { memberCreatorProfile } from "./member-api";
import { recognitionHandles, verifiedCreatorRecognition, type VerifiedCreatorRecognition } from "./creator-recognition";

/**
 * One bounded pass over distinct, visible public creators. The existing
 * anonymous-read member profile endpoint is optional; if missing all badges
 * disappear without affecting discovery or requesting a private session.
 */
export function useVerifiedCreatorRecognition(handles: readonly string[]): Readonly<Record<string,VerifiedCreatorRecognition>> {
  const key=recognitionHandles(handles).join(",");
  const result=useResource(async signal=>{
    if(!key)return {} as Record<string,VerifiedCreatorRecognition>;
    const found:Record<string,VerifiedCreatorRecognition>={};
    await Promise.all(key.split(",").map(async handle=>{
      try {
        const profile=await memberCreatorProfile(handle,signal);
        const item=verifiedCreatorRecognition(handle,profile);
        if(item)found[handle]=item;
      }catch{
        // Missing member Worker, non-public member, revoked profile,
        // missing permission or network failure are not a reward.
      }
    }));
    return found;
  },[key]);
  return result.state==="ready" ? result.data : {};
}
