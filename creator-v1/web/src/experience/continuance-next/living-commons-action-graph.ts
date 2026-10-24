/**
 * Living Commons / proposed typed action substrate.
 * Pure review-time specification, no I/O, permission grant, storage or account mutation.
 * An eventual API handler must separately validate authenticated ownership, visibility,
 * feature flags, moderation, consent, revision, idempotency and content authorization.
 */
export type CommonsView = 'home'|'atlas'|'district'|'signals'|'room'|'thread'|'assemblies'|'people'|'cabinet'|'desk'|'charter';
export type CommonsEntityKind = 'district'|'project'|'thread'|'creator'|'member'|'assembly';
export type Availability = 'ready'|'closed'|'unavailable'|'unknown';
export type Principal = Readonly<{kind:'guest'|'member'|'staff';memberId?:string}>;
export type Context = Readonly<{
  view:CommonsView;
  principal:Principal;
  activeEntity?:Readonly<{kind:CommonsEntityKind;id:string}>;
  availability:Readonly<{
    publicProjects:Availability;
    publicThreads:Availability;
    memberSpace:Availability;
    assemblies:Availability;
  }>;
}>;
export type ComponentId =
  'commons-landing'|'district-map'|'district-list'|'signal-board'|'public-project'|
  'moderated-thread'|'assembly-gate'|'public-identity'|'verified-reward'|
  'personal-workbench'|'charter-document';
export const VIEW_COMPONENTS:Readonly<Record<CommonsView,readonly ComponentId[]>>={
  home:['commons-landing','signal-board'],
  atlas:['district-map','district-list'],
  district:['district-list','signal-board'],
  signals:['signal-board'],
  room:['public-project','moderated-thread'],
  thread:['moderated-thread'],
  assemblies:['assembly-gate'],
  people:['public-identity'],
  cabinet:['verified-reward'],
  desk:['personal-workbench'],
  charter:['charter-document']
};
export type ActionDescriptor =
  | Readonly<{kind:'navigate';destination:CommonsView;entityId?:string}>
  | Readonly<{kind:'save-project';projectId:string;expectedRevision:number}>
  | Readonly<{kind:'react-thread';threadId:string;desiredScore:0|1;expectedRevision:number}>
  | Readonly<{kind:'submit-reply';threadId:string;body:string;idempotencyKey:string}>
  | Readonly<{kind:'join-assembly';assemblyId:string;consentVersion:string}>
  | Readonly<{kind:'show-member';handle:string}>
  | Readonly<{kind:'show-earned-reward';rewardId:string;memberHandle:string}>
  | Readonly<{kind:'propose-layout';moduleIds:readonly ComponentId[]}>;
export type ActionPreview=Readonly<{
  status:'local-only'|'needs-server'|'unavailable'|'invalid';
  action:ActionDescriptor['kind'];
  explanation:string;
  method:'none'|'GET'|'POST';
  requiresSignIn:boolean;
  requiresCanonicalAuthorization:boolean;
  willMutateAccount:boolean;
  gate?:'feature'|'identity'|'revision'|'consent'|'moderation'|'ownership';
}>;
const validId=(value:unknown):value is string=>
 typeof value==='string'&&value.length>0&&value.length<=128&&/^[a-z0-9][a-z0-9_-]*$/i.test(value);
const validRevision=(value:unknown):value is number=>
 typeof value==='number'&&Number.isSafeInteger(value)&&value>=0;
