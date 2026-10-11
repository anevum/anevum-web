import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { memberAuthClient } from "../member/auth-client";
import { useMemberAvailability } from "../member/useMemberAvailability";
import { verifiedProfileName } from "../member/profile-settings";

type Identity = { id: string; email?: string | null };

function CheckingAccount() {
  return <section className="member-page"><p role="status">Checking account…</p></section>;
}
function SignInSettings() {
  return <section className="member-page"><h1>Account settings</h1><Link to="/sign-in">Sign in</Link></section>;
}
export default function MemberSettings() {
  const availability = useMemberAvailability();
  if (availability === "checking") return <CheckingAccount/>;
  if (availability !== "available") return <SignInSettings/>;
  return <SignedInSettings/>;
}
function SignedInSettings() {
  const { data: session, isPending } = memberAuthClient.useSession();
  if (isPending) return <CheckingAccount/>;
  if (!session?.user?.id) return <SignInSettings/>;
  // The entire editable tree and its pending operations belong to one identity.
  return <AccountSettings key={session.user.id} identity={session.user}/>;
}
function AccountSettings({ identity }: { identity: Identity }) {
  const [displayName, setDisplayName] = useState("");
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const scope = useRef<AbortController | null>(null);
  const navigate = useNavigate();
  const load = useCallback(async (signal: AbortSignal) => {
    if (signal.aborted) return;
    const response = await fetch("/api/member/me", { cache: "no-store", signal });
    if (!response.ok) throw new Error("Could not load your settings.");
    const name = verifiedProfileName(await response.json(), identity.id);
    if (!signal.aborted) { setDisplayName(name); setVerified(true); }
  }, [identity.id]);

  useEffect(() => {
    const controller = new AbortController();
    scope.current = controller;
    setDisplayName(""); setVerified(false); setError(""); setMessage(""); setLoading(true);
    void load(controller.signal)
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Could not load your settings.");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => { controller.abort(); };
  }, [load]);

  const retry = async () => {
    const controller = scope.current;
    if (!controller || controller.signal.aborted || busy || loading) return;
    setLoading(true); setVerified(false); setDisplayName(""); setError(""); setMessage("");
    try { await load(controller.signal); }
    catch (reason) { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Could not load your settings."); }
    finally { if (!controller.signal.aborted) setLoading(false); }
  };
  const save = async () => {
    const controller = scope.current;
    const name = displayName.trim();
    if (!controller || controller.signal.aborted || busy || !verified || loading || !name || name.length > 64) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/member/me", {
        method: "PATCH", signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: name })
      });
      if (!response.ok) throw new Error("Could not update your profile.");
      // Verify and display the persisted profile rather than trusting an HTTP success alone.
      await load(controller.signal);
      if (!controller.signal.aborted) setMessage("Name saved.");
    } catch (reason) {
      if (!controller.signal.aborted) { setVerified(false); setDisplayName(""); setError(reason instanceof Error ? reason.message : "Update failed."); }
    } finally { if (!controller.signal.aborted) setBusy(false); }
  };
  const signOut = async () => {
    const controller = scope.current;
    if (!controller || controller.signal.aborted || busy) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const result = await memberAuthClient.signOut({ fetchOptions: { signal: controller.signal } });
      if (result.error) throw new Error("Could not sign out. Please try again.");
      if (!controller.signal.aborted) navigate("/", { replace: true });
    } catch (reason) {
      if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Could not sign out.");
    } finally { if (!controller.signal.aborted) setBusy(false); }
  };
  const remove = async () => {
    const controller = scope.current;
    if (!controller || controller.signal.aborted || busy || !verified || loading) return;
    if (!window.confirm("Permanently delete your ANEVUM account, saved programs, follows, profile and RHEN drafts? This cannot be undone.")) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const result = await memberAuthClient.deleteUser({ fetchOptions: { signal: controller.signal } });
      if (result.error) throw new Error("Deletion requires a recent sign-in. Sign in again, then retry.");
      if (!controller.signal.aborted) navigate("/", { replace: true });
    } catch (reason) {
      if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Account deletion failed.");
    } finally { if (!controller.signal.aborted) setBusy(false); }
  };

  return <div className="member-page member-settings" data-settings-state={verified ? "verified" : loading ? "loading" : "unverified"}>
    <p className="workshop-kicker">Command / Profile</p><h1>Account settings</h1><p>{identity.email}</p>
    {loading && <p role="status">Loading your settings…</p>}
    {error && <div role="alert" className="member-alert"><p>{error}</p><button type="button" disabled={busy || loading} onClick={() => void retry()}>Reload settings</button></div>}
    {message && <p role="status">{message}</p>}
    <form className="member-section" onSubmit={event => { event.preventDefault(); void save(); }}>
      <h2>Profile</h2>
      <label htmlFor="member-display-name">Display name</label>
      <input id="member-display-name" value={displayName} maxLength={64} disabled={busy || loading || !verified} onChange={event => { setDisplayName(event.target.value); setMessage(""); }}/>
      <button type="submit" disabled={busy || loading || !verified || !displayName.trim() || displayName.trim().length > 64}>Save changes</button>
    </form>
    <section className="member-section">
      <h2>Account</h2>
      <p>ANEVUM accounts save project preferences and optional, non-executing RHEN configuration drafts. Signing up does not connect you to any brokerage account.</p>
      {verified && <p><a href="/api/member/export" download="anevum-account-data.json">Download my account data (JSON)</a></p>}
      {["https://anevum-member-staging.devonakins.workers.dev",
        "https://anevum-v5-beta.devonakins.workers.dev"].includes(window.location.origin) &&
        <p><Link to="/me/verify">Run private beta account verification</Link></p>}
      <button type="button" disabled={busy} onClick={() => void signOut()}>Sign out</button>
      <button type="button" className="member-danger-action" disabled={busy || loading || !verified} onClick={() => void remove()}>Delete account permanently</button>
    </section>
    <Link to="/command">Back to Command</Link>
  </div>;
}
