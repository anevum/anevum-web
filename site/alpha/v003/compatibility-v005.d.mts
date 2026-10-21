export type CompatibilityIssue={code:string;severity:'info'|'warning'|'blocker';message:string;fix:string};
export type CompatibilityReport={
 schemaVersion:'0.1';sourceName:string;
 runtime:'web-static'|'web-source'|'python-source'|'godot-source'|'godot-web'|'unity-web'|'web-wasm'|'unknown';
 entrypoint:'index.html'|null;playableCandidate:boolean;securityReviewed:false;mobileVerified:false;publicationApproved:false;
 issues:CompatibilityIssue[];
};
export declare function detectCompatibility(entries:ReadonlyArray<{path:string;unpacked?:number}>,
 options?:{sourceName?:string}):CompatibilityReport;
