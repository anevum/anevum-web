import { loadSession, type MemberSession } from "./memberClient";

export type WikiCategory = {
  id: string;
  label: string;
  description: string;
  sort_order: number;
};

export type WikiPage = {
  id: string;
  slug: string;
  title: string;
  category_id: string;
  summary: string;
  status: "draft" | "published" | "archived";
  current_revision_id: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

export type WikiRevision = {
  id: string;
  page_id: string;
  revision_no: number;
  title: string;
  summary: string;
  body_md: string;
  category_id: string;
  change_summary: string;
  author_id?: string | null;
  status: "approved" | "reverted";
  created_at: string;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
};

export type WikiSubmission = {
  id: string;
  submission_type: "new_page" | "edit_page";
  page_id: string | null;
  proposed_slug: string;
  proposed_title: string;
  category_id: string;
  summary: string;
  body_md: string;
  change_summary: string;
  status: "pending" | "approved" | "rejected" | "changes_requested";
  submitter_id: string;
  created_at: string;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  review_note: string;
  resulting_revision_id?: string | null;
};

export type WikiArticle = {
  page: WikiPage;
  revision: WikiRevision;
  history: WikiRevision[];
};

export class WikiBackendUnavailable extends Error {
  constructor(message = "The public wiki database is not initialized yet.") {
    super(message);
    this.name = "WikiBackendUnavailable";
  }
}

const defaultProjectUrl = "https://mfntzxheldzdvlokyntk.supabase.co";
const defaultPublishableKey = "sb_publishable_XfkgeXau2-6XOPzoXF-Nnw_FSnx0Sae";
const projectUrl = (import.meta.env.VITE_SUPABASE_URL || defaultProjectUrl).replace(/\/$/, "");
const publicKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || defaultPublishableKey;
const restUrl = `${projectUrl}/rest/v1`;

export const FALLBACK_WIKI_CATEGORIES: WikiCategory[] = [
  { id: "universe", label: "Universe", description: "People, science, technology, institutions and concepts.", sort_order: 10 },
  { id: "atlas", label: "Atlas", description: "Worlds, regions, cities, sites and infrastructure.", sort_order: 20 },
  { id: "archive", label: "Archive", description: "Historical events, records, facilities and eras.", sort_order: 30 },
  { id: "stories", label: "Stories", description: "Published story-facing reference material.", sort_order: 40 },
  { id: "meta", label: "Meta", description: "Public documentation about WIKI.ANEVUM itself.", sort_order: 90 },
];

function apiHeaders(session?: MemberSession | null, prefer?: string) {
  const headers: Record<string, string> = {
    apikey: publicKey,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
  if (prefer) headers.Prefer = prefer;
  return headers;
}

function missingBackend(status: number, payload: unknown) {
  const value = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  const code = String(value.code || "");
  const message = String(value.message || "");
  return status === 404 || code === "PGRST205" || code === "42P01" || /wiki_(pages|categories|submissions)/i.test(message) && /not find|does not exist|schema cache/i.test(message);
}

async function rest<T>(path: string, init: RequestInit = {}, session: MemberSession | null = loadSession(), prefer?: string): Promise<T> {
  const response = await fetch(`${restUrl}${path}`, {
    ...init,
    headers: { ...apiHeaders(session, prefer), ...(init.headers || {}) },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    if (missingBackend(response.status, payload)) throw new WikiBackendUnavailable();
    const value = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
    throw new Error(String(value.message || value.hint || value.details || `Wiki request failed (${response.status})`));
  }
  return payload as T;
}

export function isWikiAdmin(session = loadSession()) {
  const metadata = session?.user?.app_metadata || {};
  return metadata.wiki_admin === true || metadata.role === "admin" || metadata.role === "wiki_admin";
}

export async function loadWikiCategories() {
  try {
    const rows = await rest<WikiCategory[]>("/wiki_categories?select=id,label,description,sort_order&order=sort_order.asc");
    return rows.length ? rows : FALLBACK_WIKI_CATEGORIES;
  } catch (error) {
    if (error instanceof WikiBackendUnavailable) return FALLBACK_WIKI_CATEGORIES;
    throw error;
  }
}

export async function loadPublishedWikiPages() {
  return rest<WikiPage[]>("/wiki_pages?select=id,slug,title,category_id,summary,status,current_revision_id,created_at,updated_at,published_at&status=eq.published&order=title.asc");
}

export async function loadWikiArticle(slug: string): Promise<WikiArticle | null> {
  const pages = await rest<WikiPage[]>(`/wiki_pages?select=id,slug,title,category_id,summary,status,current_revision_id,created_at,updated_at,published_at&slug=eq.${encodeURIComponent(slug)}&status=eq.published&limit=1`);
  const page = pages[0];
  if (!page || !page.current_revision_id) return null;
  const revisions = await rest<WikiRevision[]>(`/wiki_revisions?select=id,page_id,revision_no,title,summary,body_md,category_id,change_summary,author_id,status,created_at,reviewed_by,reviewed_at&page_id=eq.${page.id}&status=eq.approved&order=revision_no.desc`);
  const revision = revisions.find((item) => item.id === page.current_revision_id) || revisions[0];
  return revision ? { page, revision, history: revisions } : null;
}

export async function submitWikiPage(input: { slug: string; title: string; categoryId: string; summary: string; body: string; changeSummary: string }) {
  const session = loadSession();
  if (!session) throw new Error("Sign in with RHENLINK before proposing a page.");
  const rows = await rest<WikiSubmission[]>("/wiki_submissions", {
    method: "POST",
    body: JSON.stringify({
      submission_type: "new_page",
      page_id: null,
      proposed_slug: input.slug,
      proposed_title: input.title,
      category_id: input.categoryId,
      summary: input.summary,
      body_md: input.body,
      change_summary: input.changeSummary,
      status: "pending",
      submitter_id: session.user.id,
    }),
  }, session, "return=representation");
  return rows[0];
}

export async function submitWikiEdit(page: WikiPage, input: { title: string; categoryId: string; summary: string; body: string; changeSummary: string }) {
  const session = loadSession();
  if (!session) throw new Error("Sign in with RHENLINK before proposing an edit.");
  const rows = await rest<WikiSubmission[]>("/wiki_submissions", {
    method: "POST",
    body: JSON.stringify({
      submission_type: "edit_page",
      page_id: page.id,
      proposed_slug: page.slug,
      proposed_title: input.title,
      category_id: input.categoryId,
      summary: input.summary,
      body_md: input.body,
      change_summary: input.changeSummary,
      status: "pending",
      submitter_id: session.user.id,
    }),
  }, session, "return=representation");
  return rows[0];
}

export async function loadMyWikiSubmissions() {
  const session = loadSession();
  if (!session) return [];
  return rest<WikiSubmission[]>(`/wiki_submissions?select=*&submitter_id=eq.${session.user.id}&order=created_at.desc`, {}, session);
}

export async function loadPendingWikiSubmissions() {
  const session = loadSession();
  if (!session || !isWikiAdmin(session)) throw new Error("Wiki administrator access required.");
  return rest<WikiSubmission[]>("/wiki_submissions?select=*&status=eq.pending&order=created_at.asc", {}, session);
}

export async function reviewWikiSubmission(id: string, decision: "approved" | "rejected" | "changes_requested", note: string) {
  const session = loadSession();
  if (!session || !isWikiAdmin(session)) throw new Error("Wiki administrator access required.");
  return rest<string>("/rpc/review_wiki_submission", {
    method: "POST",
    body: JSON.stringify({ p_submission_id: id, p_decision: decision, p_note: note }),
  }, session);
}

export async function loadWikiSaveIds() {
  const session = loadSession();
  if (!session) return [];
  const rows = await rest<Array<{ page_id: string }>>(`/wiki_saves?select=page_id&user_id=eq.${session.user.id}`, {}, session);
  return rows.map((row) => row.page_id);
}

export async function setWikiSaved(pageId: string, saved: boolean) {
  const session = loadSession();
  if (!session) throw new Error("Sign in with RHENLINK to save pages.");
  if (saved) {
    await rest("/wiki_saves", {
      method: "POST",
      body: JSON.stringify({ user_id: session.user.id, page_id: pageId }),
    }, session, "resolution=ignore-duplicates,return=minimal");
  } else {
    await rest(`/wiki_saves?user_id=eq.${session.user.id}&page_id=eq.${pageId}`, { method: "DELETE" }, session, "return=minimal");
  }
}

export function slugifyWikiTitle(value: string) {
  return value.toLowerCase().trim().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
