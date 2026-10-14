/**
 * Creator V1 V009 — fail-closed presentation of verified, public recognition.
 * The input is the existing anonymous-readable member creator endpoint.
 * A client cannot mint XP, claim an award, or select a showcase credential.
 */
export type VerifiedCreatorRecognition = {
  handle: string;
  level: number;
  artifact: string | null;
  earnedArtifact: boolean;
  earnedAward: { key: string; name: string } | null;
};

const KNOWN_AWARDS: Readonly<Record<string,string>> = Object.freeze({
  "release-steward":"Release Steward",
  "three-builds":"Three Builds",
  "first-launch":"First Launch",
  "portal-guide":"Portal Guide",
  "keen-eye":"Keen Eye",
  "first-signal":"First Signal"
});
const AWARD_PRIORITY = Object.keys(KNOWN_AWARDS);

function record(value: unknown): Record<string,unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string,unknown> : null;
}

/** Returns only confirmed, appropriately bound earned claims. */
export function verifiedCreatorRecognition(handle:string,raw:unknown):VerifiedCreatorRecognition|null {
  if(!/^[a-z][a-z0-9_]{2,29}$/.test(handle))return null;
  const result=record(raw),creator=record(result?.creator),progress=record(result?.progression);
  if(!result||!creator||!progress||creator.handle!==handle)return null;
  const level=progress.level;
  if(!Number.isSafeInteger(level)||typeof level!=="number"||level<1||level>21_000_000)return null;
  const earnedArtifact=progress.artifactEarned===true && typeof progress.artifact==="string"
    && progress.artifact.trim().length>0 && progress.artifact.length<=80;
  const artifact=earnedArtifact ? progress.artifact as string : null;
  const achievements=Array.isArray(result.achievements)?result.achievements.map(record).filter(x=>x!==null):[];
  const award=AWARD_PRIORITY.map(key=>achievements.find(item=>
    item?.key===key && item.earned===true && item.name===KNOWN_AWARDS[key]))
    .find(item=>item!==undefined);
  return {handle,level,artifact,earnedArtifact,earnedAward:award?{key:award.key as string,name:award.name as string}:null};
}

/** Keep a bounded number of public recognition reads per community page. */
export function recognitionHandles(handles:readonly string[],max=12):string[]{
  const output:string[]=[];const seen=new Set<string>();
  for(const handle of handles){
    const normalized=handle.toLowerCase();
    if(!/^[a-z][a-z0-9_]{2,29}$/.test(normalized)||seen.has(normalized))continue;
    seen.add(normalized);output.push(normalized);
    if(output.length>=Math.min(Math.max(1,max),12))break;
  }
  return output;
}
