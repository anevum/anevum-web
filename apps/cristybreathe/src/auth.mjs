// No development authentication bypass exists in this module.
const cache = new Map();
const decode = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=')), c => c.charCodeAt(0));
export async function identity(request, env) {
  try {
    const issuer = env.ACCESS_ISSUER;
    if (!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(issuer || '') || !env.ACCESS_AUD) return null;
    const token = request.headers.get('cf-access-jwt-assertion');
    if (!token || token.length > 16000) return null;
    const bits = token.split('.');
    if (bits.length !== 3) return null;
    const header = JSON.parse(new TextDecoder().decode(decode(bits[0])));
    const claims = JSON.parse(new TextDecoder().decode(decode(bits[1])));
    const now = Date.now() / 1000;
    if (header.alg !== 'RS256' || typeof header.kid !== 'string' || claims.iss !== issuer ||
      !Array.isArray(claims.aud) || !claims.aud.includes(env.ACCESS_AUD) ||
      typeof claims.sub !== 'string' || !claims.sub ||
      !Number.isFinite(claims.exp) || claims.exp <= now ||
      !Number.isFinite(claims.iat) || claims.iat > now + 60 ||
      (claims.nbf !== undefined && (!Number.isFinite(claims.nbf) || claims.nbf > now + 60))) return null;
    let keys = cache.get(issuer);
    if (!keys || keys.until < Date.now() || !keys.keys.some(k => k.kid === header.kid)) {
      // Refresh on rotation, but do not let arbitrary unknown kids cause a fetch storm.
      if (keys && Date.now() - keys.fetched < 10000 && !keys.keys.some(k => k.kid === header.kid)) return null;
      const response = await fetch(issuer + '/cdn-cgi/access/certs', {signal: AbortSignal.timeout(8000), redirect: 'error'});
      if (!response.ok) return null;
      const data = await response.json();
      if (!Array.isArray(data.keys) || data.keys.length > 20) return null;
      keys = {keys: data.keys, until: Date.now() + 240000, fetched: Date.now()};
      cache.set(issuer, keys);
    }
    const jwk = keys.keys.find(k => k.kid === header.kid && k.kty === 'RSA');
    if (!jwk) return null;
    const key = await crypto.subtle.importKey('jwk', jwk, {name:'RSASSA-PKCS1-v1_5', hash:'SHA-256'}, false, ['verify']);
    if (!await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, decode(bits[2]), new TextEncoder().encode(bits[0] + '.' + bits[1]))) return null;
    const email = typeof claims.email === 'string' ? claims.email.trim().toLowerCase() : '';
    const allowed = String(env.ALLOWED_EMAILS || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
    return allowed.includes(email) ? email : null;
  } catch { return null; }
}
