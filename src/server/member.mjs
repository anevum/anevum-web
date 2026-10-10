import { betterAuth } from "better-auth";
import { memberRewardsStatus, memberBrokerageStatus } from "./member-capabilities.mjs";
import { reviewerSchemaReady, reviewerEndpoint, exportReviewerConnection } from "./member-alpaca-review.mjs";
import { commonsSocialEndpoint, socialSchemaReady, exportMemberSocial } from "./commons-social.mjs";
import { memberRhenDraftSchemaReady, readMemberRhenDraft, saveMemberRhenDraft, deleteMemberRhenDraft, validateRhenDraft } from "./member-rhen-draft.mjs";
import { resolveMemberOrigin, memberSchemaReady } from "./member-preflight.mjs";
import { memberRhenWorkspaceSchemaReady, readMemberRhenWorkspace, createMemberRhenWorkspace } from "./member-rhen-workspace.mjs";
const PUBLIC_PROJECTS = new Set(["rhen"]);

export function memberConfigured(env) {
  return Boolean(
    env?.ANEVUM_MEMBERS_ENABLED === "true" &&
    env?.MEMBER_DB &&
    typeof env.MEMBER_DB.prepare === "function" &&
    env?.BETTER_AUTH_SECRET?.length >= 32 &&
    env?.GOOGLE_CLIENT_ID &&
    env?.GOOGLE_CLIENT_SECRET
  );
}

export function makeMemberAuth(env, verifiedOrigin) {
  if (!memberConfigured(env) || !verifiedOrigin) throw new Error("Member identity is not configured.");
  return betterAuth({
    baseURL: verifiedOrigin,
    secret: env.BETTER_AUTH_SECRET,
    database: env.MEMBER_DB,
    emailAndPassword: { enabled: false },
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        requireEmailVerification: true
      }
    },
    account: {
      encryptOAuthTokens: true,
      storeStateStrategy: "database",
      accountLinking: { disableImplicitLinking: true }
    },
    user: {
      deleteUser: {
        enabled: true,
        afterDelete: async (user) => {
          // Defensive cleanup: D1 foreign keys normally cascade.
          await env.MEMBER_DB.batch([
            env.MEMBER_DB.prepare("DELETE FROM member_project_follows WHERE user_id = ?").bind(user.id),
            env.MEMBER_DB.prepare("DELETE FROM member_saved_apps WHERE user_id = ?").bind(user.id),
            env.MEMBER_DB.prepare("DELETE FROM member_entitlements WHERE user_id = ?").bind(user.id),
            env.MEMBER_DB.prepare("DELETE FROM member_profiles WHERE user_id = ?").bind(user.id)
          ]);
        }
      }
    },
    session: { freshAge: 10 * 60 },
    trustedOrigins: [verifiedOrigin],
    advanced: { useSecureCookies: true, ipAddress: { ipAddressHeaders: ["cf-connecting-ip"] } },
    rateLimit: {
      enabled: true,
      storage: "database",
      window: 60,
      max: 40,
      customRules: {
        "/sign-in/social": { window: 60, max: 8 }
      }
    }
  });
}

function reply(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow, noarchive"
    }
  });
}

export function safeMutation(request, verifiedOrigin) {
  const url = new URL(request.url);
  return Boolean(verifiedOrigin) && url.protocol === "https:" &&
    url.origin === verifiedOrigin &&
    request.headers.get("Origin") === verifiedOrigin;
}

/**
 * A zero-length POST can reach the Cloudflare Worker with a non-null body
 * ReadableStream (for example when the browser sends Content-Length: 0).
 * The member workspace creation contract requires zero BYTES, not no stream.
 *
 * Probe the stream in bounded chunks: any actual payload, including whitespace
 * and client-selected member/workspace IDs, fails closed. No request contents
 * are stored, parsed or logged. This is called only after verified session and
 * same-origin mutation checks, and the body is not used by the allocator.
 */
