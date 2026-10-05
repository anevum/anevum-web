export type RhenUser = {
  id?: string;
  email?: string;
  app_metadata?: Record<string, unknown>;
};

export type CommandTenant = {
  tenant_id: string;
  tenant_key?: string | null;
  display_name?: string | null;
  tenant_status?: string | null;
  role?: string | null;
};

export type RhenSession = {
  access_token: "";
  token_type: "access";
  auth_type: "cloudflare_access";
  command_admin: boolean;
  surface: "operator" | "customer";
  principal_id?: string | null;
  active_tenant_id?: string | null;
  tenants: CommandTenant[];
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
      surface?: "operator" | "customer";
      principal_id?: string | null;
      active_tenant_id?: string | null;
      tenants?: CommandTenant[];
    };
    if (
      payload.authenticated !== true ||
      payload.auth_source !== "cloudflare_access"
    ) {
      return null;
    }

    const admin = payload.command_admin === true;
    const tenants = Array.isArray(payload.tenants) ? payload.tenants : [];
    if (!admin && tenants.length === 0) return null;

    return {
      access_token: "",
      token_type: "access",
      auth_type: "cloudflare_access",
      command_admin: admin,
      surface: admin ? "operator" : "customer",
      principal_id: payload.principal_id || null,
      active_tenant_id: payload.active_tenant_id || tenants[0]?.tenant_id || null,
      tenants,
      user: {
        email: String(payload.email || "").trim().toLowerCase(),
        app_metadata: {
          command_admin: admin,
          role: admin ? "command_admin" : "command_customer"
        }
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
  return (
    session?.auth_type === "cloudflare_access" &&
    session.command_admin === true &&
    session.user?.app_metadata?.command_admin === true
  );
}
