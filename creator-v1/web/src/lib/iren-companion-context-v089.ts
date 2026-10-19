/** IREN V089 — deterministic field awareness.
 * Only public route location and the verified member/visitor distinction.
 * No LLM claims, background tracking, privileged queries or invented state.
 */
export type IrenStation={
 code:string;
 topic:"profile"|"discover"|"community"|"create"|"recognition"|"safety";
 line:string;
};
const stations={
 home:{code:"THE WAYFINDER",topic:"discover",line:"The Institute is open. Tell me where you'd like to begin."},
 discover:{code:"DISCOVER",topic:"discover",line:"Looking for a new world? I can help you narrow the search."},
 community:{code:"THE COMMONS",topic:"community",line:"There are people and projects worth finding here. I'll show you around."},
 studio:{code:"CREATOR STUDIO",topic:"create",line:"Ideas take shape here. I can explain the submission path."},
 member:{code:"MEMBER SPACE",topic:"profile",line:"This is your space. Your identity, privacy and earned records stay under your control."},
 join:{code:"REGISTRATION",topic:"profile",line:"Your identity begins here. I can explain what joining makes available."},
 recognition:{code:"CONTINUANCE RECORD",topic:"recognition",line:"Only verified discoveries appear here. Future specimens remain sealed."},
 guide:{code:"FIELD GUIDE",topic:"safety",line:"These are our field notes. Ask me where to find a particular tool."},
 staff:{code:"STAFF CLEARANCE",topic:"safety",line:"Staff capabilities are permission-controlled. I can explain public site guidance without changing access."},
 project:{code:"PUBLISHED WORK",topic:"discover",line:"You're viewing a creator's work. Explore it at your own pace."}
} as const satisfies Record<string,IrenStation>;
/** Return a safe, bounded script for the current public route. */
export function irenStationForPath(path:string,verifiedMember:boolean):IrenStation{
 const p=(typeof path==="string"&&path.startsWith("/")?path:"/").slice(0,160).toLowerCase();
 if(p==="/")return stations.home;
 if(p==="/discover"||p.startsWith("/discover/"))return stations.discover;
 if(p==="/community"||p.startsWith("/community/")||p.startsWith("/threads/"))return stations.community;
 if(p==="/studio"||p.startsWith("/studio/"))return stations.studio;
 if(p==="/member"||p.startsWith("/member/")||p.startsWith("/members/")){
  return verifiedMember?stations.member:{
   code:"MEMBER PROFILE",topic:"profile",
   line:"Member profiles share only what their owners choose to make public."
  };
 }
 if(p==="/join"||p.startsWith("/join/"))return stations.join;
 if(p==="/levels"||p==="/recognition"||p.startsWith("/recognition/"))return stations.recognition;
 if(p==="/guide"||p.startsWith("/guide/"))return stations.guide;
 if(p==="/staff"||p.startsWith("/staff/")||p==="/moderation"||p.startsWith("/moderation/"))return stations.staff;
 if(p.startsWith("/project/")||p.startsWith("/play/")||p.startsWith("/works/"))return stations.project;
 return stations.home;
}
