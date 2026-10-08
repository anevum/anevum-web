# ANEVUM.WEB.BUILD.2026-10-08.006.COMMAND-MEMBER-PORTAL-RHEN-TERMINAL

## Product decision

Command is ANEVUM's member home: profile/account, saved programs, follows, real project updates, and access to offered program features. The old trading console is RHEN Terminal. Future actual programs join the project registry and receive their own workspaces; internal RHEN modules are not invented products.

This supersedes the “My Space” name and the website-wide operator-Command identity in the prior member design. The current light workshop design applies to the entire public website, member Command, and RHEN Terminal.

## Implemented structure

- `/me`: working member Command UI backed by the existing authenticated member API; public unconfigured state explains account availability and offers public project records.
- `/me/settings`: profile updates, account JSON export, logout, and account deletion using the existing server-backed flows.
- `/command`: same member Command. Cloudflare's existing Access application may still protect this exact path externally; use `/me` for member entry until the policy cutover is verified.
- `/apps/rhen/*`: RHEN member workspace with sanitized evidence, research, and updates. Ordinary membership has no operator/broker authority.
- `/apps/rhen/terminal/*`: RHEN Terminal entry; redirects to the protected `/command/rhen/*` operator surface.
- `/command/rhen/{operate,discover,review,public,system}`: RHEN Terminal, preserved Cloudflare Access credentials and API protections. Existing `/command/operate`, `/command/review`, etc. redirect here for compatibility.
- The registry owns application URLs and real offered feature links, replacing hardcoded RHEN links in the member program directory. `hasApp` remains false until infrastructure activation is verified.

Public evidence, architecture, release list/detail, résumé, and editorial routes now use the workshop's shared palette and readable type. No dark-theme route allowlist remains.

## Authorization and activation

No RHEN strategy, Railway service, broker write path, live stream gate, member gate, secret, or production DB was changed. Do not infer account activation from this UI release.

Issue #210 still owns separate production/preview D1 provisioning, migrations, Google OAuth/secrets, actual sign-in/isolation/deletion checks, privacy/terms approval, and explicit member enablement. After those pass, verify both `/me` and the RHEN member app. Scope Cloudflare Access to the private terminal paths and protected APIs before exposing `/command` as the general member URL. Do not remove Access from `/command/rhen/*` or `/api/command/*` merely to open the portal.

## Validation

Run typecheck/build, existing trading/research/operational boundary tests, member fail-closed tests and schema/cascade checks, desktop/mobile public and terminal browser QA, and member Command UI-flow checks. Browser fixtures exercise the UI only; they do not substitute for actual OAuth, D1, user isolation, or operator sign-in validation.
