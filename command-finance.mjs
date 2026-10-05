export async function proxyFinance(request, upstreamFetch = fetch, options = {}) {
  const supplied = options.credential || null;
  const token = supplied?.token || "";
  const source = supplied?.source || "";
  const json = (body, status) => new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff"
    }
  });

  if (!["GET", "POST"].includes(request.method)) {
    return json({ error: "method_not_allowed" }, 405);
  }
  if (!token || source !== "cloudflare_access") {
    return json({ error: "unauthorized" }, 401);
  }

  const upstream = String(options.foundationUrl || "");
  if (!upstream) {
    return json(
      { error: "financial_gateway_unavailable", stale: true, action_required: true },
      503
    );
  }

  try {
    const response = await upstreamFetch(upstream, {
      method: request.method,
      headers: {
        "cf-access-jwt-assertion": token,
        accept: "application/json",
        "content-type": "application/json"
      },
      body: request.method === "POST" ? await request.text() : undefined,
      signal: AbortSignal.timeout(10000),
      cache: "no-store"
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      return json(
        {
          error: body.detail || body.error || "financial_gateway_unavailable",
          stale: true,
          action_required: true
        },
        response.status
      );
    }

    if (body.schema_version !== "anevum-finance.v1") {
      throw new Error("invalid_contract");
    }
    if (
      body.external_money_movement_enabled === true ||
      body.live_execution_authorized === true
    ) {
      throw new Error("unsafe_finance_contract");
    }
    return json(body, response.status);
  } catch {
    return json(
      { error: "financial_gateway_unavailable", stale: true, action_required: true },
      503
    );
  }
}
