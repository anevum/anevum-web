import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script, createContext } from 'node:vm';

const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const inlineScripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(match => match[1]).filter(s => s.trim());
const source = inlineScripts.at(-1);

function harness() {
  const nodes = new Map();
  const documentListeners = {};
  const windowListeners = {};
  const geolocationCalls = { watch: 0, clear: [], success: null, failure: null };
  const mapInstances = [];
  const markerInstances = [];
  const node = (id) => {
    if (!nodes.has(id)) {
      const handlers = {};
      nodes.set(id, {
        id, textContent: '', hidden: false, checked: id === 'buildings-checkbox', style: {}, attributes: {}, handlers,
        classList: { add() {}, remove() {} },
        addEventListener(type, fn) { handlers[type] = fn; },
        setAttribute(name, value) { this.attributes[name] = value; },
        getAttribute(name) { return this.attributes[name]; },
      });
    }
    return nodes.get(id);
  };
  const document = {
    hidden: false, getElementById: node,
    createElement: () => ({ style: {}, textContent: '', setAttribute() {}, addEventListener() {} }),
    addEventListener(type, callback) { documentListeners[type] = callback; }
  };
  class FakeMap {
    constructor(options) { this.options=options; this.handlers={}; this.events=[]; this.sources=[]; this.layers=[]; mapInstances.push(this); }
    on(type, callback) { this.handlers[type] = callback; }
    addControl() {}
    getStyle() { return { layers: [{ id: 'label-layer', type: 'symbol', layout: { 'text-field': '{name}' }}] }; }
    addSource(name) { this.sources.push(name); }
    addLayer(layer) { this.layers.push(layer.id); }
    setLayoutProperty(...args) { this.events.push(['layer', ...args]); }
    zoomIn() { this.events.push(['zoomIn']); }
    zoomOut() { this.events.push(['zoomOut']); }
    easeTo(options) { this.events.push(['easeTo', options]); }
    flyTo(options) { this.events.push(['flyTo', options]); }
    fitBounds(bounds, options) { this.events.push(['fitBounds', bounds, options]); }
    setTerrain(options) { this.events.push(['terrain', options]); }
  }
  class FakeMarker {
    constructor({ element }) { this.element=element; this.removed=false; markerInstances.push(this); }
    setLngLat(coords) { this.coords=coords; return this; }
    addTo() { return this; }
    remove() { this.removed=true; }
    getElement() { return this.element; }
  }
  const maplibregl = { Map: FakeMap, Marker: FakeMarker, NavigationControl: class {} };
  const window = { maplibregl, isSecureContext: true, addEventListener(type, fn) { windowListeners[type] = fn; } };
  const navigator = { geolocation: {
    watchPosition(success,failure,options) { geolocationCalls.watch+=1; geolocationCalls.success=success; geolocationCalls.failure=failure; geolocationCalls.options=options; return 7; },
    clearWatch(id) { geolocationCalls.clear.push(id); }
  }};
  const context = createContext({ window, document, navigator, maplibregl, console, Date, Number, setTimeout() { return 42; }, clearTimeout() {} });
  new Script(source, { filename: 'family-safety-3d-map.inline.js' }).runInContext(context);
  const click = (id) => { const handler=node(id).handlers.click; assert.equal(typeof handler,'function','missing handler '+id); handler(); };
  return { document, node, click, geolocationCalls, mapInstances, markerInstances, windowListeners, documentListeners };
}

test('prototype loads as standalone HTML and contains parseable JavaScript', () => {
  assert.match(html, /<title>ANEVUM \/ Family Safety Map/);
  assert.match(html, /<div id="map"/);
  assert.ok(source);
  assert.doesNotThrow(() => new Script(source));
});

test('map uses real 3D vector extrusion and map navigation controls', () => {
  const { mapInstances, click, node } = harness();
  assert.equal(mapInstances.length,1);
  const map = mapInstances[0];
  assert.equal(map.options.zoom > 15,true);
  assert.equal(map.options.pitch > 0,true);
  map.handlers.load();
  assert.deepEqual(map.sources,['anevum-buildings','anevum-terrain']);
  assert.deepEqual(map.layers,['anevum-3d-buildings']);
  click('zoom-in'); click('zoom-out'); click('tilt'); click('reset');
  assert.deepEqual(map.events.map(event => event[0]),['zoomIn','zoomOut','easeTo','flyTo']);
  assert.equal(node('tilt').getAttribute('aria-pressed'),'false');
  node('buildings-checkbox').handlers.change({ target: { checked:false }});
  assert.deepEqual(map.events.at(-1),['layer','anevum-3d-buildings','visibility','none']);
  node('terrain-checkbox').handlers.change({ target: { checked:true }});
  assert.equal(map.events.at(-1)[0], 'terrain');
  assert.equal(map.events.at(-1)[1].source, 'anevum-terrain');
});

