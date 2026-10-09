import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { memberAuthClient } from "../member/auth-client";
import { useMemberAvailability } from "../member/useMemberAvailability";

type RewardsStatus = {
  program: "not_launched";
  earningEnabled: false;
  payoutEnabled: false;
  availableBalanceCents: null;
  currency: "USD";
  history: [];
};

export default function MemberRewards() {
  const availability = useMemberAvailability();
  const { data: session, isPending } = memberAuthClient.useSession();
  const [status, setStatus] = useState<RewardsStatus | null>(null);
  const [error, setError] = useState("");
  const signedIn = availability === "available" && Boolean(session?.user);

  useEffect(() => {
    setStatus(null);
    setError("");
    if (!signedIn) return;
    const controller = new AbortController();
    void fetch("/api/member/rewards", { cache: "no-store", signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error("Reward status could not be verified.");
        return response.json() as Promise<RewardsStatus>;
      })
      .then(value => { if (!controller.signal.aborted) setStatus(value); })
      .catch(() => { if (!controller.signal.aborted) setError("Reward status could not be verified."); });
    return () => controller.abort();
  }, [signedIn, session?.user?.id]);

  return (
    <main className="member-page member-financial">
      <p className="workshop-kicker">Command / Member rewards</p>
      <div className="member-page-heading">
        <div>
          <h1>Giving something back.</h1>
          <p>ANEVUM may eventually share a portion of its genuine business surplus with the people who support its work. This is a future program, not an active financial benefit.</p>
        </div>
        <Link to="/command">Back to Command</Link>
      </div>
      <section className="member-financial-status" aria-labelledby="rewards-state-title">
        <div>
          <span className="member-financial-eyebrow">PROGRAM STATUS</span>
          <h2 id="rewards-state-title">Not launched</h2>
          <p>No credits are accruing, no funds have been allocated to members, and no payouts or brokerage transfers are available.</p>
        </div>
        <span className="member-financial-state">Planned / inactive</span>
      </section>
      {availability === "checking" || isPending ? <p role="status">Checking member access…</p> : !signedIn ? (
        <p className="member-financial-note">Member accounts are {availability === "unavailable" ? "not open to the public yet." : "available for sign-in."} <Link to="/sign-in">Account access</Link></p>
      ) : error ? <p role="alert" className="member-alert">{error}</p> : !status ? (
        <p role="status">Reading program status…</p>
      ) : status.program !== "not_launched" || status.earningEnabled || status.payoutEnabled || status.availableBalanceCents !== null ? (
        <p role="alert" className="member-alert">Unexpected reward status. No financial features are available in this interface.</p>
      ) : <p className="member-financial-note">Your account has no active rewards program. No reward balance is represented.</p>}
      <section className="member-section">
        <h2>What would have to happen first</h2>
        <div className="member-financial-steps">
          <article><span>01</span><div><h3>Real operating surplus</h3><p>Pay operating costs, taxes, and reserves first. Trading profits are not assumed or promised.</p></div></article>
          <article><span>02</span><div><h3>A funded, published rewards policy</h3><p>Set actual eligibility, a capped budget, accounting rules, and clear terms before anyone earns credits.</p></div></article>
          <article><span>03</span><div><h3>Approved payout rails</h3><p>Only send money with member consent through permitted payment or broker-approved funding routes.</p></div></article>
        </div>
      </section>
      <p className="member-financial-footnote">Purchases, tips, visits, and membership do not currently earn rewards. This is not a return on investment, a profit-sharing security, or an offer to manage anyone's investments.</p>
    </main>
  );
}
