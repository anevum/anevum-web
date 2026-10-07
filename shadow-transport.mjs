// Authenticated upstream reads. Never return provider bodies or credentials on error.
export async function shadowRead(base, path, token, fetcher = fetch) {
  let response;
  try {
    response = await fetcher(base + path, {
      headers: {Authorization: "Bearer " + token, Accept: "application/json"},
      signal: AbortSignal.timeout(10000), redirect: "manual"
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const reason = /redirect/i.test(message) ? "REDIRECT" : /timeout|timed out|abort/i.test(message) ? "TIMEOUT"
      : /dns|resolve/i.test(message) ? "DNS" : /certificate|tls|ssl/i.test(message) ? "TLS"
      : /connection|socket|network/i.test(message) ? "NETWORK" : "FAILED";
    return {status: 502, payload: {message: "Shadow upstream connection failed.", error_code: "SHADOW_FETCH_" + reason}};
  }
  if (!response.ok) {
    return {status: response.status, payload: {
      message: "Shadow upstream rejected the read.", error_code: "SHADOW_UPSTREAM_" + response.status
    }};
  }
  try { return {status: response.status, payload: await response.json()}; }
  catch { return {status: 502, payload: {message: "Shadow upstream returned an invalid snapshot.", error_code: "SHADOW_INVALID_JSON"}}; }
}
