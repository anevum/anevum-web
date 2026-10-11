/** Strictly local post-login destinations; no user-supplied callback URL is accepted. */
export type MemberReturnPath = "/command" | "/me/beta";

export function signInReturnPath(search: string): MemberReturnPath {
  // The sole optional beta intent is a fixed token, not a URI or route string.
  // Normal member sign-in continues returning to Command.
  return new URLSearchParams(search).get("next") === "beta" ? "/me/beta" : "/command";
}
