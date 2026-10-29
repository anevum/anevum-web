# BRANDLE — The Glimmer Grove

A personalized five-letter word game made for Brandi. Forest green, teal, burnt orange, luminous visuals and independent daily/endless play. Free and open-source; no account, analytics, payment service or backend.

**Live:** https://brandle-glimmer-grove.devonakins.workers.dev/

## Local development

From `games/brandle`, run `python3 -m http.server 8788` and open http://localhost:8788/. Any static HTTP server with ES module support works. Never open index.html as file://, because browsers restrict local module loading.

```sh
node --test games/brandle/tests.mjs
node games/brandle/build-worker.mjs
npx wrangler deploy --config games/brandle/wrangler.toml
```

The generator packages the static game assets into an independent Cloudflare Worker, so publication is reproducible from this repository. Do not edit generated `dist/worker.mjs`. The GitHub Actions workflow uses the repository's Cloudflare credentials on pushes to `main` affecting only this game. Manual deploy is possible with Wrangler or the Cloudflare API.

## Design and behavior

- Standard five-letter, six-attempt puzzle with color-accurate duplicate-letter scoring.
- Deterministic daily word based on UTC date (same answer for everyone on that UTC date); separate endless mode with recent-answer avoidance.
- Offline English guess dictionary from the permissively licensed `tabatkins/wordle-list` and independent curated common-answer bank.
- Local-only saved progress, daily and endless statistics, streaks, shareable results, first-run help, accessibility and reduced-motion settings.
- Sound synthesized on interaction. Vibration only where the browser supports `navigator.vibrate`; iOS Safari does not reliably support programmable web vibration.
- PWA manifest and service worker cache the full playable game for offline play after first successful load.

## Build / deployment boundaries

Never deploy or edit the ANEVUM apex Worker or its routing as part of BRANDLE. Deploy exclusively to `brandle-glimmer-grove` and publish on its isolated `workers.dev` subdomain.

## Attribution

See [NOTICE.md](./NOTICE.md) for the license attribution for the bundled guess dictionary. The app's project source follows the parent repository license.
