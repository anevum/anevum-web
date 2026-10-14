# ANEVUM Community V009 — earned creator recognition

**Session:** ANEVUM.WEB.BUILD.2026-10-14.005.COMMUNITY-RECOGNITION-V009  
**Branch:** build/creator-v1-community-recognition-v009-20261014  
**Stack:** #388 cinematic source → #392 Community V007 → #395 invited member V008 → V009  
**State:** source-only review candidate. No public account access or migration is authorized.

## Implementation

The community hub now includes compact creator identity markers beside project posts, moderated discussion posts, creator directory cards and approved public creator sidebar entries. The homepage public CommunityHomeFeed has the same marker in its linked creator identity card. The indicators use the shared original CelestialEmblem artwork, canonical series-one motif mapping, and six existing achievement motifs.

The UI displays verified current Level, named earned artifact and **one actually earned achievement** chosen by a deterministic display priority. This is **not** a member-selected showcase slot. The ability for a member to select and persist a preferred award is unimplemented and remains separately gated. No paid titles, moderator badges, fabricated awards, synthetic followers or ranks.

## Real data boundary

The only optional recognition source is the existing anonymous-readable Creator V1 member endpoint under /api/v1/member/creators/:handle. Requests are same-origin, omit cookies, and use no-store. The hook reads at most 12 unique handles from already-approved public project/discussion/creator results, with no private member ID, email or query search. It does not enumerate unpublished creators. Handles are canonicalized, responses must match the requested handle, levels must be valid integers, artifacts require the server's explicit earned flag, and award claims must match an allowlisted key/name with earned=true.

No member Worker, endpoint, permission, schema, XP award, moderation state or database was changed. If the public member profile endpoint is closed, missing, malformed, or errors, the markers disappear; anonymous public discovery remains usable. The existing API's level threshold remains **20 × (L−1)²** in staging, pending the separate #337 progression balance decision. Its sixty names are the first artifact series, **not** a level ceiling.

## Visual contract

On both desktop and mobile, the level emblem, artifact name and earned award appear as a compact, wrapping byline strip next to a genuine creator. Dedicated small-scale emblem artwork and CSS preserve contrast, accessible names, forced-colors behavior and reduced motion. The four illustrated level milestone motifs are currently supported; intermediate levels use the shared orbital emblem rather than pretending original art exists for all sixty.

## Evidence and release gates

Test creator-recognition-v009.test.mjs covers handle binding, invalid/unearned claims, priority, bounded lookups, request credential omission, accessibility, and source-only behavior. The existing compiled 1440/1024/390/320 browser test now also requires level 30 Midnight Atlas / First Launch and level 2 Copper Key / First Signal from labeled **SYNTHETIC OFFLINE** fixtures and captures recognition screenshots. These examples are not real members and are never deployed to a Worker or D1.

Still open: CI exact-head, owner visual acceptance, genuine two-member staging journey, canonical member identity consolidation, and real server-side featured/selected award preferences with ownership, privacy and revocation. Do not deploy/merge, enable public signup, alter launch-page routing, apply migrations, or publish sample data.
