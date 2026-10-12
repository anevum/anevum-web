# ANEVUM - creator and community production

**Production start:** October 12, 2026.  
**Session:** `ANEVUM.WEB.BUILD.2026-10-12.001.PRODUCTION-BASELINE`  
**Active integration branch:** `production/creator-v1`. This is source development, not an automatic live deployment.

ANEVUM is a public creative destination: discover independent creations, experience them, meet their makers, contribute useful feedback, and build a recognizable presence. Visitors and non-publishing members matter as much as creators.

## Production baseline and archive

The owner declared the production-start boundary on October 12. Earlier experiments and roadmaps are historical unless explicitly carried forward here. The complete inspected source tree and its ancestry are preserved at `archive/pre-production-20261012`, commit `e34faf8ad72d319e469eface8aec7fe26741951f`. Other branches and existing protected archives remain intact; no history was deleted or force-pushed. This source checkpoint is not a new database or provider backup.

The approved Creator and Community Experience specification, selected Orbit mark, restored cinematic composition, meaningful free participation, existing security obligations and January 1, 2027 opening target are carried forward. Implementation stays in `creator-v1/`; legacy directories remain historical. Reuse tested foundations rather than treating a fresh production start as permission to discard them.

See [production baseline](docs/production/PRODUCTION-BASELINE.md) and [artifact provenance](docs/production/BASELINE.json). Engineering remains on #325 and the existing feature issues; launch operations remain on #308. Do not create a competing task board.

## Build 001: public discovery journey

Search, category and creator filters survive pagination and project navigation. Project pages offer a validated return to results, identify external destinations, and link to the creator. Browser Back restores recorded catalogue positions. Empty results, unpublished projects and outages remain distinct. The homepage addresses both creators and the curious while retaining the approved artwork, layout and navigation.

The public runtime stays read-only. Member identity, publishing, reviews, saves and progression retain their staged implementations and acceptance gates. No public signup, schema migration, payments, brokerage action, hosting purchase or legal-policy acceptance is implied by this source build.

## Work and verification

```sh
cd creator-v1
npm test
node --check dist/worker.mjs
```

The Creator V1 workflow adds member/staff boundary, privacy and shared-brand checks. Local isolated fixture tests are not real-user acceptance. The first complete accepted journey remains one genuine project through member A, separately authenticated staff, anonymous discovery and independent member B.

Runtime promotion requires the exact tested artifact, source and schema record, visual and responsive acceptance, recovery/rollback readiness, and owner authorization. Do not use the retired V5 deployment workflow or assume the repository default branch is the deployed source.

## License and security

Existing [Apache License 2.0](LICENSE), [NOTICE](NOTICE), [trademark policy](TRADEMARKS.md) and [security reporting](SECURITY.md) remain in force. This work does not change code/media licensing or grant rights to other creators' work. Never commit credentials, account records, family data, confidential reports or session tokens to this public repository.
