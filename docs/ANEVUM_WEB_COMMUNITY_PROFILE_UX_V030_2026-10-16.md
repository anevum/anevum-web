# Community and member profile UX V030

Session: ANEVUM.WEB.UPDATE.2026-10-16.002.COMMUNITY-PROFILE-UX

Staging only: https://a.anevum.com. The launch countdown on anevum.com remains unchanged. Base source: 4c3b60ed84c2bafaf9685a1b0784ce9069cd6251 (V029). The user confirmed their iCloud account creates a space and asked to leave the other email issue alone.

## Result

Community now connects canonical member accounts to their own walls. Signed-in members can write a wall entry from Community, see their visibility before posting, and return directly to their wall. Guests can join/sign in. Members without a claimed profile are guided to create their space.

People includes a real public member directory, searchable by name/handle and interest, with stable bounded pagination. Latest shows the twelve newest public wall updates with links to the actual entry. Existing approved projects, creator channels and moderated discussions retain their existing data and access boundaries; no legacy identities, roles or entitlements are joined to canonical accounts.

Dashboard sections are addressable with ?tab=overview|profile|appearance|awards|wall and browser history. Community links reach the member wall without the older Creator Studio gate. Visibility copy names the content exposed by opting in, including existing wall entries and images.

## Privacy and persistence

Read-only /api/v1/community/members and /api/v1/community/activity query MEMBER_DB only. Both require verified users with public profiles, return no email or internal user ID, and omit private stats and profile bodies. Public responses are no-store. Visibility revocation removes profiles and entries from subsequent reads. Search is literal, parameters are bounded and allowlisted, and cursors paginate by timestamp plus a stable unique key. No database migration is required.

The community composer uses the existing authenticated wall endpoint and rate limit. Its expectedVisibility is compared atomically during insert; a stale privacy choice returns 409 without saving. This field is optional for existing wall clients. New accounts stay private by default. Existing canonical auth flags, secrets, D1 bindings, routes and Safari Origin fix are preserved.

## Validation

TypeScript; production and staging builds; complete Creator V1 suite including new discovery/privacy/pagination and stale-composer checks; nine cinematic regression checks. The staging release additionally runs the compiled app with genuine Better Auth and temporary SQLite in Chrome and WebKit: OTP, profile creation, image crop/upload, wall save, private community composer, public opt-in, directory search/interest, public composer, entry deep link, and 1440/390/320px overflow checks. Synthetic email delivery and member writes remain inside the disposable fixture.

Release workflow preserves the prior Worker version and rolls back on failed live validation. Live checks cover auth health, anonymous isolation, public discovery shape, exact compiled asset parity and unchanged apex countdown. Browser acceptance JSON and screenshots are retained as CI artifacts.
