export type AnevumBrowserOptions={projectId:string;anevumOrigin?:string;reportEndpoint?:string;linkEndpoint?:string;storage?:Storage;navigation?:{assign(url:string):void};fetchImpl?:typeof fetch};
export declare class AnevumAchievementBrowser {
 constructor(options:AnevumBrowserOptions);
 readonly projectId:string;
 readonly achievements:{readonly unlock:(key:string)=>Promise<unknown>};
 connect():void;
 finishConnection(options?:{callbackUrl?:string}):Promise<unknown>;
 unlock(stableKey:string):Promise<unknown>;
}
export declare function createAnevumAchievements(options:AnevumBrowserOptions):AnevumAchievementBrowser;
