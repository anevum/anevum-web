import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { memberAuthClient } from "../member/auth-client";
import { useMemberAvailability } from "../member/useMemberAvailability";

export default function MemberSettings() {
  const availability = useMemberAvailability();
  const { data: session, isPending } = memberAuthClient.useSession();
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!session?.user || availability !== "available") return;
    let active = true;
    fetch("/api/member/me", { cache: "no-store" })
      .then(async response => {
        if (!response.ok) throw new Error("Settings unavailable.");
        return response.json();
      })
      .then(value => { if (active) setDisplayName(String(value.profile?.displayName || session.user.name || "")); })
      .catch(() => { if (active) setError("Could not load your settings."); });
    return () => { active = false; };
  }, [session?.user, availability]);

  if (isPending || availability === "checking") return <section className="member-page"><p>Checking account…</p></section>;
  if (!session?.user || availability !== "available") return <section className="member-page"><h1>Account settings</h1><Link to="/sign-in">Sign in</Link></section>;

  const save = async () => {
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/member/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName })
      });
      if (!response.ok) throw new Error("Could not update your profile.");
      setMessage("Name saved.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Update failed."); }
    finally { setBusy(false); }
  };

  const remove = async () => {
    if (!window.confirm("Permanently delete your ANEVUM account, saved projects, and follows? This cannot be undone.")) return;
    setBusy(true); setError("");
    try {
      const { error: deletionError } = await memberAuthClient.deleteUser();
      if (deletionError) throw new Error(deletionError.message || "Deletion requires a recent sign-in. Sign in again, then retry.");
      navigate("/", { replace: true });
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Account deletion failed."); }
    finally { setBusy(false); }
  };

  return (
    <div className="member-page member-settings">
      <p className="workshop-kicker">Command / Profile</p>
      <h1>Account settings</h1>
      <p>{session.user.email}</p>
      {error && <p role="alert" className="member-alert">{error}</p>}
      {message && <p role="status">{message}</p>}
      <section className="member-section">
        <h2>Profile</h2>
        <label htmlFor="member-display-name">Display name</label>
        <input id="member-display-name" value={displayName} maxLength={64} onChange={(event) => setDisplayName(event.target.value)} />
        <button type="button" disabled={busy || displayName.trim().length < 1} onClick={() => void save()}>Save changes</button>
      </section>
      <section className="member-section">
        <h2>Account</h2>
        <p>ANEVUM accounts save project preferences. Signing up does not connect you to any brokerage account.</p>
        <p><a href="/api/member/export" download="anevum-account-data.json">Download my account data (JSON)</a></p>
        <button type="button" disabled={busy} onClick={() => void memberAuthClient.signOut({ fetchOptions: { onSuccess: () => navigate("/", { replace: true }) } })}>Sign out</button>
        <button type="button" className="member-danger-action" disabled={busy} onClick={() => void remove()}>Delete account permanently</button>
      </section>
      <Link to="/command">Back to Command</Link>
    </div>
  );
}

