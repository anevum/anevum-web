/**
 * One source of truth for public, member and mobile ANEVUM V5 navigation.
 * These entries are always real routes. A link never implies enabled
 * brokerage, social posting, rewards, or access to owner operations.
 */
export type SiteNavItem = Readonly<{
  path:string;
  label:string;
  icon:string;
  description:string;
}>;

export const primaryNavigation:ReadonlyArray<SiteNavItem> = Object.freeze([
  {path:"/",label:"Commons",icon:"home",description:"Published ANEVUM work"},
  {path:"/products",label:"Projects",icon:"compass",description:"Real applications and status"},
  {path:"/communities",label:"Topics",icon:"users",description:"Explore research categories"},
  {path:"/learn",label:"Learning",icon:"book",description:"Methods and open resources"},
  {path:"/field-notes",label:"Field Notes",icon:"book",description:"Research and engineering records"},
  {path:"/beta",label:"Member access",icon:"check",description:"Account and testing availability"}
].map(item=>Object.freeze(item)));

export const accountNavigation:ReadonlyArray<SiteNavItem> = Object.freeze([
  {path:"/command",label:"Saved programs",icon:"bookmark",description:"My saved projects and follows"},
  {path:"/me/settings",label:"My profile",icon:"user",description:"Personal profile and account controls"},
  {path:"/apps/rhen",label:"My RHEN workspace",icon:"chart",description:"Private non-executing research tools"},
  {path:"/me/beta",label:"Member checklist",icon:"check",description:"Available account tests"}
].map(item=>Object.freeze(item)));

export const mobileNavigation:ReadonlyArray<SiteNavItem> = Object.freeze([
  primaryNavigation[0],primaryNavigation[1],primaryNavigation[2],primaryNavigation[4],accountNavigation[0]
]);

/** All route highlighting uses this function, irrespective of navbar size.
 * The /feed compatibility alias belongs to the Commons section.
 * /me/beta belongs to member access, but not to generic Command.
 */
export function isSiteNavigationActive(pathname:string, target:string):boolean {
  if(pathname==="/feed")return target==="/";
  if(target==="/")return pathname==="/";
  if(target==="/beta")return pathname==="/beta"||pathname==="/me/beta";
  if(target==="/command")return pathname==="/command"||
    pathname.startsWith("/command/")||
    pathname==="/me"||pathname==="/me/rewards";
  if(target==="/me/settings")return pathname==="/me/settings";
  if(target==="/me/beta")return pathname==="/me/beta";
  return pathname===target||pathname.startsWith(target+"/");
}

export function safeAccountDestination(authenticated:boolean):string {
  return authenticated?"/command":"/sign-in";
}