function result(action:ActionDescriptor,status:ActionPreview['status'],explanation:string,
 method:ActionPreview['method'],requiresSignIn=false,requiresCanonicalAuthorization=true,
 willMutateAccount=false,gate?:ActionPreview['gate']):ActionPreview{
 return {status,action:action.kind,explanation,method,requiresSignIn,requiresCanonicalAuthorization,willMutateAccount,gate};
}
/** Only previews intended behavior; DOES NOT evaluate or grant real permission. */
export function previewCommonsAction(context:Context,action:ActionDescriptor):ActionPreview{
 const member=context.principal.kind!=='guest'&&validId(context.principal.memberId);
 switch(action.kind){
  case 'navigate':
   if(!Object.hasOwn(VIEW_COMPONENTS,action.destination)||
     (action.entityId!==undefined&&!validId(action.entityId)))
    return result(action,'invalid','The requested destination is unknown.','none',false,false);
   return result(action,'local-only','Go to a reviewed view. Fetch actual records through the canonical service.','none',false,false);
  case 'propose-layout':
   if(!Array.isArray(action.moduleIds)||action.moduleIds.length>9||
      new Set(action.moduleIds).size!==action.moduleIds.length||
      action.moduleIds.some(id=>!Object.values(VIEW_COMPONENTS).some(items=>items.includes(id))))
    return result(action,'invalid','Only unique approved modules can be arranged.','none',false,false);
   return result(action,'local-only','Proposes a local arrangement. Durable save requires a separate authenticated API.','none',false,false);
  case 'save-project':
   if(!validId(action.projectId)||!validRevision(action.expectedRevision))
    return result(action,'invalid','Invalid project identifier or revision.','none');
   if(context.availability.publicProjects!=='ready')
    return result(action,'unavailable','Public project service availability is unverified.','none',false,true,false,'feature');
   return result(action,'needs-server',member?'Server must verify identity and current revision.':'Sign-in is required for a durable save.','POST',!member,true,true,member?'revision':'identity');
  case 'react-thread':
   if(!validId(action.threadId)||!validRevision(action.expectedRevision)||
      (action.desiredScore!==0&&action.desiredScore!==1))
    return result(action,'invalid','Invalid reaction parameters.','none');
   if(context.availability.publicThreads!=='ready')
    return result(action,'unavailable','Moderated discussion service is closed or unknown.','none',false,true,false,'feature');
   return result(action,'needs-server','Reaction needs server-owned user, visibility and revision checks.','POST',!member,true,true,member?'revision':'identity');
  case 'submit-reply':
   if(!validId(action.threadId)||typeof action.body!=='string'||action.body.trim().length<10||
      action.body.length>2000||!validId(action.idempotencyKey))
    return result(action,'invalid','Invalid reply length, thread or idempotency key.','none');
   if(context.availability.publicThreads!=='ready')
    return result(action,'unavailable','Moderated discussion service is unavailable.','none',false,true,false,'feature');
   return result(action,'needs-server','Submit to the canonical API; never show pending_review unless the server confirms.','POST',!member,true,true,member?'moderation':'identity');
  case 'join-assembly':
   if(!validId(action.assemblyId)||!validId(action.consentVersion))
    return result(action,'invalid','Invalid assembly or consent version.','none');
   if(context.availability.assemblies!=='ready')
    return result(action,'unavailable','Assembly membership is future-gated; no join occurred.','none',false,true,false,'feature');
   return result(action,'needs-server','Joining requires explicit consent, owner policy and server verification.','POST',!member,true,true,member?'consent':'identity');
  case 'show-member':
   if(!/^[a-z][a-z0-9_]{2,29}$/.test(action.handle))
    return result(action,'invalid','Invalid public member handle.','none');
   return result(action,'needs-server','Public identity must be opted in. Do not reveal private/missing distinctions.','GET',false,true,false,'ownership');
  case 'show-earned-reward':
   if(!validId(action.rewardId)||!/^[a-z][a-z0-9_]{2,29}$/.test(action.memberHandle))
    return result(action,'invalid','Invalid reward or member handle.','none');
   return result(action,'needs-server','Canonical earned inventory and media endpoints must verify visibility and entitlement.','GET',false,true,false,'ownership');
 }
}
export const NEXT_DESTINATION:Readonly<Record<CommonsView,CommonsView>>={
 home:'atlas',atlas:'district',district:'signals',signals:'room',room:'thread',
 thread:'charter',assemblies:'charter',people:'cabinet',cabinet:'desk',desk:'atlas',charter:'home'
};
export function explainNextStep(context:Context):Readonly<{view:CommonsView;reason:string}>{
 const next=NEXT_DESTINATION[context.view];
 if(!next||!Object.hasOwn(VIEW_COMPONENTS,next))
  return {view:'home',reason:'Return to a stable Commons entry point.'};
 return {view:next,reason:'A reviewable Commons path from '+context.view+' to '+next+'. Not an AI recommendation.'};
}
