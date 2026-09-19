export type MemberUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
};

export type MemberSession = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  saved_at?: number;
  user: MemberUser;
};

export type SharedIdentity = {
  userId: string;
  email?: string;
  handle: string;
  displayName: string;
};

export type PublicationClaim = {
  publication_id: string;
  edition: string;
  xp_awarded: number;
  claimed_at: string;
};

export type AuthRedirectResult =
  | { status: "signed-in"; session: MemberSession }
  | { status: "error"; message: string }
  | null;

export type RhenlinkReturnTarget = "command";

const defaultProjectUrl = "https://mfntzxheldzdvlokyntk.supabase.co";
const defaultPublishableKey = "sb_publishable_XfkgeXau2-6XOPzoXF-Nnw_FSnx0Sae";
const projectUrl = (import.meta.env.VITE_SUPABASE_URL || defaultProjectUrl).replace(/\/$/, "");
const publicKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || defaultPublishableKey;
const storageKey = "anevum.rhenlink.session.v1";
const sharedIdentityCookieKey = "anevum_rhenlink_identity_v1";
const rhenlinkHandoffMarker = "anevum-rhenlink-v1";
const rhenlinkReturnTargets: Record<RhenlinkReturnTarget, string> = {
  command: "https://anevum.com/command",
};
let metadataWriteQueue: Promise<unknown> = Promise.resolve();
let sessionRefreshPromise: Promise<MemberSession> | null = null;

export const memberBackend = {
  projectUrl,
  configured: Boolean(publicKey),
};

function headers(token?: string) {
  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: publicKey,
  };

  if (token) requestHeaders.Authorization = `Bearer ${token}`;
  return requestHeaders;
}

class MemberApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "MemberApiError";
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  if (!publicKey) throw new Error("RHENLINK backend is not configured in this build.");
  const response = await fetch(`${projectUrl}${path}`, init);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.msg || payload?.message || payload?.error_description || payload?.error || `Request failed (${response.status})`;
    throw new MemberApiError(String(message), response.status);
  }
  return payload as T;
}

function isUnauthorized(error: unknown) {
  return error instanceof MemberApiError && error.status === 401;
}

function latestStoredSession(session: MemberSession) {
  const stored = loadSession();
  if (!stored || stored.user.id !== session.user.id) return session;
  return (stored.saved_at || 0) >= (session.saved_at || 0) ? stored : session;
}

function sessionExpiresSoon(session: MemberSession, skewMs = 60_000) {
  if (!session.saved_at || !session.expires_in) return false;
  return Date.now() >= session.saved_at + session.expires_in * 1000 - skewMs;
}

async function withFreshSession<T>(
  session: MemberSession,
  operation: (activeSession: MemberSession) => Promise<T>,
): Promise<T> {
  let activeSession = latestStoredSession(session);

  if (activeSession.refresh_token && sessionExpiresSoon(activeSession)) {
    activeSession = await refreshSession(activeSession);
  }

  try {
    return await operation(activeSession);
  } catch (error) {
    if (!isUnauthorized(error)) throw error;
    if (!activeSession.refresh_token) {
      saveSession(null);
      throw new Error("Your RHENLINK session has expired. Sign in again.");
    }

    activeSession = await refreshSession(activeSession);
    return operation(activeSession);
  }
}

function sharedCookieAttributes(maxAge: number) {
  const host = window.location.hostname.toLowerCase();
  const domain = host === "anevum.com" || host.endsWith(".anevum.com") ? "; Domain=.anevum.com" : "";
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  return `Path=/; Max-Age=${maxAge}; SameSite=Lax${domain}${secure}`;
}

function writeSharedIdentityCookie(session: MemberSession | null) {
  if (typeof document === "undefined") return;
  if (!session) {
    document.cookie = `${sharedIdentityCookieKey}=; ${sharedCookieAttributes(0)}`;
    return;
  }
  const identity = displayIdentity(session);
  const shared: SharedIdentity = {
    userId: session.user.id,
    email: session.user.email,
    handle: identity.handle,
    displayName: identity.displayName,
  };
  document.cookie = `${sharedIdentityCookieKey}=${encodeURIComponent(JSON.stringify(shared))}; ${sharedCookieAttributes(60 * 60 * 24 * 30)}`;
}

