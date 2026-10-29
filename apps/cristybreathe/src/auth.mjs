// No development authentication bypass exists in this module.
const cache = new Map();
const decode = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=')), c => c.charCodeAt(0));
const audienceMatches = (value, expected) => typeof value==='string' ? value===expected : Array.isArray(value)&&value.includes(expected);
export async function identity(request, env, context, onFailure=()=>{}) {
  const deny=reason=>{onFailure(reason);return null;};
  try {
    const issuer = env.ACCESS_ISSUER;
    if (!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(issuer || '') || !env.ACCESS_AUD) return deny('configuration');
    const allowed = String(env.ALLOWED_EMAILS || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
    const authorize=value=>{const email=typeof value==='string'?value.trim().toLowerCase():'';return allowed.includes(email)?email:null;};
    // This object is provided by the Workers runtime after Access authenticates
    // the invocation. It cannot be supplied by a request header or JSON body.
    // https://developers.cloudflare.com/workers/configuration/cloudflare-access/
    if(context?.access){
      if(!audienceMatches(context.access.aud,env.ACCESS_AUD))return deny('runtime_audience');
      const user=await context.access.getIdentity();
      return authorize(user?.email)||deny('account_not_allowed');
    }
    // Legacy routes and internal routers may not provide ctx.access. Both
    // transported assertions still require the same full signature verification.
    const cookie=request.headers.get('cookie')?.match(/(?:^|;\s*)CF_Authorization=([^;]+)/)?.[1]?.replace(/^"|"$/g,'');
    const token = request.headers.get('cf-access-jwt-assertion') || cookie;
    if (!token || token.length > 16000) return deny('assertion_missing');
    const bits = token.split('.');
    if (bits.length !== 3) return deny('assertion_malformed');
    const header = JSON.parse(new TextDecoder().decode(decode(bits[0])));
    const claims = JSON.parse(new TextDecoder().decode(decode(bits[1])));
    const now = Date.now() / 1000;
    if (header.alg !== 'RS256' || typeof header.kid !== 'string' || claims.iss !== issuer ||
      !audienceMatches(claims.aud,env.ACCESS_AUD) ||
      typeof claims.sub !== 'string' || !claims.sub ||
      !Number.isFinite(claims.exp) || claims.exp <= now ||
      !Number.isFinite(claims.iat) || claims.iat > now + 60 ||
      (claims.nbf !== undefined && (!Number.isFinite(claims.nbf) || claims.nbf > now + 60))) return deny('claims_invalid');
    let keys = cache.get(issuer);
    if (!keys || keys.until < Date.now() || !keys.keys.some(k => k.kid === header.kid)) {
      if (keys && Date.now() - keys.fetched < 10000 && !keys.keys.some(k => k.kid === header.kid)) return deny('signing_key_unknown');
      const response = await fetch(issuer + '/cdn-cgi/access/certs', {signal: AbortSignal.timeout(8000), redirect: 'error'});
      if (!response.ok) return deny('signing_keys_unavailable');
      const data = await response.json();
      if (!Array.isArray(data.keys) || data.keys.length > 20) return deny('signing_keys_invalid');
      keys = {keys: data.keys, until: Date.now() + 240000, fetched: Date.now()};
      cache.set(issuer, keys);
    }
    const jwk = keys.keys.find(k => k.kid === header.kid && k.kty === 'RSA');
    if (!jwk) return deny('signing_key_unknown');
    const key = await crypto.subtle.importKey('jwk', jwk, {name:'RSASSA-PKCS1-v1_5', hash:'SHA-256'}, false, ['verify']);
    if (!await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, decode(bits[2]), new TextEncoder().encode(bits[0] + '.' + bits[1]))) return deny('signature_invalid');
    return authorize(claims.email)||deny('account_not_allowed');
  } catch { return deny('verification_unavailable'); }
}
