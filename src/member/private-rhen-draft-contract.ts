/** Strict display-only RHEN draft projection. Broker and execution authority are never inferred. */
export type PrivateDraft = Readonly<{
  label:string;
  marketScope:"us_equities_etfs";
  direction:"long_only";
  maxOpenPositions:number;
  maxTotalExposurePercent:number;
  maxPositionPercent:number;
  updatedAt:string;
}>;
export type PrivateDraftResponse = Readonly<{
  available:true;
  draft:PrivateDraft|null;
  executionEnabled:false;
  brokerageConnected:false;
}>;

const expectedTop=["available","brokerageConnected","draft","executionEnabled"];
const expectedDraft=["direction","label","marketScope","maxOpenPositions",
  "maxPositionPercent","maxTotalExposurePercent","updatedAt"];
const object=(input:unknown):input is Record<string,unknown> =>
  input !== null && typeof input==="object" && !Array.isArray(input);
const exact=(value:Record<string,unknown>,fields:readonly string[]):boolean=>
  Object.keys(value).sort().join("|")===fields.join("|");
const integer=(value:unknown,minimum:number,maximum:number):value is number =>
  typeof value==="number" && Number.isSafeInteger(value) &&
  value>=minimum && value<=maximum;
function invalid():never { throw new Error("Private RHEN draft could not be verified."); }

/**
 * This does NOT authenticate an account: the Worker derives user_id from Better Auth.
 * Client parsing refuses malformed, elevated or unknown fields before any rendering.
 */
export function parsePrivateDraftResponse(input:unknown,requireDraft=false):PrivateDraftResponse {
  if(!object(input)||!exact(input,expectedTop)||
     input.available!==true||input.executionEnabled!==false||
     input.brokerageConnected!==false)return invalid();
  if(input.draft===null){
    if(requireDraft)return invalid();
    return Object.freeze({available:true,draft:null,executionEnabled:false,brokerageConnected:false});
  }
  if(!object(input.draft)||!exact(input.draft,expectedDraft))return invalid();
  const d=input.draft;
  if(typeof d.label!=="string"||!d.label.trim()||d.label!==d.label.trim()||d.label.length>48||
     d.marketScope!=="us_equities_etfs"||d.direction!=="long_only"||
     !integer(d.maxOpenPositions,1,10)||
     !integer(d.maxTotalExposurePercent,1,100)||
     !integer(d.maxPositionPercent,1,100)||
     d.maxPositionPercent>d.maxTotalExposurePercent||
     typeof d.updatedAt!=="string"||
     !/^\d{4}-\d{2}-\d{2}(?:T| )\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z)?$/.test(d.updatedAt)
  )return invalid();
  const draft:PrivateDraft=Object.freeze({
    label:d.label,marketScope:"us_equities_etfs",direction:"long_only",
    maxOpenPositions:d.maxOpenPositions,maxTotalExposurePercent:d.maxTotalExposurePercent,
    maxPositionPercent:d.maxPositionPercent,updatedAt:d.updatedAt
  });
  return Object.freeze({available:true,draft,executionEnabled:false,brokerageConnected:false});
}
