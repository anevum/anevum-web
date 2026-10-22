// Read-only canonical Creator Studio entry handshake.
// The hub needs verified member identity, not an expensive second project query.
// Server routes still enforce Studio flags, permissions, and per-member ownership.
import type {CanonicalPrivateResponse,CanonicalProfile} from './canonical-beta';
import type {StudioHealth} from './canonical-studio';

export type StudioEntryMode='list'|'new'|'edit'|'review';
export type StudioEntryResult=
 | {phase:'ready';identity:CanonicalProfile;uploads:boolean;canReview:boolean}
 | {phase:'unavailable'|'incomplete'};
export interface StudioEntryDependencies {
 profile:(signal?:AbortSignal)=>Promise<CanonicalPrivateResponse>;
 health:(signal?:AbortSignal)=>Promise<StudioHealth>;
 list:(signal?:AbortSignal)=>Promise<{uploadsReady:boolean;canReview:boolean}>;
}

/**
 * The list route verifies identity and service readiness, then lets StudioLibrary load its own
 * protected inventory, so one stalled list request cannot hide the entire hub.
 * Editor and reviewer routes retain the existing health+capability gate.
 * Deadline, cancellation and account remount remain the caller's responsibility.
 */
export async function resolveStudioEntry(
 memberId:string,mode:StudioEntryMode,signal:AbortSignal,deps:StudioEntryDependencies
):Promise<StudioEntryResult>{
 const [profile,health]=await Promise.all([
  deps.profile(signal),deps.health(signal)
 ]);
 if(profile.memberId!==memberId)throw Error('Member identity changed. Sign in again.');
 if(!health.studioReady)return {phase:'unavailable'};
 if(!profile.profile?.handle)return {phase:'incomplete'};
 if(mode==='list')return {phase:'ready',identity:profile.profile,uploads:false,canReview:false};
 const capabilities=await deps.list(signal);
 return {phase:'ready',identity:profile.profile,
  uploads:capabilities.uploadsReady===true,canReview:capabilities.canReview===true};
}
