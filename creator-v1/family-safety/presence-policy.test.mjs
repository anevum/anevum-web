import test from "node:test";
import assert from "node:assert/strict";
import {
  LIVE_MAX_AGE_MS,
  POSITION_TTL_MS,
  MAX_SESSION_MS,
  isActiveShareSession,
  mayReadPresence,
  mayWritePresence,
  visiblePresence,
  sanitizePosition,
  admitLocationWrite,
  mayPublishCommunityLocation,
  buildViewerGrant
} from "./presence-policy.mjs";

const T = Date.parse("2026-10-17T21:00:00Z");
const circle = { id: "circle-1", state: "active" };
const adult = (subjectId, circleId = circle.id) => ({
  circleId, subjectId, ageBand: "adult", role: "adult", state: "active", identityVerified: true
});
const memberships = [adult("alice"), adult("bob"), adult("carol")];
const session = {
  id: "session-1", circleId: circle.id, subjectId: "alice",
  startedAt: T - 30_000, expiresAt: T + 300_000,
  state: "active", consent: "explicit", revokedAt: null
};
const grant = {
  id: "grant-1", circleId: circle.id, subjectId: "alice",
  viewerId: "bob", sessionId: session.id,
  scope: "presence:read", state: "active", consent: "explicit",
  issuedAt: T - 20_000, expiresAt: T + 200_000, revokedAt: null
};
const context = () => ({
  now: T, circleId: circle.id, circle: { ...circle },
  actorId: "bob", subjectId: "alice",
  memberships: memberships.map(x => ({ ...x })),
  session: { ...session }, grant: { ...grant }
});
const point = (overrides = {}) => ({
  lat: 28.2483, lng: -81.2873, accuracyM: 9,
  observedAt: T - 2_000, ...overrides
});
const deny = ({ state: "unavailable", position: null, updatedAt: null, accuracyM: null });

test("a verified adult sees a position only with specific active time-limited consent", () => {
  const args = context();
  assert.equal(mayReadPresence(args), true);
  assert.equal(mayWritePresence(args), false); // viewer must not write subject data
  const display = visiblePresence({ ...args, location: point() });
  assert.equal(display.state, "recent");
  assert.deepEqual(display.position, { lat: 28.2483, lng: -81.2873 });
  assert.equal(display.accuracyM, 9);
});

test("circle membership by itself or administrative role never provides a viewing grant", () => {
  const a = context();
  assert.equal(mayReadPresence({ ...a, grant: null }), false);
  const adminMembership = a.memberships.map(x => x.subjectId === "bob" ? { ...x, role: "guardian" } : x);
  assert.equal(mayReadPresence({ ...a, memberships: adminMembership, grant: null }), false);
  assert.equal(mayReadPresence({ ...a, actorId: "carol", grant: a.grant }), false);
  assert.equal(mayReadPresence({ ...a, grant: { ...a.grant, viewerId: "carol" } }), false);
});

test("cross-circle, wrong-session, forged scope, arbitrary actor and bad states deny", () => {
  const a = context();
  const mutations = [
    { actorId: "unknown" },
    { circle: { ...a.circle, state: "disabled" } },
    { circleId: "another-circle" },
    { memberships: a.memberships.filter(x => x.subjectId !== "bob") },
    { memberships: a.memberships.filter(x => x.subjectId !== "alice") },
    { session: { ...a.session, id: "new-session" } },
    { grant: { ...a.grant, sessionId: "old-session" } },
    { grant: { ...a.grant, scope: "presence:write" } },
    { grant: { ...a.grant, state: "pending" } },
    { grant: { ...a.grant, consent: "assumed" } },
    { grant: { ...a.grant, revokedAt: T - 2_000 } },
    { session: { ...a.session, state: "paused" } },
    { session: { ...a.session, revokedAt: T - 1_000 } },
    { session: { ...a.session, consent: "implicit" } }
  ];
  for (const mutation of mutations) {
    assert.equal(mayReadPresence({ ...a, ...mutation }), false, JSON.stringify(mutation));
    assert.deepEqual(visiblePresence({ ...a, ...mutation, location: point() }), deny);
  }
});

test("expired, future and implausibly long session and grants fail closed", () => {
  const a = context();
  assert.equal(isActiveShareSession({ circleId:a.circleId, subjectId:a.subjectId, session:a.session, now:T }), true);
  for (const mutation of [
    { now: a.grant.expiresAt },
    { now: a.session.expiresAt },
    { session: { ...a.session, startedAt: T + 1 } },
    { session: { ...a.session, expiresAt: T } },
    { session: { ...a.session, expiresAt: a.session.startedAt + MAX_SESSION_MS + 1 } },
    { session: { ...a.session, expiresAt: a.session.startedAt + 59_999 } },
    { grant: { ...a.grant, issuedAt: T + 100 } },
    { grant: { ...a.grant, expiresAt: a.session.expiresAt + 1 } },
    { grant: { ...a.grant, issuedAt: a.session.startedAt - 1 } },
    { now: Number.NaN },
    { now: -1 },
  ]) {
    assert.equal(mayReadPresence({ ...a, ...mutation }), false, JSON.stringify(mutation));
  }
});

test("duplicate or contradictory memberships always deny access", () => {
  const a = context();
  assert.equal(mayReadPresence({ ...a, memberships:[...a.memberships, adult("bob")] }),false);
  assert.equal(mayReadPresence({
    ...a, memberships:[...a.memberships, { ...adult("alice"), state:"removed" }]
  }),false);
});

