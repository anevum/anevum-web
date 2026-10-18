# Porchlight phone review — V001.3

This is a **fictional, read-only, no-cost** demo, not an operational protection service. All event stops and households are fabricated. No real data or external services are used.

## Build from source

From the repository root with Node.js 22:

```sh
node safety/porchlight/review/phone/build-kit.mjs evidence/porchlight-v001/porchlight-phone-review
node --test evidence/porchlight-v001/porchlight-phone-review/test/server.test.mjs
```

The generator copies the current real Porchlight UI into a standalone no-network HTML review. It does **not** copy the page from a stale hand-maintained demo.

## Use on your phone

Extract the workflow's **porchlight-phone-review-v0013.zip** to a computer running Node.js. On a trusted home Wi-Fi network, run:

```sh
node server.mjs --lan --minutes 30
```

Read the printed local IP address on the phone in Safari. This is **unencrypted local HTTP**, not suitable for real names, home addresses, staff credentials, or children's information. Other devices on the same LAN may reach the fictional page. Use `node server.mjs` to bind to localhost only; press Ctrl+C or let the timer stop it.

In the page, use: **Insert fictional host → submit → save fake removal code → simulate approval → report → withdraw → emergency close.** You are testing presentation and workflow comprehension, not actual permission checks or emergency response.

The server allows only GET/HEAD for the demo and health, rejects unknown hostnames/routes, sends no-store and strict CSP headers, and never accepts any API mutation. The embedded JS intercepts fake API requests in memory and blocks outbound requests. Nothing synchronizes between phones.

Record real adult observations in `REVIEW-NOTES.md` without writing down sensitive information. On-device Safari acceptance is still outstanding.

Reference: [Porchlight PR #493](https://github.com/anevum/anevum-web/pull/493), [Safety master plan #489](https://github.com/anevum/anevum-web/issues/489).
