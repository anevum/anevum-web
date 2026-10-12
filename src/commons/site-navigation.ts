/**
 * One source of truth for public, member and mobile ANEVUM V5 navigation.
 * Links describe destinations, not permission to publish or run software.
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
  {path:"/updates",label:"Updates",icon:"file",description:"Studio and AHA publications"},
  {path:"/beta",label:"Member access",icon:"check",description:"Account and testing availability"},
  {path:"/discover",label:"Discover apps",icon:"compass",description:"Independent creator projects and external apps"}
].map(item=>Object.freeze(item)));

export const accountNavigation:ReadonlyArray<SiteNavItem> = Object.freeze([
  {path:"/command",label:"Saved programs",icon:"bookmark",description:"My saved projects and follows"},
  {path:"/me/settings",label:"My profile",icon:"user",description:"Personal profile and account controls"},
  {path:"/apps/rhen",label:"My RHEN workspace",icon:"chart",description:"Private non-executing research tools"},
  {path:"/me/beta",label:"Member checklist",icon:"check",description:"Available account tests"},
  {path:"/library",label:"Creator library",icon:"bookmark",description:"My private saved creator projects"},
  {path:"/publish",label:"Publish a project",icon:"plus",description:"Private drafts and reviewed external project listings"}
].map(item=>Object.freeze(item)));

export const mobileNavigation:ReadonlyArray<SiteNavItem> = Object.freeze([
  primaryNavigation[0],primaryNavigation[1],primaryNavigation[3],primaryNavigation[5],accountNavigation[0]
]);

/** Shared active state for public and private destinations. */
export function isSiteNavigationActive(pathname:string, target:string):boolean {
  if(pathname==="/feed")return target==="/";
  if(target==="/")return pathname==="/";
  if(target==="/beta")return pathname==="/beta"||pathname==="/me/beta";
  if(target==="/command")return pathname==="/command"||
    pathname.startsWith("/command/")||
    pathname==="/me"||pathname==="/me/rewards";
  if(target==="/me/settings")return pathname==="/me/settings";
  if(target==="/me/beta")return pathname==="/me/beta";
  if(target==="/discover")return pathname==="/discover"||pathname.startsWith("/projects/");
  return pathname===target||pathname.startsWith(target+"/");
}

export function safeAccountDestination(authenticated:boolean):string {
  return authenticated?"/command":"/sign-in";
}
