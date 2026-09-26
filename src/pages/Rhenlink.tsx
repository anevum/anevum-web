import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import Mark from "../components/Mark";

export default function PrivateAccess() {
  const { session, loading, commandAdmin, signIn, sendMagicLink, signUp, signOut } = useAuth();
  const [mode, setMode] = useState<"signin" | "create">("signin");
  const [status, setStatus] = useState("");
  const [signInEmail, setSignInEmail] = useState("");

  if (loading) {
    return (
      <main className="private-screen">
        <div className="private-loading"><Mark /><span>PRIVATE</span><p>Resolving access…</p></div>
      </main>
    );
  }

  if (session?.user) {
    const metadata = session.user.user_metadata || {};
    const display = String(
      metadata.display_name || metadata.rhenlink_handle || session.user.email || "Private user"
    );

    return (
      <main className="private-screen">
        <section className="private-panel signed-in">
          <header className="private-panel-head">
            <div className="private-brand"><Mark /><span>ANEVUM</span></div>
            <span>PRIVATE</span>
          </header>

          <div className="private-welcome">
            <p>ACCESS RESOLVED</p>
            <h1>{display}</h1>
            <span>{session.user.email}</span>
          </div>

          <div className="private-actions">
            {commandAdmin ? (
              <Link className="private-primary" to="/command">Open Command <b>↗</b></Link>
            ) : (
              <div className="private-state">
                <span>ACCOUNT ACTIVE</span>
                <p>This account exists, but private administrator permissions have not been enabled yet.</p>
              </div>
            )}
            <Link className="private-secondary" to="/">Public site</Link>
            <button className="private-secondary" type="button" onClick={() => signOut()}>Sign out</button>
          </div>

          <footer>
            <span>Private access is permission-gated separately from account creation.</span>
          </footer>
        </section>
      </main>
    );
  }

  async function submitSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setStatus("Resolving access…");
    try {
      await signIn(signInEmail, String(form.get("password") || ""));
      setStatus("");
    } catch (reason) {
      setStatus(reason instanceof Error ? reason.message : "Could not sign in.");
    }
  }

  async function emailSignInLink() {
    if (!signInEmail.trim()) {
      setStatus("Enter your email first.");
      return;
    }

    setStatus("Sending secure sign-in link…");
    try {
      await sendMagicLink(signInEmail);
      setStatus("Check your email for a secure sign-in link.");
    } catch (reason) {
      setStatus(reason instanceof Error ? reason.message : "Could not send the sign-in link.");
    }
  }

  async function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setStatus("Creating private account…");
    try {
      const email = String(form.get("email") || "");
      const displayName = String(form.get("displayName") || "");
      const complete = await signUp({
        displayName,
        handle: email.split("@")[0].toLowerCase().replace(/[^a-z0-9_-]/g, "") || displayName.toLowerCase().replace(/[^a-z0-9_-]/g, ""),
        email,
        password: String(form.get("password") || "")
      });
      if (!complete) {
        setSignInEmail(email);
        setMode("signin");
        setStatus("If this is a new account, check your email for the confirmation link. If you have used this email before, use the email sign-in link below.");
      }
    } catch (reason) {
      setStatus(reason instanceof Error ? reason.message : "Could not create account.");
    }
  }

  return (
    <main className="private-screen">
      <section className="private-panel">
        <header className="private-panel-head">
          <Link className="private-brand" to="/"><Mark /><span>ANEVUM</span></Link>
          <span>PRIVATE</span>
        </header>

        <div className="private-intro">
          <p>PRIVATE ACCESS</p>
          <h1>{mode === "signin" ? "Welcome back." : "Create access."}</h1>
          <span>This area is not part of the public ANEVUM experience.</span>
        </div>

        <div className="private-tabs">
          <button className={mode === "signin" ? "active" : ""} type="button" onClick={() => { setMode("signin"); setStatus(""); }}>Sign in</button>
          <button className={mode === "create" ? "active" : ""} type="button" onClick={() => { setMode("create"); setStatus(""); }}>Create</button>
        </div>

        {mode === "signin" ? (
          <form className="private-form" onSubmit={submitSignIn}>
            <label>
              <span>Email</span>
              <input
                name="email"
                type="email"
                autoComplete="email"
                value={signInEmail}
                onChange={(event) => setSignInEmail(event.target.value)}
                required
              />
            </label>
            <label><span>Password</span><input name="password" type="password" autoComplete="current-password" required /></label>
            <button className="private-primary" type="submit">Sign in <b>↗</b></button>
            <button className="private-secondary" type="button" onClick={emailSignInLink}>Email me a sign-in link</button>
          </form>
        ) : (
          <form className="private-form" onSubmit={submitCreate}>
            <label><span>Name</span><input name="displayName" autoComplete="name" required /></label>
            <label><span>Email</span><input name="email" type="email" autoComplete="email" required /></label>
            <label><span>Password</span><input name="password" type="password" minLength={8} autoComplete="new-password" required /></label>
            <button className="private-primary" type="submit">Create account <b>↗</b></button>
          </form>
        )}

        <p className="private-status">{status}</p>
        <footer>
          <span>Creating an account does not grant administrator access.</span>
        </footer>
      </section>
    </main>
  );
}
