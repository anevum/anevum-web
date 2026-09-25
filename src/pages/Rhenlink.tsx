import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import PageIntro from "../components/PageIntro";

export default function Rhenlink() {
  const { session, loading, commandAdmin, signIn, signUp, signOut, updateMetadata } = useAuth();
  const [mode, setMode] = useState<"create" | "signin">("create");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  if (loading) {
    return (
      <section className="auth-loading">
        <span>RHENLINK</span>
        <p>Resolving identity…</p>
      </section>
    );
  }

  if (session?.user) {
    const metadata = session.user.user_metadata || {};
    const display =
      String(metadata.display_name || metadata.rhenlink_handle || session.user.email || "RHENLINK");
    const updates = metadata.anevum_system_updates === true;

    async function toggleUpdates(next: boolean) {
      setSaving(true);
      setStatus("Saving…");
      try {
        await updateMetadata({
          anevum_system_updates: next,
          anevum_system_updates_at: new Date().toISOString(),
          anevum_system_updates_source: "anevum-web"
        });
        setStatus(next ? "Development updates enabled." : "Development updates disabled.");
      } catch (reason) {
        setStatus(reason instanceof Error ? reason.message : "Could not save preference.");
      } finally {
        setSaving(false);
      }
    }

    return (
      <>
        <PageIntro kicker="RHENLINK" title={display}>
          <p>Your ANEVUM identity is active. RHENLINK is the persistent account layer for preferences and permission-gated tools.</p>
        </PageIntro>

        <section className="content-section identity-grid">
          <article className="identity-panel">
            <span>ACCOUNT</span>
            <h2>{session.user.email}</h2>
            <p>Authenticated identity connected to ANEVUM.</p>
            <button className="secondary-button" type="button" onClick={() => signOut()}>Sign out</button>
          </article>

          <article className="identity-panel">
            <span>PREFERENCES</span>
            <div className="preference-row">
              <div><strong>ANEVUM development updates</strong><p>Store this preference on your RHENLINK identity.</p></div>
              <button
                className={updates ? "toggle on" : "toggle"}
                type="button"
                disabled={saving}
                aria-pressed={updates}
                onClick={() => toggleUpdates(!updates)}
              ><i /></button>
            </div>
            <p className="form-status">{status}</p>
          </article>

          <article className="identity-panel">
            <span>ACCESS</span>
            <h2>{commandAdmin ? "Command authorized" : "Standard identity"}</h2>
            <p>{commandAdmin ? "This RHENLINK can open the private operations console." : "Private operational access is permission-gated separately."}</p>
            {commandAdmin && <Link className="primary-link compact-link" to="/command">Open Command <span>↗</span></Link>}
          </article>
        </section>
      </>
    );
  }

  async function createAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setStatus("Creating RHENLINK…");
    try {
      const complete = await signUp({
        displayName: String(form.get("displayName") || ""),
        handle: String(form.get("handle") || ""),
        email: String(form.get("email") || ""),
        password: String(form.get("password") || "")
      });
      if (!complete) {
        setMode("signin");
        setStatus("Check your email to confirm the RHENLINK, then sign in.");
      }
    } catch (reason) {
      setStatus(reason instanceof Error ? reason.message : "Could not create RHENLINK.");
    }
  }

  async function signIntoAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setStatus("Signing in…");
    try {
      await signIn(String(form.get("email") || ""), String(form.get("password") || ""));
      setStatus("");
    } catch (reason) {
      setStatus(reason instanceof Error ? reason.message : "Could not sign in.");
    }
  }

  return (
    <>
      <PageIntro kicker="RHENLINK" title="One identity for ANEVUM.">
        <p>
          RHENLINK is deliberately small: an authenticated identity for preferences and private
          tools. It is not a social network and it does not need to become one.
        </p>
      </PageIntro>

      <section className="content-section auth-layout">
        <div className="auth-card">
          <div className="auth-tabs">
            <button className={mode === "create" ? "active" : ""} onClick={() => { setMode("create"); setStatus(""); }} type="button">Create</button>
            <button className={mode === "signin" ? "active" : ""} onClick={() => { setMode("signin"); setStatus(""); }} type="button">Sign in</button>
          </div>

          {mode === "create" ? (
            <form onSubmit={createAccount}>
              <label><span>Display name</span><input name="displayName" required autoComplete="name" /></label>
              <label><span>RHENLINK handle</span><input name="handle" required autoComplete="username" autoCapitalize="none" /></label>
              <label><span>Email</span><input name="email" type="email" required autoComplete="email" /></label>
              <label><span>Password</span><input name="password" type="password" minLength={8} required autoComplete="new-password" /></label>
              <button className="primary-button" type="submit">Create RHENLINK <span>↗</span></button>
            </form>
          ) : (
            <form onSubmit={signIntoAccount}>
              <label><span>Email</span><input name="email" type="email" required autoComplete="email" /></label>
              <label><span>Password</span><input name="password" type="password" required autoComplete="current-password" /></label>
              <button className="primary-button" type="submit">Sign in <span>↗</span></button>
            </form>
          )}

          <p className="form-status">{status}</p>
        </div>

        <div className="auth-explainer">
          <div><span>01</span><strong>Identity</strong><p>One persistent account across ANEVUM.</p></div>
          <div><span>02</span><strong>Preferences</strong><p>Keep communication and interface settings attached to you.</p></div>
          <div><span>03</span><strong>Private tools</strong><p>Approved identities can access permission-gated systems such as Command.</p></div>
        </div>
      </section>
    </>
  );
}
