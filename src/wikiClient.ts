import { loadSession, type MemberSession } from "./memberClient";
import { loadMemberProgress, toggleMemberSave } from "./memberState";
import {
  CANON_PROJECTION_SYNC,
  canonProjectionRecords,
  canonProjectionRelations,
  getCanonProjectionRecord,
  type CanonLifecycleState,
  type CanonProjectionRecord,
} from "./canonProjection";

export type WikiCanonState = CanonLifecycleState;

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
  canon_state?: string | null;
  canonical_state?: string | null;
  source_status?: string | null;
  current_revision_id: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  source_url?: string | null;
  source_route?: string | null;
  freeze_state?: string | null;
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

export type WikiLink = {
  id: string;
  from_page_id: string;
  to_page_id: string;
  relation: string;
  created_at: string;
};

export class WikiBackendUnavailable extends Error {
  constructor(message = "The optional community Wiki backend is not available to this runtime yet.") {
    super(message);
    this.name = "WikiBackendUnavailable";
  }
}

const defaultProjectUrl = "https://mfntzxheldzdvlokyntk.supabase.co";
const defaultPublishableKey = "sb_publishable_XfkgeXau2-6XOPzoXF-Nnw_FSnx0Sae";
const projectUrl = (import.meta.env.VITE_SUPABASE_URL || defaultProjectUrl).replace(/\/$/, "");
const publicKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || defaultPublishableKey;
const restUrl = `${projectUrl}/rest/v1`;

export const WIKI_CANON_STATES: readonly WikiCanonState[] = [
  "Source-Locked",
  "Locked",
  "Canonical",
  "Working",
  "Unresolved",
  "Exploratory",
  "Superseded",
  "Archived",
];

const PRODUCT_VISIBLE_STATES = new Set<WikiCanonState>(["Source-Locked", "Locked", "Canonical"]);

export const FALLBACK_WIKI_CATEGORIES: WikiCategory[] = [
  { id: "universe", label: "Universe", description: "People, science, technology, institutions and concepts cleared by the live Wiki publication gate.", sort_order: 10 },
  { id: "atlas", label: "Atlas", description: "Worlds, regions, cities, sites and infrastructure cleared by the live Wiki publication gate.", sort_order: 20 },
  { id: "archive", label: "Archive", description: "Historical records released by the live Wiki publication gate without exposing withheld context.", sort_order: 30 },
];

export const WIKI_PROJECTION_SYNC = CANON_PROJECTION_SYNC;

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
  return status === 404 || code === "PGRST205" || code === "42P01" || /wiki_(pages|categories|submissions|saves)/i.test(message) && /not find|does not exist|schema cache/i.test(message);
}

