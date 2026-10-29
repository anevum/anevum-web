# Security boundary

Every application asset and API route requires authenticated Cloudflare Access
identity. For direct invocations, the Worker accepts the provider-verified
`ctx.access` runtime context only for the configured application audience and
an allowed email. This context is created by Cloudflare, not from a client
header or request body. The provider validates the Access authentication before
invoking the Worker.

For legacy routes without runtime identity, the Worker accepts an assertion
from the Access header or `CF_Authorization` cookie only after verifying RS256
signatures, exact issuer and audience, expiry, issuance time, optional not-before,
subject and the email allowlist. Both standard JWT audience encodings (string
or array) are supported. Public signing keys are cached briefly and refreshed
on rotation. Missing configuration fails closed. There is no development
authentication switch in the deployment bundle.

Rejected document requests receive a readable 401 recovery page with no private
content. API rejections remain structured 401 responses. Recovery styles use a
per-response CSP nonce; no inline script is enabled. The reference code contains
only a non-sensitive rejection category and random request ID. No token, cookie,
identity or private configuration value is rendered.

The owner is derived exclusively from the verified Access identity. Clients cannot submit
or override ownership. List, read, update, delete, preferences and export
queries scope by owner; cross-account IDs produce 404. Restore assigns the
authenticated owner and fresh IDs rather than accepting ownership from a file.
Administrators with database credentials still have infrastructure access;
this is not end-to-end encryption or a zero-knowledge system.

Mutations require an exact same-origin Origin header and the application
request header. JSON content type, streamed body limits, allowlisted fields,
types, lengths and dates are validated. SQL values use bound parameters.
Rendering escapes all user content; notes are plain text, including writing
tool markers. A self-only script policy disallows inline scripts. Responses
are no-store, non-indexable and disallow framing. Camera, microphone and
geolocation are disabled by Permissions Policy.

Revisions prevent stale edits and deletes. Client-generated IDs make creation
retries idempotent only for the same validated snapshot. A conflicting retry
never pretends a newer snapshot was saved. Autosaves are serialized and the
editor reports success only after the server acknowledges the specific text.

Service worker caches contain only a generic offline page and its stylesheet.
They do not contain the private app document, notes, API responses or identity.
No analytics, third-party fonts, remote scripts, recordings or AI processing
are used. Audit errors contain a random request ID and version, without private
content, identity, raw exception text or request URLs.

Report vulnerabilities privately through the repository's security contact.
Do not open public issues containing private entries, database exports,
deployment identities, tokens or screenshots of personal content.
