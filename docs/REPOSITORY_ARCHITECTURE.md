# Repository separation program

Session: ANEVUM.OPS.BUILD.2026-10-30.001.GITHUB-REPOSITORY-REORGANIZATION

Verified GitHub owner: anevum. Existing independent repositories: anevum-web, rhen, devonakins.com and family-adventure-book. Keep these and their histories.

Initial split candidates:
- games/brandle => anevum/brandle (Worker: brandle-glimmer-grove)
- apps/cristybreathe => anevum/cristybreathe (Worker: cristybreathe; private Access and D1 remain private)

This branch prepares independent CI and source licensing, but **does not create repositories, move source or deploy**. The current source and production pipelines remain authoritative until an independently verified cutover.

Unknown source location: IdeaFlow, DevonStation, Brandicade. Severance remains associated with draft PR #788; do not extract unmerged work or reconstruct sources.

## Reproducible local extraction

From a complete checkout of this repository on the foundation branch:

    node scripts/ops/split-project.mjs --project brandle
    node scripts/ops/split-project.mjs --project cristybreathe

After reviewing all project history for sensitive content, run:

    node scripts/ops/split-project.mjs --project brandle --execute --output /absolute/new/brandle

This performs a local history-preserving git subtree split and **never pushes or deploys**. The filename guard is not a substitute for a full secret scan, personal-data audit, or reviewing repository history.

## Cutover sequence

1. Audit the complete source and project-specific historical content for secrets, personal data, license incompatibilities and dependencies.
2. Run unit, build and browser tests from each extracted checkout; retain Apache 2.0 license and attribution.
3. Create empty target GitHub repositories and push only the verified isolated history.
4. Configure least-privilege CI. Standalone CI must not automatically deploy until current deployment ownership, rollback and credentials are established.
5. Brandle: verify live Worker, route, deployment version, rollback and application playability before transfer. Do not let two repositories deploy the same Worker.
6. CristyBreathe: verify D1 backup/restore, Cloudflare Access, worker identity, owner isolation and private entries. Never copy account data or credentials into a public GitHub repo.
7. Switch deployment ownership after successful production smoke tests. Remove old monorepo copies and deployment workflows only in a separate reviewed PR.
8. Review historical workflows and open PRs individually. Preserve legacy ANEVUM apex deploy refusal, never reactivate the retired V5 production deployment.

A new repository name, script or PR alone does not mean the migration is complete. Family-adventure-book currently states that it has no open-source license; make an explicit license decision separately.
