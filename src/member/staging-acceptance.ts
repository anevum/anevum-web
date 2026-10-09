// Browser-only, read-only authenticated staging probe. No cookies, tokens, IDs,
// profile values or broker information are included in the returned report.
export type AcceptanceCheck = { label: string; passed: boolean };
export type AcceptanceReport = { checks: AcceptanceCheck[]; passed: boolean };
type JsonObject = Record<string, unknown>;
type Probe = { status: number; body: JsonObject; privateHeaders: boolean };

function object(value: unknown): JsonObject {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as JsonObject : {};
}

async function probe(fetcher: typeof fetch, path: string): Promise<Probe> {
  const response = await fetcher(path, {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
    redirect: "manual"
  });
  const privateHeaders = (response.headers.get("cache-control") || "").includes("no-store")
    && (response.headers.get("x-robots-tag") || "").includes("noindex");
  let body: JsonObject = {};
  if (response.ok) {
    try { body = object(await response.json()); } catch { /* Report failure below. */ }
  }
  return { status: response.status, body, privateHeaders };
}

export async function runStagingAcceptance(fetcher: typeof fetch): Promise<AcceptanceReport> {
  const paths = [
    "/api/member/session",
    "/api/member/me",
    "/api/member/export",
    "/api/member/rhen/draft",
    "/api/member/rewards",
    "/api/member/brokerage",
    "/api/command/trader/status"
  ] as const;

  // One failed route must not suppress independent release-boundary checks.
  const data = await Promise.all(paths.map(path =>
    probe(fetcher, path).catch((): Probe => ({
      status: 0, body: {}, privateHeaders: false
    }))
  ));
  const [session, profile, exported, draft, rewards, brokerage, operator] = data;
  const id = object(session.body.user).id;
  const idReady = typeof id === "string" && id.length > 0;
  const brokerDisabled = [
    "connectionAvailable", "accountConnected", "paperTradingEnabled",
    "liveTradingEnabled", "depositsEnabled", "withdrawalsEnabled"
  ].every(key => brokerage.body[key] === false);

  const checks: AcceptanceCheck[] = [
    {
      label: "Current Google member session is authenticated",
      passed: session.status === 200 && session.privateHeaders
        && session.body.authenticated === true && idReady
    },
    {
      label: "Member profile resolves to the current account",
      passed: profile.status === 200 && profile.privateHeaders && idReady
        && object(profile.body.user).id === id
    },
    {
      label: "Private account export belongs to the same account",
      passed: exported.status === 200 && exported.privateHeaders && idReady
        && object(exported.body.identity).id === id
    },
    {
      label: "RHEN draft storage is available but cannot execute or connect to a broker",
      passed: draft.status === 200 && draft.privateHeaders
        && draft.body.available === true && draft.body.executionEnabled === false
        && draft.body.brokerageConnected === false
        && (draft.body.draft === null || (
          typeof object(draft.body.draft).label === "string"
          && object(draft.body.draft).marketScope === "us_equities_etfs"
          && object(draft.body.draft).direction === "long_only"
        ))
    },
    {
      label: "Member financial rewards remain inactive",
      passed: rewards.status === 200 && rewards.privateHeaders
        && rewards.body.program === "not_launched"
        && rewards.body.earningEnabled === false
        && rewards.body.payoutEnabled === false
        && rewards.body.availableBalanceCents === null
    },
    {
      label: "Member brokerage trading and funds access remain disabled",
      passed: brokerage.status === 200 && brokerage.privateHeaders
        && brokerage.body.integration === "unavailable"
        && brokerage.body.account === null && brokerDisabled
    },
    {
      label: "Ordinary member identity does not grant RHEN operator access",
      passed: operator.status === 401 || operator.status === 403
    }
  ];
  return { checks, passed: checks.every(check => check.passed) };
}
