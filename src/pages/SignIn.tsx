import { useState } from "react";
import { Link } from "react-router-dom";
import { memberAuthClient } from "../member/auth-client";
import { useMemberAvailability } from "../member/useMemberAvailability";

export default function SignIn() {
  const availability = useMemberAvailability();
  const { data: session, isPending } = memberAuthClient.useSession();
  const [error, setError] = useState("");
  const [redirecting, setRedirecting] = useState(false);

  const signIn = async () => {
    setError("");
    setRedirecting(true);
    try {
      const result = await memberAuthClient.signIn.social({
        provider: "google",
        callbackURL: "/me"
      });
      if (result.error) {
        setError(result.error.message || "Sign-in could not be started.");
        setRedirecting(false);
      }
    } catch {
      setError("Sign-in could not be started. Please retry.");
      setRedirecting(false);
    }
  };

  return (
    <section className="member-auth-page">
      <p className="workshop-kicker">ANEVUM account</p>
      <h1>Your space for projects.</h1>
      <p>Save software you use, follow development, and open applications that are actually available. Public projects and Field Notes never require an account.</p>
      {availability === "checking" || isPending ? (
        <p role="status">Checking account availability…</p>
      ) : availability === "unavailable" ? (
        <p role="status">Member registration is not open yet. The rest of ANEVUM remains available without signing in.</p>
      ) : session?.user ? (
        <Link className="member-primary-action" to="/me">Go to My Space</Link>
      ) : (
        <button className="member-primary-action" type="button" disabled={redirecting} onClick={() => void signIn()}>
          {redirecting ? "Opening Google…" : "Continue with Google"}
        </button>
      )}
      {error ? <p role="alert" className="member-alert">{error}</p> : null}
      <p className="member-muted">Before creating an account, read the <Link to="/privacy">privacy notice</Link> and <Link to="/terms">terms</Link>.</p>
      <p className="member-muted"><Link to="/products">Explore projects without signing in</Link></p>
    </section>
  );
}
