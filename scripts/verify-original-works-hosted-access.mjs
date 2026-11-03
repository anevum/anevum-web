/**
 * Read-only fail-closed check for Anevum's hosted Cloudflare Worker review gate.
 *
 * This does NOT create Access apps, modify the Worker, enable preview URLs, or
 * deploy a preview. In particular, wrangler.jsonc preview_urls:true is not proof
 * that Cloudflare has enabled its corresponding remote preview subdomain.
 *
 * Required explicit configuration (GitHub Actions repo variables):
 * ANEVUM_WEB_PREVIEW_ACCESS_APP_ID — exact self-hosted Access app UUID
 * ANEVUM_WEB_PREVIEW_WORKER_UUID — exact target Worker UUID from Cloudflare
 *
 * Authentication: existing CLOUDFLARE_API_TOKEN with read-only Access/Worker
 * permissions plus CLOUDFLARE_ACCOUNT_ID. Do not log those values.
 * The verified allow policy is restricted to the owner's exact identity.
 *
 * Note: Browser/HTTP verification behind Access requires a separate CI identity.
 * A successful preflight alone cannot authorize production, publication or merge.
 */
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const EXPECTED_SCRIPT = "anevum-web-nextgen";
const OWNER_EMAIL = "devon@anevum.com";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function checkAccessPreviewGate({subdomain, app, policies, pinnedAppId, pinnedWorkerUuid, actualWorkerUuid}) {
  const blockers = [];
  if (!UUID.test(pinnedAppId || "") || !UUID.test(pinnedWorkerUuid || "")) {
    return ["MISSING_PINNED_ACCESS_APPLICATION_OR_WORKER_ID"];
  }
  if (actualWorkerUuid !== pinnedWorkerUuid) blockers.push("TARGET_WORKER_IDENTITY_MISMATCH");
  if (!subdomain || subdomain.previews_enabled !== true) {
    blockers.push("PREVIEW_URLS_NOT_ENABLED");
  }
  if (!app || app.id !== pinnedAppId || app.type !== "self_hosted") {
    blockers.push("UNEXPECTED_ACCESS_APPLICATION");
  }
  const dests = app?.destinations;
  if (!Array.isArray(dests) || dests.length !== 1 ||
      dests[0]?.type !== "preview_worker" || dests[0]?.worker_id !== pinnedWorkerUuid) {
    blockers.push("PREVIEW_NOT_BOUND_TO_PINNED_WORKER");
  }
  if (!Array.isArray(policies) || policies.length === 0) {
    blockers.push("ACCESS_POLICY_MISSING");
  } else {
    const allows = policies.filter(policy => policy?.decision === "allow");
    const other = policies.filter(policy => policy?.decision !== "allow" && policy?.decision !== "deny");
    if (allows.length !== 1 || other.length > 0) blockers.push("UNSAFE_ACCESS_DECISIONS");
    // A single exact-email include avoids accidental everyone/domain/group
    // broadening. Additional identities or service-token access require a new
    // explicit authorization and corresponding reviewed CI changes.
    for (const policy of allows) {
      const include = policy.include;
      if (!Array.isArray(include) || include.length !== 1 ||
          !include[0] || Object.keys(include[0]).length !== 1 ||
          include[0].email?.email?.toLowerCase() !== OWNER_EMAIL ||
          !Array.isArray(policy.exclude || []) ||
          !Array.isArray(policy.require || [])) {
        blockers.push("ACCESS_ALLOW_NOT_OWNER_ONLY");
      }
    }
  }
  return [...new Set(blockers)];
}

export async function readRemotePreviewGate({token, accountId, accessAppId, fetchImpl = fetch}) {
  if (!token || !accountId || !UUID.test(accessAppId || "")) {
    throw new Error("MISSING_REQUIRED_PREVIEW_CREDENTIAL_OR_ID");
  }
  if (!UUID.test(accountId)) throw new Error("INVALID_CLOUDFLARE_ACCOUNT_ID");
  const root = "https://api.cloudflare.com/client/v4/accounts/" + accountId;
  const headers = {Authorization: "Bearer " + token, Accept: "application/json"};
  async function read(path) {
    const response = await fetchImpl(root + path, {method:"GET",headers,redirect:"error"});
    if (!response.ok) throw new Error("CLOUDFLARE_READ_DENIED_OR_UNAVAILABLE");
    const payload = await response.json();
    if (payload?.success !== true) throw new Error("CLOUDFLARE_READ_DENIED_OR_UNAVAILABLE");
    return payload.result;
  }
  const [subdomain, app, policies, scripts] = await Promise.all([
    read("/workers/scripts/" + EXPECTED_SCRIPT + "/subdomain"),
    read("/access/apps/" + accessAppId),
    read("/access/apps/" + accessAppId + "/policies"),
    read("/workers/scripts?per_page=200")
  ]);
  const scriptList = Array.isArray(scripts) ? scripts : scripts?.items;
  const target = scriptList?.find(worker => worker.id === EXPECTED_SCRIPT);
  if (!target || !UUID.test(target.tag || "")) {
    throw new Error("CLOUDFLARE_TARGET_WORKER_NOT_FOUND");
  }
  return {subdomain, app, policies, actualWorkerUuid:target.tag};
}

async function main() {
  const pinnedAppId = process.env.ANEVUM_WEB_PREVIEW_ACCESS_APP_ID || "";
  const pinnedWorkerUuid = process.env.ANEVUM_WEB_PREVIEW_WORKER_UUID || "";
  if (!UUID.test(pinnedAppId) || !UUID.test(pinnedWorkerUuid)) {
    console.error("Hosted review BLOCKED: MISSING_PINNED_ACCESS_APPLICATION_OR_WORKER_ID");
    console.error("Set the two deliberately approved GitHub variables only after configuring a preview-only owner Access app.");
    process.exitCode = 1;
    return;
  }
  try {
    const remote = await readRemotePreviewGate({
      token: process.env.CLOUDFLARE_API_TOKEN,
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
      accessAppId: pinnedAppId
    });
    const blockers = checkAccessPreviewGate({...remote,pinnedAppId,pinnedWorkerUuid});
    if (blockers.length) {
      for (const code of blockers) console.error("Hosted review BLOCKED: " + code);
      process.exitCode = 1;
      return;
    }
    console.log("Hosted review PREVIEW-ACCESS-PREFLIGHT-PASS: exact owner Access policy, pinned preview Worker and remote preview enabled.");
    console.log("Hosted browser identity and release approval still require separate verification.");
  } catch (e) {
    // Never print request bodies, headers, opaque tokens, account IDs, emails,
    // worker metadata or stack traces into public PR logs.
    const publicCode = [
      "MISSING_REQUIRED_PREVIEW_CREDENTIAL_OR_ID",
      "INVALID_CLOUDFLARE_ACCOUNT_ID",
      "CLOUDFLARE_READ_DENIED_OR_UNAVAILABLE",
      "CLOUDFLARE_TARGET_WORKER_NOT_FOUND"
    ].includes(e?.message) ? e.message : "CLOUDFLARE_READ_DENIED_OR_UNAVAILABLE";
    console.error("Hosted review BLOCKED: " + publicCode);
    process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
