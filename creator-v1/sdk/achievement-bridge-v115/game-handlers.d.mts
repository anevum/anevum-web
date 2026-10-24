import type {AnevumPublisher} from './server.mjs';
export type AuthenticatedGameUser=string;
export type AuthoritativeMilestoneEvidence={eventId:string;evidenceDigest:string};
export type GameHandlersConfig={
 publisher:AnevumPublisher;
 authenticatePlayer:(request:Request)=>Promise<AuthenticatedGameUser|null>|AuthenticatedGameUser|null;
 verifyCsrf:(request:Request)=>Promise<boolean>|boolean;
 readGameLink:(gameUser:AuthenticatedGameUser)=>Promise<string|null>|string|null;
 saveGameLink:(gameUser:AuthenticatedGameUser,opaqueLinkId:string)=>Promise<void>|void;
 proveGameMilestone:(gameUser:AuthenticatedGameUser,stableKey:string)=>Promise<AuthoritativeMilestoneEvidence|null>|AuthoritativeMilestoneEvidence|null;
};
export declare function createAnevumGameHandlers(config:GameHandlersConfig):Readonly<{link(request:Request):Promise<Response>;report(request:Request):Promise<Response>}>;
