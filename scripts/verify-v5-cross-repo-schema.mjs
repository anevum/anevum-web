/**
 * ANEVUM V5 F0 - fail-closed cross-repository workspace contract gate.
 *
 * Reads a reviewed immutable RHEN source commit and verifies that its branch
 * has not silently advanced. No broker calls, deploys, secrets or write APIs.
 * Update BOTH repositories and explicitly review a new pinned SHA for any
 * intentional schema-version change.
 */
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const RHEN_CONTRACT_BRANCH =
  "build/anevum-v5-foundation-f3f-market-data-stage-probe-20261010";
export const RHEN_CONTRACT_COMMIT =
  "a98202dbce476df80643c0cfc915fc14e8da915d";
export const WORKSPACE_CONTRACT_PATH =
  "contracts/foundation/workspace-state.v1.schema.json";
export const WORKSPACE_CONTRACT_BLOB =
  "7d351b2e0f4164df097fbf3a864c41ad6c8777b9";
export const WORKSPACE_VERSION = "anevum.workspace-state.v1";

export function gitBlobSha(input) {
  const bytes = Buffer.from(input);
  return createHash("sha1")
    .update(Buffer.from("blob " + bytes.length + "\0", "utf8"))
    .update(bytes)
    .digest("hex");
}

export function assertWorkspaceContractParity({
  localBytes,
  rhenBytes,
  rhenBranchHead,
  expectedCommit = RHEN_CONTRACT_COMMIT,
  expectedBlob = WORKSPACE_CONTRACT_BLOB,
}) {
  if (!/^[a-f0-9]{40}$/.test(rhenBranchHead ?? "") || rhenBranchHead !== expectedCommit) {
    throw new Error("RHEN contract source branch moved or was not authenticated; review and repin both repositories before integration.");
  }
  const local = Buffer.from(localBytes);
  const remote = Buffer.from(rhenBytes);
  const localBlob = gitBlobSha(local);
  const rhenBlob = gitBlobSha(remote);
  if (localBlob !== expectedBlob || rhenBlob !== expectedBlob || !local.equals(remote)) {
    throw new Error(
      "INCOMPATIBLE_SCHEMA: WEB/RHEN workspace contract bytes differ or the reviewed blob changed " +
      "(WEB " + localBlob + ", RHEN " + rhenBlob + ", pinned " + expectedBlob + ").",
    );
  }
  let schema;
  try {
    schema = JSON.parse(local.toString("utf8"));
  } catch {
    throw new Error("INCOMPATIBLE_SCHEMA: V5 workspace contract is invalid JSON.");
  }
  if (
    schema?.properties?.schema_version?.const !== WORKSPACE_VERSION ||
    schema?.additionalProperties !== false ||
    schema?.$id !== "https://anevum.com/contracts/foundation/workspace-state.v1.schema.json"
  ) {
    throw new Error("INCOMPATIBLE_SCHEMA: V5 workspace schema version, ID or fail-closed field policy changed.");
  }
  return { schemaVersion: WORKSPACE_VERSION, blobSha: localBlob, rhenCommit: rhenBranchHead };
}

async function fetchRequired(url, label, { token, accept = "application/octet-stream" } = {}) {
  const headers = { Accept: accept, "User-Agent": "anevum-v5-contract-check" };
  if (token) headers.Authorization = "Bearer " + token;
  let response;
  try {
    response = await fetch(url, { headers, signal: AbortSignal.timeout(15000), redirect: "error" });
  } catch {
    throw new Error("INCOMPATIBLE_SCHEMA: " + label + " is unavailable; remote verification fails closed.");
  }
  if (!response.ok) {
    throw new Error("INCOMPATIBLE_SCHEMA: " + label + " returned HTTP " + response.status + "; remote verification fails closed.");
  }
  return response;
}

export async function verifyCrossRepositoryContract() {
  const local = await readFile(new URL("../" + WORKSPACE_CONTRACT_PATH, import.meta.url));
  const refUrl =
    "https://api.github.com/repos/anevum/rhen/git/ref/heads/" + RHEN_CONTRACT_BRANCH;
  const refResponse = await fetchRequired(refUrl, "RHEN source branch", {
    token: process.env.GITHUB_TOKEN,
    accept: "application/vnd.github+json",
  });
  let reference;
  try {
    reference = await refResponse.json();
  } catch {
    throw new Error("INCOMPATIBLE_SCHEMA: RHEN source branch reference is not valid JSON.");
  }
  if (reference?.ref !== "refs/heads/" + RHEN_CONTRACT_BRANCH || reference?.object?.type !== "commit") {
    throw new Error("INCOMPATIBLE_SCHEMA: RHEN source branch response has an unexpected identity.");
  }
  const rawUrl =
    "https://raw.githubusercontent.com/anevum/rhen/" +
    RHEN_CONTRACT_COMMIT + "/" + WORKSPACE_CONTRACT_PATH;
  const rawResponse = await fetchRequired(rawUrl, "Pinned RHEN workspace schema");
  const remote = Buffer.from(await rawResponse.arrayBuffer());
  if (remote.length > 32768 || local.length > 32768) {
    throw new Error("INCOMPATIBLE_SCHEMA: workspace contract exceeded the reviewed size budget.");
  }
  return assertWorkspaceContractParity({
    localBytes: local,
    rhenBytes: remote,
    rhenBranchHead: reference.object.sha,
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const verified = await verifyCrossRepositoryContract();
    console.log(
      "ANEVUM V5 cross-repo workspace contract OK: " +
      verified.schemaVersion + " | blob " + verified.blobSha +
      " | RHEN commit " + verified.rhenCommit,
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : "INCOMPATIBLE_SCHEMA: verification failed.");
    process.exitCode = 1;
  }
}
