// Authenticated upstream reads. Never return provider bodies or credentials on error.
export async function shadowRead(base, path, token, fetcher = fetch) {
  let response;
  try {
    response = await fetcher(base + path, {
      headers: {Authorization: "Bearer " + token, Accept: "application/json"},
      signal: AbortSignal.timeout(10000), redirect: "error"
    });
  } catch {
    return {status: 502, payload: {message: "Shadow upstream connection failed.", error_code: "SHADOW_FETCH_FAILED"}};
  }
  if (!response.ok) {
    return {status: response.status, payload: {
      message: "Shadow upstream rejected the read.", error_code: "SHADOW_UPSTREAM_" + response.status
    }};
  }
  try { return {status: response.status, payload: await response.json()}; }
  catch { return {status: 502, payload: {message: "Shadow upstream returned an invalid snapshot.", error_code: "SHADOW_INVALID_JSON"}}; }
}
