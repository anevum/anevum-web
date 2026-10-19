# ANEVUM V091 — Founder-authorized production beta

Date: 2026-10-19
Session: ANEVUM.WEB.RELEASE.2026-10-19.001.V091-FOUNDER-BETA
Release branch: release/v091-founder-beta-20261019-001
Pinned fully tested commit: 2938f8d387cf08ee3de4abc32c4fabf737556597
Production baseline Worker version: 8e4932d5-467d-418b-be10-2098053f375a

## Explicit authorization
The founder has repeatedly requested a live V091 deployment, including: "No you can deploy I don't care". The stated reason is that the signed-in creator and staff experience cannot be meaningfully tested until the new build is available online.

This is an intentional **early production beta**, not a certification that all real-account acceptance scenarios passed. The following remain UNVERIFIED: founder session end-to-end on V091, reviewer session, creator upload/approval/publication/playback interaction, and cross-account interaction. Do not set these to true or alter the V091 authenticated acceptance evidence.

## Evidence already obtained
All seven exact-head pull-request workflows passed on 2938f8d387cf08ee3de4abc32c4fabf737556597:
39339804744, 39339804436, 39339804447, 39339804796, 39339804564, 39339804842, 39339804557.
Authenticated acceptance remains explicitly pending; production browser testing follows deployment.

## Guardrails
Deploy only the tested V091 application source through the same guarded Cloudflare production script, preserving live settings, service bindings, secrets, routes, progression, collectibles, published projects, D1/R2 content and authentication. Stop if current production Worker version differs from the recorded baseline. Require successful automatic browser and API smoke checks and roll back the main Worker version if the release fails.

V092 Observatory polish and newer V092 IREN updates are out of scope for this release.
