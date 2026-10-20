-- V013: disposable, brand-new canonical Better Auth D1 only.
-- DO NOT apply to anevum-creator-v1-staging, any V5 preview or production DB.
-- Do not infer ownership/role/linkage from rows present in another database.
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS "user" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "emailVerified" INTEGER NOT NULL DEFAULT 0,
  "image" TEXT,
  "createdAt" INTEGER NOT NULL,
  "updatedAt" INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS "session" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "expiresAt" INTEGER NOT NULL,
  "token" TEXT NOT NULL UNIQUE,
  "createdAt" INTEGER NOT NULL,
  "updatedAt" INTEGER NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS canonical_session_user_idx ON "session"("userId");

CREATE TABLE IF NOT EXISTS "account" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "accountId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "idToken" TEXT,
  "accessTokenExpiresAt" INTEGER,
  "refreshTokenExpiresAt" INTEGER,
  "scope" TEXT,
  "password" TEXT,
  "createdAt" INTEGER NOT NULL,
  "updatedAt" INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS canonical_account_user_idx ON "account"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS canonical_provider_account_idx
  ON "account"("providerId","accountId");

CREATE TABLE IF NOT EXISTS "verification" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "identifier" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "expiresAt" INTEGER NOT NULL,
  "createdAt" INTEGER,
  "updatedAt" INTEGER
);
CREATE INDEX IF NOT EXISTS canonical_verification_identifier_idx
  ON "verification"("identifier");

CREATE TABLE IF NOT EXISTS "rateLimit" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "key" TEXT NOT NULL UNIQUE,
  "count" INTEGER NOT NULL,
  "lastRequest" INTEGER NOT NULL
);

-- Explicit isolation marker. Existing V5/member D1s share Better Auth tables
-- but DO NOT carry this marker. Core-table existence alone is insufficient.
CREATE TABLE IF NOT EXISTS canonical_identity_manifest (
  id INTEGER PRIMARY KEY NOT NULL CHECK(id=1),
  issuer TEXT NOT NULL CHECK(issuer='anevum-better-auth-staging-v1'),
  migration TEXT NOT NULL CHECK(migration='0001_canonical_better_auth_core')
);
INSERT OR IGNORE INTO canonical_identity_manifest(id,issuer,migration)
VALUES(1,'anevum-better-auth-staging-v1','0001_canonical_better_auth_core');

-- No member entitlement, staff, broker, Creator V1, XP or transfer tables.
-- No existing rows are imported and no ALTER on another environment.
