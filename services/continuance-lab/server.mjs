// Continuance Lab V001: internal-only, stateless and read-only document diagnostics.
// This service never calls a model, persists source text, runs user code or changes a Studio project.
import http from 'node:http';
import {createHash, timingSafeEqual} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {diagnoseStudioSource} from '../../creator-v1/agent-quality-lab/project-doctor-v001.mjs';

export const MAX_BODY_BYTES = 36 * 1024;
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 60;
const HEADERS = Object.freeze({
  'cache-control': 'private, no-store, max-age=0',
  'content-type': 'application/json; charset=utf-8',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
  'content-security-policy': "default-src 'none'"
});

const json = (response, code, data) => {
  response.writeHead(code, HEADERS);
  response.end(JSON.stringify(data));
};

const sha256 = value => createHash('sha256').update(value).digest('hex');

function authorized(header, token) {
  if (typeof header !== 'string' || !header.startsWith('Bearer ')) return false;
  const incoming = header.slice(7);
  // Hash both values before comparison so lengths do not produce a timing leak.
  const expectedHash = createHash('sha256').update(token, 'utf8').digest();
  const actualHash = createHash('sha256').update(incoming, 'utf8').digest();
  return timingSafeEqual(expectedHash, actualHash);
}

async function readBody(request) {
  const expectedLength = Number(request.headers['content-length']);
  if (request.headers['content-length'] !== undefined &&
      (!Number.isSafeInteger(expectedLength) || expectedLength < 0 ||
       expectedLength > MAX_BODY_BYTES)) {
    return {error:413};
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.byteLength;
    if (size > MAX_BODY_BYTES) return {error:413};
    chunks.push(chunk);
  }
  return {text:Buffer.concat(chunks, size).toString('utf8')};
}

export function createServer({token=process.env.LAB_API_TOKEN, now=()=>Date.now()}={}) {
  if (typeof token !== 'string' || token.length < 32 || token.length > 512) {
    throw Error('LAB_API_TOKEN must be a 32-512 character server-side secret.');
  }
  // One bounded in-memory quota per isolated instance. Not a cross-replica quota.
  const calls = [];

  const server = http.createServer(async (request, response) => {
    try {
      const target = new URL(request.url, 'http://internal.invalid');
      const route = target.pathname;
      if (target.search || target.hash) {
        json(response,404,{error:'not_found'});
        return;
      }

      if (request.method === 'GET' && route === '/healthz') {
        json(response,200,{ok:true,service:'continuance-lab',version:'v001',
          mode:'read-only',models:false,persistence:false});
        return;
      }
      if (route !== '/v1/diagnose' && route !== '/v1/capabilities') {
        json(response,404,{error:'not_found'});
        return;
      }
      if ((route === '/v1/capabilities' && request.method !== 'GET') ||
          (route === '/v1/diagnose' && request.method !== 'POST')) {
        response.setHeader('allow',route === '/v1/capabilities'?'GET':'POST');
        json(response,405,{error:'method_not_allowed'});
        return;
      }
      // Only internal callers with a server-held secret can inspect any document.
      if (!authorized(request.headers.authorization, token)) {
        json(response,401,{error:'unauthorized'});
        return;
      }
      const time = now();
      while (calls.length && time - calls[0] >= WINDOW_MS) calls.shift();
      if (calls.length >= MAX_REQUESTS_PER_WINDOW) {
        json(response,429,{error:'rate_limited'});
        return;
      }
      calls.push(time);

      if (route === '/v1/capabilities') {
        json(response,200,{service:'continuance-lab',version:'v001',
          capabilities:['studio.document.diagnose'],
          formats:['anevum.blocks.v1','anevum.ui.v1'],
          modelEnabled:false,writesEnabled:false,storesSource:false});
        return;
      }
      if (!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(request.headers['content-type'] || '')) {
        json(response,415,{error:'content_type_must_be_json'});
        return;
      }
      const body = await readBody(request);
      if (body.error) {
        json(response,body.error,{error:'body_too_large'});
        return;
      }
      let input;
      try { input=JSON.parse(body.text); }
      catch { json(response,400,{error:'invalid_json'}); return; }
      if (!input || typeof input !== 'object' || Array.isArray(input) ||
          Object.keys(input).length !== 1 || typeof input.source !== 'string') {
        json(response,400,{error:'expected_source_string_only'});
        return;
      }
      const result = diagnoseStudioSource(input.source);
      const safeResult = {
        ...result,
        sourceSha256:sha256(input.source),
        sourceBytes:Buffer.byteLength(input.source,'utf8')
      };
      json(response,result.valid?200:422,safeResult);
    } catch {
      // Do not log source code, auth headers, exception objects or request URLs.
      if (!response.headersSent) json(response,500,{error:'internal_error'});
      else response.end();
    }
  });

  server.requestTimeout=5000;
  server.headersTimeout=6000;
  server.keepAliveTimeout=3000;
  server.maxHeadersCount=32;
  return server;
}

export async function startFromEnvironment() {
  const port=Number(process.env.PORT || 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw Error('PORT must be a valid TCP port.');
  }
  const server=createServer();
  await new Promise((ok,fail)=>{
    server.once('error',fail);
    server.listen(port,'0.0.0.0',ok);
  });
  // No caller data or secrets in logs.
  process.stdout.write('continuance-lab v001 listening; internal-only, read-only\n');
  return server;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  startFromEnvironment().catch(()=>{process.stderr.write('continuance-lab failed to start\n');process.exitCode=1;});
}
