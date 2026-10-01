export const SUPABASE_URL = "https://mfntzxheldzdvlokyntk.supabase.co";
export const SUPABASE_KEY = "sb_publishable_XfkgeXau2-6XOPzoXF-Nnw_FSnx0Sae";
export const SESSION_KEY = "anevum.rhenlink.session.v2";
export const AUTH_RETURN_URL = "https://anevum.com/private";

export type RhenUser = {
  id?: string;
  email?: string;
  email_confirmed_at?: string;
  confirmed_at?: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
};

export type RhenSession = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  expires_at?: number;
  token_type?: string;
  auth_type?: string;
  user?: RhenUser;
  saved_at?: number;
};

export function commandAuthHeaders(session: RhenSession): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json"
  };
  if (session.auth_type !== "cloudflare_access" && session.access_token) {
    headers.Authorization = "Bearer " + session.access_token;
  }
  return headers;
}

export async function resolveCommandAccessSession(): Promise<RhenSession | null> {
  try {
    const response = await fetch("/api/command/session", {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store"
    });
    if (!response.ok) return null;
    const payload = await response.json() as {
      authenticated?: boolean;
      email?: string | null;
      auth_source?: string | null;
      command_admin?: boolean;
    };
    if (
      payload.authenticated !== true ||
      payload.auth_source !== "cloudflare_access" ||
      payload.command_admin !== true
    ) {
      return null;
    }
    return {
      access_token: "",
      token_type: "access",
      auth_type: "cloudflare_access",
      user: {
        email: String(payload.email || "").trim().toLowerCase(),
        app_metadata: { command_admin: true, role: "command_admin" }
      }
    };
  } catch {
    return null;
  }
}

function authHeaders(token?: string) {
  const value: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: SUPABASE_KEY
  };
  if (token) value.Authorization = "Bearer " + token;
  return value;
}

async function request<T>(path: string, init: RequestInit & { token?: string } = {}) {
  const response = await fetch(SUPABASE_URL + path, {
    ...init,
    headers: { ...authHeaders(init.token), ...(init.headers || {}) }
  });

  const payload = (await response.json().catch(() => ({}))) as T & {
    message?: string;
    msg?: string;
    error?: string;
    error_description?: string;
  };

  if (!response.ok) {
    throw new Error(
      payload.message ||
        payload.msg ||
        payload.error_description ||
        payload.error ||
        "Request failed"
    );
  }

  return payload;
}

export function loadSession(): RhenSession | null {
  try {
    const value = localStorage.getItem(SESSION_KEY);
    return value ? (JSON.parse(value) as RhenSession) : null;
  } catch {
    return null;
  }
}

export function saveSession(session: RhenSession | null) {
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ ...session, saved_at: Date.now() }));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

export async function consumeAuthRedirect(): Promise<RhenSession | null> {
  if (typeof window === "undefined" || !window.location.hash) return null;

  const params = new URLSearchParams(window.location.hash.slice(1));
  const accessToken = params.get("access_token");
  if (!accessToken) return null;

  const expiresIn = Number(params.get("expires_in") || 0) || undefined;
  const session: RhenSession = {
    access_token: accessToken,
    refresh_token: params.get("refresh_token") || undefined,
    token_type: params.get("token_type") || "bearer",
    auth_type: params.get("type") || undefined,
    expires_in: expiresIn,
    expires_at: expiresIn ? Math.floor(Date.now() / 1000) + expiresIn : undefined
  };

  const user = await request<RhenUser>("/auth/v1/user", {
    method: "GET",
    token: accessToken
  });
  const next = { ...session, user };
  saveSession(next);

  window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
  return next;
}

export async function refreshSessionRequest(refreshToken: string) {
  const next = await request<RhenSession>("/auth/v1/token?grant_type=refresh_token", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken })
  });
  saveSession(next);
  return next;
}