async function communityRest<T>(path: string, init: RequestInit = {}, session: MemberSession | null = loadSession(), prefer?: string): Promise<T> {
  const response = await fetch(`${restUrl}${path}`, {
    ...init,
    headers: { ...apiHeaders(session, prefer), ...(init.headers || {}) },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    if (missingBackend(response.status, payload)) throw new WikiBackendUnavailable();
    const value = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
    throw new Error(String(value.message || value.hint || value.details || `Wiki community request failed (${response.status})`));
  }
  return payload as T;
}

export function isWikiAdmin(session = loadSession()) {
  const metadata = session?.user?.app_metadata || {};
  return metadata.wiki_admin === true || metadata.role === "admin" || metadata.role === "wiki_admin";
}

export function isCommandAdmin(session = loadSession()) {
  const metadata = session?.user?.app_metadata || {};
  const role = String(metadata.role || "").trim().toLowerCase();
  return metadata.command_admin === true
    || metadata.wiki_admin === true
    || role === "owner"
    || role === "founder"
    || role === "admin"
    || role === "command_admin"
    || role === "wiki_admin";
}

function normalizeStateValue(value: unknown) {
  return String(value || "").trim().toLowerCase().replace(/[\s_]+/g, "-");
}

export function wikiCanonState(page: Pick<WikiPage, "status" | "canon_state" | "canonical_state" | "source_status">): WikiCanonState {
  const raw = normalizeStateValue(page.canon_state || page.canonical_state || page.source_status);
  if (raw === "source-locked" || raw === "sourcelocked" || raw === "source-locked") return "Source-Locked";
  if (raw === "locked") return "Locked";
  if (raw === "canonical" || raw === "canon") return "Canonical";
  if (raw === "working" || raw === "working-canon" || raw === "work-in-progress" || raw === "wip" || raw === "draft") return "Working";
  if (raw === "unresolved") return "Unresolved";
  if (raw === "exploratory") return "Exploratory";
  if (raw === "superseded" || raw === "obsolete") return "Superseded";
  if (raw === "archived") return "Archived";
  if (page.status === "archived") return "Archived";
  if (page.status === "draft") return "Working";
  return "Unresolved";
}

export function isWikiProductVisible(page: WikiPage) {
  return page.status === "published" && PRODUCT_VISIBLE_STATES.has(wikiCanonState(page));
}

export function wikiStateCounts(pages: WikiPage[]) {
  const initial = Object.fromEntries(WIKI_CANON_STATES.map((state) => [state, 0])) as Record<WikiCanonState, number>;
  pages.forEach((page) => { initial[wikiCanonState(page)] += 1; });
  return initial;
}

function projectionDate() {
  return `${CANON_PROJECTION_SYNC.syncedAt}T00:00:00.000Z`;
}

function projectionPage(record: CanonProjectionRecord): WikiPage {
  return {
    id: record.id,
    slug: record.slug,
    title: record.title,
    category_id: record.section.toLowerCase(),
    summary: record.summary,
    status: "published",
    canon_state: record.canonState,
    current_revision_id: `projection:${record.id}:1`,
    created_at: projectionDate(),
    updated_at: projectionDate(),
    published_at: projectionDate(),
    source_url: record.sourceUrl,
    source_route: record.sourceRoute,
    freeze_state: record.freezeState,
  };
}

function projectionBody(record: CanonProjectionRecord) {
  const lines = [
    "## Public record",
    record.summary,
    "",
    `> CANON STATE / ${record.canonState.toUpperCase()} · FREEZE / ${record.freezeState.toUpperCase()} · RELEASE / ${record.renderMode}`,
    "",
    "## Publication boundary",
    record.publicNote,
  ];
  if (record.facts?.length) {
    lines.push("", "## Released facts", ...record.facts.map(([label, value]) => `- ${label}: ${value}`));
  }
  lines.push("", "## Provenance", `This browser-safe record is a released projection of the live ANEVUM Wiki. Source route: ${record.sourceRoute}.`);
  return lines.join("\n");
}

function projectionRevision(record: CanonProjectionRecord): WikiRevision {
  return {
    id: `projection:${record.id}:1`,
    page_id: record.id,
    revision_no: 1,
    title: record.title,
    summary: record.summary,
    body_md: projectionBody(record),
    category_id: record.section.toLowerCase(),
    change_summary: `Synced from ${CANON_PROJECTION_SYNC.source}`,
    status: "approved",
    created_at: projectionDate(),
    reviewed_at: projectionDate(),
  };
}

export async function loadWikiCategories() {
  return FALLBACK_WIKI_CATEGORIES;
}

export async function loadPublishedWikiPages() {
  return canonProjectionRecords.map(projectionPage).filter(isWikiProductVisible).sort((a, b) => a.title.localeCompare(b.title));
}

export async function loadWikiControlPages() {
  const session = loadSession();
  if (!session || !isWikiAdmin(session)) throw new Error("Wiki administrator access required.");
  return canonProjectionRecords.map(projectionPage).sort((a, b) => a.title.localeCompare(b.title));
}

export async function loadPublishedWikiLinks() {
  const recordBySlug = new Map(canonProjectionRecords.map((record) => [record.slug, record]));
  return canonProjectionRelations.flatMap<WikiLink>((relation) => {
    const from = recordBySlug.get(relation.fromSlug);
    const to = recordBySlug.get(relation.toSlug);
    if (!from || !to) return [];
    return [{
      id: relation.id,
      from_page_id: from.id,
      to_page_id: to.id,
      relation: relation.relation,
      created_at: projectionDate(),
    }];
  });
}

export async function loadWikiArticle(slug: string): Promise<WikiArticle | null> {
  const record = getCanonProjectionRecord(slug);
  if (!record) return null;
  const page = projectionPage(record);
  if (!isWikiProductVisible(page)) return null;
  const revision = projectionRevision(record);
  return { page, revision, history: [revision] };
}

// Community proposals remain a separate moderated layer. They never write canon
// directly and their availability does not determine whether canonical Wiki
// records can be read by the product.
export async function submitWikiPage(input: { slug: string; title: string; categoryId: string; summary: string; body: string; changeSummary: string }) {
  const session = loadSession();
  if (!session) throw new Error("Sign in with RHENLINK before proposing a page.");
  const rows = await communityRest<WikiSubmission[]>("/wiki_submissions", {
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
  const rows = await communityRest<WikiSubmission[]>("/wiki_submissions", {
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
  return communityRest<WikiSubmission[]>(`/wiki_submissions?select=*&submitter_id=eq.${session.user.id}&order=created_at.desc`, {}, session);
}

export async function loadPendingWikiSubmissions() {
  const session = loadSession();
  if (!session || !isWikiAdmin(session)) throw new Error("Wiki administrator access required.");
  return communityRest<WikiSubmission[]>("/wiki_submissions?select=*&status=eq.pending&order=created_at.asc", {}, session);
}

export async function reviewWikiSubmission(id: string, decision: "approved" | "rejected" | "changes_requested", note: string) {
  const session = loadSession();
  if (!session || !isWikiAdmin(session)) throw new Error("Wiki administrator access required.");
  return communityRest<string>("/rpc/review_wiki_submission", {
    method: "POST",
    body: JSON.stringify({ p_submission_id: id, p_decision: decision, p_note: note }),
  }, session);
}

export async function loadWikiSaveIds() {
  const session = loadSession();
  if (!session) return [];
  return loadMemberProgress(session).savedRecordIds;
}

export async function setWikiSaved(pageId: string, saved: boolean) {
  const session = loadSession();
  if (!session) throw new Error("Sign in with RHENLINK to save pages.");
  const current = loadMemberProgress(session).savedRecordIds.includes(pageId);
  if (current !== saved) toggleMemberSave(session, pageId);
}

export function slugifyWikiTitle(value: string) {
  return value.toLowerCase().trim().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
