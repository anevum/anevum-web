export type PortalDestination = {
  id: string;
  title: string;
  description: string;
  path: string;
  category: "Explore" | "Community" | "Account";
  icon: string;
  keywords: string;
  gated?: true;
};

// Fixed first-party paths only. No URLs, external redirects or fabricated records.
export const PORTAL_DESTINATIONS: readonly PortalDestination[] = [
  {id:"home",title:"The Portal",description:"Return to the ANEVUM entrance",path:"/",category:"Explore",icon:"home",keywords:"home frontpage main"},
  {id:"start",title:"Start Here",description:"Choose a path through the underground",path:"/start",category:"Explore",icon:"explore",keywords:"onboarding welcome first visit"},
  {id:"discover",title:"Discover All",description:"Browse genuine public releases",path:"/discover",category:"Explore",icon:"search",keywords:"search projects catalogue browse"},
  {id:"games",title:"Games & Play",description:"Find independently made games",path:"/discover?category=games",category:"Explore",icon:"star",keywords:"arcade play interactive"},
  {id:"tools",title:"Apps & Tools",description:"Find practical software and utilities",path:"/discover?category=tools",category:"Explore",icon:"create",keywords:"apps software utility"},
  {id:"creative",title:"Creative / AI",description:"Explore experiments and creative work",path:"/discover?category=creative",category:"Explore",icon:"star",keywords:"creative ai art"},
  {id:"libraries",title:"Open Source",description:"Discover public code and libraries",path:"/discover?category=libraries",category:"Explore",icon:"explore",keywords:"github code libraries"},
  {id:"automation",title:"Automation",description:"Explore useful workflows",path:"/discover?category=automation",category:"Explore",icon:"status",keywords:"scripts bots automation workflow"},
  {id:"research",title:"Research",description:"Explore evidence and experiments",path:"/discover?category=research",category:"Explore",icon:"search",keywords:"research mathematics science"},
  {id:"learning",title:"Learning",description:"Guides and educational work",path:"/discover?category=learning",category:"Explore",icon:"star",keywords:"education learn tutorials"},
  {id:"other",title:"More Creations",description:"Everything that crosses categories",path:"/discover?category=other",category:"Explore",icon:"explore",keywords:"miscellaneous other"},
  {id:"free",title:"Marked Free",description:"Filter public projects marked free-to-use",path:"/discover?free=1",category:"Explore",icon:"save",keywords:"free zero cost"},
  {id:"creators",title:"Creators",description:"Visit public creator channels",path:"/creators",category:"Community",icon:"people",keywords:"members people maker profiles"},
  {id:"community",title:"The Commons",description:"Community rooms and launch boundaries",path:"/community",category:"Community",icon:"community",keywords:"commons threads forum conversations"},
  {id:"guide",title:"Field Guide",description:"Twelve free practice decisions",path:"/guide",category:"Community",icon:"star",keywords:"practice safety guide skills"},
  {id:"levels",title:"Levels & Artifacts",description:"See how earned progression is designed",path:"/levels",category:"Community",icon:"star",keywords:"xp achievements medals badges unlimited"},
  {id:"status",title:"Build Status",description:"What is deployed and what is still gated",path:"/status",category:"Community",icon:"status",keywords:"development roadmap release"},
  {id:"account",title:"My Account",description:"Invitation-only member workspace",path:"/account",category:"Account",icon:"people",keywords:"profile settings signin login",gated:true},
  {id:"library",title:"My Library",description:"Saved projects for invited members",path:"/library",category:"Account",icon:"library",keywords:"saved bookmarks favorites",gated:true},
  {id:"create",title:"Creator Workspace",description:"Private drafts and creator tools for invited members",path:"/create",category:"Account",icon:"create",keywords:"submit upload drafts studio",gated:true}
];

const clean = (s:string) => s.trim().toLocaleLowerCase("en").replace(/\s+/g," ");
export function findPortalDestinations(search:string): PortalDestination[] {
  const query=clean(search).slice(0,100);
  if (!query) return PORTAL_DESTINATIONS.filter(x=>["start","discover","games","tools","community","guide","status"].includes(x.id));
  const words=query.split(" ").filter(Boolean);
  if(words.length===0) return [];
  return PORTAL_DESTINATIONS
    .map(item=>{
      const title=clean(item.title),id=item.id,description=clean(item.description),keys=clean(item.keywords);
      if(!words.every(word=>title.includes(word)||id.includes(word)||description.includes(word)||keys.includes(word))) return {item,score:-1};
      const score=words.reduce((n,word)=>n+(title===word?25:title.startsWith(word)?12:title.includes(word)?8:id.includes(word)?5:keys.includes(word)?3:1),0);
      return {item,score};
    })
    .filter(x=>x.score>=0)
    .sort((a,b)=>b.score-a.score||PORTAL_DESTINATIONS.indexOf(a.item)-PORTAL_DESTINATIONS.indexOf(b.item))
    .slice(0,9).map(x=>x.item);
}

export function publishedSearchPath(input:string):string|null {
  const query=input.trim();
  if (!query || query.length>100 || /[\u0000-\u001f\u007f]/.test(query)) return null;
  return "/discover?"+new URLSearchParams({q:query}).toString();
}

export function isEditableTarget(value:EventTarget|null):boolean {
  if (!value || typeof value!=="object") return false;
  const el=value as Element;
  if (typeof el.closest!=="function") return false;
  return Boolean(el.closest("input,textarea,select,[contenteditable='true'],[role='textbox']"));
}
