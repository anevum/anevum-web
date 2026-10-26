import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { memberAuthClient } from "../member/auth-client";
import { useMemberAvailability } from "../member/useMemberAvailability";
import "../styles/commerce-preview.css";

type Category = "support" | "storage" | "handmade";
type Offer = {
  code: string; kind: "supporter" | "vault";
  cents: number; name: string; description: string;
  duration?: string;
};
type CatalogItem = {
  code: string; kind: string; priceCents: number;
  currency: string; purchasable: false;
};
type Catalog = {
  available: false; previewOnly: true; paymentAcceptance: false;
  rail: null; freeVault: { includedBytes: number }; products: CatalogItem[];
};

const SUPPORT: Offer[] = [
  { code: "signal-support-5", kind: "supporter", cents: 500, name: "First Signal", description: "One-time support for the creative commons." },
  { code: "signal-support-10", kind: "supporter", cents: 1000, name: "Keep creating", description: "Help cover hosting, projects and accessibility." },
  { code: "signal-support-25", kind: "supporter", cents: 2500, name: "Continuance", description: "Support independent development at your own pace." }
];
const STORAGE: Offer[] = [
  { code: "vault-10g-month", kind: "vault", cents: 400, name: "Additional 10 GiB", description: "Private project capacity beyond the free 2 GiB.", duration: "30 days" },
  { code: "vault-50g-month", kind: "vault", cents: 900, name: "Additional 50 GiB", description: "For larger creative files and working assets.", duration: "30 days" }
];
const OFFERS = [...SUPPORT, ...STORAGE];
const usd = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

function isValidCatalog(v: unknown): v is Catalog {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  if (o.available !== false || o.previewOnly !== true || o.paymentAcceptance !== false || o.rail !== null) return false;
  if (!o.freeVault || typeof o.freeVault !== "object" || (o.freeVault as Record<string, unknown>).includedBytes !== 2 * 1024 ** 3) return false;
  if (!Array.isArray(o.products) || o.products.length !== OFFERS.length) return false;
  const catalog = new Map<string, CatalogItem>();
  for (const value of o.products) {
    if (!value || typeof value !== "object") return false;
    const item = value as CatalogItem;
    if (item.purchasable !== false || item.currency !== "USD" || catalog.has(item.code)) return false;
    catalog.set(item.code, item);
  }
  return OFFERS.every(item => catalog.get(item.code)?.priceCents === item.cents &&
    catalog.get(item.code)?.kind === item.kind);
}

