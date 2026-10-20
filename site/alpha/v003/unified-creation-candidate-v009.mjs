/* ANEVUM V009 exact legacy owner integration candidate.
 * Imports the pinned deployed V002 Worker and adds ONLY the fail-closed
 * /upload/v3 subtree. No worker route, auth or environment change.
 * PACKAGE_CANONICAL_BRIDGE_ENABLED is OFF by default and must remain off
 * until the canonical owner + isolated package service A/B/C tests pass.
 */
import existingOwner from "./unified-creation-v002-pinned-snapshot.mjs";
import {withPackageUplink} from "./unified-creation-owner-v009.mjs";
export default withPackageUplink(existingOwner);
