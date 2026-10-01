const IREN_LEGACY = "https://mfntzxheldzdvlokyntk.supabase.co/functions/v1/iren-command";
const IREN_FOUNDATION = "https://foundation-ingest-staging.up.railway.app/v1/command/iren";

function accessAssertion(request) {
  return (request.headers.get("Cf-Access-Jwt-Assertion") || "").trim();
}

export async function proxyIren(request, assertAdmin, upstreamFetch = fetch) {
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const access = accessAssertion(request);
  const json = (body, status) => new Response(JSON.stringify(body), { status, headers: {
    "content-type": "application/json", "cache-control": "private, no-store",
    "x-content-type-options": "nosniff" } });

  if (!["GET", "POST"].includes(request.method)) {
    return json({ error: "method_not_allowed" }, 405);
  }

  let upstream = IREN_LEGACY;
  let headers;
  if (access) {
    upstream = IREN_FOUNDATION;
    headers = {
      "Cf-Access-Jwt-Assertion": access,
      accept: "application/json",
      "content-type": "application/json",
    };
  } else {
    if (!token) return json({ error: "unauthorized" }, 401);
    await assertAdmin(token);
    headers = {
      authorization: "Bearer " + token,
      accept: "application/json",
      "content-type": "application/json",
    };
  }

  try {
    const response = await upstreamFetch(upstream, {
      method: request.method,
      headers,
      body: request.method === "POST" ? await request.text() : undefined,
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!response.ok) {
      return json(
        { error: "operational_state_unavailable", stale: true, action_required: true },
        response.status,
      );
    }
    const body = await response.json();
    if (!["iren_command.v1", "iren_command.v2"].includes(body.schema_version)) {
      throw new Error("invalid_contract");
    }
    if (request.method === "POST" && body.accepted !== true) {
      throw new Error("command_not_accepted");
    }
    return json(body, response.status);
  } catch {
    return json(
      { error: "operational_state_unavailable", stale: true, action_required: true },
      503,
    );
  }
}
