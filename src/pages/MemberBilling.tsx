import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { memberAuthClient } from "../member/auth-client";
import { useMemberAvailability } from "../member/useMemberAvailability";

type Plan = { code: string; amountCents: number; currency: string; interval: string };
type Subscription = { plan: string; status: string; currentPeriodEnd: number | null; cancelAtPeriodEnd: boolean };
type BetaStatus = {available:boolean; joined:boolean; joinedAt:string|null; priceCents?:number; executionEnabled?:boolean};
type BillingStatus = {
  available: boolean;
  checkoutEnabled: boolean;
  foundingEnabled: boolean;
  manageEnabled: boolean;
  paidAccess: boolean;
  plans: Record<"founding" | "standard", Plan>;
  subscription: Subscription | null;
  lastReconciledAt: number | null;
  paperExecutionEnabled: false;
  liveExecutionEnabled: false;
};

const displayPrice = (plan: Plan) => new Intl.NumberFormat("en-US", {
  style: "currency", currency: plan.currency.toUpperCase()
}).format(plan.amountCents / 100);

export default function MemberBilling() {
  const availability = useMemberAvailability();
  const { data: session, isPending } = memberAuthClient.useSession();
  const [search] = useSearchParams();
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [beta, setBeta] = useState<BetaStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session?.user || availability !== "available") return;
    const controller = new AbortController();
    setLoading(true);
    void fetch("/api/member/billing", { cache: "no-store", signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error("Billing status is unavailable.");
        return await response.json() as BillingStatus;
      })
      .then(data => {
        if (controller.signal.aborted) return;
        if (data.paperExecutionEnabled || data.liveExecutionEnabled) {
          throw new Error("Unexpected financial capability state.");
        }
        setBilling(data);
      })
      .catch(reason => {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Billing unavailable.");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [availability, session?.user?.id]);

  useEffect(() => {
    if (!session?.user || availability !== "available") return;
    const controller=new AbortController();
    void fetch("/api/member/rhen/beta",{cache:"no-store",signal:controller.signal})
      .then(async response => {
        const body=await response.json() as BetaStatus;
        if (body.executionEnabled) throw new Error("Unexpected trading access.");
        return body;
      })
      .then(body => {if(!controller.signal.aborted)setBeta(body);})
      .catch(() => {if(!controller.signal.aborted)setBeta({available:false,joined:false,joinedAt:null});});
    return () => controller.abort();
  },[availability,session?.user?.id]);

  const toggleBeta = async (join:boolean) => {
    setBusy(true);setError("");
    try {
      const response=await fetch("/api/member/rhen/beta",{
        method:join?"POST":"DELETE",
        headers:{"Content-Type":"application/json"},
        body:join?"{}":undefined
      });
      const body=await response.json() as BetaStatus & {message?:string};
      if(!response.ok)throw new Error(body.message||"Beta registration unavailable.");
      if(body.executionEnabled)throw new Error("Unexpected trading capability.");
      setBeta(body);
    } catch(reason) {
      setError(reason instanceof Error?reason.message:"Unable to update beta registration.");
    } finally {setBusy(false);}
  };

  const refreshBilling = async () => {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/member/billing/refresh", {method:"POST",headers:{"Content-Type":"application/json"},body:"{}"});
      const payload = await response.json() as BillingStatus & {message?:string};
      if (!response.ok) throw new Error(payload.message || "Refresh unavailable.");
      if (payload.paperExecutionEnabled || payload.liveExecutionEnabled) throw new Error("Unexpected trading capability.");
      setBilling(payload);
    } catch (err) { setError(err instanceof Error ? err.message : "Refresh failed."); }
    finally { setBusy(false); }
  };

  const redirectToStripe = async (operation: "checkout" | "portal", plan?: "founding" | "standard") => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/member/billing/" + operation, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(operation === "checkout" ? { plan } : {})
      });
      const result = await response.json().catch(() => ({})) as { url?: string; message?: string };
      if (!response.ok || !result.url) throw new Error(result.message || "Billing action unavailable.");
      const target = new URL(result.url);
      const expected = operation === "checkout" ? "https://checkout.stripe.com" : "https://billing.stripe.com";
      if (target.origin !== expected) throw new Error("Billing returned an untrusted destination.");
      window.location.assign(target.toString());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Billing action failed.");
      setBusy(false);
    }
  };

  if (isPending || availability === "checking") {
    return <section className="member-page"><p role="status">Checking your account…</p></section>;
  }
  if (!session?.user || availability !== "available") {
    return <section className="member-page"><h1>RHEN Cloud billing</h1><p>Sign in to inspect subscription availability.</p><Link to="/sign-in">Sign in</Link></section>;
  }

  return (
    <section className="member-page member-settings">
      <p className="workshop-kicker">Command / Subscription</p>
      <h1>RHEN Cloud</h1>
      <p>ANEVUM accounts and public research remain free. RHEN Cloud is a proposed subscription for the separately approved, hosted RHEN service. It does not enable trading today.</p>
      {search.get("checkout") === "success" && <p role="status">Checkout returned. Billing access is confirmed only after Stripe webhook reconciliation; refresh this page to see verified status.</p>}
      {search.get("checkout") === "cancelled" && <p role="status">Checkout was cancelled. No subscription is inferred from this page.</p>}
      {error && <p role="alert" className="member-alert">{error}</p>}
      {loading && <p role="status">Loading your subscription status…</p>}
      {!billing && !loading && <p>Billing configuration is not available in this environment.</p>}
      <section className="member-section" aria-labelledby="rhen-beta-title">
        <h2 id="rhen-beta-title">Free RHEN beta</h2>
        <p>Join the opt-in interest list for a future RHEN Cloud paper-testing invitation. This is free, does not connect a broker, does not execute trades, and does not enroll you in a subscription. Invitations are not guaranteed.</p>
        {beta?.joined && <>
          <p role="status">You're on the interest list.</p>
          {beta.joinedAt && <p>Joined: {new Date(beta.joinedAt.replace(" ","T")+"Z").toLocaleDateString()}</p>}
        </>}
        {beta?.available
          ? <button type="button" disabled={busy} onClick={() => void toggleBeta(!beta.joined)}>
              {beta.joined ? "Leave free beta list" : "Join free beta list"}
            </button>
          : <p role="status">Beta registration is not yet open.</p>}
      </section>
      {billing && <>
        <section className="member-section">
          <h2>Subscription status</h2>
          <p>{billing.subscription
            ? <>Recorded status: <strong>{billing.subscription.status}</strong> · Plan: <strong>{billing.subscription.plan}</strong></>
            : "No RHEN Cloud subscription is recorded for this account."}</p>
          {billing.subscription?.currentPeriodEnd && <p>Current billing period ends: {new Date(billing.subscription.currentPeriodEnd * 1000).toLocaleDateString()}</p>}
          {billing.subscription?.cancelAtPeriodEnd && <p>Cancellation is scheduled at the end of the billing period.</p>}
          <p>{billing.paidAccess ? "Subscription entitlement recorded." : "No current paid entitlement."} Personal paper and live trading remain unavailable until a separate RHEN release.</p>
          {billing.available && <button type="button" disabled={busy} onClick={() => void refreshBilling()}>Refresh subscription status</button>}
          {billing.lastReconciledAt && <p>Last checked with Stripe: {new Date(billing.lastReconciledAt).toLocaleString()}</p>}
          {billing.manageEnabled && <button type="button" disabled={busy} onClick={() => void redirectToStripe("portal")}>Manage billing in Stripe</button>}
        </section>
        <section className="member-section">
          <h2>Planned monthly pricing</h2>
          {(["founding", "standard"] as const).map(plan => (
            <div key={plan} className="member-app-ready">
              <h3>{plan === "founding" ? "Founding member" : "RHEN Cloud"}</h3>
              <p><strong>{displayPrice(billing.plans[plan])}/month</strong></p>
              <p>{plan === "founding"
                ? "Limited early-member rate, if offered after readiness approval."
                : "Regular hosted-subscription rate, subject to release approval."}</p>
              {billing.checkoutEnabled && (plan !== "founding" || billing.foundingEnabled) &&
                !billing.subscription &&
                <button type="button" disabled={busy} onClick={() => void redirectToStripe("checkout", plan)}>
                  Subscribe through Stripe
                </button>}
            </div>
          ))}
          {!billing.checkoutEnabled && <p role="status">Paid checkout is not available. No payment is collected on this page.</p>}
        </section>
        <section className="member-section">
          <h2>What payment would and would not authorize</h2>
          <p>A verified subscription would unlock only the commercial entitlement. Brokerage linking, paper trading, real-money orders, automated investing, deposits, withdrawals, and RHEN operator privileges are separate permissions that require independent approval and implementation.</p>
        </section>
      </>}
      <Link to="/me/settings">Back to account settings</Link>
    </section>
  );
}
