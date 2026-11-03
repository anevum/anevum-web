/**
 * Fail-closed editorial validator for the fourteen added Transcosmic Now-window
 * review articles and their 22-entry wiki graph.
 *
 * This is not a public release switch. The separate original 8-entry manifest,
 * private canon, Website Publishing Queue and author approval are unchanged.
 *
 * Raw Notion pages, unreviewed canon, future-book notes and source URLs must
 * never be imported here. Deliberate editorial changes require reviewing the
 * content change AND changing the frozen Git blob digest in this validator.
 */
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const FILES={
  a:"src/data/transcosmic-wiki-expansion-a.json",
  b:"src/data/transcosmic-wiki-expansion-b.json",
  links:"src/data/transcosmic-wiki-relations.json",
  original:"src/data/transcosmic-reader-preview.json"
};
const PINNED_GIT_BLOBS={
  a:"ac7afac1ed1830f98f501ba2e894a292400dad1e",
  b:"ffd2b8acdc13f3af1c12d43e330a23371df15646",
  links:"045a55980cea09d50f0312fa8202fd9e73940710"
};
const ALLOWED_NEW=[
  ["09","cape-serein","Cape Serein","Place"],
  ["10","continuance-institute","Continuance Institute","Institution"],
  ["11","d3-17","D3-17","History"],
  ["12","deep-three","Deep Three","Place"],
  ["13","elias-venn","Elias Venn","Person"],
  ["14","grainit","GRAINIT","Science"],
  ["15","greater-serein","Greater Serein","Place"],
  ["16","ione","Ione","World"],
  ["17","iren","IREN","Science"],
  ["18","lio-sol","Lio Sol","Person"],
  ["19","rena-sol","Rena Sol","Person"],
  ["20","skygate-age","Skygate Age","History"],
  ["21","skygate-megastructure","Skygate Megastructure","Infrastructure"],
  ["22","talin-vel","Talin Vel","Person"]
];
const CATEGORIES=new Set(["World","Person","Place","Infrastructure","Institution","Science","History"]);
const ENTRY_KEYS=["id","slug","title","category","subtitle","summary","detail","keywords"];
const RELATION_KEYS=["slug","relation"];
const ROOT_KEYS=["schema","releaseState","publicationApproved","publicQueueEnabled","entries"];
const LINK_KEYS=["schema","releaseState","publicationApproved","relationships","bridges"];
const WITHHELD=/\b(?:Anel Varo|Kalen Tor|Kerin Solan|Selian Ort|Ovaran Contact Forum|North Works|Jon Zero|Part IV|Chapter 43|first physical visitor|first-complete-traveler|first complete human traveler|invitation authorization|Ovaran arrival|physical crossing to Ovara|Elias.*Neral.*death|post-book outcome)\b/i;
const FORBIDDEN=/(?:https?:\/\/|notion:|file_[0-9a-f]{12}|<\/?[a-z][\s>]|[\u0000-\u0008\u000B\u000C\u000E-\u001F])/i;

