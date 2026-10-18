/**
 * ANEVUM Porchlight V003 — isolated consent-first host pilot domain.
 *
 * Security boundary:
 *   - This class is a reference domain model, not an HTTP authentication service.
 *   - A future API must inject principal from a validated server-side session,
 *     never from submitted JSON, URL parameters, or a browser-controlled role.
 *   - This prototype ONLY handles synthetic houses / coarse fictional cells.
 *   - Neither addresses, children, GPS nor third-party tracking are accepted.
 */
export const PILOT_EVENT_ID = "porchlight-st-cloud-halloween-2026";
export const PILOT_CONSENT_VERSION = "porchlight-public-house-v1";
export const PILOT_CLOSES_AT = "2026-10-31T23:00:00.000Z";
export const PILOT_AMENITIES = Object.freeze(["Treats", "Non-food treats", "Decorations"]);
export const PILOT_CELLS = Object.freeze(["DEMO_NORTH","DEMO_CENTRAL","DEMO_SOUTH"]);
const ACCESS = Object.freeze({ORGANIZER:"organizer", ADULT:"adult"});
const LABEL_PATTERN = /^[a-z0-9][a-z0-9 .'\-]{2,39}$/i;
const VALID_HOURS = Object.freeze(["5–6 PM","5–7 PM","6–7 PM"]);
const INPUT_KEYS = Object.freeze(["alias","amenities","hours","cell","consentConfirmed","authorityConfirmed","ageConfirmed","consentVersion"]);
const PUBLISHED_KEYS = Object.freeze(["id","alias","amenities","hours","cell","synthetic","eventId"]);
const ACTIONS = Object.freeze(["submitted","approved","rejected","withdrawn","held_for_report"]);
const PRIVATE_ID_RE = /^[a-zA-Z0-9_-]{6,88}$/;

export class PilotError extends Error {
  constructor(code, message){super(message); this.name="PilotError";this.code=code;}
}
function reject(code,message){throw new PilotError(code,message);}
function assertKeys(input,allow){
  if(!input || typeof input!=="object" || Array.isArray(input))reject("INVALID_INPUT","A request object is required.");
  for(const key of Object.keys(input)){
    if(!allow.includes(key))reject("UNSUPPORTED_FIELD","Unexpected or personal field: "+key);
  }
}
function trustedAdult(principal){
  if(!principal || typeof principal!=="object" || !PRIVATE_ID_RE.test(principal.subject||"") ||
     principal.emailVerified!==true || principal.role!==ACCESS.ADULT ||
     principal.adultEligible!==true)reject("UNAUTHORIZED","An authenticated eligible adult is required.");
}
function trustedOrganizer(principal){
  if(!principal || typeof principal!=="object" || !PRIVATE_ID_RE.test(principal.subject||"") ||
     principal.emailVerified!==true || principal.role!==ACCESS.ORGANIZER ||
     principal.organizerAuthorized!==true)reject("FORBIDDEN","A verified independent organizer is required.");
}
function readTime(at){
  const n=typeof at==="number" ? at : new Date(at).getTime();
  if(!Number.isFinite(n))reject("INVALID_TIME","A valid event time is required.");
  return n;
}
function openForWrites(at){
  const now=readTime(at);
  if(now>=Date.parse(PILOT_CLOSES_AT))reject("EVENT_ENDED","This event has ended.");
  return now;
}
function validatedRequest(input){
  assertKeys(input, INPUT_KEYS);
  if(typeof input.alias!=="string"||!LABEL_PATTERN.test(input.alias.trim())){
    reject("INVALID_ALIAS","Use a neutral display alias (3–40 characters).");
  }
  if(!Array.isArray(input.amenities) || input.amenities.length<1 || input.amenities.length>3 ||
    new Set(input.amenities).size!==input.amenities.length ||
    !input.amenities.every(v=>PILOT_AMENITIES.includes(v))){
    reject("INVALID_AMENITIES","Select supported activity options only.");
  }
  if(!VALID_HOURS.includes(input.hours))reject("INVALID_HOURS","Unsupported event hours.");
  if(!PILOT_CELLS.includes(input.cell))reject("INVALID_CELL","Fictional area cells only.");
  if(input.consentConfirmed!==true || input.authorityConfirmed!==true || input.ageConfirmed!==true ||
     input.consentVersion!==PILOT_CONSENT_VERSION){
    reject("CONSENT_REQUIRED","Current adult authority and publishing consent are required.");
  }
  return {
    alias:input.alias.trim(),amenities:[...input.amenities],
    hours:input.hours,cell:input.cell
  };
}
function publicSafe(record){
  const candidate={
    id:record.id,
    alias:record.alias,
    amenities:[...record.amenities],
    hours:record.hours,
    cell:record.cell,
    synthetic:true,
    eventId:PILOT_EVENT_ID
  };
  const output={};
  for(const key of PUBLISHED_KEYS)output[key]=candidate[key];
  return output;
}
function clone(record){return structuredClone(record);}

/** In-memory, deterministic for tests; NEVER use as production persistence. */
export class PilotRegistry {
  #records=new Map();
  #audit=[];
  #clock;
  #idGenerator;
  constructor({clock=()=>Date.now(),idGenerator=()=>crypto.randomUUID()}={}){
    this.#clock=clock;this.#idGenerator=idGenerator;
  }
  #stamp(){return readTime(this.#clock());}
  #log(action,record,principal,at){
    if(!ACTIONS.includes(action))throw new Error("Unexpected audit action.");
    this.#audit.push(Object.freeze({
      action,recordId:record.id,actorSubject:principal.subject,
      at:new Date(at).toISOString(),revision:record.revision
    }));
  }
  #lookup(id){
    if(typeof id!=="string")reject("NOT_FOUND","No matching application.");
    const rec=this.#records.get(id);
    if(!rec)reject("NOT_FOUND","No matching application.");
    return rec;
  }
  #ownerOrOrganizer(principal,rec){
    if(principal && principal.subject===rec.ownerSubject &&
       principal.role===ACCESS.ADULT && principal.emailVerified===true &&
       principal.adultEligible===true)return;
    trustedOrganizer(principal);
  }
  #expected(rec,rev){
    if(!Number.isInteger(rev)||rec.revision!==rev){
      reject("STALE_REVISION","This application changed; refresh it before reviewing.");
    }
  }
  request(principal,input){
    trustedAdult(principal);
    const time=openForWrites(this.#stamp());
    const safe=validatedRequest(input);
    for(const rec of this.#records.values()){
      if(rec.ownerSubject===principal.subject && rec.state!=="withdrawn" && rec.state!=="rejected"){
        reject("ALREADY_REQUESTED","An application already exists for this event.");
      }
    }
    const id=this.#idGenerator();
    if(typeof id!=="string"||!PRIVATE_ID_RE.test(id)||this.#records.has(id)){
      reject("INVALID_ID","A unique server-generated ID is required.");
    }
    const rec={
      id,eventId:PILOT_EVENT_ID,ownerSubject:principal.subject,
      alias:safe.alias,amenities:safe.amenities,hours:safe.hours,cell:safe.cell,
      consentVersion:PILOT_CONSENT_VERSION, consentAt:new Date(time).toISOString(),
      adultAttested:true,authorityAttested:true,
      controlVerified:false,reviewedBy:null,state:"pending",revision:1,
      reason:null,revokedAt:null,
      createdAt:new Date(time).toISOString(),updatedAt:new Date(time).toISOString()
    };
    this.#records.set(id,rec);
    this.#log("submitted",rec,principal,time);
    return clone(rec);
  }
  review(principal,id,{decision,controlVerified,expectedRevision}={}){
    trustedOrganizer(principal);
    const time=openForWrites(this.#stamp()),rec=this.#lookup(id);
    this.#expected(rec,expectedRevision);
    if(principal.subject===rec.ownerSubject)reject("SELF_APPROVAL","A resident cannot approve their own request.");
    if(rec.state!=="pending")reject("INVALID_STATE","Only pending applications may be reviewed.");
    if(decision!=="approve"&&decision!=="reject")reject("INVALID_DECISION","Unsupported review decision.");
    if(decision==="approve"&&controlVerified!==true){
      reject("UNVERIFIED_PROPERTY","The organizer must independently verify control of the household.");
    }
    rec.state=decision==="approve"?"approved":"rejected";
    rec.controlVerified=decision==="approve";
    rec.reviewedBy=principal.subject;rec.revision++;
    rec.updatedAt=new Date(time).toISOString();
    this.#log(decision==="approve"?"approved":"rejected",rec,principal,time);
    return clone(rec);
  }
  withdraw(principal,id,{expectedRevision}={}){
    const rec=this.#lookup(id);
    this.#ownerOrOrganizer(principal,rec);
    const time=this.#stamp();
    this.#expected(rec,expectedRevision);
    if(rec.state==="withdrawn")return clone(rec);
    if(rec.state==="rejected")reject("INVALID_STATE","Rejected applications cannot be withdrawn.");
    rec.state="withdrawn";rec.revokedAt=new Date(time).toISOString();
    rec.updatedAt=new Date(time).toISOString();rec.revision++;
    rec.controlVerified=false;
    this.#log("withdrawn",rec,principal,time);
    return clone(rec);
  }
  report(principal,id,{reason,expectedRevision}={}){
    // The pilot does not allow anonymous reporting because anti-abuse controls
    // and rate limiting are not implemented yet.
    trustedAdult(principal);
    const rec=this.#lookup(id),time=this.#stamp();
    this.#expected(rec,expectedRevision);
    if(!["incorrect_listing","withdrawn_consent","private_location","other"].includes(reason)){
      reject("INVALID_REASON","Unsupported report reason.");
    }
    if(rec.state!=="approved")reject("INVALID_STATE","Only published listings can be reported.");
    rec.state="held";rec.reason=reason;rec.revision++;
    rec.updatedAt=new Date(time).toISOString();rec.controlVerified=false;
    this.#log("held_for_report",rec,principal,time);
    return {held:true};
  }
  myRequests(principal){
    trustedAdult(principal);
    return [...this.#records.values()].filter(r=>r.ownerSubject===principal.subject).map(clone);
  }
  organizerQueue(principal){
    trustedOrganizer(principal);
    return [...this.#records.values()].map(clone);
  }
  audit(principal){
    trustedOrganizer(principal);
    return this.#audit.map(x=>({...x}));
  }
  publicListings(){
    const time=this.#stamp();
    if(time>=Date.parse(PILOT_CLOSES_AT))return [];
    return [...this.#records.values()].filter(r=>
      r.state==="approved" && r.controlVerified===true &&
      r.consentVersion===PILOT_CONSENT_VERSION &&
      r.adultAttested===true && r.authorityAttested===true &&
      r.revokedAt===null && r.eventId===PILOT_EVENT_ID
    ).map(publicSafe);
  }
}
export const DEMO_PRINCIPALS=Object.freeze({
  resident:Object.freeze({subject:"demo_adult_alpha",role:"adult",emailVerified:true,adultEligible:true}),
  other:Object.freeze({subject:"demo_adult_other",role:"adult",emailVerified:true,adultEligible:true}),
  organizer:Object.freeze({subject:"demo_organizer",role:"organizer",emailVerified:true,organizerAuthorized:true})
});
export const DEMO_REQUEST=Object.freeze({
  alias:"Pending House",amenities:Object.freeze(["Treats"]),hours:"5–7 PM",
  cell:"DEMO_CENTRAL",consentConfirmed:true,authorityConfirmed:true,ageConfirmed:true,
  consentVersion:PILOT_CONSENT_VERSION
});
