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

export interface CategoryCount { category: Category; count: number }
export interface PageResult<T> { items: T[]; count: number; nextCursor: string | null }

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
  return getJson<Status>("/api/v1/status", signal);
}
export function readCategories(signal?: AbortSignal) {
  return getJson<{ categories: CategoryCount[] }>("/api/v1/categories", signal);
}
export function readProjects(params: Record<string, string | undefined> = {}, signal?: AbortSignal) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value) query.set(key, value);
  if (!query.has("limit")) query.set("limit", "24");
  return getJson<PageResult<Project>>("/api/v1/projects?" + query.toString(), signal);
}
export function readProject(id: string, signal?: AbortSignal) {
  return getJson<{ item: Project }>("/api/v1/projects/" + encodeURIComponent(id), signal);
}
export function readCreators(params: Record<string, string | undefined> = {}, signal?: AbortSignal) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value) query.set(key, value);
  if (!query.has("limit")) query.set("limit", "24");
  return getJson<PageResult<Creator>>("/api/v1/creators?" + query.toString(), signal);
}
export function readCreator(handle: string, signal?: AbortSignal) {
  return getJson<{ creator: Creator }>("/api/v1/creators/" + encodeURIComponent(handle), signal);
}
export function safeExternal(value: string | null | undefined): URL | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    if (!url.hostname.includes(".")) return null;
    return url;
  } catch {
    return null;
  }
}
