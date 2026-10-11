/** Strictly local post-login destinations; no user-supplied callback URL is accepted. */
export type MemberReturnPath = "/command" | "/me/beta" | "/studio";

export function signInReturnPath(search: string): MemberReturnPath {
  // The sole optional beta intent is a fixed token, not a URI or route string.
  // Normal member sign-in continues returning to Command.
  const intent = new URLSearchParams(search).get("next");
  return intent === "beta" ? "/me/beta" : intent === "studio" ? "/studio" : "/command";
}
