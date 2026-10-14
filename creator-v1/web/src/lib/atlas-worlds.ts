import type {Category} from "./api";
import type {CosmicScene} from "../components/CosmicIllustration";

export type AtlasWorldId =
  | "discover" | "play" | "apps" | "creative" | "studio"
  | "commons" | "collaborate" | "signals" | "artifacts" | "identity";

export type AtlasWorld = {
  id:AtlasWorldId;
  title:string;
  overline:string;
  tagline:string;
  description:string;
  type:"catalogue"|"participation"|"roadmap";
  status:"public"|"invited"|"planned";
  route:string;
  action:string;
  category?:Category;
  scene:CosmicScene;
  accent:string;
  number:string;
  coordinates:readonly [number,number,number];
  glyph:string;
};

// Fixed first-party destinations, not creator-controlled URLs or invented social activity.
// Future data-driven worlds require moderated project and room APIs.
export const ATLAS_WORLDS:readonly AtlasWorld[]=[
  {
    id:"discover",title:"DISCOVER",overline:"THE CENTRAL SIGNAL",
    tagline:"Something worth finding.",description:"Move through real approved games, tools, experiments and creators. This deck reads the public catalogue, not fabricated recommendations.",
    type:"catalogue",status:"public",route:"/discover",action:"OPEN DISCOVERY",
    scene:"portal",accent:"#e8c28a",number:"00",coordinates:[0,.12,.92],glyph:"✧"
  },
  {
    id:"play",title:"PLAY",overline:"THE ARCADE",
    tagline:"Enter someone else's imagination.",description:"Discover playable independent games. ANEVUM-hosted games remain under separate security and hosting review; existing real demo links lead to their approved destinations.",
    type:"catalogue",status:"public",route:"/discover?category=games",action:"FIND GAMES",category:"games",
    scene:"games",accent:"#84d7fe",number:"01",coordinates:[-3.05,.62,.75],glyph:"◆"
  },
  {
    id:"apps",title:"TOOLS",overline:"THE WORKSHOP",
    tagline:"Useful things made by people.",description:"Find authentic applications and helpful utilities, with truthful source and demo links.",
    type:"catalogue",status:"public",route:"/discover?category=tools",action:"EXPLORE TOOLS",category:"tools",
    scene:"tools",accent:"#8fe1d0",number:"02",coordinates:[3.05,.88,-.48],glyph:"⌘"
  },
  {
    id:"creative",title:"CREATE",overline:"THE IMAGINATION FIELD",
    tagline:"Art. Experiments. Unusual ideas.",description:"Explore creative work, prototypes and AI-assisted experiments alongside traditionally built work.",
    type:"catalogue",status:"public",route:"/discover?category=creative",action:"EXPLORE CREATIONS",category:"creative",
    scene:"creative",accent:"#f7a8e9",number:"03",coordinates:[-3.65,-1.3,-.6],glyph:"✺"
  },
  {
    id:"studio",title:"STUDIO",overline:"THE CREATOR DECK",
    tagline:"Make something yours.",description:"Private member project drafts and submissions. Publishing and native uploads remain gated behind the existing invitation and review workflow.",
    type:"participation",status:"invited",route:"/create",action:"OPEN CREATOR WORKSPACE",
    scene:"automation",accent:"#f0b98a",number:"04",coordinates:[.35,2.18,-1.1],glyph:"✦"
  },
  {
    id:"commons",title:"COMMONS",overline:"THE MEETING GROUND",
    tagline:"The conversation around the work.",description:"Public community information and authentic project participation. Broader discussion rooms are not live until moderation acceptance.",
    type:"participation",status:"public",route:"/community",action:"VISIT COMMUNITY",
    scene:"other",accent:"#c0b2fa",number:"05",coordinates:[3.12,-1.2,.55],glyph:"◎"
  },
  {
    id:"collaborate",title:"COLLAB",overline:"THE SHARED WORKSPACE",
    tagline:"Build together in a living room.",description:"Planned project-based teams with roles, shared assets, discussion, review and presence. No live shared editing or collaborator invitations are available yet.",
    type:"roadmap",status:"planned",route:"/workspace",action:"VIEW WORKSPACE ROADMAP",
    scene:"libraries",accent:"#9fe7dd",number:"06",coordinates:[1.83,1.64,1.35],glyph:"⟡"
  },
  {
    id:"signals",title:"SIGNALS",overline:"THE COMMUNICATION LAYER",
    tagline:"Stay connected to what matters.",description:"Planned opt-in notifications, message inbox, invitations and project updates. No live message counts or simulated conversations.",
    type:"roadmap",status:"planned",route:"/community",action:"EXPLORE COMMUNITY",
    scene:"research",accent:"#aac5ff",number:"07",coordinates:[1.61,-2.28,-.72],glyph:"⌁"
  },
  {
    id:"artifacts",title:"ARTIFACTS",overline:"EARNED RECOGNITION",
    tagline:"Your contributions become your story.",description:"Learn about server-verified XP, unlimited levels and earned collectibles. Level-up animations will use confirmed server events, not navigation or random rewards.",
    type:"participation",status:"public",route:"/levels",action:"EXPLORE LEVELS",
    scene:"learning",accent:"#efd9a5",number:"08",coordinates:[-1.78,2.17,-1.25],glyph:"✶"
  },
  {
    id:"identity",title:"IDENTITY",overline:"YOUR CORNER OF THE UNIVERSE",
    tagline:"A world that feels like you.",description:"Personal profiles, a saved library and future customization. Private account access remains invitation-only until acceptance.",
    type:"participation",status:"invited",route:"/account",action:"OPEN MY SPACE",
    scene:"hero",accent:"#ffa98e",number:"09",coordinates:[-1.9,-2.75,1.26],glyph:"◈"
  }
];
export const ATLAS_WORLD_BY_ID=new Map(ATLAS_WORLDS.map(world=>[world.id,world]));
export const ATLAS_LINKS:readonly (readonly [AtlasWorldId,AtlasWorldId])[]=[
  ["discover","play"],["discover","apps"],["discover","creative"],["discover","studio"],
  ["discover","commons"],["discover","collaborate"],["discover","signals"],
  ["discover","artifacts"],["discover","identity"],["play","creative"],["apps","collaborate"],
  ["studio","collaborate"],["commons","signals"],["artifacts","identity"]
];

/** Accessible compact constellation layout for narrow phones (three columns, four rows).
 * Points are independent of genuine project/category data and never encode rankings.
 */
export const ATLAS_MOBILE_LAYOUT:Readonly<Record<AtlasWorldId,readonly [number,number]>>={
  discover:[0,-4.8],play:[-2.7,-4.8],apps:[2.7,-4.8],
  creative:[-2.7,-1.6],studio:[0,-1.6],commons:[2.7,-1.6],
  artifacts:[-2.7,1.6],collaborate:[0,1.6],signals:[2.7,1.6],
  identity:[0,4.8]
};
