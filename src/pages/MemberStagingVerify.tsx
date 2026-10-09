import { useState } from "react";
import { Link } from "react-router-dom";
import { memberAuthClient } from "../member/auth-client";
import { useMemberAvailability } from "../member/useMemberAvailability";
import { runStagingAcceptance, type AcceptanceReport } from "../member/staging-acceptance";

const STAGING_ORIGIN = "https://anevum-member-staging.devonakins.workers.dev";

export default function MemberStagingVerify() {
  const availability = useMemberAvailability();
  const { data: session, isPending } = memberAuthClient.useSession();
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState<AcceptanceReport | null>(null);
  const [error, setError] = useState("");

  // The same static bundle ships to production, but this is an isolated
  // staging-only testing UI, not an elevated backend feature or launch flag.
  if (window.location.origin !== STAGING_ORIGIN) return (
    <main className="member-page">
      <h1>Not available</h1>
      <p>Member acceptance checks are limited to the isolated ANEVUM staging website.</p>
      <Link to="/command">Return to Command</Link>
    </main>
  );

  if (availability === "checking" || isPending) return (
    <main className="member-page"><p role="status">Checking staging account…</p></main>
  );
  if (availability !== "available" || !session?.user) return (
    <main className="member-page">
      <h1>Staging account verification</h1>
      <p>Sign in with a staging Google test account before running the private checks.</p>
      <Link to="/sign-in">Sign in</Link>
    </main>
  );

  const verify = async () => {
    if (running) return;
    setRunning(true);
    setError("");
    setReport(null);
    try { setReport(await runStagingAcceptance(fetch)); }
    catch { setError("The staging acceptance checks could not complete."); }
    finally { setRunning(false); }
  };

  return (
    <main className="member-page member-staging-qa">
      <p className="workshop-kicker">ANEVUM / Staging only</p>
      <h1>Check your member account.</h1>
      <p>This checks the active signed-in browser session against the isolated staging Worker. It reads account identity, export, RHEN draft availability, and financial permission boundaries. It never places orders, changes preferences, or transfers funds.</p>

      <section className="member-section">
        <h2>Current account</h2>
        <p>Signed in as <strong>{session.user.email}</strong>. Use a different browser profile for each independent Google test account.</p>
        <button type="button" className="member-primary-action" disabled={running} onClick={() => void verify()}>
          {running ? "Verifying…" : "Run read-only checks"}
        </button>
        {report && (
          <div className="member-qa-results" role="status">
            <h3>{report.passed ? "All automated session checks passed" : "Some checks need investigation"}</h3>
            <ul>{report.checks.map(check =>
              <li key={check.label}>
                <span aria-label={check.passed ? "Passed" : "Failed"}>{check.passed ? "PASS" : "FAIL"}</span>
                {check.label}
              </li>
            )}</ul>
          </div>
        )}
        {error && <p role="alert" className="member-alert">{error}</p>}
      </section>

      <section className="member-section">
        <h2>Two-account acceptance</h2>
        <p>Run these checks in two separate browser profiles, with different Google test accounts. A pass here verifies each current session, but does not independently prove cross-user isolation.</p>
        <ol>
          <li>Verify the two accounts show their own email and profile, and both pass the checks above.</li>
          <li>Give each account a different RHEN draft name under <Link to="/apps/rhen/setup">Bot draft</Link>. Reload both accounts and confirm neither sees the other's draft.</li>
          <li>Use <Link to="/me/settings">Account settings</Link> to export each account. Confirm the identity and draft in each export match only that account.</li>
          <li>Test account deletion using a disposable staging account, then verify another account's data remains intact.</li>
        </ol>
      </section>

      <p className="member-financial-footnote">
        This tool does not verify OAuth client settings in Google Cloud, deliberately expired session behavior, CSRF/rate-limit resistance with real cookies, or another user's private data. Those remain separate release checks. Production signup is not enabled by a staging PASS.
      </p>
      <Link to="/command">Back to Command</Link>
    </main>
  );
}
