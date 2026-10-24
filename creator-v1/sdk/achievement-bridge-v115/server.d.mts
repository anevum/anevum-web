export type PublisherOptions={projectId:string;keyId:string;secret:string;anevumOrigin?:string;fetchImpl?:typeof fetch};
export type CreatorEvent={linkId:string;stableKey:string;eventId:string;evidenceDigest:string};
export class AnevumPublisher {
 constructor(options:PublisherOptions);
 exchange(code:string):Promise<{projectId:string;linkId:string;trust:'creator_attested'}>;
 award(event:CreatorEvent):Promise<{status:'recorded'|'earned'|'duplicate';platformXp:0;trust:'creator_attested'}>;
}
export function createAnevumPublisher(options:PublisherOptions):AnevumPublisher;
