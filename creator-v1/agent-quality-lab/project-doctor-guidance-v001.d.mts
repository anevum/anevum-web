/**
 * Curated, offline and non-executable educational help for a known Project
 * Doctor diagnostic code. Never use these strings as executable patches.
 */
export interface LocalRepairGuide {
  readonly code:string;
  readonly title:string;
  readonly impact:string;
  readonly steps:readonly string[];
  readonly verify:string;
  readonly note:string;
  readonly execution:'local-rules';
  readonly providerRequests:0;
  readonly appliesChanges:false;
}
export declare function localRepairGuide(code:unknown):Readonly<LocalRepairGuide>|null;
export declare function availableLocalRepairCodes():readonly string[];
