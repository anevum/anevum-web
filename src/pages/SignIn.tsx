import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { signInReturnPath } from "../member/beta-auth-redirect";
import { memberAuthClient } from "../member/auth-client";
import { useMemberAvailability, refreshMemberAvailability } from "../member/useMemberAvailability";

export default function SignIn() {
  const location = useLocation();
  const destination = signInReturnPath(location.search);
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
        callbackURL: destination
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
      <h1>Your projects. Your Command.</h1>
      <p>Register with Google, save and follow projects, and test ANEVUM as a member. Public work never requires brokerage access.</p>
      {availability === "checking" || isPending ? (
        <p role="status">Checking account availability…</p>
      ) : availability === "unavailable" ? (
        <div role="status"><p>Registration could not be verified. Public ANEVUM remains available.</p>
          <button type="button" className="member-primary-action" onClick={() => refreshMemberAvailability()}>Recheck registration</button>
        </div>
      ) : session?.user ? (
        <Link className="member-primary-action" to={destination}>{destination === "/studio" ? "Open Studio" : destination === "/me/beta" ? "Open beta checklist" : "Open Command"}</Link>
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