export async function workspaceCreateHasClientPayload(request) {
  if (request.body === null) return false;
  let reader;
  try {
    reader = request.body.getReader();
    for (let i = 0; i < 8; i++) {
      const { done, value } = await reader.read();
      if (done) return false;
      if (!(value instanceof Uint8Array)) return true;
      if (value.byteLength > 0) return true;
    }
    // An unbounded sequence of empty chunks is not a permitted request shape.
    return true;
  } catch {
    // Unreadable, locked, or errored streams must never authorize creation.
    return true;
  } finally {
    try { await reader?.cancel(); } catch {}
  }
}

export async function safeJSON(request) {
  if (request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() !== "application/json") {
    throw new Error("JSON body required.");
  }
  const body = await request.text();
  if (body.length > 2048) throw new Error("Request body too large.");
  const value = JSON.parse(body);
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid object.");
  return value;
}

export async function memberEndpoint(request, env, pathname) {
  const verifiedOrigin = resolveMemberOrigin(request, env);
  if (pathname === "/api/member/availability") {
    const available = memberConfigured(env) && Boolean(verifiedOrigin) && await memberSchemaReady(env);
    return request.method === "GET"
      ? reply({ available, provider: available ? "google" : null })
      : reply({ message: "Method not allowed." }, 405);
  }

  // The API cannot open accidentally on a new preview or after missing secrets.
  if (!memberConfigured(env)) return reply({ message: "Member accounts are not available yet." }, 503);
  if (!verifiedOrigin) return reply({ message: "Member API origin is not authorized." }, 403);

  const auth = makeMemberAuth(env, verifiedOrigin);
  if (pathname === "/api/auth" || pathname.startsWith("/api/auth/")) {
    return auth.handler(request);
  }

  const session = await auth.api.getSession({ headers: request.headers }).catch(() => null);
  const user = session?.user;
  if (!user?.id) return reply({ message: "Sign in required." }, 401);
  if (!["GET", "HEAD"].includes(request.method) && !safeMutation(request, verifiedOrigin)) {
    return reply({ message: "Same-origin request required." }, 403);
  }

  const db = env.MEMBER_DB;
  if (pathname.startsWith("/api/member/commons/")) {
    // Identity and same-origin writes were already checked above.
    // The social module separately requires the isolated preview-only flag and schema.
    return commonsSocialEndpoint(request, env, user, verifiedOrigin, pathname);
  }
  if (pathname === "/api/member/rewards" || pathname === "/api/member/brokerage") {
    if (request.method !== "GET") return reply({ message: "Read-only capability." }, 405);
    if (pathname === "/api/member/brokerage" &&
        env?.ANEVUM_MEMBER_PREVIEW_ENABLED === "true" &&
        await reviewerSchemaReady(db)) {
      return reviewerEndpoint(request, env, user, verifiedOrigin, pathname);
    }
    return reply(pathname === "/api/member/rewards" ? memberRewardsStatus() : memberBrokerageStatus());
  }
  if (pathname.startsWith("/api/member/alpaca/review/")) {
    // The provider callback still requires the same verified Better Auth
    // browser identity. Mutation paths have passed the same-origin guard.
    return reviewerEndpoint(request, env, user, verifiedOrigin, pathname);
  }
  if (pathname === "/api/member/rhen/workspace") {
    if (!["GET", "POST"].includes(request.method)) return reply({ message: "Method not allowed." }, 405);
    if (env?.ANEVUM_V5_WORKSPACES_ENABLED !== "true") {
      return reply({ message: "Private RHEN V5 workspaces are not enabled." }, 503);
    }
    // Never allow a query-selected owner, workspace or brokerage account.
    if (new URL(request.url).search) return reply({ message: "Workspace selection is not supported." }, 400);
    if (request.method === "POST" && await workspaceCreateHasClientPayload(request)) {
      return reply({ message: "Workspace creation accepts no client fields." }, 400);
    }
    if (!await memberRhenWorkspaceSchemaReady(db)) {
      return reply({ message: "Private workspace storage is not ready." }, 503);
    }
    try {
      const workspace = request.method === "POST"
        ? await createMemberRhenWorkspace(db, user.id)
        : await readMemberRhenWorkspace(db, user.id);
      return reply({ available: true, workspace });
    } catch {
      return reply({ message: "Private workspace is unavailable." }, 503);
    }
  }
  if (pathname === "/api/member/rhen/draft") {
    if (env?.ANEVUM_MEMBER_RHEN_DRAFTS_ENABLED !== "true") {
      return reply({ message: "Personal RHEN drafts are not enabled." }, 503);
    }
    if (!await memberRhenDraftSchemaReady(db)) {
      return reply({ message: "Personal RHEN draft storage is unavailable." }, 503);
    }
    if (!["GET", "PUT", "DELETE"].includes(request.method)) {
      return reply({ message: "Method not allowed." }, 405);
    }
    let draft;
    if (request.method === "PUT") {
      try { draft = validateRhenDraft(await safeJSON(request)); }
      catch (error) { return reply({ message: error instanceof Error ? error.message : "Invalid draft." }, 400); }
    }
    try {
      if (request.method === "PUT") {
        const saved = await saveMemberRhenDraft(db, user.id, draft);
        return reply({ available: true, draft: saved, executionEnabled: false, brokerageConnected: false });
      }
      if (request.method === "DELETE") {
        await deleteMemberRhenDraft(db, user.id);
        return reply({ available: true, draft: null, executionEnabled: false, brokerageConnected: false });
      }
      const saved = await readMemberRhenDraft(db, user.id);
      return reply({ available: true, draft: saved, executionEnabled: false, brokerageConnected: false });
    } catch {
      return reply({ message: "Personal RHEN draft storage is unavailable." }, 503);
    }
  }
  if (pathname === "/api/member/export" && request.method === "GET") {
    const hasDraftTable = await memberRhenDraftSchemaReady(db);
    const hasWorkspaceTable = await memberRhenWorkspaceSchemaReady(db);
    const hasSocialTables = await socialSchemaReady(db);
    const [profile, saved, follows, entitlements, rhenDraft, rhenWorkspace, reviewerConnection, socialContributions] = await Promise.all([
      db.prepare("SELECT display_name, theme, created_at, updated_at FROM member_profiles WHERE user_id = ?").bind(user.id).first(),
      db.prepare("SELECT app_slug, saved_at FROM member_saved_apps WHERE user_id = ? ORDER BY saved_at DESC").bind(user.id).all(),
      db.prepare("SELECT project_slug, followed_at FROM member_project_follows WHERE user_id = ? ORDER BY followed_at DESC").bind(user.id).all(),
      db.prepare("SELECT app_slug, capability, granted_at, expires_at FROM member_entitlements WHERE user_id = ?").bind(user.id).all(),
      hasDraftTable ? readMemberRhenDraft(db, user.id) : Promise.resolve(null),
      hasWorkspaceTable ? readMemberRhenWorkspace(db, user.id) : Promise.resolve(null),
      env?.ANEVUM_MEMBER_PREVIEW_ENABLED === "true"
        ? exportReviewerConnection(db, user.id) : Promise.resolve(null),
      hasSocialTables ? exportMemberSocial(db, user.id) : Promise.resolve(null)
    ]);
    return new Response(JSON.stringify({
      exportedAt: new Date().toISOString(),
      identity: { id: user.id, name: user.name, email: user.email, image: user.image },
      profile: profile || {},
      savedApps: saved.results || [],
      projectFollows: follows.results || [],
      entitlements: entitlements.results || [],
      rhenDraft,
      rhenWorkspace,
      brokerReview: reviewerConnection,
      commonsContributions: socialContributions
    }, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="anevum-account-data.json"',
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "X-Robots-Tag": "noindex, nofollow, noarchive"
      }
    });
  }
  if (pathname === "/api/member/session" && request.method === "GET") {
    return reply({ authenticated: true, user: { id: user.id, email: user.email, name: user.name, image: user.image } });
  }
  if (pathname === "/api/member/me" && request.method === "GET") {
    const [profile, saved, follows, entitlements] = await Promise.all([
      db.prepare("SELECT display_name, theme FROM member_profiles WHERE user_id = ?").bind(user.id).first(),
      db.prepare("SELECT app_slug FROM member_saved_apps WHERE user_id = ? ORDER BY saved_at DESC").bind(user.id).all(),
      db.prepare("SELECT project_slug FROM member_project_follows WHERE user_id = ? ORDER BY followed_at DESC").bind(user.id).all(),
      db.prepare("SELECT app_slug, capability, expires_at FROM member_entitlements WHERE user_id = ? AND (expires_at IS NULL OR expires_at > datetime('now'))").bind(user.id).all()
    ]);
    return reply({
      user: { id: user.id, email: user.email, name: user.name, image: user.image },
      profile: { displayName: profile?.display_name || user.name, theme: profile?.theme || "system" },
      savedApps: (saved.results || []).map((x) => x.app_slug).filter((slug) => PUBLIC_PROJECTS.has(slug)),
      follows: (follows.results || []).map((x) => x.project_slug).filter((slug) => PUBLIC_PROJECTS.has(slug)),
      entitlements: (entitlements.results || []).map((x) => ({ app: x.app_slug, capability: x.capability, expiresAt: x.expires_at }))
    });
  }
  if (pathname === "/api/member/me" && request.method === "PATCH") {
    let body;
    try { body = await safeJSON(request); } catch { return reply({ message: "Invalid profile update." }, 400); }
    const keys = Object.keys(body);
    if (!keys.length || keys.some((key) => !["displayName", "theme"].includes(key))) {
      return reply({ message: "Unrecognized profile field." }, 400);
    }
    if (body.displayName !== undefined &&
        (typeof body.displayName !== "string" || body.displayName.trim().length < 1 || body.displayName.length > 64)) {
      return reply({ message: "Display name must have 1-64 characters." }, 400);
    }
    if (body.theme !== undefined && !["system", "light", "dark"].includes(body.theme)) {
      return reply({ message: "Invalid theme." }, 400);
    }
    const previous = await db.prepare("SELECT display_name, theme FROM member_profiles WHERE user_id = ?").bind(user.id).first();
    const displayName = body.displayName === undefined ? previous?.display_name || user.name : body.displayName.trim();
    const theme = body.theme === undefined ? previous?.theme || "system" : body.theme;
    await db.prepare(
      "INSERT INTO member_profiles (user_id, display_name, theme) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET display_name=excluded.display_name, theme=excluded.theme, updated_at=datetime('now')"
    ).bind(user.id, displayName, theme).run();
    return reply({ profile: { displayName, theme } });
  }

  const choice = pathname.match(/^\/api\/member\/(saved-apps|follows)\/([a-z0-9-]+)$/);
  if (choice) {
    const [, group, slug] = choice;
    if (!PUBLIC_PROJECTS.has(slug)) return reply({ message: "Project not registered." }, 404);
    if (!["PUT", "DELETE"].includes(request.method)) return reply({ message: "Method not allowed." }, 405);
    const table = group === "saved-apps" ? "member_saved_apps" : "member_project_follows";
    const column = group === "saved-apps" ? "app_slug" : "project_slug";
    if (request.method === "PUT") {
      await db.prepare(`INSERT OR IGNORE INTO ${table} (user_id, ${column}) VALUES (?, ?)`).bind(user.id, slug).run();
      return reply({ saved: true, slug });
    }
    await db.prepare(`DELETE FROM ${table} WHERE user_id = ? AND ${column} = ?`).bind(user.id, slug).run();
    return reply({ saved: false, slug });
  }
  if (pathname === "/api/member/entitlements" && request.method === "GET") {
    const results = await db.prepare(
      "SELECT app_slug, capability, expires_at FROM member_entitlements WHERE user_id = ? AND (expires_at IS NULL OR expires_at > datetime('now'))"
    ).bind(user.id).all();
    return reply({ entitlements: results.results || [] });
  }
  return reply({ message: "Member endpoint not found." }, 404);
}