export async function refreshCurrentUser(session: RhenSession) {
  if (session.auth_type === "cloudflare_access") {
    return resolveCommandAccessSession();
  }
  if (!session.access_token) return null;

  let current = session;
  const now = Math.floor(Date.now() / 1000);

  if (current.refresh_token && current.expires_at && current.expires_at <= now + 60) {
    try {
      current = await refreshSessionRequest(current.refresh_token);
    } catch {
      saveSession(null);
      return null;
    }
  }

  try {
    const user = await request<RhenUser>("/auth/v1/user", {
      method: "GET",
      token: current.access_token
    });
    const next = { ...current, user };
    saveSession(next);
    return next;
  } catch {
    if (!current.refresh_token) {
      saveSession(null);
      return null;
    }

    try {
      const refreshed = await refreshSessionRequest(current.refresh_token);
      const user = await request<RhenUser>("/auth/v1/user", {
        method: "GET",
        token: refreshed.access_token
      });
      const next = { ...refreshed, user };
      saveSession(next);
      return next;
    } catch {
      saveSession(null);
      return null;
    }
  }
}

export async function signInRequest(email: string, password: string) {
  return request<RhenSession>("/auth/v1/token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({ email: email.trim(), password })
  });
}

export async function sendMagicLinkRequest(email: string) {
  return request<Record<string, never>>("/auth/v1/otp?redirect_to=" + encodeURIComponent(AUTH_RETURN_URL), {
    method: "POST",
    body: JSON.stringify({
      email: email.trim(),
      create_user: false
    })
  });
}

export async function sendPasswordResetRequest(email: string) {
  return request<Record<string, never>>("/auth/v1/recover?redirect_to=" + encodeURIComponent(AUTH_RETURN_URL), {
    method: "POST",
    body: JSON.stringify({ email: email.trim() })
  });
}

export async function signUpRequest(input: {
  displayName: string;
  handle: string;
  email: string;
  password: string;
}) {
  return request<RhenSession>("/auth/v1/signup?redirect_to=" + encodeURIComponent(AUTH_RETURN_URL), {
    method: "POST",
    body: JSON.stringify({
      email: input.email.trim(),
      password: input.password,
      data: {
        display_name: input.displayName.trim(),
        rhenlink_handle: input.handle.trim().toLowerCase(),
        product: "RHENLINK"
      }
    })
  });
}

export async function updateMetadataRequest(session: RhenSession, patch: Record<string, unknown>) {
  const data = { ...(session.user?.user_metadata || {}), ...patch };
  const user = await request<RhenUser>("/auth/v1/user", {
    method: "PUT",
    token: session.access_token,
    body: JSON.stringify({ data })
  });
  const next = { ...session, user };
  saveSession(next);
  return next;
}

export async function updatePasswordRequest(session: RhenSession, password: string) {
  const user = await request<RhenUser>("/auth/v1/user", {
    method: "PUT",
    token: session.access_token,
    body: JSON.stringify({ password })
  });
  const next = { ...session, auth_type: undefined, user };
  saveSession(next);
  return next;
}

export async function signOutRequest(session: RhenSession | null) {
  if (session?.auth_type === "cloudflare_access") {
    if (typeof window !== "undefined") {
      window.location.assign("/cdn-cgi/access/logout");
    }
    return;
  }
  if (session?.access_token) {
    fetch(SUPABASE_URL + "/auth/v1/logout", {
      method: "POST",
      headers: authHeaders(session.access_token)
    }).catch(() => undefined);
  }
  saveSession(null);
}

export function isCommandAdmin(session: RhenSession | null) {
  const user = session?.user;
  if (!user) return false;

  const meta = user.app_metadata || {};
  if (session?.auth_type === "cloudflare_access") {
    return meta.command_admin === true;
  }
  const role = String(meta.role || "").trim().toLowerCase();
  const email = String(user.email || "").trim().toLowerCase();
  const confirmed = Boolean(user.email_confirmed_at || user.confirmed_at);

  return (
    confirmed &&
    (
      meta.command_admin === true ||
      meta.wiki_admin === true ||
      ["owner", "founder", "admin", "command_admin", "wiki_admin"].includes(role)
    )
  );
}
