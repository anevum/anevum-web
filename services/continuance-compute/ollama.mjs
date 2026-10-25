// Ollama requests are restricted to loopback. No redirects, cloud calls or model downloads.
import {parseLocalEndpoint} from './policy.mjs';

function configuredLocalModel(endpoint,model) {
  const path=parseLocalEndpoint(endpoint);
  if (!path || typeof model!=='string' || !/^[a-zA-Z0-9._:/-]{1,120}$/.test(model)) return null;
  return path;
}

async function boundedJson(response,maxBytes) {
  const length=response.headers?.get?.('content-length');
  if(length!==null && length!==undefined && /^\d+$/.test(length) && Number(length)>maxBytes) throw Error('oversized_backend_response');
  let text;
  if (response.body && typeof response.body.getReader==='function') {
    const reader=response.body.getReader();const chunks=[];let total=0;
    try {
      while(true) {
        const {done,value}=await reader.read();if(done)break;
        total+=value.byteLength;
        if(total>maxBytes) {await reader.cancel().catch(()=>{});throw Error('oversized_backend_response');}
        chunks.push(Buffer.from(value));
      }
    } finally {reader.releaseLock();}
    text=Buffer.concat(chunks,total).toString('utf8');
  } else {
    text=await response.text();
    if(Buffer.byteLength(text,'utf8')>maxBytes) throw Error('oversized_backend_response');
  }
  return JSON.parse(text);
}

// /api/tags proves the model is installed, NOT that it is loaded or capable of a task.
export async function inspectLocalBackend({endpoint,model,fetchImpl=fetch}={}) {
  const path=configuredLocalModel(endpoint,model);
  if (!path) return {status:'not_configured',modelInstalled:false,inferenceTested:false};
  try {
    const response=await fetchImpl(new URL('/api/tags',path).toString(),{
      method:'GET',redirect:'error',signal:AbortSignal.timeout(3000)
    });
    if (!response?.ok) return {status:'unreachable',modelInstalled:false,inferenceTested:false};
    const data=await boundedJson(response,128*1024);
    if(!Array.isArray(data?.models)||data.models.length>500) return {status:'unreachable',modelInstalled:false,inferenceTested:false};
    const names=data.models.map(item=>item?.name??item?.model).filter(item=>typeof item==='string');
    const installed=names.some(name=>name===model || (!model.includes(':') && name===`${model}:latest`));
    return {status:installed?'installed':'model_missing',modelInstalled:installed,inferenceTested:false};
  } catch {
    return {status:'unreachable',modelInstalled:false,inferenceTested:false};
  }
}

export async function generateLocal({endpoint,model,instruction,prompt,maxOutputTokens,fetchImpl=fetch}) {
  const path=configuredLocalModel(endpoint,model);
  if(!path) throw Error('backend_unavailable');
  let response;
  try {
    response=await fetchImpl(path,{
      method:'POST',redirect:'error',
      headers:{'content-type':'application/json'},
      signal:AbortSignal.timeout(60_000),
      body:JSON.stringify({model,system:instruction,prompt,stream:false,
        options:{num_predict:maxOutputTokens,temperature:0.2}})
    });
  } catch {throw Error('backend_unavailable');}
  if(!response?.ok) throw Error('backend_unavailable');
  let payload;
  try {payload=await boundedJson(response,128*1024);}
  catch {throw Error('backend_unavailable');}
  if(typeof payload?.response!=='string' || Buffer.byteLength(payload.response,'utf8')>48*1024) {
    throw Error('backend_unavailable');
  }
  return {answer:payload.response,
    usage:{promptTokens:Number.isSafeInteger(payload.prompt_eval_count)?payload.prompt_eval_count:null,
      outputTokens:Number.isSafeInteger(payload.eval_count)?payload.eval_count:null}};
}