function exactKeys(o,keys){
  return o!==null&&typeof o==="object"&&!Array.isArray(o)&&
    JSON.stringify(Object.keys(o).sort())===JSON.stringify([...keys].sort());
}
function safeText(v,where,limit,issues){
  if(typeof v!=="string"||v.length<(limit===90?3:8)||v.length>limit||v!==v.trim()||
     WITHHELD.test(v)||FORBIDDEN.test(v)){
    issues.push(where+": invalid or restricted reader copy");
  }
}
export function readWikiFiles() {
  return Object.fromEntries(Object.entries(FILES).map(([key,file])=>
    [key,JSON.parse(readFileSync(path.join(root,file),"utf8"))]));
}
export function validateWikiExpansion({a,b,links,original}){
  const issues=[];
  for(const [key,part,expected,start] of [["a",a,"transcosmic.wiki-expansion.part-a.v1",0],["b",b,"transcosmic.wiki-expansion.part-b.v1",7]]){
    if(!exactKeys(part,ROOT_KEYS)){
      issues.push(key+": invalid schema fields");
      continue;
    }
    if(part.schema!==expected||part.releaseState!=="review_only"||
       part.publicationApproved!==false||part.publicQueueEnabled!==false)
      issues.push(key+": publication is not authorized");
    if(!Array.isArray(part.entries)||part.entries.length!==7){
      issues.push(key+": expected seven curated entries");
      continue;
    }
    for(const [i,entry] of part.entries.entries()){
      const allowed=ALLOWED_NEW[start+i];
      if(!exactKeys(entry,ENTRY_KEYS)){issues.push(key+"["+i+"]: unexpected article field");continue;}
      if(JSON.stringify([entry.id,entry.slug,entry.title,entry.category])!==JSON.stringify(allowed)||
         !CATEGORIES.has(entry.category))
        issues.push(key+"["+i+"]: unreviewed title, id, slug or category");
      for(const [field,max] of [["subtitle",150],["summary",500],["detail",1400],["keywords",240]])
        safeText(entry[field],key+"["+i+"]."+field,max,issues);
      if(typeof entry.detail==="string"&&!entry.detail.includes("\n\n"))
        issues.push(key+"["+i+"]: missing separate encyclopedia context paragraphs");
    }
  }
  const oldSlugs=Array.isArray(original?.entries)?original.entries.map(e=>e.slug):[];
  const newSlugs=Array.isArray(a?.entries)&&Array.isArray(b?.entries)?
    [...a.entries,...b.entries].map(e=>e.slug):[];
  const slugs=[...oldSlugs,...newSlugs];
  if(oldSlugs.length!==8||newSlugs.length!==14||new Set(slugs).size!==22)
    issues.push("wiki: expected exactly 22 unique reader pages");
  if(!exactKeys(links,LINK_KEYS)){
    issues.push("links: invalid schema fields");
    return issues;
  }
  if(links.schema!=="transcosmic.wiki-relations.v1"||
     links.releaseState!=="review_only"||links.publicationApproved!==false)
    issues.push("links: not a publishing feed");
  for(const [kind,graph,allowedSources] of [
    ["relations",links.relationships,newSlugs],
    ["bridges",links.bridges,["veyra","neral","serein-skygate","neral-skygate","open-road"]]
  ]){
    if(!graph||!exactKeys(graph,allowedSources)){
      issues.push(kind+": unexpected/missing source slugs");
      continue;
    }
    for(const [source,edges] of Object.entries(graph)){
      if(!Array.isArray(edges)||edges.length>8){
        issues.push(kind+"."+source+": invalid connections");
        continue;
      }
      const targets=new Set();
      for(const [i,edge] of edges.entries()){
        if(!exactKeys(edge,RELATION_KEYS)){issues.push(kind+"."+source+"["+i+"]: invalid edge keys");continue;}
        if(!slugs.includes(edge.slug)||edge.slug===source||targets.has(edge.slug))
          issues.push(kind+"."+source+"["+i+"]: unknown, self or duplicate link");
        safeText(edge.relation,kind+"."+source+"["+i+"].relation",90,issues);
        targets.add(edge.slug);
      }
    }
  }
  const matureRoadNetwork=["skygate-age","skygate-megastructure","open-road","serein-skygate","neral-skygate","veyra","neral"];
  const disconnectedOvaraSubjects=new Set(["ovara","merva","nali-solan"]);
  for(const source of matureRoadNetwork){
    const edges=[...(links.relationships?.[source]||[]),...(links.bridges?.[source]||[])];
    if(edges.some(edge=>disconnectedOvaraSubjects.has(edge.slug)))
      issues.push("wiki: unreviewed Road-to-Ovara relation from "+source);
  }
  if(links.bridges?.ovara||links.bridges?.merva||links.bridges?.["nali-solan"])
    issues.push("wiki: Ovara has no implied connection to the Veyra–Neral Road");
  const lateNames=["Anel Varo","Kalen Tor","Kerin Solan","Selian Ort","North Works","Ovaran Contact Forum"];
  for(const withheld of lateNames){
    const text=JSON.stringify([a?.entries,b?.entries]);
    if(text.includes(withheld))issues.push("wiki: staged later-window subject leaked");
  }
  return issues;
}
export function gitBlobSha(buffer){
  return createHash("sha1").update(Buffer.concat([
    Buffer.from("blob "+buffer.length+"\0","utf8"),buffer
  ])).digest("hex");
}
function main(){
  try{
    const files=readWikiFiles(),errors=validateWikiExpansion(files);
    for(const [key,expected] of Object.entries(PINNED_GIT_BLOBS)){
      const observed=gitBlobSha(readFileSync(path.join(root,FILES[key])));
      if(observed!==expected)errors.push(key+": unreviewed change to frozen reader copy or graph");
    }
    if(errors.length){
      for(const issue of errors)console.error("Wiki expansion BLOCKED: "+issue);
      process.exitCode=1;
    }else console.log("Wiki expansion validated: 22 unique reader candidates, 7 categories, 14 frozen additions and explicit links; publication remains OFF.");
  }catch(e){
    console.error("Wiki expansion BLOCKED: malformed or unavailable content");
    process.exitCode=1;
  }
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main();
