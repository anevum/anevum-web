/** Retired promotional visual kit.
 * The V010 image backgrounds are not an authorized presentation source.
 * This module preserves public route classification for callers but never
 * fetches an optional art pack or accesses private member content.
 */
export type VisualRoom="home"|"discover"|"community"|"people"|"create"|"learning"|"notes";
export async function checkVisualKit():Promise<boolean>{return false;}
export function publicVisualRoom(path:string):VisualRoom|null{
 if(path==="/")return "home";
 if(path==="/discover"||path.startsWith("/discover/"))return "discover";
 if(path==="/community"||path.startsWith("/community/")||path==="/boards")return "community";
 if(path==="/creators"||path.startsWith("/creators/"))return "people";
 if(path==="/start"||path==="/guide")return "learning";
 if(path==="/status")return "notes";
 return null; // account, messages, create, Lab, staff and RHEN remain excluded.
}
export function VisualKitAtmosphere(_props:{room:VisualRoom|null;placement?:"page"|"hero"}){
 return null; // No static imagery, network fetch, or generated picture layer.
}
