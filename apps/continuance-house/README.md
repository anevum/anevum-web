# Continuance House V001 | isolated software prototype

Session: ANEVUM.OPS.BUILD.2026-10-24.001.CONTINUANCE-HOUSE-V001

An independent, source-only owner command interface for ANEVUM and the future household system. It does not replace ANEVUM Command, IREN staff, RHEN, Continuance Cadets, or PARITY V136. Nothing in this directory is imported into the production website.

## What is implemented

- Desktop, couch, iPhone, tablet and future fridge responsive interface.
- Owner-only private gateway (Cloudflare Access signed JWT verification) or explicit loopback demonstration.
- Built-in deterministic IREN command router, safe navigation, public GitHub PR activity and GitHub Actions workflow status (each separately labeled; no private tokens).
- Synthetic family explorer and Stardust preview. No child's actual details, progression or private data.
- Browser push-to-talk where the device supports Web Speech and optional spoken replies.
- Keyboard shortcuts suitable for Stream Deck macro programming.
- Integration readiness view: existing ANEVUM links versus unconfigured Railway, home devices and AI model.
- No persistent writes, external device commands, paid inference or secret tokens in the browser.

## Local hardware-free run

Node 22+ is required. From this folder run:

  npm run verify
  npm run dev

Then open http://127.0.0.1:8788/ on the same computer.

The local demonstration is intentionally bound only to 127.0.0.1. It is not an iPhone-accessible home server. The local sample profiles and missions are synthetic.

## Hosted mode (NOT activated)

This project is NOT deployed. Do not publish it publicly or set HOUSE_LOCAL_DEMO in production. Configure a Cloudflare Access application protecting the entire host, and then securely set the following server-only environment variables:

  NODE_ENV=production
  PORT=<platform-port>
  HOUSE_CF_TEAM_DOMAIN=<your-team>.cloudflareaccess.com
  HOUSE_CF_AUD=<application-audience-tag>
  HOUSE_OWNER_EMAIL=<authorized-email>
  HOUSE_PUBLIC_ORIGIN=https://<private-hostname>

A valid Cloudflare Access RS256 JWT is required for all app and API routes other than /healthz. Hosted mode denies access when any required identity configuration is absent. An allowlisted email without a valid signed token never receives access. Do not grant child or partner roles by copying the owner identity.

Cloudflare Access must be configured to protect the whole host before hosting this app; the app checks tokens as defense in depth. On a future Railway service, restrict origin bypass wherever possible. No secrets belong in GitHub or client-side assets.

## Integration contract and next gates

V001 uses public ANEVUM GitHub PR metadata, and links to existing protected ANEVUM pages. Public PR activity does not establish deployment, CI or RHEN status. The ChatGPT Railway connector does NOT automatically authorize an independent hosted application.

V002: OAuth/service-token authorization to carefully scoped read-only operational APIs, verified voice provider, durable owner-only settings, explicit command confirmation.

V003: private child profiles, parent-approved Stardust ledger, synchronized family missions, role-based access and auditable actions; use a server-owned datastore. Never treat V001 synthetic values as earned progression.

V004: local Home Assistant adapter with allowlisted entities, short-lived signed commands, confirmations for safety-critical actions, physical device testing and optional local AI.

## Safety invariants

- Production is fail-closed without signed Cloudflare Access verification.
- No real household data in this public repository.
- No third-party model or microphone capture without user-initiated action.
- No arbitrary commands, payments, deployments, door locks or account writes.
- Every synthetic view labels itself as a demonstration.
- Device APIs and private service tokens are not included.
- This is an isolated additive development branch, not an approved public launch.
