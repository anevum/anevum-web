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
        callbackURL: "/commons"
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
      <p className="workshop-kicker">ANEVUM / Commons</p>
      <h1>One account. Your research space.</h1>
      <p>Enter Commons, manage your private Command, and follow the development of RHEN and future applications. Commons research contributions are currently invitation-only; joining ANEVUM is free.</p>
      {availability === "checking" || isPending ? (
        <p role="status">Checking account availability…</p>
      ) : availability === "unavailable" ? (
        <p role="status">Member registration is not open yet. Published research and projects remain available without signing in.</p>
      ) : session?.user ? (
        <Link className="member-primary-action" to="/commons">Enter Commons</Link>
      ) : (
        <button className="member-primary-action" type="button" disabled={redirecting} onClick={() => void signIn()}>
          {redirecting ? "Opening Google…" : "Continue with Google"}
        </button>
      )}
      {error ? <p role="alert" className="member-alert">{error}</p> : null}
      <p className="member-muted">Before creating an account, read the <Link to="/privacy">privacy notice</Link> and <Link to="/terms">terms</Link>.</p>
      <p className="member-muted"><Link to="/field-notes">Browse published research without signing in</Link></p>
    </section>
  );
}

