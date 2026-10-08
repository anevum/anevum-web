import { betterAuth } from "better-auth";

const CANONICAL_ORIGIN = "https://anevum.com";
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

export function makeMemberAuth(env) {
  if (!memberConfigured(env)) throw new Error("Member identity is not configured.");
  return betterAuth({
    baseURL: CANONICAL_ORIGIN,
    secret: env.BETTER_AUTH_SECRET,
    database: env.MEMBER_DB,
    emailAndPassword: { enabled: false },
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET
      }
    },
    account: { accountLinking: { disableImplicitLinking: true } },
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
    trustedOrigins: [CANONICAL_ORIGIN],
    advanced: { useSecureCookies: true },
    rateLimit: {
      enabled: true,
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

function safeMutation(request) {
  const url = new URL(request.url);
  return url.protocol === "https:" &&
    url.origin === CANONICAL_ORIGIN &&
    request.headers.get("Origin") === CANONICAL_ORIGIN;
}

async function safeJSON(request) {
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
  if (pathname === "/api/member/availability") {
    return request.method === "GET"
      ? reply({ available: memberConfigured(env), provider: memberConfigured(env) ? "google" : null })
      : reply({ message: "Method not allowed." }, 405);
  }

  // The API cannot open accidentally on a new preview or after missing secrets.
  if (!memberConfigured(env)) return reply({ message: "Member accounts are not available yet." }, 503);
  if (new URL(request.url).origin !== CANONICAL_ORIGIN) return reply({ message: "Member API is disabled outside production." }, 403);

  const auth = makeMemberAuth(env);
  if (pathname === "/api/auth" || pathname.startsWith("/api/auth/")) {
    return auth.handler(request);
  }

  const session = await auth.api.getSession({ headers: request.headers }).catch(() => null);
  const user = session?.user;
  if (!user?.id) return reply({ message: "Sign in required." }, 401);
  if (!["GET", "HEAD"].includes(request.method) && !safeMutation(request)) {
    return reply({ message: "Same-origin request required." }, 403);
  }

  const db = env.MEMBER_DB;
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
