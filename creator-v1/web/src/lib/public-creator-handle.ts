/** Approved alpha releases may have no publicly linked creator channel.
 * Validate public handles without inventing /creators/null or exposing private IDs. */
export function publicCreatorHandle(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const handle=value.trim().toLowerCase();
  return /^[a-z][a-z0-9_]{2,29}$/.test(handle)?handle:null;
}