export function loadSharedIdentity(): SharedIdentity | null {
  if (typeof document === "undefined") return null;
  const entry = document.cookie.split("; ").find((part) => part.startsWith(`${sharedIdentityCookieKey}=`));
  if (!entry) return null;
  try {
    return JSON.parse(decodeURIComponent(entry.slice(sharedIdentityCookieKey.length + 1))) as SharedIdentity;
  } catch {
    return null;
  }
}

export function loadSession(): MemberSession | null {
  try {
    const value = localStorage.getItem(storageKey);
    return value ? JSON.parse(value) as MemberSession : null;
  } catch {
    return null;
  }
}

export function saveSession(session: MemberSession | null) {
  if (session) {
    const next = { ...session, saved_at: Date.now() };
    localStorage.setItem(storageKey, JSON.stringify(next));
    writeSharedIdentityCookie(next);
  } else {
    localStorage.removeItem(storageKey);
    writeSharedIdentityCookie(null);
  }
  window.dispatchEvent(new Event("anevum-member-session"));
}

export async function syncCurrentUser(session = loadSession()) {
  if (!session) return null;
  return withFreshSession(session, async (activeSession) => {
    const user = await request<MemberUser>("/auth/v1/user", {
      method: "GET",
      headers: headers(activeSession.access_token),
    });
    const next = { ...activeSession, user };
    saveSession(next);
    return next;
  });
}

export function updateMemberMetadata(patch: Record<string, unknown>) {
  const work = metadataWriteQueue.then(async () => {
    const session = loadSession();
    if (!session) throw new Error("Sign in with RHENLINK to update member data.");

    return withFreshSession(session, async (activeSession) => {
      const metadata = { ...(activeSession.user.user_metadata || {}), ...patch };
      const user = await request<MemberUser>("/auth/v1/user", {
        method: "PUT",
        headers: headers(activeSession.access_token),
        body: JSON.stringify({ data: metadata }),
      });
      const next = { ...activeSession, user };
      saveSession(next);
      return next;
    });
  });
  metadataWriteQueue = work.catch(() => undefined);
  return work;
}

