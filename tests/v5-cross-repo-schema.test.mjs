import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  RHEN_CONTRACT_COMMIT,
  WORKSPACE_CONTRACT_BLOB,
  WORKSPACE_VERSION,
  assertWorkspaceContractParity,
  gitBlobSha,
} from "../scripts/verify-v5-cross-repo-schema.mjs";

const good = readFileSync(new URL("../contracts/foundation/workspace-state.v1.schema.json", import.meta.url));
const original = () => ({
  localBytes: good,
  rhenBytes: good,
  rhenBranchHead: RHEN_CONTRACT_COMMIT,
});

test("pinned WEB and RHEN wire schema is byte-identical and explicitly versioned", () => {
  assert.equal(gitBlobSha(good), WORKSPACE_CONTRACT_BLOB);
  const actual = assertWorkspaceContractParity(original());
  assert.equal(actual.schemaVersion, WORKSPACE_VERSION);
  assert.equal(actual.blobSha, WORKSPACE_CONTRACT_BLOB);
  assert.equal(actual.rhenCommit, RHEN_CONTRACT_COMMIT);
});

test("WEB schema mutation blocks integration even if local TypeScript tests pass", () => {
  const tampered = Buffer.from(good.toString("utf8").replace('"additionalProperties": false', '"additionalProperties": true'));
  assert.notEqual(gitBlobSha(tampered), WORKSPACE_CONTRACT_BLOB);
  assert.throws(
    () => assertWorkspaceContractParity({ ...original(), localBytes: tampered }),
    /INCOMPATIBLE_SCHEMA/,
  );
});

test("RHEN schema mutation blocks integration even when WEB remains unchanged", () => {
  const tampered = Buffer.from(good.toString("utf8").replace('"MEMBER_PRIVATE"', '"MEMBER_PUBLIC"'));
  assert.throws(
    () => assertWorkspaceContractParity({ ...original(), rhenBytes: tampered }),
    /INCOMPATIBLE_SCHEMA/,
  );
});

test("pinned source branch must resolve to exactly the reviewed RHEN SHA", () => {
  assert.throws(
    () => assertWorkspaceContractParity({ ...original(), rhenBranchHead: "0".repeat(40) }),
    /branch moved/,
  );
  assert.throws(
    () => assertWorkspaceContractParity({ ...original(), rhenBranchHead: undefined }),
    /branch moved/,
  );
});

test("new contract version requires review even when caller spoofs matching bytes/blob", () => {
  const mutated = Buffer.from(good.toString("utf8").replace(WORKSPACE_VERSION, "anevum.workspace-state.v2"));
  assert.throws(
    () => assertWorkspaceContractParity({
      ...original(),
      localBytes: mutated,
      rhenBytes: mutated,
      expectedBlob: gitBlobSha(mutated),
    }),
    /INCOMPATIBLE_SCHEMA/,
  );
});

test("relaxing unknown-field rejection requires review even with a newly pinned digest", () => {
  const mutated = Buffer.from(good.toString("utf8").replace('"additionalProperties": false', '"additionalProperties": true'));
  assert.throws(
    () => assertWorkspaceContractParity({
      ...original(),
      localBytes: mutated,
      rhenBytes: mutated,
      expectedBlob: gitBlobSha(mutated),
    }),
    /INCOMPATIBLE_SCHEMA/,
  );
});

test("invalid JSON is rejected even when byte equality and digest are contrived", () => {
  const invalid = Buffer.from("{not json");
  assert.throws(
    () => assertWorkspaceContractParity({
      ...original(),
      localBytes: invalid,
      rhenBytes: invalid,
      expectedBlob: gitBlobSha(invalid),
    }),
    /INCOMPATIBLE_SCHEMA/,
  );
});