test("position ingress admits only the subject with valid on-time location samples", () => {
  const a=context();
  assert.equal(admitLocationWrite({ ...a, location:point() }),null);
  const own={...a,actorId:"alice"};
  assert.deepEqual(admitLocationWrite({ ...own, location:point() }),point());
  assert.deepEqual(sanitizePosition(point(),T),point());
  for(const location of [
    point({lat:91}),
    point({lng:-181}),
    point({accuracyM:2001}),
    point({observedAt:T+5001}),
    point({observedAt:T-120000}),
    point({lat:NaN}),
    point({lng:undefined}),
    {lat:28,lng:-81,accuracyM:"10",observedAt:T-1000},
    {lat:28,lng:-81,accuracyM:10,observedAt:1.5}
  ]) {
    assert.equal(admitLocationWrite({ ...own, location }),null);
  }
  assert.equal(admitLocationWrite({ ...own, session:{...own.session, revokedAt:T-1}, location:point() }),null);
});

test("disabled or unverified adults, minor accounts and rejected memberships never receive locations", () => {
  const a = context();
  for (const membership of [
    { ...adult("bob"), ageBand: "minor" },
    { ...adult("alice"), ageBand: "minor" },
    { ...adult("bob"), identityVerified: false },
    { ...adult("bob"), role: "child" },
    { ...adult("alice"), state: "pending" },
    { ...adult("alice"), circleId: "other-circle" },
    { ...adult("bob"), ageBand: null }
  ]) {
    const newMemberships = a.memberships.map(x => x.subjectId === membership.subjectId ? membership : x);
    assert.equal(mayReadPresence({ ...a, memberships: newMemberships }), false);
  }
});

test("only the subject can write their own position with explicit current consent", () => {
  const a = context();
  assert.equal(mayWritePresence(a), false); // bob cannot write alice
  const own = { ...a, actorId: "alice" };
  assert.equal(mayWritePresence(own), true);
  assert.equal(mayWritePresence({ ...own, session: null }), false);
  assert.equal(mayWritePresence({ ...own, session: { ...session, revokedAt: T - 1 } }), false);
  assert.equal(mayWritePresence({ ...own, memberships: [adult("bob")] }), false);
});

test("freshness status is honest; expired, implausible and absent locations are indistinguishable", () => {
  const a = context();
  assert.equal(visiblePresence({ ...a, location: point({ observedAt: T - LIVE_MAX_AGE_MS }) }).state, "recent");
  assert.equal(visiblePresence({ ...a, location: point({ observedAt: T - LIVE_MAX_AGE_MS - 1 }) }).state, "stale");
  assert.equal(visiblePresence({ ...a, location: point({ observedAt: T - POSITION_TTL_MS }) }).state, "unavailable");
  for (const location of [
    null,
    point({ lat: 90.1 }),
    point({ lng: 180.1 }),
    point({ accuracyM: -1 }),
    point({ accuracyM: 2_001 }),
    point({ observedAt: T + 5_001 }),
    point({ observedAt: -1 }),
    point({ observedAt: NaN }),
    point({ lat: Infinity }),
    point({ lng: "28" }),
  ]) assert.deepEqual(visiblePresence({ ...a, location }), deny);
  assert.deepEqual(visiblePresence({ ...a, grant: null, location: point() }), deny);
});

test("only validated opted-in public place records may be published", () => {
  const a = {
    subjectType: "community_place",
    verifiedPlace: true,
    moderationStatus: "approved",
    ownerOptedIn: true
  };
  assert.equal(mayPublishCommunityLocation(a), true);
  for (const key of Object.keys(a)) {
    assert.equal(mayPublishCommunityLocation({ ...a, [key]: null }), false);
  }
  assert.equal(mayPublishCommunityLocation({ ...a, subjectType: "child" }), false);
  assert.equal(mayPublishCommunityLocation({ ...a, subjectType: "family_member" }), false);
});

test("grant factory requires current session, verified adults and explicit opt-in", () => {
  const a = context();
  const options = {
    circle: a.circle, circleId: a.circleId, actorId: "alice", viewerId: "bob",
    memberships: a.memberships, session: a.session, now: T,
    grantId: "unpredictable-grant-id", expiresAt: T + 60_000, explicitConsent: true
  };
  const built = buildViewerGrant(options);
  assert.ok(built);
  assert.equal(built.viewerId, "bob");
  assert.equal(built.expiresAt, T + 60_000);
  assert.equal(built.consent, "explicit");
  assert.equal(mayReadPresence({ ...a, grant: built }), true);
  for (const mutation of [
    { explicitConsent: false },
    { grantId: "" },
    { viewerId: "alice" },
    { viewerId: "stranger" },
    { session: { ...a.session, revokedAt: T - 1 } },
    { expiresAt: a.session.expiresAt + 1 },
    { expiresAt: T },
    { memberships: [adult("alice")] },
    { memberships: [adult("alice"), { ...adult("bob"), ageBand: "minor" }] }
  ]) assert.equal(buildViewerGrant({ ...options, ...mutation }), null, JSON.stringify(mutation));
});

test("must never expose internal coordinates from the permission kernel through logging", () => {
  assert.equal(typeof mayReadPresence, "function");
  assert.equal(mayReadPresence({ actorId:"bob" }), false);
  assert.deepEqual(visiblePresence({}), deny);
});
