import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import { authenticate } from "../src/identity.mjs";

const { publicKey, privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const kid = "isolated-house-test-key";
const publicJwk = { ...publicKey.export({ format: "jwk" }), kid, alg: "RS256", use: "sig" };
const base = {
  HOUSE_CF_TEAM_DOMAIN: "house-unit-test.cloudflareaccess.com",
  HOUSE_CF_AUD: "test-audience-1234567890",
  HOUSE_OWNER_EMAIL: "owner@example.org",
  HOUSE_PUBLIC_ORIGIN: "https://house.example.org",
  NODE_ENV: "production"
};
const now = () => Math.floor(Date.now() / 1000);
const claims = () => ({
  iss: "https://" + base.HOUSE_CF_TEAM_DOMAIN,
  aud: [base.HOUSE_CF_AUD],
  email: "owner@example.org",
  iat: now() - 30,
  exp: now() + 600
});
const encoded = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
function token(payload) {
  const prefix = encoded({ alg: "RS256", typ: "JWT", kid }) + "." + encoded(payload);
  return prefix + "." + sign("RSA-SHA256", Buffer.from(prefix), privateKey).toString("base64url");
}
const request = (jwt) => ({
  headers: { "cf-access-jwt-assertion": jwt },
  socket: { remoteAddress: "198.51.100.3" }
});
const mockJwks = async () => new Response(JSON.stringify({ keys: [publicJwk] }), { status: 200 });

test("valid signed Cloudflare Access owner token grants hosted entry", async () => {
  const identity = await authenticate(request(token(claims())), base, mockJwks);
  assert.deepEqual(identity, { role: "owner", mode: "verified", label: "Verified owner" });
});
test("unsigned claims modifications do not grant access", async () => {
  const signed = token(claims());
  const components = signed.split(".");
  components[1] = encoded({ ...claims(), email: "owner@example.org", injected: true });
  await assert.rejects(authenticate(request(components.join(".")), base, mockJwks), (error) => error.status === 401);
});
test("wrong audience and expired tokens are rejected", async () => {
  await assert.rejects(
    authenticate(request(token({ ...claims(), aud: ["different-aud"] })), base, mockJwks),
    (error) => error.status === 401
  );
  await assert.rejects(
    authenticate(request(token({ ...claims(), exp: now() - 1 })), base, mockJwks),
    (error) => error.status === 401
  );
});
test("a valid signature does not make a different email the owner", async () => {
  await assert.rejects(
    authenticate(request(token({ ...claims(), email: "someoneelse@example.org" })), base, mockJwks),
    (error) => error.status === 403
  );
});
test("hosted mode never becomes a demo when NODE_ENV is production", async () => {
  await assert.rejects(
    authenticate({ headers: {}, socket: { remoteAddress: "127.0.0.1" } }, {
      HOUSE_LOCAL_DEMO: "1", NODE_ENV: "production"
    }),
    (error) => error.status === 503
  );
});
