// Adapter for a locally installed Ollama server only; URL validated by policy.
import {parseLocalEndpoint} from './policy.mjs';
export async function generateLocal({endpoint,model,instruction,prompt,maxOutputTokens,fetchImpl=fetch}) {
  const path=parseLocalEndpoint(endpoint);
  if (!path || typeof model !== 'string' || !/^[a-zA-Z0-9._:/-]{1,120}$/.test(model)) {
    throw Error('backend_unavailable');
  }
  let result;
  try {
    result=await fetchImpl(path,{
      method:'POST',
      headers:{'content-type':'application/json'},
      signal:AbortSignal.timeout(60_000),
      body:JSON.stringify({model,system:instruction,prompt,stream:false,
        options:{num_predict:maxOutputTokens,temperature:0.2}})
    });
  } catch { throw Error('backend_unavailable'); }
  if (!result?.ok) throw Error('backend_unavailable');
  let payload;
  try {
    const body=await result.text();
    if (Buffer.byteLength(body,'utf8') > 128 * 1024) throw Error('oversized_backend_response');
    payload=JSON.parse(body);
  } catch { throw Error('backend_unavailable'); }
  if (typeof payload?.response !== 'string' || Buffer.byteLength(payload.response,'utf8') > 48 * 1024) {
    throw Error('backend_unavailable');
  }
  return {
    answer:payload.response,
    usage:{promptTokens:Number.isSafeInteger(payload.prompt_eval_count)?payload.prompt_eval_count:null,
      outputTokens:Number.isSafeInteger(payload.eval_count)?payload.eval_count:null}
  };
}
