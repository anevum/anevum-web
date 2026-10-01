const IREN_READ = "https://mfntzxheldzdvlokyntk.supabase.co/functions/v1/iren-command";

export async function proxyIren(request, assertAdmin, upstreamFetch = fetch, options = {}) {
  const supplied = options.credential || null;
  const auth = request.headers.get("authorization") || "";
  const legacyToken = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const token = supplied?.token || legacyToken;
  const source = supplied?.source || "supabase";
  const json = (body, status) => new Response(JSON.stringify(body), { status, headers: {
    "content-type": "application/json", "cache-control": "private, no-store",
    "x-content-type-options": "nosniff" } });
  if (!["GET", "POST"].includes(request.method)) return json({ error: "method_not_allowed" }, 405);
  if (!token) return json({ error: "unauthorized" }, 401);
  if (!supplied) await assertAdmin(token);
  const upstream = source === "cloudflare_access"
    ? String(options.foundationUrl || "")
    : IREN_READ;
  if (!upstream) return json({ error: "operational_state_unavailable", stale: true, action_required: true }, 503);
  try {
    const response = await upstreamFetch(upstream, {
      method: request.method,
      headers: source === "cloudflare_access"
        ? {
            "cf-access-jwt-assertion": token,
            accept: "application/json",
            "content-type": "application/json",
          }
        : {
            authorization: "Bearer " + token,
            accept: "application/json",
            "content-type": "application/json",
          },
      body: request.method === "POST" ? await request.text() : undefined,
      signal: AbortSignal.timeout(8000), cache: "no-store",
    });
    if (!response.ok) return json({ error: "operational_state_unavailable", stale: true, action_required: true }, response.status);
    const body = await response.json();
    if (!["iren_command.v1", "iren_command.v2"].includes(body.schema_version)) throw new Error("invalid_contract");
    if (request.method === "POST" && body.accepted !== true) throw new Error("command_not_accepted");
    return json(body, response.status);
  } catch {
    return json({ error: "operational_state_unavailable", stale: true, action_required: true }, 503);
  }
}
