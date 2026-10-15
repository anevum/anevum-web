export type Category = "tools" | "games" | "automation" | "research" | "creative" | "learning" | "libraries" | "other";

export interface Project {
  id: string;
  slug: string | null;
  title: string;
  summary: string;
  category: Category;
  sourceUrl: string | null;
  demoUrl: string | null;
  freeToUse: boolean;
  license: string | null;
  publishedAt: string | null;
  creatorHandle: string;
  creatorName: string;
  description?: string | null;
  aiDisclosure?: string | null;
  humanContribution?: string | null;
}

export interface PublicRepositoryMetadata {
  provider: "github";
  sourceUrl: string;
  fullName: string;
  description: string;
  language: string | null;
  license: string | null;
  archived: boolean;
  observedAt: string;
  ownershipVerified: false;
  notice: string;
}

export interface Creator {
  handle: string;
  displayName: string;
  publishedProjects: number;
}

export interface Status {
  version: string;
  phase: string;
  counts: { publishedProjects: number; publishedCreators: number };
  features?: Record<string, boolean>;
}

/** Moderated, public-only community posts. Future staging endpoint remains fail-closed
 * until a real review queue and moderation backend are accepted.
 */
export interface CommunityPost {
  id:string;
  title:string;
  excerpt:string;
  authorHandle:string;
  authorName:string;
  topic:string;
  publishedAt:string;
  score:number;
  replyCount:number;
  project?: Pick<Project,"id"|"title"|"category"|"creatorHandle"|"creatorName"> | null;
}
/** Explicitly public earned recognition, never client-awarded progression. */
export interface PublicCreatorShowcase {
 handle:string; level:number; currentArtifact:string|null;
 equippedArtifact:{name:string;series:string}|null;
 featuredAwards:{key:string;name:string;description:string}[];
 earnedAwardCount:number;
}
export interface PublicShowcasesResult {
 source:"verified-creator-ledger"; items:Record<string,PublicCreatorShowcase>;
}
export type CommunityPostSort="hot"|"new";
export interface CommunityPostDetail extends CommunityPost {body:string}
export interface CommunityPostReply {
 id:string;body:string;publishedAt:string;authorHandle:string;authorName:string;
}
export interface CommunityPostsPage {
  items:CommunityPost[];
  count:number;
  nextCursor:string|null;
  sort:CommunityPostSort;
}

export interface PublicBoards {
  source: "approved-public-projects";
  labels: { latestReleases: string; firstLooks: string; publishingCreators: string };
  latestReleases: Project[];
  firstLooks: Project[];
  publishingCreators: Creator[];
  qualityRankingAvailable: false;
}

export interface CategoryCount { category: Category; count: number }
export interface PageResult<T> { items: T[]; count: number; nextCursor: string | null }

// Public catalogue API is served within the isolated /creator/ path in staging.
const PUBLIC_API_ROOT = import.meta.env.BASE_URL === "/creator/" ? "/creator/api/v1" : "/api/v1";
const publicPath = (path: string) => PUBLIC_API_ROOT + path;

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(path, {
    method: "GET",
    credentials: "omit",
    cache: "no-store",
    headers: { Accept: "application/json" },
    signal
  });
  if (!response.ok) {
    const error = new Error(response.status === 404 ? "not-found" : "unavailable");
    Object.assign(error, { status: response.status });
    throw error;
  }
  return response.json() as Promise<T>;
}

export function readStatus(signal?: AbortSignal) {
  return getJson<Status>(publicPath("/status"), signal);
}
export function readCategories(signal?: AbortSignal) {
  return getJson<{ categories: CategoryCount[] }>(publicPath("/categories"), signal);
}
export function readProjects(params: Record<string, string | undefined> = {}, signal?: AbortSignal) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value) query.set(key, value);
  if (!query.has("limit")) query.set("limit", "24");
  return getJson<PageResult<Project>>(publicPath("/projects?") + query.toString(), signal);
}
export function readProject(id: string, signal?: AbortSignal) {
  return getJson<{ item: Project }>(publicPath("/projects/") + encodeURIComponent(id), signal);
}
export function readRepository(id:string,signal?:AbortSignal) {
  return getJson<{repository:PublicRepositoryMetadata}>(publicPath("/projects/")+encodeURIComponent(id)+"/repository",signal);
}

