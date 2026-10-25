// Local-only, read-only LLM workbench. No arbitrary network targets or tool execution.
import http from 'node:http';
import {createHash,timingSafeEqual} from 'node:crypto';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateLocalRequest,parseLocalEndpoint,MAX_BODY_BYTES} from './policy.mjs';
import {generateLocal,inspectLocalBackend} from './ollama.mjs';

const HEADERS=Object.freeze({
  'content-type':'application/json; charset=utf-8',
  'cache-control':'private, no-store',
  'x-content-type-options':'nosniff',
  'referrer-policy':'no-referrer',
  'content-security-policy':"default-src 'none'"
});
function respond(res,code,body) {res.writeHead(code,HEADERS);res.end(JSON.stringify(body));}
function validToken(header,expected) {
  if (typeof header !== 'string' || !header.startsWith('Bearer ')) return false;
  const a=createHash('sha256').update(header.slice(7)).digest();
  const b=createHash('sha256').update(expected).digest();
  return timingSafeEqual(a,b);
}
async function bodyText(req) {
  const header=req.headers['content-length'];
  if (header !== undefined && (!/^\d+$/.test(header) || Number(header)>MAX_BODY_BYTES)) return null;
  const parts=[];let size=0;
  for await (const part of req) {
    size+=part.byteLength;
    if (size>MAX_BODY_BYTES) return null;
    parts.push(part);
  }
  return Buffer.concat(parts,size).toString('utf8');
}

export function createServer({token=process.env.CONTINUANCE_COMPUTE_TOKEN,
  endpoint=process.env.CONTINUANCE_OLLAMA_URL,model=process.env.CONTINUANCE_LOCAL_MODEL,
  generate=generateLocal,inspect=inspectLocalBackend,clock=()=>Date.now()}={}) {
  if (typeof token!=='string' || token.length<32 || token.length>512) throw Error('strong_token_required');
  // Invalid or unset backend is disabled. Never substitute a paid provider.
  const configured=Boolean(parseLocalEndpoint(endpoint) && typeof model==='string' && /^[a-zA-Z0-9._:/-]{1,120}$/.test(model));
  const recent=[];const inspections=[];let running=false;let inspecting=false;
  const server=http.createServer(async (req,res)=>{
    try {
      const path=new URL(req.url,'http://localhost');
      if (path.search || path.hash) {respond(res,404,{error:'not_found'});return;}
      if (req.method==='GET' && path.pathname==='/healthz') {
        respond(res,200,{service:'continuance-compute',version:'v001',mode:'owner-local',
          backendConfigured:configured,cloudFallback:false,memberDataAllowed:false});return;
      }
      if (!['/v1/infer','/v1/model-status'].includes(path.pathname)) {respond(res,404,{error:'not_found'});return;}
      const inspection=path.pathname==='/v1/model-status';
      if (req.method!==(inspection?'GET':'POST')) {
        res.setHeader('allow',inspection?'GET':'POST');respond(res,405,{error:'method_not_allowed'});return;
      }
      if (!validToken(req.headers.authorization,token)) {respond(res,401,{error:'unauthorized'});return;}
      if (inspection) {
        const now=clock();while(inspections.length&&now-inspections[0]>=60_000)inspections.shift();
        if (inspections.length>=20||inspecting) {respond(res,429,{error:'inspection_capacity_exceeded'});return;}
        inspections.push(now);inspecting=true;
        try {
          const state=configured?await inspect({endpoint,model}):
            {status:'not_configured',modelInstalled:false,inferenceTested:false};
          const safe=['installed','model_missing','not_configured','unreachable'].includes(state?.status)?state.status:'unreachable';
          respond(res,200,{service:'continuance-compute',backend:'ollama-local',status:safe,
            modelInstalled:safe==='installed',inferenceTested:false,cloudFallback:false});
        } catch {
          respond(res,200,{service:'continuance-compute',backend:'ollama-local',status:'unreachable',
            modelInstalled:false,inferenceTested:false,cloudFallback:false});
        } finally {inspecting=false;}
        return;
      }
      if (!configured) {respond(res,503,{error:'local_backend_not_configured'});return;}
      const now=clock();while(recent.length && now-recent[0]>=60_000)recent.shift();
      if (recent.length>=20 || running) {respond(res,429,{error:'local_capacity_exceeded'});return;}
      if (!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(req.headers['content-type']||'')) {
        respond(res,415,{error:'json_required'});return;
      }
      const text=await bodyText(req);
      if (text===null) {respond(res,413,{error:'body_too_large'});return;}
      let body;try{body=JSON.parse(text);}catch{respond(res,400,{error:'invalid_json'});return;}
      const plan=validateLocalRequest(body);
      if (!plan.ok) {respond(res,400,{error:plan.error});return;}
      recent.push(now);running=true;
      try {
        const before=clock();
        const result=await generate({endpoint,model,instruction:plan.instruction,prompt:plan.prompt,
          maxOutputTokens:plan.maxOutputTokens});
        respond(res,200,{task:plan.task,backend:'ollama-local',answer:result.answer,usage:result.usage,
          elapsedMs:Math.max(0,clock()-before),writes:false});
      } catch {respond(res,503,{error:'local_backend_unavailable'});}
      finally {running=false;}
    } catch {if(!res.headersSent)respond(res,500,{error:'internal_error'});else res.end();}
  });
  server.requestTimeout=15_000;
  server.headersTimeout=16_000;
  server.keepAliveTimeout=3_000;
  server.maxHeadersCount=32;
  return server.on('connection',socket=>socket.setTimeout(65_000));
}
export async function startFromEnvironment() {
  const port=Number(process.env.PORT ?? 3217);
  if (!Number.isInteger(port)||port<1||port>65535) throw Error('invalid_port');
  const server=createServer();
  await new Promise((ok,fail)=>server.once('error',fail).listen(port,'127.0.0.1',ok));
  process.stdout.write('continuance-compute v001 started on loopback only\n');
  return server;
}
if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  startFromEnvironment().catch(()=>{process.stderr.write('local compute startup rejected\n');process.exitCode=1;});
}
