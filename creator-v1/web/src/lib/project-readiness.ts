import type {ProjectDraft} from "./member-api";

const categories=new Set(["games","tools","creative","automation","research","learning","libraries","other"]);
const control=/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;
const validText=(value:string,min:number,max:number)=>value.trim().length>=min&&value.length<=max&&!control.test(value);

// Advisory editor checks only. The Member Worker remains authoritative.
export function projectDestination(value:string|null):URL|null {
  if(!value||value.length>1500)return null;
  try {
    const url=new URL(value);
    if(url.protocol!=="https:"||url.username||url.password||(url.port&&url.port!=="443")||
      !url.hostname.includes(".")||url.hostname.includes(":")||/^(?:\d{1,3}\.){3}\d{1,3}$/.test(url.hostname)||
      /(?:^|\.)(?:localhost|local|internal|test|invalid)$/.test(url.hostname))return null;
    for(const key of url.searchParams.keys())if(/^(?:token|api_key|secret|password|access_token)$/i.test(key))return null;
    return url;
  }catch{return null;}
}

export function draftFingerprint(draft:ProjectDraft):string {
  return JSON.stringify([draft.slug,draft.title,draft.summary,draft.category,draft.description,
    draft.freeToUse,draft.sourceUrl||null,draft.demoUrl||null,draft.license||null,
    draft.aiDisclosure,draft.humanContribution]);
}

export function projectReadiness(draft:ProjectDraft){
  const demo=projectDestination(draft.demoUrl),source=projectDestination(draft.sourceUrl);
  return [
    {key:"details",label:"Title, summary and category",ready:validText(draft.title,3,100)&&validText(draft.summary,10,280)&&categories.has(draft.category)&&validText(draft.description,0,8000)},
    {key:"slug",label:"Valid project URL slug",ready:validText(draft.slug,3,90)&&/^[a-z0-9](?:[a-z0-9-]{1,88}[a-z0-9])$/.test(draft.slug.trim().toLowerCase())},
    {key:"destination",label:"Public demo or source destination",ready:Boolean(demo||source)&&(!draft.demoUrl||Boolean(demo))&&(!draft.sourceUrl||Boolean(source))},
    {key:"disclosures",label:"AI disclosure and human credits (10+ characters each)",ready:validText(draft.aiDisclosure,10,1200)&&validText(draft.humanContribution,10,1200)},
    {key:"license",label:"License field within its limit (optional)",ready:!draft.license||validText(draft.license,1,80)}
  ];
}

export function canSubmitSavedProject(draft:ProjectDraft,saved:ProjectDraft|null,status:string,busy:boolean):boolean {
  return !busy&&(status==="draft"||status==="changes_requested")&&saved!==null&&
    draftFingerprint(draft)===draftFingerprint(saved)&&projectReadiness(saved).every(check=>check.ready);
}