export function readCommunityPosts(params:{sort?:CommunityPostSort;limit?:string;project?:string;creator?:string}={},signal?:AbortSignal){
  const query=new URLSearchParams();
  for(const [key,value] of Object.entries(params))if(value)query.set(key,value);
  if(!query.has("sort"))query.set("sort","hot");
  if(!query.has("limit"))query.set("limit","6");
  return getJson<CommunityPostsPage>(publicPath("/community/posts?")+query.toString(),signal);
}

export function readCommunityPost(id:string,signal?:AbortSignal){
  return getJson<{post:CommunityPostDetail;replies:CommunityPostReply[]}>(
    publicPath("/community/posts/")+encodeURIComponent(id),signal);
}

/** Read-only verified publication boards; no client-generated popularity score. */
export function readPublicBoards(signal?: AbortSignal) {
  return getJson<PublicBoards>(publicPath("/boards"), signal);
}

export function readCreators(params: Record<string, string | undefined> = {}, signal?: AbortSignal) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value) query.set(key, value);
  if (!query.has("limit")) query.set("limit", "24");
  return getJson<PageResult<Creator>>(publicPath("/creators?") + query.toString(), signal);
}
/** Bounded anonymous same-origin lookup; gated/unknown response fails closed. */
export async function readPublicShowcases(handles:readonly string[],signal?:AbortSignal){
 if(handles.length<1||handles.length>10||
   handles.some(handle=>! /^[a-z][a-z0-9_]{2,29}$/.test(handle))||
   new Set(handles).size!==handles.length)throw new Error("Invalid showcase author selection");
 const response=await getJson<PublicShowcasesResult>(
   publicPath("/community/showcases?handles=")+encodeURIComponent(handles.join(",")),signal);
 if(response.source!=="verified-creator-ledger"||!response.items||
   typeof response.items!=="object"||Array.isArray(response.items))
   throw new Error("Unverified public showcase response");
 const items:Record<string,PublicCreatorShowcase>={};
 for(const handle of handles){
   const item=response.items[handle];
   if(!item||item.handle!==handle||!Number.isSafeInteger(item.level)||item.level<1||
     (item.currentArtifact!==null&&typeof item.currentArtifact!=="string")||
     (item.equippedArtifact!==null&&(!item.equippedArtifact||
       typeof item.equippedArtifact.name!=="string"||typeof item.equippedArtifact.series!=="string"))||
     !Array.isArray(item.featuredAwards)||item.featuredAwards.length>3||
     item.featuredAwards.some(a=>!a||typeof a.key!=="string"||
       typeof a.name!=="string"||typeof a.description!=="string")||
     !Number.isSafeInteger(item.earnedAwardCount)||item.earnedAwardCount<0)continue;
   items[handle]=item;
 }
 return {source:"verified-creator-ledger" as const,items};
}
export function readCreator(handle: string, signal?: AbortSignal) {
  return getJson<{ creator: Creator }>(publicPath("/creators/") + encodeURIComponent(handle), signal);
}
export function safeExternal(value: string | null | undefined): URL | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443")) return null;
    const host = url.hostname.toLowerCase();
    if (!host.includes(".") || /^\d+\.\d+\.\d+\.\d+$/.test(host) || host.includes(":") ||
        /(?:^|\.)(?:localhost|local|internal|test|invalid)$/.test(host)) return null;
    for (const key of url.searchParams.keys()) {
      if (/^(?:token|access_token|api_key|secret|password)$/i.test(key)) return null;
    }
    return url;
  } catch {
    return null;
  }
}
