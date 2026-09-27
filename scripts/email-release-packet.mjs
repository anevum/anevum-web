import fs from "node:fs/promises";
import path from "node:path";

const pdfPath = process.argv[2];
if (!pdfPath) throw new Error("Usage: node scripts/email-release-packet.mjs <pdf-path>");

const apiKey = String(process.env.RESEND_API_KEY || "").trim();
if (!apiKey) {
  console.log("RESEND_API_KEY is not configured; release packet email skipped.");
  process.exit(0);
}

const recipient = String(process.env.RELEASE_EMAIL_TO || "devon@anevum.com").trim();
const sender = String(process.env.RELEASE_EMAIL_FROM || "RHEN Releases <onboarding@resend.dev>").trim();
const filename = path.basename(pdfPath);
const match = filename.match(/^RHEN-([0-9.]+)-([A-Z0-9_-]+)\.pdf$/i);
const version = match?.[1] || "release";
const codename = (match?.[2] || "packet").replaceAll("_", " ").toUpperCase();
const attachment = await fs.readFile(pdfPath);

const response = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    from: sender,
    to: [recipient],
    subject: `RHEN ${version} - ${codename} release packet`,
    html: `<div style="font-family:Arial,sans-serif;background:#050a11;color:#dfe8ee;padding:28px"><div style="font-size:11px;letter-spacing:.16em;color:#6f91a7">ANEVUM / RHEN RELEASE PROGRAM</div><h1 style="margin:14px 0 12px">RHEN ${version} - ${codename}</h1><p style="color:#8fa3b1;line-height:1.6">A named RHEN release has been published. The archival release packet is attached.</p><p style="color:#637b8b;font-size:12px">This email is generated from the same canonical release record used by anevum.com.</p></div>`,
    attachments: [{ filename, content: attachment.toString("base64") }]
  })
});

const body = await response.text();
if (!response.ok) throw new Error(`Resend failed (${response.status}): ${body}`);
console.log(`Release packet emailed to ${recipient}: ${body}`);
