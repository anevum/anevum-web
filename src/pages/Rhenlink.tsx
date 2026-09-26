import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import Mark from "../components/Mark";

export default function PrivateAccess() {
  const {
    session,
    loading,
    commandAdmin,
    signIn,
    sendMagicLink,
    sendPasswordReset,
    signOut,
    updatePassword
  } = useAuth();
  const [status, setStatus] = useState("");
  const [signInEmail, setSignInEmail] = useState("");

  if (loading) {
    return (
      <main className="private-screen">
        <div className="private-loading"><Mark /><span>PRIVATE</span><p>Resolving access…</p></div>
      </main>
    );
  }

  async function submitNewPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    const confirmPassword = String(form.get("confirmPassword") || "");

    if (password.length < 8) {
      setStatus("Use at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setStatus("The passwords do not match.");
      return;
    }

    setStatus("Updating password…");
    try {
      await updatePassword(password);
      setStatus("");
    } catch (reason) {
      setStatus(reason instanceof Error ? reason.message : "Could not update the password.");
    }
  }

  if (session?.auth_type === "recovery") {
    return (
      <main className="private-screen">
        <section className="private-panel">
          <header className="private-panel-head">
            <Link className="private-brand" to="/"><Mark /><span>ANEVUM</span></Link>
            <span>PRIVATE</span>
          </header>

          <div className="private-intro">
            <p>PASSWORD RECOVERY</p>
            <h1>Set a new password.</h1>
            <span>This will replace the password for your ANEVUM private account.</span>
          </div>

          <form className="private-form" onSubmit={submitNewPassword}>
            <label>
              <span>New password</span>
              <input name="password" type="password" minLength={8} autoComplete="new-password" required />
            </label>
            <label>
              <span>Confirm password</span>
              <input name="confirmPassword" type="password" minLength={8} autoComplete="new-password" required />
            </label>
            <button className="private-primary" type="submit">Update password <b>↗</b></button>
          </form>

          <p className="private-status">{status}</p>
          <footer>
            <span>Password recovery links are single-use. Use the newest email if an older link has expired.</span>
          </footer>
        </section>
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

  async function emailPasswordReset() {
    if (!signInEmail.trim()) {
      setStatus("Enter your email first.");
      return;
    }

    setStatus("Sending password recovery email…");
    try {
      await sendPasswordReset(signInEmail);
      setStatus("Check your email for the password recovery link.");
    } catch (reason) {
      setStatus(reason instanceof Error ? reason.message : "Could not send the password recovery email.");
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
          <h1>Welcome back.</h1>
          <span>This area is not part of the public ANEVUM experience.</span>
        </div>

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
          <button className="private-secondary" type="button" onClick={emailPasswordReset}>Forgot password</button>
          <button className="private-secondary" type="button" onClick={emailSignInLink}>Email me a sign-in link</button>
        </form>

        <p className="private-status">{status}</p>
        <footer>
          <span>Private access is restricted to approved ANEVUM administrator accounts.</span>
        </footer>
      </section>
    </main>
  );
}
