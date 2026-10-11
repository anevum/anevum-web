/** Project only the editable name after the server's member ID matches the session. */
export function verifiedProfileName(value: unknown, memberId: string): string {
  if (!memberId || !value || typeof value !== "object") throw new Error("The member identity could not be verified. Sign in again.");
  const payload = value as { user?: { id?: unknown }; profile?: { displayName?: unknown } };
  if (payload.user?.id !== memberId || typeof payload.profile?.displayName !== "string" || !payload.profile.displayName.trim()) {
    throw new Error("The member identity could not be verified. Sign in again.");
  }
  return payload.profile.displayName;
}
