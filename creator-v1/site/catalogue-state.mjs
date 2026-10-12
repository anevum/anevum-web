// Public navigation only. Never put identity, tokens or member records here.
const PUBLIC_CATEGORIES = new Set(['tools','games','automation','creative','learning','research','libraries','other']);
const PUBLIC_HANDLE = /^[a-z][a-z0-9_]{2,29}$/i;
const PUBLIC_ID = /^[A-Za-z0-9_-]{1,80}$/;

export function catalogueParams(input = '', route = 'browse') {
  const source = new URLSearchParams(input);
  const result = new URLSearchParams();
  const directory = route === 'creators';
  const portfolio = route.startsWith('creator/');
  const query = (source.get('q') || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, directory ? 80 : 100);
  if (!portfolio && query) result.set('q', query);
  const category = source.get('category');
  if (!directory && !portfolio && PUBLIC_CATEGORIES.has(category)) result.set('category', category);
  const creator = source.get('creator');
  if (!directory && !portfolio && PUBLIC_HANDLE.test(creator || '')) result.set('creator', creator.toLowerCase());
  const limit = source.get('limit');
  if (/^[1-9]\d?$/.test(limit || '') && Number(limit) <= 48) result.set('limit', limit);
  const cursor = source.get('cursor');
  if ((directory ? PUBLIC_HANDLE : PUBLIC_ID).test(cursor || '')) result.set('cursor', cursor);
  return result;
}

export function catalogueRoute(route = 'browse', input = '', changes = {}) {
  if (!/^(?:browse|creators|creator\/[a-z][a-z0-9_]{2,29})$/i.test(route)) route = 'browse';
  const params = catalogueParams(input, route);
  const changed = Object.keys(changes);
  if (changed.some(key => key !== 'cursor')) params.delete('cursor');
  for (const [key, value] of Object.entries(changes)) {
    if (value === null || value === undefined || value === '') params.delete(key);
    else params.set(key, String(value));
  }
  const query = catalogueParams(params, route).toString();
  return route + (query ? '?' + query : '');
}

export function catalogueReturn(value) {
  if (typeof value !== 'string' || value.length > 2048 || /[\u0000-\u001f\u007f#\\]/.test(value)) return 'browse';
  const split = value.indexOf('?');
  const route = split < 0 ? value : value.slice(0, split);
  if (route === 'discover' && split < 0) return route;
  if (!/^(?:browse|creators|creator\/[a-z][a-z0-9_]{2,29})$/i.test(route)) return 'browse';
  return catalogueRoute(route, split < 0 ? '' : value.slice(split + 1));
}

export function projectRoute(id, from = 'browse') {
  if (typeof id !== 'string' || !PUBLIC_ID.test(id)) return null;
  return 'project/' + encodeURIComponent(id) + '?from=' + encodeURIComponent(catalogueReturn(from));
}

export function publicLocation(location) {
  const path = location.pathname || '/';
  const direct = path === '/discover' ? 'browse'
    : path === '/creators' ? 'creators'
    : /^\/creators\/[a-z][a-z0-9_]{2,29}$/i.test(path) ? 'creator/' + path.slice(10)
    : path === '/create' ? 'publish'
    : /^\/projects\/[A-Za-z0-9_-]{1,80}$/.test(path) ? 'project/' + path.slice(10)
    : ['community','library','account','status','about','rankings','jams'].includes(path.slice(1))
      ? (path === '/about' ? 'status' : path.slice(1)) : 'discover';
  const hash = (location.hash || '').replace(/^#/, '');
  const input = hash && hash !== 'main' ? hash : direct;
  const split = input.indexOf('?');
  const route = split < 0 ? input : input.slice(0, split);
  const raw = new URLSearchParams(split < 0 ? (hash && hash !== 'main' ? '' : location.search || '') : input.slice(split + 1));
  const params = catalogueParams(raw, route);
  if (route.startsWith('project/')) {
    for (const key of [...params.keys()]) params.delete(key);
    params.set('from', catalogueReturn(raw.get('from')));
  }
  const query = params.toString();
  return { route, params, key: route + (query ? '?' + query : '') };
}

// Defense in depth matching the public API's destination restrictions.
export function projectDestination(value) {
  if (typeof value !== 'string' || value.length > 2048) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) return null;
    const host = url.hostname.toLowerCase();
    if (!host.includes('.') || /^\d+\.\d+\.\d+\.\d+$/.test(host) || host.includes(':') || /(?:^|\.)(?:localhost|local|internal|test|invalid)$/.test(host)) return null;
    for (const key of url.searchParams.keys()) if (/^(?:token|access_token|api_key|secret|password)$/i.test(key)) return null;
    return { href: url.href, host: url.host };
  } catch { return null; }
}
