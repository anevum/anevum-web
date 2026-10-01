export type RhenUser = {
  email?: string;
  app_metadata?: Record<string, unknown>;
};

export type RhenSession = {
  access_token: string;
  token_type?: string;
  auth_type: "cloudflare_access";
  user?: RhenUser;
};

export function commandAuthHeaders(_session: RhenSession): Record<string, string> {
  return {
    Accept: "application/json",
    "Content-Type": "application/json"
  };
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

export async function signOutRequest() {
  if (typeof window !== "undefined") {
    window.location.assign("/cdn-cgi/access/logout");
  }
}

export function isCommandAdmin(session: RhenSession | null) {
  return session?.auth_type === "cloudflare_access"
    && session?.user?.app_metadata?.command_admin === true;
}
