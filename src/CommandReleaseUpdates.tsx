import { useEffect, useState, type FormEvent } from "react";
import { AlertTriangle, BellRing, MailCheck, Send, Users } from "lucide-react";
import {
  loadReleaseCampaignSummary,
  sendReleaseCampaign,
  type ReleaseCampaignSummary,
} from "./notificationsClient";
import type { MemberSession } from "./memberClient";

export function CommandReleaseUpdates({ session }: { session: MemberSession }) {
  const [summary, setSummary] = useState<ReleaseCampaignSummary | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = () => {
    loadReleaseCampaignSummary(session)
      .then(setSummary)
      .catch((error) => setStatus(error instanceof Error ? error.message : "Release-update telemetry is unavailable."));
  };

  useEffect(() => {
    refresh();
  }, [session.user.id]);

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const subject = String(form.get("subject") || "").trim();
    const title = String(form.get("title") || "").trim();
    const body = String(form.get("body") || "").trim();
    const actionLabel = String(form.get("actionLabel") || "").trim();
    const actionUrl = String(form.get("actionUrl") || "").trim();

    if (!summary?.providerConfigured) {
      setStatus("Email delivery is not configured on the production Worker yet.");
      return;
    }
    if (!subject || !title || !body) {
      setStatus("Subject, title, and message are required.");
      return;
    }

    const confirmed = window.confirm(
      `Send this REPLY release notice to ${summary.subscriberCount} opted-in RHENLINK${summary.subscriberCount === 1 ? "" : "s"}? This sends real email and in-app notices.`,
    );
    if (!confirmed) return;

    setBusy(true);
    setStatus("");
    try {
      const result = await sendReleaseCampaign({ subject, title, body, actionLabel, actionUrl }, session);
      setStatus(`Release notice sent: ${result.sentCount} email deliveries, ${result.failedCount} failures.`);
      event.currentTarget.reset();
      refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "The release notice could not be sent.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="command-release-updates" aria-labelledby="command-release-updates-title">
      <header>
        <div>
          <span>REPLY / RELEASE COMMUNICATIONS</span>
          <h2 id="command-release-updates-title">Opt-in reader notices.</h2>
          <p>Release communications go only to RHENLINK identities that explicitly attached REPLY release updates.</p>
        </div>
        <div className="command-release-subscriber-count">
          <Users size={19} />
          <strong>{summary?.subscriberCount ?? "—"}</strong>
          <small>OPTED-IN RHENLINKS</small>
        </div>
      </header>

      <div className="command-release-health">
        <div className={summary?.providerConfigured ? "ready" : "blocked"}>
          <MailCheck size={16} />
          <span>EMAIL DELIVERY</span>
          <strong>{summary?.providerConfigured ? "READY" : "CONFIG REQUIRED"}</strong>
        </div>
        <div className={summary?.inAppConfigured ? "ready" : "staged"}>
          <BellRing size={16} />
          <span>RHENLINK NOTICES</span>
          <strong>{summary?.inAppConfigured ? "READY" : "MIGRATION REQUIRED"}</strong>
        </div>
      </div>

      <form className="command-release-composer" onSubmit={handleSend}>
        <div className="command-release-fields">
          <label>EMAIL SUBJECT<input name="subject" maxLength={160} required placeholder="REPLY is now available." /></label>
          <label>NOTICE TITLE<input name="title" maxLength={180} required placeholder="REPLY has entered release." /></label>
          <label className="wide">MESSAGE<textarea name="body" rows={6} maxLength={4000} required placeholder="A concise release notice for readers who explicitly opted in." /></label>
          <label>CTA LABEL<input name="actionLabel" maxLength={40} placeholder="VIEW REPLY" /></label>
          <label>ACTION URL<input name="actionUrl" type="url" placeholder="https://anevum.com/the-book" /></label>
        </div>
        <footer>
          <p><AlertTriangle size={14} /> Sending is irreversible. COMMAND asks for a final confirmation before any real message leaves ANEVUM.</p>
          <button type="submit" disabled={busy || !summary?.subscriberCount || !summary?.providerConfigured}><Send size={14} /> {busy ? "SENDING..." : "SEND RELEASE NOTICE"}</button>
        </footer>
      </form>

      {status ? <p className="command-release-status" role="status">{status}</p> : null}

      <div className="command-release-history">
        <div className="command-release-history-head"><span>RECENT CAMPAIGNS</span><strong>DELIVERY RECORD</strong></div>
        {summary?.recentCampaigns?.length ? summary.recentCampaigns.map((campaign) => (
          <div key={campaign.id} className="command-release-history-row">
            <time>{new Date(campaign.created_at).toLocaleDateString()}</time>
            <strong>{campaign.title}</strong>
            <span>{campaign.status.toUpperCase()}</span>
            <small>{campaign.sent_count}/{campaign.subscriber_count} SENT</small>
            {campaign.failed_count ? <em>{campaign.failed_count} FAILED</em> : <em>NO FAILURES</em>}
          </div>
        )) : <div className="command-release-history-empty">NO RELEASE CAMPAIGNS HAVE BEEN SENT FROM COMMAND.</div>}
      </div>
    </section>
  );
}
