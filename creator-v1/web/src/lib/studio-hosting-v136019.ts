/**
 * PARITY V136.019 — one Creator Studio hosting explanation, not a second
 * publication system. No provider permissions are granted by this module.
 */
import {safeExternal} from './api';

export type CreatorHostingPath='external'|'quarantine'|'browser-build'|'future-managed';
export type HostingPathView=Readonly<{
 id:CreatorHostingPath;title:string;status:'linked'|'ready'|'restricted'|'planned';
 explanation:string;actionLabel:string|null;actionPath:string|null
}>;

export function studioHostingPaths(input:{
 demoUrl:string|null;sourceUrl:string|null;
 storageReady:boolean;uploadsReady:boolean;
 nativeStudioEnabled:boolean;nativeCanUpload:boolean;
}):readonly HostingPathView[]{
 const {demoUrl,sourceUrl,storageReady,uploadsReady,nativeStudioEnabled,nativeCanUpload}=input;
 const hasLink=Boolean(safeExternal(demoUrl)||safeExternal(sourceUrl));
 return [
  {id:'external',title:'Creator-hosted project',status:hasLink?'linked':'ready',
   explanation:hasLink?
    'A public HTTPS destination is attached to this private record. Approval is still required before ANEVUM lists it.':
    'Attach a public HTTPS demo or source link. Keep control of your hosting and connect discovery through ANEVUM.',
   actionLabel:null,actionPath:null},
  {id:'quarantine',title:'Private asset vault',
   status:storageReady?(uploadsReady?'ready':'restricted'):'restricted',
   explanation:storageReady?(uploadsReady?
    'Your account is eligible to submit bounded private assets for review. They are quarantined, never automatically published or executed.':
    'Existing files may be listed or removed, but new uploads are not enabled for this account.'):
    'The isolated private R2 vault is unavailable. No public files can be created from it.',
   actionLabel:null,actionPath:null},
  {id:'browser-build',title:'Isolated browser build',
   status:nativeStudioEnabled?(nativeCanUpload?'ready':'restricted'):'restricted',
   explanation:nativeStudioEnabled?(nativeCanUpload?
    'Upload a browser-ready HTML or ZIP build. Private tests stay isolated and staff independently approve any public release.':
    'Playable publishing is limited to approved pilot accounts.'):
    'The native browser-build workflow is disabled in this environment.',
   actionLabel:nativeStudioEnabled&&nativeCanUpload?'Open playable builds':null,
   actionPath:nativeStudioEnabled&&nativeCanUpload?'/studio/packages':null},
  {id:'future-managed',title:'Portable managed hosting',status:'planned',
   explanation:'A shared static-hosting contract is in development. No unrestricted uploads, connected third-party cloud credentials, or unlimited free storage are available.',
   actionLabel:null,actionPath:null}
 ] as const;
}