export default function CommercePreview() {
  const availability = useMemberAvailability();
  const { data: session, isPending } = memberAuthClient.useSession();
  const memberId = session?.user?.id || null;
  const signedIn = availability === "available" && !isPending && Boolean(memberId);
  const [category, setCategory] = useState<Category>("storage");
  const [selected, setSelected] = useState<string>("vault-10g-month");
  const [flowOpen, setFlowOpen] = useState(false);
  const [serverState, setServerState] = useState<"checking" | "available" | "off" | "unverified">("checking");

  useEffect(() => {
    setServerState("checking");
    if (!signedIn) return;
    const controller = new AbortController();
    void fetch("/api/member/commerce/catalog", {
      method: "GET", cache: "no-store", credentials: "same-origin",
      redirect: "manual", signal: controller.signal
    }).then(async response => {
      if (!response.ok) return response.status === 503 ? "off" : "unverified";
      const body: unknown = await response.json();
      return isValidCatalog(body) ? "available" : "unverified";
    }).then(value => { if (!controller.signal.aborted) setServerState(value); })
      .catch(() => { if (!controller.signal.aborted) setServerState("unverified"); });
    return () => controller.abort();
  }, [signedIn, memberId]);

  const offer = useMemo(() => OFFERS.find(item => item.code === selected) || STORAGE[0], [selected]);

  const selectCategory = (next: Category) => {
    setCategory(next);
    setFlowOpen(false);
    setSelected(next === "support" ? SUPPORT[0].code : STORAGE[0].code);
  };

  return <main className="anevum-commerce-preview" aria-labelledby="commerce-title">
    <div className="anevum-commerce-shell">
      <header className="anevum-commerce-head">
        <div className="anevum-commerce-brand"><span className="anevum-commerce-orbit" aria-hidden="true" /> ANEVUM <span className="anevum-commerce-micro">COMMERCE / V001</span></div>
        <Link to="/me">Back to Command</Link>
      </header>
      <div className="anevum-commerce-line" aria-hidden="true" />
      <div className="anevum-commerce-hero">
        <div>
          <p className="anevum-commerce-kicker">PRIVATE DESIGN PREVIEW · NO PURCHASES</p>
          <h1 id="commerce-title">Support creation.<br /><em>Keep control.</em></h1>
          <p>Explore how ANEVUM's supporter options, private Creator Vault and family-made merchandise will fit together. Payments are not open.</p>
        </div>
        <div className="anevum-commerce-rule" aria-label="Payment acceptance is disabled">
          <span className="anevum-commerce-signal" aria-hidden="true" />
          <strong>PAYMENTS OFFLINE</strong>
          <span>No financial account is connected</span>
        </div>
      </div>
      <div className="anevum-commerce-dash" role="status">
        <span>ACCOUNT</span>
        <strong>{availability === "checking" || isPending ? "Verifying session" : signedIn ? "Signed in" : "Not signed in"}</strong>
        <span>INTEGRATION</span>
        <strong>{!signedIn ? "Not available" : serverState === "available" ? "Read-only catalog verified" : serverState === "checking" ? "Checking private catalog" : serverState === "off" ? "Private catalog switched off" : "Catalog not verified"}</strong>
        <span>CHARGES</span>
        <strong>Disabled</strong>
      </div>
      {!signedIn && !(availability === "checking" || isPending) && <div className="anevum-commerce-auth-note" role="status">
        <p>A verified member account is required to access the private commerce preview. No financial information is requested.</p>
        <Link to="/sign-in">Go to member sign-in</Link>
      </div>}
      {signedIn && <div className="anevum-commerce-layout">
        <section className="anevum-commerce-products" aria-labelledby="commerce-options">
          <div className="anevum-commerce-section-head">
            <div><p className="anevum-commerce-kicker">01 / YOUR OPTIONS</p><h2 id="commerce-options">Choose a direction</h2></div>
            <p>For demonstration only</p>
          </div>
          <nav className="anevum-commerce-tabs" aria-label="Commerce product categories">
            <button type="button" aria-pressed={category === "support"} onClick={() => selectCategory("support")}>Support</button>
            <button type="button" aria-pressed={category === "storage"} onClick={() => selectCategory("storage")}>Creator Vault</button>
            <button type="button" aria-pressed={category === "handmade"} onClick={() => selectCategory("handmade")}>Handmade</button>
          </nav>
          {category === "handmade" ? <div className="anevum-commerce-handmade">
            <span className="anevum-commerce-icon" aria-hidden="true">✳</span>
            <h3>Made by us. Not drop-shipped.</h3>
            <p>Original ANEVUM pieces made and packaged in-house with our own Cricut equipment. Products, prices, shipping and stock will be shown only after samples and inventory are ready.</p>
            <span className="anevum-commerce-unavailable">No merchandise currently for sale</span>
          </div> : <fieldset className="anevum-commerce-offers">
            <legend className="anevum-commerce-sr">Select a {category === "support" ? "support" : "storage"} option for preview</legend>
            {(category === "support" ? SUPPORT : STORAGE).map(item =>
              <label key={item.code} className="anevum-commerce-offer" data-selected={selected === item.code}>
                <input type="radio" name="commerce-offer" value={item.code} checked={selected === item.code} onChange={() => { setSelected(item.code); setFlowOpen(false); }} />
                <span className="anevum-commerce-offer-copy">
                  <strong>{item.name}</strong>
                  <small>{item.description}</small>
                  <small className="anevum-commerce-duration">{item.duration || "One-time contribution · no subscription"}</small>
                </span>
                <span className="anevum-commerce-price">{usd(item.cents)}</span>
              </label>)}
          </fieldset>}
          <div className="anevum-commerce-trust">
            <div><span aria-hidden="true">◎</span><strong>Member-owned files</strong><p>Free 2 GiB private project space is the planned starting allowance.</p></div>
            <div><span aria-hidden="true">◇</span><strong>No pay-to-win</strong><p>Supporter contributions do not buy achievements, ratings or editorial treatment.</p></div>
          </div>
        </section>
        <aside className="anevum-commerce-checkout" aria-labelledby="commerce-summary">
          <p className="anevum-commerce-kicker">02 / REVIEW</p>
          <h2 id="commerce-summary">Order preview</h2>
          {category === "handmade" ? <div className="anevum-commerce-order">
            <p>Handmade inventory is in preparation.</p><strong>No available order</strong>
          </div> : <div className="anevum-commerce-order" aria-live="polite">
            <span>{offer.name}</span>
            <strong>{usd(offer.cents)}</strong>
            <span>{offer.kind === "vault" ? "One 30-day capacity period" : "One-time voluntary support"}</span>
            <span className="anevum-commerce-order-total"><span>Illustrative total</span><strong>{usd(offer.cents)}</strong></span>
          </div>}
          <h3>How payment will work</h3>
          <p className="anevum-commerce-note">A bank-supported payment request could appear in the customer's banking app. Availability, fees and delivery depend on the participating bank.</p>
          <div className="anevum-commerce-payment-option" aria-disabled="true">
            <span aria-hidden="true">▣</span>
            <div><strong>Approve in your bank</strong><small>Future feature · not connected</small></div>
            <span aria-hidden="true">○</span>
          </div>
          <button type="button" className="anevum-commerce-primary" disabled>Payments not open</button>
          <button type="button" className="anevum-commerce-demo-toggle" aria-expanded={flowOpen} onClick={() => setFlowOpen(value => !value)}>
            {flowOpen ? "Hide customer journey" : "Preview customer journey"}
          </button>
          {flowOpen && <ol className="anevum-commerce-journey">
            <li><strong>Review</strong><p>ANEVUM generates a unique unpaid order and confirms the exact total.</p></li>
            <li><strong>Authorize</strong><p>An eligible customer's bank securely presents and approves a payment request.</p></li>
            <li><strong>Verify</strong><p>ANEVUM independently reconciles the actual bank-confirmed credit.</p></li>
            <li><strong>Fulfill</strong><p>Only verified payment grants storage, supporter records or a handmade order.</p></li>
          </ol>}
          <p className="anevum-commerce-disclaimer">No bank credentials, card details, deposits or preorders are collected here. No purchase has been created.</p>
        </aside>
      </div>}
      <footer className="anevum-commerce-footer">
        <p>Independent creation · sustainable operation · family-made merchandise.</p>
        <p>This page is a private engineering preview, not an offer to accept payment.</p>
      </footer>
    </div>
  </main>;
}
