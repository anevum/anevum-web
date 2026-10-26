/**
 * ANEVUM Creator V1 information architecture — route presentation ONLY.
 * Reuses existing routes, auth boundaries and the approved cinematic surfaces.
 * No new member API, message endpoint, upload capability or XP grants.
 */
export type SiteLink = {
  readonly key:string;
  readonly label:string;
  readonly to:string;
  readonly icon:string;
  readonly detail:string;
};

/** The sole canonical navigation ordering for both website headers.
 * The legacy desktop header is intentionally smaller; the V136 header
 * includes Studio, while both retain the same canonical route strings.
 */
export type HeaderDestination=Readonly<{to:string;label:string;parityOnly:boolean}>;
export const HEADER_NAV:readonly HeaderDestination[]=[
  {to:"/",label:"Home",parityOnly:false},
  {to:"/discover",label:"Discover",parityOnly:false},
  {to:"/community",label:"Community",parityOnly:false},
  {to:"/creators",label:"Creators",parityOnly:false},
  {to:"/studio",label:"Studio",parityOnly:true}
];

export const PRIMARY_NAV:readonly SiteLink[]=[
  {key:"home",label:"Home",to:"/",icon:"home",detail:"Community dashboard"},
  {key:"discover",label:"Discover",to:"/discover",icon:"explore",detail:"Creations and creator channels"},
  {key:"community",label:"Community",to:"/community",icon:"community",detail:"Public conversations and project forums"},
  {key:"account",label:"Account",to:"/member",icon:"people",detail:"Your verified identity and personal world"}
];

export const DISCOVERY_NAV:readonly SiteLink[]=[
  {key:"creators",label:"Creators",to:"/creators",icon:"people",detail:"Public creator channels"},
  {key:"levels",label:"Evolution Levels",to:"/levels",icon:"star",detail:"Thirty permanent evolutionary specimens"},
  {key:"recognition",label:"Badge Archive",to:"/recognition",icon:"star",detail:"Achievement badges, ribbons and rare medals"},
  {key:"guide",label:"Field Guide",to:"/guide",icon:"library",detail:"Guides and learning"}
];

export const MEMBER_NAV:readonly SiteLink[]=[
  {key:"studio",label:"Creator Studio",to:"/studio",icon:"create",detail:"Private projects and moderated submissions"},
  {key:"library",label:"Saved Library",to:"/library",icon:"library",detail:"Your saved, approved creations"},
  {key:"profile",label:"Profile Settings",to:"/member?tab=profile",icon:"people",detail:"Your verified member profile, handle and visibility"}
];

export const SUPPORT_NAV:readonly SiteLink[]=[
  {key:"start",label:"Start Here",to:"/start",icon:"explore",detail:"Introduction"},
  {key:"status",label:"Build Status",to:"/status",icon:"status",detail:"Verified feature availability"},
];

// Messages and collaboration are NOT navigable until independently authorized,
// privacy-reviewed and deployed. Their proposed contract lives in build docs.
export function isSiteLinkSelected(pathname:string,to:string):boolean{
  if(to==="/")return pathname==="/";
  if(to==="/member"||to==="/member?tab=profile")return pathname==="/member"||pathname==="/member/setup";
  if(to==="/studio")return pathname==="/studio"||pathname.startsWith("/studio/")||pathname==="/account/studio"||pathname==="/create"||pathname.startsWith("/create/");
  if(to==="/discover")return pathname==="/discover";
  // Public channel and Commons detail pages belong to their parent station.
  // Bound to an actual slash so /community-other cannot impersonate Commons.
  if(to==="/community"||to==="/creators")
    return pathname===to||pathname.startsWith(to+"/");
  return pathname===to;
}