test('GPS is opt-in and stopped on backgrounding without server writes', () => {
  const { click, geolocationCalls, node, document, documentListeners, markerInstances } = harness();
  assert.equal(geolocationCalls.watch,0);
  assert.equal(markerInstances.length,0);
  click('location-button');
  assert.equal(geolocationCalls.watch,1);
  assert.equal(node('location-button').getAttribute('aria-pressed'),'true');
  assert.equal(geolocationCalls.options.enableHighAccuracy,true);
  geolocationCalls.success({coords:{longitude:-81.285, latitude:28.245, accuracy:9.4}, timestamp:Date.parse('2026-10-17T20:00:00Z')});
  assert.equal(markerInstances.length,1);
  assert.deepEqual(Array.from(markerInstances[0].coords),[-81.285,28.245]);
  assert.match(node('location-status').textContent,/±9 m/);
  document.hidden=true;
  documentListeners.visibilitychange();
  assert.deepEqual(geolocationCalls.clear,[7]);
  assert.equal(markerInstances[0].removed,true);
  assert.equal(node('location-button').getAttribute('aria-pressed'),'false');
});

test('denial fails closed without leaving a live watch', () => {
  const { click, geolocationCalls, node } = harness();
  click('location-button');
  geolocationCalls.failure({code:1,message:'denied'});
  assert.deepEqual(geolocationCalls.clear,[7]);
  assert.equal(node('location-button').getAttribute('aria-pressed'),'false');
  assert.equal(node('location-status').textContent,'Location unavailable');
});

test('fictional circle markers preview identity without live member feeds', () => {
  const { click, node, markerInstances } = harness();
  assert.match(html,/id="sample-family-members" hidden/);
  assert.equal(markerInstances.length,0);
  click('preview-family');
  assert.equal(markerInstances.length,2);
  assert.equal(node('family-count').textContent,'FICTIONAL SAMPLE · 2');
  assert.equal(node('sample-family-members').hidden,false);
  click('community-tab');
  assert.equal(markerInstances.every(pin => pin.getElement().style.display === 'none'),true);
  click('family-tab');
  assert.equal(markerInstances.every(pin => pin.getElement().style.display === ''),true);
  click('preview-family');
  assert.equal(node('sample-family-members').hidden,true);
  assert.equal(node('family-count').textContent,'NO MEMBERS CONNECTED');
});

test('sample positions demonstrate stale and revoked access without real tracking', () => {
  const { click, node, markerInstances, mapInstances } = harness();
  click('preview-family');
  assert.equal(markerInstances.length,2);
  assert.equal(node('family-count').textContent,'FICTIONAL SAMPLE · 2');
  click('preview-focus');
  assert.equal(mapInstances[0].events.at(-1)[0],'fitBounds');
  click('preview-stale');
  assert.match(node('sample-a-status').textContent,/Stale sample/);
  assert.equal(node('preview-stale').getAttribute('aria-pressed'),'true');
  assert.equal(markerInstances[0].getElement().style.opacity,'0.58');
  click('preview-revoke');
  assert.match(node('sample-a-status').textContent,/access revoked/);
  assert.equal(node('preview-stale').disabled,true);
  assert.equal(node('family-count').textContent,'FICTIONAL SAMPLE · 1 VISIBLE');
  assert.equal(markerInstances[0].getElement().style.display,'none');
  assert.equal(markerInstances[1].getElement().style.display,'');
  click('preview-focus');
  assert.equal(mapInstances[0].events.at(-1)[0],'flyTo');
  assert.deepEqual(Array.from(mapInstances[0].events.at(-1)[1].center),[-81.2898,28.2464]);
  click('preview-reset');
  assert.equal(node('preview-stale').disabled,false);
  assert.equal(markerInstances[0].getElement().style.display,'');
  assert.equal(node('sample-a-status').textContent,'Recent (fictional) · access granted for this demonstration');
});

test('community pins are clearly fictional and not shown by default', () => {
  const { click, node, markerInstances } = harness();
  assert.match(html,/id="community-content"[^>]* hidden/);
  assert.equal(markerInstances.length,0);
  click('community-tab');
  assert.equal(node('family-content').hidden,true);
  assert.equal(node('community-content').hidden,false);
  node('demo-markers').handlers.change({target:{checked:true}});
  assert.equal(markerInstances.length,2);
  assert.match(html,/fictional demonstration/);
});

test('GPS does not persist or post to ANEVUM services', () => {
  assert.doesNotMatch(source,/\b(fetch|XMLHttpRequest|WebSocket|sendBeacon|localStorage|sessionStorage|indexedDB)\b/);
  assert.doesNotMatch(source,/\/api\/|api\.anevum\.com|sendPosition|trackChild/);
  assert.match(html,/map provider still receives tile requests/i);
  assert.match(html,/No family accounts or location feeds are connected/);
});
