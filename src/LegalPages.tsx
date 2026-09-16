import { ArrowLeft, ExternalLink, ShieldCheck } from "lucide-react";
import { LaunchTerminal } from "./LaunchTerminal";

const effectiveDate = "September 16, 2026";

function LegalHeader({ label }: { label: string }) {
  return (
    <header className="legal-header">
      <a className="legal-brand" href="/" aria-label="Return to ANEVUM">
        <strong>ANEVUM</strong>
        <small>A UNIVERSE IN STORY.</small>
      </a>
      <span>{label}</span>
      <a className="legal-return" href="/"><ArrowLeft size={14} /> REPLY</a>
    </header>
  );
}

function LegalFooter() {
  return (
    <footer className="legal-footer">
      <a href="/privacy">PRIVACY</a>
      <a href="/terms">TERMS</a>
      <a href="/contact">CONTACT</a>
      <a href="/rhenlink">RHENLINK</a>
      <span>ANEVUM / REPLY</span>
    </footer>
  );
}

function LegalShell({ label, title, intro, children }: { label: string; title: string; intro: string; children: React.ReactNode }) {
  return (
    <div className="legal-page">
      <LaunchTerminal />
      <LegalHeader label={label} />
      <main id="main-content" className="legal-main">
        <section className="legal-hero">
          <p>{label}</p>
          <h1>{title}</h1>
          <div className="legal-intro"><ShieldCheck size={18} aria-hidden="true" /><span>{intro}</span></div>
          <small>EFFECTIVE {effectiveDate.toUpperCase()}</small>
        </section>
        <div className="legal-document">{children}</div>
      </main>
      <LegalFooter />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="legal-section"><h2>{title}</h2>{children}</section>;
}

export function PrivacyPage() {
  return (
    <LegalShell
      label="PRIVACY"
      title="What ANEVUM keeps, and why."
      intro="This notice describes the information used by the current ANEVUM website and RHENLINK member system. It is written around the product that exists now, not hypothetical future features."
    >
      <Section title="RHENLINK account information">
        <p>When you create a RHENLINK, the service uses information needed to establish and maintain your account. That currently includes your email address, display name, RHENLINK handle, authentication credentials handled by the authentication provider, and profile fields you choose to add such as a title, status line, or biography.</p>
        <p>Your email address is used for account authentication and account-related communication. Choosing to receive REPLY release updates is a separate preference; creating a RHENLINK does not automatically opt you in to release marketing.</p>
      </Section>

      <Section title="Progress and product state">
        <p>RHENLINK can retain product state associated with your identity, including XP, Network Level, achievements, routes you have visited, public Wiki records you have saved, and your REPLY release-update preference.</p>
        <p>These systems exist to preserve continuity across ANEVUM surfaces. XP, levels, achievements, and saves are product features and are not financial assets.</p>
      </Section>

      <Section title="Wiki and Lattice activity">
        <p>The public ANEVUM Wiki is a publication-safe projection of material released from the live ANEVUM Wiki. Lattice is a relational navigation layer over those released records. Browsing these surfaces does not grant editorial or canon authority.</p>
        <p>If community proposal tools are enabled later, submitted material remains separate from canonical material unless it is reviewed and promoted through ANEVUM's canonical publication process.</p>
      </Section>

      <Section title="Analytics">
        <p>ANEVUM includes a privacy-light analytics adapter that is inactive unless a production analytics project is explicitly configured. When enabled, it is designed to record explicit page views and selected launch-conversion events such as opening a release-interest path or following an outbound purchase link.</p>
        <p>The current analytics configuration disables broad autocapture, session replay, and anonymous person profiles. RHENLINK email addresses and handles are not intentionally sent through the launch analytics adapter.</p>
      </Section>

      <Section title="Service providers">
        <p>ANEVUM relies on service providers for infrastructure such as hosting, authentication, data storage, and—when enabled—analytics. Those providers process information only as needed to provide their respective services and are subject to their own security and privacy practices.</p>
      </Section>

      <Section title="Children">
        <p>RHENLINK and the interactive ANEVUM account features are not intended for children under 13. Do not create a RHENLINK for a child under 13 or provide personal information about a child under 13 through the service.</p>
      </Section>

      <Section title="Retention, access, and deletion">
        <p>Account and progress information may be retained while a RHENLINK remains active and as reasonably necessary to operate, secure, and maintain the service. ANEVUM is still finalizing the public account-request and deletion channel. The current status is published on the <a href="/contact">Contact page</a>; no private contact address is fabricated here.</p>
      </Section>

      <Section title="Changes to this notice">
        <p>This notice may change as ANEVUM adds or removes product capabilities. Material changes should be reflected by an updated effective date and should remain consistent with the behavior of the live product.</p>
      </Section>
    </LegalShell>
  );
}

export function TermsPage() {
  return (
    <LegalShell
      label="TERMS"
      title="Use the system as a participant, not an owner of it."
      intro="These terms establish the launch-era rules for the public ANEVUM website, RHENLINK, Wiki, Lattice, progression systems, and external REPLY purchase links."
    >
      <Section title="Accounts">
        <p>You are responsible for maintaining the security of your RHENLINK credentials and for activity performed through your account. Do not impersonate another person, interfere with the service, attempt to bypass access controls, or use RHENLINK to abuse other users or infrastructure.</p>
      </Section>

      <Section title="ANEVUM and REPLY intellectual property">
        <p>ANEVUM, REPLY, The Transcosmic, the website presentation, released reference material, text, artwork, interfaces, and other original content remain the property of their respective rights holders. Public access does not grant permission to copy, republish, sell, or create unauthorized official-looking derivatives.</p>
      </Section>

      <Section title="Canon, Wiki, and community material">
        <p>The live ANEVUM Wiki is the canonical authority for universe material. The public Wiki is a released projection of that system, and Lattice is a navigation layer over released records. Material submitted by a community participant does not become canon merely because it was submitted, saved, discussed, or displayed in a review workflow.</p>
      </Section>

      <Section title="XP, levels, achievements, and badges">
        <p>XP, Network Level, achievements, badges, saves, and similar participation features have no cash value, are not currency, are not transferable property, and do not represent authority over ANEVUM or other members. Their rules, values, names, and availability may change as the product develops.</p>
        <p>Any future badge or XP award that represents verified ownership of REPLY must be granted through a trusted server-side verification process. A user cannot create verified ownership merely by claiming to have purchased a book.</p>
      </Section>

      <Section title="Book purchases and external retailers">
        <p>When ANEVUM links to an external retailer, the retailer controls the transaction, price, tax, delivery, refund, payment, and account terms unless the page explicitly states that ANEVUM is the direct seller. ANEVUM does not fabricate edition availability or pricing when no verified retailer destination is configured.</p>
      </Section>

      <Section title="Release updates">
        <p>REPLY release updates are opt-in. Creating a RHENLINK does not automatically subscribe you. If notification delivery is enabled, you must be able to remove that preference through RHENLINK or through the delivery mechanism provided with the message.</p>
      </Section>

      <Section title="Availability and changes">
        <p>ANEVUM is an evolving platform. Features may be added, changed, suspended, or removed, especially during the book-launch period. Reasonable efforts will be made to preserve member identity and product continuity, but uninterrupted availability is not guaranteed.</p>
      </Section>

      <Section title="Age">
        <p>RHENLINK is not intended for children under 13. By creating an account, you represent that you are at least 13 years old.</p>
      </Section>

      <Section title="Operating entity and governing terms">
        <p>The final public operating-entity, postal-address, and governing-law language has not yet been approved for publication. ANEVUM will not invent those details in code. They must be added before these launch terms are treated as the final commerce-era legal terms.</p>
      </Section>
    </LegalShell>
  );
}

export function ContactPage() {
  return (
    <LegalShell
      label="CONTACT"
      title="A public contact channel is being finalized."
      intro="ANEVUM will publish a real support and privacy-request channel here rather than expose an unapproved private address or invent a business contact."
    >
      <Section title="Current status">
        <p>The website does not currently publish an approved support email, privacy email, business mailing address, or account-deletion mailbox. Those values require an explicit owner decision before they are exposed publicly.</p>
        <p>Until that channel is published, do not send sensitive personal information through unofficial social accounts, community posts, Wiki submissions, or public issue trackers.</p>
      </Section>

      <Section title="What this page will support">
        <p>The approved contact channel will cover account access and deletion requests, privacy questions, release-update questions, technical support, rights or content concerns, and general ANEVUM correspondence.</p>
      </Section>

      <Section title="Product routes">
        <div className="legal-route-grid">
          <a href="/rhenlink"><strong>RHENLINK</strong><span>Identity and account state</span></a>
          <a href="/the-book"><strong>REPLY</strong><span>Book and release information</span></a>
          <a href="https://wiki.anevum.com/"><strong>WIKI</strong><span>Released canonical reference</span><ExternalLink size={13} /></a>
        </div>
      </Section>
    </LegalShell>
  );
}

export function PublicLegalStrip() {
  return (
    <nav className="public-legal-strip" aria-label="Legal and contact links">
      <span>ANEVUM</span>
      <a href="/privacy">PRIVACY</a>
      <a href="/terms">TERMS</a>
      <a href="/contact">CONTACT</a>
    </nav>
  );
}

export function RhenlinkAccountNotice() {
  return (
    <aside className="rhenlink-account-notice" aria-label="RHENLINK account terms">
      <strong>RHENLINK ACCOUNT NOTICE</strong>
      <p>RHENLINK is intended for people age 13 and older. Creating or using a RHENLINK means you accept the <a href="/terms">Terms</a> and acknowledge the <a href="/privacy">Privacy notice</a>. REPLY release updates remain a separate opt-in preference and are not enabled merely by creating an account.</p>
    </aside>
  );
}
