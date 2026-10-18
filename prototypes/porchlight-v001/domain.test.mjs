import test from 'node:test';
import assert from 'node:assert/strict';
import { houses, labels, filters, MAX_STOPS, visibleHouses, toggleStop, routeHouses, boundedZoom } from './domain.mjs';

test('all fixture homes use fictional blocks and within-diagram coordinates', () => {
  assert.equal(houses.length, 6);
  assert.ok(houses.every((home) => home.block.includes('(fictional)')));
  assert.ok(houses.every((home) => home.x >= 0 && home.x <= 800 && home.y >= 0 && home.y <= 540));
  assert.ok(houses.every((home) => home.status === 'Sample stop'));
});

test('filters only return matching sample fixtures', () => {
  assert.equal(visibleHouses(houses).length, houses.length);
  for (const f of filters.slice(1)) {
    assert.ok(visibleHouses(houses, f).length > 0);
    assert.ok(visibleHouses(houses, f).every((home) => home.tags.includes(f)));
  }
  assert.equal(visibleHouses(houses, 'random-filter').length, houses.length);
  assert.equal(visibleHouses(null, 'all').length, 0);
  assert.equal(labels.stepfree, 'Step-free entry (self-reported)');
});

test('selected stops can be added, removed, and reordered by selection', () => {
  let selection = [];
  selection = toggleStop(selection, 'pl-02');
  selection = toggleStop(selection, 'pl-01');
  assert.deepEqual(selection, ['pl-02', 'pl-01']);
  assert.deepEqual(routeHouses(selection).map((h) => h.id), selection);
  assert.deepEqual(toggleStop(selection, 'pl-02'), ['pl-01']);
  assert.deepEqual(toggleStop(selection, 'missing-id'), selection);
});

test('route limits prevent overlong selection', () => {
  const fixtures = Array.from({length: 12}, (_, i) => ({id: String(i), tags: []}));
  let selection = [];
  for (const entry of fixtures) selection = toggleStop(selection, entry.id, fixtures);
  assert.equal(selection.length, MAX_STOPS);
  assert.equal(new Set(selection).size, MAX_STOPS);
});

test('zoom stays within usable bounds', () => {
  assert.equal(boundedZoom(0), 0.8);
  assert.equal(boundedZoom(1.3), 1.3);
  assert.equal(boundedZoom(2), 1.6);
  assert.equal(boundedZoom(NaN), 1);
});
