// A member terminal is never the company's RHEN broker session.
// This module does not read global broker credentials or authorize trading.
function email(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function isConfiguredOwnerMember(user, env) {
  const memberId = env?.ANEVUM_OWNER_MEMBER_ID;
  return typeof memberId === "string"
    && memberId.length >= 8
    && memberId === memberId.trim()
    && typeof user?.id === "string"
    && user.id === memberId
    && user.emailVerified === true;
}

export function hasBoundOwnerTerminalAccess(user, accessIdentity, env) {
  const expectedEmail = email(env?.ANEVUM_OWNER_ACCESS_EMAIL);
  return isConfiguredOwnerMember(user, env)
    && expectedEmail.length > 0
    && email(accessIdentity?.email) === expectedEmail
    && accessIdentity?.source === "cloudflare_access";
}

export function ownerDualAuthEnabled(env) {
  return env?.ANEVUM_OWNER_TERMINAL_DUAL_AUTH === "true";
}

export function isCompanyTerminalPath(pathname) {
  return pathname === "/command/rhen"
    || pathname.startsWith("/command/rhen/")
    || pathname === "/api/command"
    || pathname.startsWith("/api/command/");
}

// This is a non-executing readiness contract for the signed-in member's OWN
// future broker workspace. It must not borrow owner live feed data.
export function memberTerminalStatus(user, env) {
  if (!user?.id) throw new Error("Authenticated member required.");
  return {
    terminalScope: "personal",
    ownerMember: isConfiguredOwnerMember(user, env),
    provider: "alpaca",
    connectionAvailable: false,
    brokerageConnected: false,
    account: null,
    portfolio: null,
    positions: null,
    orders: null,
    personalBotRunning: false,
    paperTradingEnabled: false,
    liveTradingEnabled: false,
    depositsEnabled: false,
    withdrawalsEnabled: false
  };
}
