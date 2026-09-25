export const SUPABASE_URL = "https://mfntzxheldzdvlokyntk.supabase.co";
export const SUPABASE_KEY = "sb_publishable_XfkgeXau2-6XOPzoXF-Nnw_FSnx0Sae";
export const SESSION_KEY = "anevum.rhenlink.session.v2";

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
  user?: RhenUser;
  saved_at?: number;
};

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

export async function refreshCurrentUser(session: RhenSession) {
  if (!session.access_token) return null;
  try {
    const user = await request<RhenUser>("/auth/v1/user", {
      method: "GET",
      token: session.access_token
    });
    const next = { ...session, user };
    saveSession(next);
    return next;
  } catch {
    saveSession(null);
    return null;
  }
}

export async function signInRequest(email: string, password: string) {
  return request<RhenSession>("/auth/v1/token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({ email: email.trim(), password })
  });
}

export async function signUpRequest(input: {
  displayName: string;
  handle: string;
  email: string;
  password: string;
}) {
  const redirect = window.location.origin + "/rhenlink";
  return request<RhenSession>("/auth/v1/signup?redirect_to=" + encodeURIComponent(redirect), {
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

export async function signOutRequest(session: RhenSession | null) {
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
  const role = String(meta.role || "").trim().toLowerCase();
  const email = String(user.email || "").trim().toLowerCase();
  const confirmed = Boolean(user.email_confirmed_at || user.confirmed_at);

  return (
    (email === "devon@anevum.com" && confirmed) ||
    meta.command_admin === true ||
    meta.wiki_admin === true ||
    ["owner", "founder", "admin", "command_admin", "wiki_admin"].includes(role)
  );
}
