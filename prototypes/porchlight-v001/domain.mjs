/**
 * ANEVUM Porchlight V001: entirely fictional display fixtures and pure functions.
 * Never interpret this data as real households, reports, safety status, or event hours.
 */
export const MAX_STOPS = 8;

export const houses = Object.freeze([
  Object.freeze({ id: 'pl-01', name: 'Lantern House', block: 'Lantern Walk (fictional)', x: 166, y: 152, tags: ['candy', 'decor'], status: 'Sample stop' }),
  Object.freeze({ id: 'pl-02', name: 'Moonlit Porch', block: 'Hollow Crescent (fictional)', x: 332, y: 142, tags: ['candy', 'nonfood'], status: 'Sample stop' }),
  Object.freeze({ id: 'pl-03', name: 'Starlight Station', block: 'Orbit Lane (fictional)', x: 575, y: 177, tags: ['decor', 'nonfood'], status: 'Sample stop' }),
  Object.freeze({ id: 'pl-04', name: 'The Pumpkin Gate', block: 'Lantern Walk (fictional)', x: 642, y: 330, tags: ['candy', 'decor'], status: 'Sample stop' }),
  Object.freeze({ id: 'pl-05', name: 'Little Comet', block: 'Comet Court (fictional)', x: 467, y: 389, tags: ['candy', 'nonfood', 'stepfree'], status: 'Sample stop' }),
  Object.freeze({ id: 'pl-06', name: 'The Glow Garden', block: 'Orbit Lane (fictional)', x: 245, y: 365, tags: ['decor', 'stepfree'], status: 'Sample stop' })
]);

export const labels = Object.freeze({ candy: 'Treats', nonfood: 'Non-food options', decor: 'Decorations', stepfree: 'Step-free entry (self-reported)' });
export const filters = Object.freeze(['all', 'candy', 'nonfood', 'decor', 'stepfree']);

export function visibleHouses(list, filter = 'all') {
  if (!Array.isArray(list)) return [];
  const value = filters.includes(filter) ? filter : 'all';
  return list.filter((house) => value === 'all' || house.tags.includes(value));
}

export function toggleStop(route, id, list = houses) {
  const current = Array.isArray(route) ? route : [];
  if (!list.some((house) => house.id === id)) return current.slice();
  if (current.includes(id)) return current.filter((item) => item !== id);
  if (current.length >= MAX_STOPS) return current.slice();
  return [...current, id];
}

export function routeHouses(route, list = houses) {
  const byId = new Map(list.map((house) => [house.id, house]));
  return (Array.isArray(route) ? route : []).map((id) => byId.get(id)).filter(Boolean);
}

export function boundedZoom(value) {
  if (!Number.isFinite(value)) return 1;
  return Math.min(1.6, Math.max(0.8, value));
}
