const IREN_READ = "https://mfntzxheldzdvlokyntk.supabase.co/functions/v1/iren-command";

export async function proxyIren(request, assertAdmin, upstreamFetch = fetch) {
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const json = (body, status) => new Response(JSON.stringify(body), { status, headers: {
    "content-type": "application/json", "cache-control": "private, no-store",
    "x-content-type-options": "nosniff" } });
  if (!["GET", "POST"].includes(request.method)) return json({ error: "method_not_allowed" }, 405);
  if (!token) return json({ error: "unauthorized" }, 401);
  await assertAdmin(token);
  try {
    const response = await upstreamFetch(IREN_READ, {
      method: request.method,
      headers: {
        authorization: "Bearer " + token,
        accept: "application/json",
        "content-type": "application/json",
      },
      body: request.method === "POST" ? await request.text() : undefined,
      signal: AbortSignal.timeout(8000), cache: "no-store",
    });
    if (!response.ok) return json({ error: "operational_state_unavailable", stale: true, action_required: true }, response.status);
    const body = await response.json();
    if (body.schema_version !== "iren_command.v2") throw new Error("invalid_contract");
    if (request.method === "POST" && body.accepted !== true) throw new Error("command_not_accepted");
    return json(body, response.status);
  } catch {
    return json({ error: "operational_state_unavailable", stale: true, action_required: true }, 503);
  }
}
