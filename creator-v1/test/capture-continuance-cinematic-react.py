#!/usr/bin/env python3
"""Standalone, source-bound Chromium review of opt-in ANEVUM React Arrival/Discover.
Reads the actually compiled Vite output and serves only local files. Never deploys.
"""
import functools
import json
import os
import socketserver
import threading
from http.server import SimpleHTTPRequestHandler
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist' / 'continuance-cinematic-react-review'
EVIDENCE = ROOT.parent / 'evidence' / 'continuance-cinematic-react'
EVIDENCE.mkdir(parents=True, exist_ok=True)
if not (DIST / 'index.html').is_file():
    raise SystemExit(f'Build the standalone React review first: {DIST}')
for asset in ('games-768.webp', 'games-1536.webp', 'tools-768.webp',
              'tools-1536.webp', 'creative-768.webp', 'creative-1536.webp',
              'libraries-768.webp', 'libraries-1536.webp'):
    if not (DIST / asset).is_file():
        raise SystemExit(f'Expected responsive original art missing from review dist: {asset}')
class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIST), **kwargs)
    def log_message(self, *args, **kwargs): pass

class Server(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True
    daemon_threads = True

server = Server(('127.0.0.1', 0), Handler)
thread = threading.Thread(target=server.serve_forever, daemon=True)
thread.start()
url = f'http://127.0.0.1:{server.server_address[1]}/'
checks = []
failures = []
def check(label, condition):
    result = bool(condition)
    checks.append({'label': label, 'passed': result})
    if not result:
        failures.append(label)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, args=['--no-sandbox'])
    for width, height in ((320, 760), (390, 844), (768, 950), (1440, 900), (1920, 1080)):
        browser_errors, external_calls = [], []
        ctx = browser.new_context(viewport={'width': width, 'height': height}, device_scale_factor=2,
                                  reduced_motion='no-preference', color_scheme='dark')
        page = ctx.new_page()
        page.on('pageerror', lambda error: browser_errors.append(str(error)))
        page.on('request', lambda request: external_calls.append(request.url) if not request.url.startswith(url) else None)
        response = page.goto(url, wait_until='networkidle', timeout=35000)
        check(f'{width} initial HTTP 200', response is not None and response.status == 200)
        check(f'{width} Arrival heading visible', page.get_by_role('heading', name='A UNIVERSE IN THE MAKING.', level=1).is_visible())
        check(f'{width} canonical mark visible', page.locator('.cnr-brandmark svg, svg.cnr-brandmark').count() == 1)
        check(f'{width} Arrival image loaded', page.locator('.cnr-hero > .cnr-art img').evaluate('(image) => image.complete && image.naturalWidth >= 768'))
        check(f'{width} no arrival x-overflow', page.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1'))
        page.screenshot(path=str(EVIDENCE / f'arrival-{width}.png'), full_page=True, animations='disabled')
        page.get_by_role('button', name='Enter ANEVUM').click()
        check(f'{width} Discover heading after real button', page.get_by_role('heading', name='FIND THE UNEXPECTED.', level=1).is_visible())
        check(f'{width} Discover original responsive artwork loaded', page.locator('.cnr-discover-hero > .cnr-art img').evaluate('(image) => image.complete && image.naturalWidth >= 768'))
        check(f'{width} four field cards present', page.locator('button.cnr-room').count() == 4)
        check(f'{width} no Discover x-overflow', page.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1'))
        page.screenshot(path=str(EVIDENCE / f'discover-{width}.png'), full_page=True, animations='disabled')
        page.get_by_role('button', name='Apps & Tools', exact=True).first.click()
        check(f'{width} filter retains only tools', page.locator('button.cnr-room').count() == 1 and page.locator('[data-testid=room-tools]').count() == 1)
        page.get_by_role('button', name='List', exact=True).click()
        check(f'{width} list layout responds', page.locator('.cnr-rooms.cnr-rooms-list').count() == 1)
        page.get_by_label('Search disciplines').fill('not-a-real-discipline')
        check(f'{width} accurate search empty state', page.get_by_text('No matching disciplines').is_visible())
        page.get_by_role('button', name='Clear discovery filters').click()
        check(f'{width} clearing search shows all four fields', page.locator('button.cnr-room').count() == 4)
        page.get_by_role('button', name='error', exact=True).click()
        check(f'{width} error is not faked as zero records', page.get_by_role('heading', name='The catalogue is temporarily unavailable').is_visible())
        page.get_by_role('button', name='loading', exact=True).click()
        check(f'{width} separate loading response state', page.get_by_role('heading', name='Reading the public index').is_visible())
        page.get_by_role('button', name='Home', exact=True).click()
        page.get_by_role('button', name='Pause motion').click()
        check(f'{width} motion pause toggles', page.locator('.cnr-root[data-still=true]').count() == 1)
        page.get_by_role('button', name='Resume motion').click()
        check(f'{width} motion resume toggles', page.locator('.cnr-root[data-still=false]').count() == 1)
        check(f'{width} zero external calls', len(external_calls) == 0)
        check(f'{width} zero uncaught JS exceptions', len(browser_errors) == 0)
        ctx.close()
    ctx = browser.new_context(viewport={'width': 390, 'height': 844}, reduced_motion='reduce')
    reduced = ctx.new_page()
    reduced.goto(url, wait_until='networkidle')
    check('OS reduced motion immediately stops animation', reduced.locator('.cnr-root[data-still=true]').count() == 1)
    reduced.emulate_media(reduced_motion='no-preference')
    check('live reduced-motion preference is observed', reduced.locator('.cnr-root[data-still=false]').count() == 1)
    ctx.close()
    browser.close()
server.shutdown()
receipt = {'source': 'compiled isolated React bundle (not production)', 'base_url': url,
           'checks': len(checks), 'passed': len(checks)-len(failures), 'failures': failures, 'details': checks,
           'screenshots': sorted(x.name for x in EVIDENCE.glob('*.png'))}
(EVIDENCE / 'browser-results.json').write_text(json.dumps(receipt, indent=2))
print(json.dumps({k: receipt[k] for k in ('source', 'checks', 'passed', 'failures', 'screenshots')}, indent=2))
if failures: raise SystemExit(1)
