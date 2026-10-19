import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { signInReturnPath } from "../member/beta-auth-redirect";
import { memberAuthClient } from "../member/auth-client";
import { useMemberAvailability, refreshMemberAvailability } from "../member/useMemberAvailability";

type LoginMethod = "google" | "github" | "email";

export default function SignIn() {
  const location = useLocation();
  const navigate = useNavigate();
  const destination = signInReturnPath(location.search);
  const availability = useMemberAvailability();
  const { data: session, isPending } = memberAuthClient.useSession();
  const [methods, setMethods] = useState<LoginMethod[]>(["google"]);
  const [error, setError] = useState("");
  const [redirecting, setRedirecting] = useState<LoginMethod | null>(null);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);

  // Server-advertised methods reflect verified secrets + explicit enable flags.
  // If discovery is unavailable, retain only the existing Google login path.
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/member/auth-methods", {
      cache: "no-store",
      credentials: "same-origin",
      signal: controller.signal
    }).then(async (response) => response.ok ? response.json() : null)
      .then((data: unknown) => {
        if (controller.signal.aborted || !data || typeof data !== "object") return;
        const candidate = data as { available?: unknown; methods?: unknown };
        if (candidate.available !== true || !Array.isArray(candidate.methods)) return;
        const permitted: LoginMethod[] = [];
        for (const item of candidate.methods) {
          if ((item === "google" || item === "github" || item === "email") && !permitted.includes(item))
            permitted.push(item);
        }
        if (permitted.includes("google")) setMethods(permitted);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const signIn = async (provider: "google" | "github") => {
    setError("");
    setRedirecting(provider);
    try {
      const result = await memberAuthClient.signIn.social({
        provider,
        callbackURL: destination
      });
      if (result.error) {
        setError(result.error.message || "Sign-in could not be started.");
        setRedirecting(null);
      }
    } catch {
      setError("Sign-in could not be started. Please retry.");
      setRedirecting(null);
    }
  };

  const requestEmailCode = async () => {
    const address = email.trim().toLowerCase();
    if (!address || emailBusy) return;
    setError("");
    setEmailBusy(true);
    try {
      const result = await memberAuthClient.emailOtp.sendVerificationOtp({
        email: address,
        type: "sign-in"
      });
      if (result.error) throw new Error("Could not send a sign-in code. Try another method or retry.");
      setEmail(address);
      setCode("");
      setCodeSent(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not send sign-in code.");
    } finally {
      setEmailBusy(false);
    }
  };

  const verifyEmailCode = async () => {
    if (!/^\d{8}$/.test(code) || emailBusy) return;
    setError("");
    setEmailBusy(true);
    try {
      const result = await memberAuthClient.signIn.emailOtp({
        email: email.trim().toLowerCase(),
        otp: code
      });
      if (result.error) throw new Error("Code not accepted or expired. Request a new one.");
      navigate(destination, { replace: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not verify sign-in code.");
    } finally {
      setEmailBusy(false);
    }
  };

  return (
    <section className="member-auth-page">
      <p className="workshop-kicker">ANEVUM account</p>
      <h1>Your projects. Your Command.</h1>
      <p>Join ANEVUM to save and follow projects and test member features. A brokerage account, payment and trading authorization are not required.</p>
      {availability === "checking" || isPending ? (
        <p role="status">Checking account availability…</p>
      ) : availability === "unavailable" ? (
        <div role="status"><p>Registration could not be verified. Public ANEVUM remains available.</p>
          <button type="button" className="member-primary-action" onClick={() => refreshMemberAvailability()}>Recheck registration</button>
        </div>
      ) : session?.user ? (
        <Link className="member-primary-action" to={destination}>{destination === "/studio" ? "Open Studio" : destination === "/me/beta" ? "Open beta checklist" : "Open Command"}</Link>
      ) : (
        <div className="member-auth-methods">
          <div className="member-auth-social" aria-label="Sign-in providers">
            {methods.includes("google") && <button className="member-primary-action" type="button" disabled={Boolean(redirecting) || emailBusy} onClick={() => void signIn("google")}>
              {redirecting === "google" ? "Opening Google…" : "Continue with Google"}
            </button>}
            {methods.includes("github") && <button className="member-primary-action" type="button" disabled={Boolean(redirecting) || emailBusy} onClick={() => void signIn("github")}>
              {redirecting === "github" ? "Opening GitHub…" : "Continue with GitHub"}
            </button>}
          </div>
          {methods.includes("email") && (
            <form className="member-auth-email" onSubmit={(event) => {
              event.preventDefault();
              void (codeSent ? verifyEmailCode() : requestEmailCode());
            }}>
              <label htmlFor="member-auth-email-input">Sign in with email</label>
              <input id="member-auth-email-input" type="email" autoComplete="email" required maxLength={254}
                disabled={Boolean(redirecting) || emailBusy || codeSent} value={email}
                onChange={event => setEmail(event.target.value)} placeholder="you@example.com" />
              {codeSent && <>
                <label htmlFor="member-auth-code">Eight-digit sign-in code</label>
                <input id="member-auth-code" type="text" inputMode="numeric" autoComplete="one-time-code"
                  pattern="[0-9]{8}" maxLength={8} required disabled={Boolean(redirecting) || emailBusy}
                  value={code} onChange={event => setCode(event.target.value.replace(/\D/g, ""))}
                  placeholder="00000000" />
                <p className="member-muted">Check your inbox. Codes expire after 10 minutes.</p>
              </>}
              <button className="member-primary-action" type="submit" disabled={Boolean(redirecting) || emailBusy}>
                {emailBusy ? "Processing…" : codeSent ? "Verify code and continue" : "Email me a sign-in code"}
              </button>
              {codeSent && <button type="button" disabled={emailBusy || Boolean(redirecting)} onClick={() => { setCodeSent(false); setCode(""); setError(""); }}>
                Use a different email or request a new code
              </button>}
            </form>
          )}
        </div>
      )}
      {error ? <p role="alert" className="member-alert">{error}</p> : null}
      <p className="member-muted">Before creating an account, read the <Link to="/privacy">privacy notice</Link> and <Link to="/terms">terms</Link>.</p>
      <p className="member-muted"><Link to="/products">Explore projects without signing in</Link></p>
    </section>
  );
}
