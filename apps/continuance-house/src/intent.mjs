// Fail-closed IREN command router. No model, secrets, device writes or shell execution.
export const SAFE_LINKS = Object.freeze({
  website: "https://anevum.com/",
  studio: "https://anevum.com/studio",
  command: "https://anevum.com/staff?view=command",
  updates: "https://anevum.com/updates"
});

export function interpretCommand(value) {
  const query = typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
  if (!query || query.length > 240) {
    return { kind: "invalid", message: "Enter a request between 1 and 240 characters." };
  }
  const lower = query.toLowerCase();

  // High-impact verbs are deliberately blocked even when another safe intent appears.
  if (/\b(deploy|merge|publish|delete|erase|pay|purchase|transfer|wire|refund|disable|unlock|grant|revoke|approve|send email)\b/i.test(lower)) {
    return {
      kind: "restricted",
      message: "This command cannot execute here. Privileged operations require a separate verified workflow and explicit confirmation."
    };
  }
  if (/\b(light|thermostat|garage|door lock|turn on|turn off|temperature)\b/i.test(lower)) {
    return {
      kind: "hardware-pending",
      message: "No household devices are paired. The home-control adapter is intentionally disabled."
    };
  }
  if (/\b(family|cadets|stardust|mission|explorer|fridge)\b/i.test(lower)) {
    return { kind: "view", view: "family", message: "Opening the family demonstration dashboard. Values are synthetic." };
  }
  if (/\b(build|pull request|pull requests|github|development|status|signal|activity|pipeline)\b/i.test(lower)) {
    return { kind: "view", view: "signals", message: "Showing public GitHub development activity. This does not prove production deployment health." };
  }
  if (/\b(integration|infrastructure|railway|cloudflare|hardware|device)\b/i.test(lower)) {
    return { kind: "view", view: "systems", message: "Showing integration readiness and unconfigured dependencies." };
  }
  if (/\b(creator studio|studio|editor)\b/i.test(lower)) {
    return { kind: "link", href: SAFE_LINKS.studio, message: "Opening the existing ANEVUM Creator Studio in a separate authenticated tab." };
  }
  if (/\b(staff|command center|operations|operator)\b/i.test(lower)) {
    return { kind: "link", href: SAFE_LINKS.command, message: "Opening the existing protected ANEVUM Command interface." };
  }
  if (/\b(release|updates|patch notes|bulletin)\b/i.test(lower)) {
    return { kind: "link", href: SAFE_LINKS.updates, message: "Opening ANEVUM release updates." };
  }
  if (/\b(home|desk|couch|overview)\b/i.test(lower)) {
    return { kind: "view", view: "desk", message: "Returning to your personal command deck." };
  }
  if (/\b(anevum|website)\b/i.test(lower)) {
    return { kind: "link", href: SAFE_LINKS.website, message: "Opening ANEVUM." };
  }
  return {
    kind: "not-connected",
    message: "IREN's full language-model gateway is not connected. The current terminal supports a small, explicit set of read-only commands."
  };
}