export async function signUp(input: { email: string; password: string; handle: string; displayName: string }) {
  const redirectTo = `${window.location.origin}/rhenlink${window.location.search}`;
  const payload = await request<Partial<MemberSession> & { user?: MemberUser }>(`/auth/v1/signup?redirect_to=${encodeURIComponent(redirectTo)}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      email: input.email.trim(),
      password: input.password,
      data: {
        rhenlink_handle: input.handle.trim().toLowerCase(),
        display_name: input.displayName.trim(),
        product: "RHENLINK",
      },
    }),
  });

  if (payload.access_token && payload.user) {
    const session = payload as MemberSession;
    saveSession(session);
    return { status: "signed-in" as const, session };
  }
  return { status: "confirmation-required" as const, user: payload.user || null };
}

export async function signIn(email: string, password: string) {
  const session = await request<MemberSession>("/auth/v1/token?grant_type=password", {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ email: email.trim(), password }),
  });
  saveSession(session);
  return session;
}

export function refreshSession(session: MemberSession) {
  if (!session.refresh_token) return Promise.resolve(session);
  if (sessionRefreshPromise) return sessionRefreshPromise;

  sessionRefreshPromise = (async () => {
    try {
      const next = await request<MemberSession>("/auth/v1/token?grant_type=refresh_token", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ refresh_token: session.refresh_token }),
      });
      saveSession(next);
      return next;
    } catch (error) {
      if (error instanceof MemberApiError && (error.status === 400 || error.status === 401)) {
        saveSession(null);
        throw new Error("Your RHENLINK session has expired. Sign in again.");
      }
      throw error;
    } finally {
      sessionRefreshPromise = null;
    }
  })();

  return sessionRefreshPromise;
}

export async function signOut() {
  const session = loadSession();
  if (session?.access_token && publicKey) {
    await fetch(`${projectUrl}/auth/v1/logout`, { method: "POST", headers: headers(session.access_token) }).catch(() => undefined);
  }
  saveSession(null);
}

export async function fetchPublicationClaims(session = loadSession()) {
  if (!session) return [] as PublicationClaim[];
  return withFreshSession(session, (activeSession) =>
    request<PublicationClaim[]>(
      "/rest/v1/member_publication_claims?select=publication_id,edition,xp_awarded,claimed_at&order=claimed_at.desc",
      { method: "GET", headers: headers(activeSession.access_token) },
    ),
  );
}

export async function redeemPublicationCode(code: string, session = loadSession()) {
  if (!session) throw new Error("Sign in with RHENLINK before verifying a copy of REPLY.");
  const normalized = code.trim();
  if (!normalized) throw new Error("Enter the verification code supplied with your copy of REPLY.");

  const claims = await withFreshSession(session, (activeSession) =>
    request<PublicationClaim[]>("/rest/v1/rpc/redeem_publication_code", {
      method: "POST",
      headers: headers(activeSession.access_token),
      body: JSON.stringify({ p_code: normalized }),
    }),
  );
  const claim = claims[0];
  if (!claim) throw new Error("REPLY ownership could not be verified.");
  return claim;
}

export function resolveRhenlinkReturnTarget(): RhenlinkReturnTarget | null {
  if (typeof window === "undefined") return null;
  const requested = new URLSearchParams(window.location.search).get("return");
  return requested === "command" ? "command" : null;
}

export function createRhenlinkHandoffUrl(target: RhenlinkReturnTarget, session = loadSession()) {
  if (!session) return null;
  const url = new URL(rhenlinkReturnTargets[target]);
  const handoff = new URLSearchParams({
    handoff: rhenlinkHandoffMarker,
    access_token: session.access_token,
  });
  if (session.refresh_token) handoff.set("refresh_token", session.refresh_token);
  if (session.expires_in) handoff.set("expires_in", String(session.expires_in));
  url.hash = handoff.toString();
  return url.toString();
}

export async function consumeRhenlinkHandoff(): Promise<AuthRedirectResult> {
  if (typeof window === "undefined" || !window.location.hash) return null;
  const params = new URLSearchParams(window.location.hash.slice(1));
  if (params.get("handoff") !== rhenlinkHandoffMarker) return null;

  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token") || undefined;
  const expiresValue = Number(params.get("expires_in") || 0);

  // Remove bearer material from the visible URL before making any network request.
  const cleanUrl = `${window.location.pathname}${window.location.search}`;
  window.history.replaceState({}, document.title, cleanUrl);

  if (!accessToken) return { status: "error", message: "RHENLINK handoff did not include an access token." };

  try {
    const user = await request<MemberUser>("/auth/v1/user", {
      method: "GET",
      headers: headers(accessToken),
    });
    const session: MemberSession = {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: Number.isFinite(expiresValue) && expiresValue > 0 ? expiresValue : undefined,
      user,
    };
    saveSession(session);
    return { status: "signed-in", session };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "RHENLINK handoff could not be completed.",
    };
  }
}

export async function consumeAuthRedirect(): Promise<AuthRedirectResult> {
  if (typeof window === "undefined" || !window.location.hash) return null;
  const params = new URLSearchParams(window.location.hash.slice(1));
  const errorMessage = params.get("error_description") || params.get("error");
  const accessToken = params.get("access_token");

  if (!errorMessage && !accessToken) return null;

  const cleanUrl = `${window.location.pathname}${window.location.search}`;
  window.history.replaceState({}, document.title, cleanUrl);

  if (errorMessage) return { status: "error", message: errorMessage };
  if (!accessToken) return null;

  try {
    const user = await request<MemberUser>("/auth/v1/user", {
      method: "GET",
      headers: headers(accessToken),
    });
    const expiresValue = Number(params.get("expires_in") || 0);
    const session: MemberSession = {
      access_token: accessToken,
      refresh_token: params.get("refresh_token") || undefined,
      expires_in: Number.isFinite(expiresValue) && expiresValue > 0 ? expiresValue : undefined,
      user,
    };
    saveSession(session);
    return { status: "signed-in", session };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "RHENLINK confirmation could not be completed.",
    };
  }
}

export function displayIdentity(session: MemberSession | null) {
  const metadata = session?.user?.user_metadata || {};
  return {
    handle: String(metadata.rhenlink_handle || ""),
    displayName: String(metadata.display_name || session?.user?.email || ""),
  };
}
