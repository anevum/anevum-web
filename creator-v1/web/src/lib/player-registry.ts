/**
 * Presentation-only mode selection from the public, moderated project record.
 * Validated HTTPS links are supplied by safeExternal in ProjectPage.
 * This does not infer hosting, playback, completion, or XP.
 */
export type PlayerKind = "external-game"|"external-app"|"external-creation"|"source-only"|"unavailable";
export type PlayerSelection = {
  kind:PlayerKind; status:string; format:string; primaryAction:string|null; explanation:string;
};
export function selectPlayer(category:string,hasDemo:boolean,hasSource:boolean):PlayerSelection {
  if(hasDemo && category==="games")return {
    kind:"external-game",status:"CREATOR-HOSTED",format:"GAME EXPERIENCE",primaryAction:"PLAY ON CREATOR SITE",
    explanation:"Opens the creator's external HTTPS game. ANEVUM does not run the code or verify gameplay."
  };
  if(hasDemo && (category==="tools"||category==="automation"))return {
    kind:"external-app",status:"CREATOR-HOSTED",format:"APPLICATION",primaryAction:"TRY ON CREATOR SITE",
    explanation:"Opens the creator's external HTTPS application. Accounts, pricing and data use are controlled by that site."
  };
  if(hasDemo)return {
    kind:"external-creation",status:"CREATOR-HOSTED",format:"CREATIVE EXPERIENCE",primaryAction:"OPEN CREATOR EXPERIENCE",
    explanation:"Opens the creator's external HTTPS experience. The destination is independent of ANEVUM."
  };
  if(hasSource)return {
    kind:"source-only",status:"SOURCE ONLY",format:"PROJECT SOURCE",primaryAction:"VIEW SOURCE CODE",
    explanation:"No playable or runnable demo is linked. Source is not an executable demo or automatically an open license."
  };
  return {
    kind:"unavailable",status:"NO LINKED DEMO",format:"PROJECT PASSPORT",primaryAction:null,
    explanation:"This published project has no public demo or source destination listed."
  };
}