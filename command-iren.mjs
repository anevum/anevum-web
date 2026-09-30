const IREN_READ = "https://mfntzxheldzdvlokyntk.supabase.co/functions/v1/iren-command";

export async function proxyIren(request, assertAdmin, upstreamFetch = fetch) {
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const json = (body, status) => new Response(JSON.stringify(body), { status, headers: {
    "content-type": "application/json", "cache-control": "private, no-store",
    "x-content-type-options": "nosniff" } });
  if (request.method !== "GET") return json({ error: "method_not_allowed" }, 405);
  if (!token) return json({ error: "unauthorized" }, 401);
  await assertAdmin(token);
  try {
    const response = await upstreamFetch(IREN_READ, {
      headers: { authorization: "Bearer " + token, accept: "application/json" },
      signal: AbortSignal.timeout(8000), cache: "no-store",
    });
    if (!response.ok) return json({ error: "operational_state_unavailable", stale: true, action_required: true }, response.status);
    const body = await response.json();
    if (body.schema_version !== "iren_command.v1") throw new Error("invalid_contract");
    return json(body, 200);
  } catch {
    return json({ error: "operational_state_unavailable", stale: true, action_required: true }, 503);
  }
}
