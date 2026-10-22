// Source-only V002 Lab archiving acceptance, using the repository's real modules.
// No network, Cloudflare Access or production data is used.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, readdir, mkdtemp, copyFile, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {archiveBackstageLab, LAB_V002_VERSION} from './v002-archive-backstage.mjs';

const root=resolve(fileURLToPath(new URL('../',import.meta.url)));
const sourceWorker=await readFile(join(root,'worker.mjs'),'utf8');
const sourceTerminal=await readFile(join(root,'terminal-ui.mjs'),'utf8');
const patched=archiveBackstageLab({worker:sourceWorker,terminal:sourceTerminal});

test('removes the duplicate Backstage launcher entry, not its records',()=>{
  assert.ok(patched.activeProjects.includes('the-fold'));
  assert.ok(patched.activeProjects.includes('rhen'));
  assert.ok(patched.activeProjects.includes('transcosmic'));
  assert.ok(!patched.activeProjects.includes('backstage'));
  assert.ok(patched.preservesArchive);
  assert.match(patched.terminal,/BACKSTAGE \/ EXPORT CASES/);
  assert.match(patched.terminal,/IREN \/ LIVE STAFF/);
  assert.match(patched.terminal,/PREVIEWS \/ SIMULATED/);
  assert.doesNotMatch(patched.terminal,/"slug":"backstage"/);
  assert.match(patched.worker,/renderArchivedBackstage\(\)/);
  assert.match(patched.worker,new RegExp(LAB_V002_VERSION));
});

test('duplicate, incomplete and mismatched sources fail closed',()=>{
  assert.throws(()=>archiveBackstageLab({worker:patched.worker,terminal:patched.terminal}),/Already patched/);
  assert.throws(()=>archiveBackstageLab({worker:'bad',terminal:sourceTerminal}),/Expected complete/);
  assert.throws(()=>archiveBackstageLab({
    worker:sourceWorker.replace("const HOST='lab.anevum.com'","const HOST='example.com'"),
    terminal:sourceTerminal
  }),/Missing preservation invariant/);
  assert.throws(()=>archiveBackstageLab({
    worker:sourceWorker,terminal:sourceTerminal.replace('"slug":"backstage"','"slug":"retired"')
  }),/Unexpected project registry/);
});

test('compiled V002 Worker preserves the game, research, authoring, case backups and domain security',async()=>{
  const temp=await mkdtemp(join(tmpdir(),'anevum-lab-v002-'));
  try {
    for(const name of await readdir(root)) {
      if(name.endsWith('.mjs'))await copyFile(join(root,name),join(temp,name));
    }
    await writeFile(join(temp,'worker.mjs'),patched.worker);
    await writeFile(join(temp,'terminal-ui.mjs'),patched.terminal);
    const {default:lab}=await import(pathToFileURL(join(temp,'worker.mjs')).href);
    const get=async(path,method='GET')=>lab.fetch(new Request('https://lab.anevum.com'+path,{method}));
    const home=await get('/');
    assert.equal(home.status,200);
    const html=await home.text();
    assert.equal((html.match(/class="project-entry/g)||[]).length,patched.activeProjects.length);
    assert.doesNotMatch(html,/data-slug="backstage"/);
    for(const name of ['THE FOLD','RHEN','TRANSCOSMIC'])assert.match(html,new RegExp(name));
    assert.match(html,/IREN \/ LIVE STAFF/);
    assert.match(html,/BACKSTAGE \/ EXPORT CASES/);
    assert.match(html,/PREVIEWS \/ SIMULATED/);
    assert.match(html,/href="https:\/\/anevum\.com\/staff"/);
    assert.match(html,/href="\/projects\/backstage\/"/);
    assert.match(html,/href="\/previews\/"/);
    assert.equal(home.headers.get('X-Robots-Tag'),'noindex, nofollow, noarchive');
    assert.match(home.headers.get('Content-Security-Policy'),/frame-ancestors 'none'/);
    const css=await (await get('/terminal.css')).text();
    assert.match(css,/lab-ops-links/);
    assert.match(css,new RegExp('grid-template-rows:repeat\\('+patched.activeProjects.length+',minmax\\(34px,1fr\\)\\)'));
    const js=await (await get('/terminal.js')).text();
    assert.match(js,/runCommand/);
    assert.doesNotMatch(js,/BACKSTAGE: CASE DESK/);
    const archived=await get('/projects/backstage/');
    assert.equal(archived.status,200);
    const archivePage=await archived.text();
    assert.match(archivePage,/ARCHIVE ONLY/);
    assert.match(archivePage,/id="exportCases"/);
    assert.match(archivePage,/id="importCases"/);
    assert.match(archivePage,/IREN STAFF \(LIVE\)/);
    const backup=await (await get('/projects/backstage/workspace.js')).text();
    assert.match(backup,/anevum\.lab\.backstage\.cases\.v1/);
    assert.match(backup,/backstage-local-v1/);
    assert.match(backup,/download\(/);
    assert.match(backup,/restore\(/);
    assert.equal((await get('/projects/the-fold/')).status,200);
    assert.equal((await get('/projects/rhen/')).status,200);
    assert.equal((await get('/projects/transcosmic/')).status,200);
    const info=await (await get('/health')).json();
    assert.equal(info.projects,patched.activeProjects.length);
    assert.equal(info.lab,LAB_V002_VERSION);
    assert.equal((await get('/', 'POST')).status,405);
    assert.equal((await lab.fetch(new Request('https://other.example/'))).status,404);
    assert.equal((await get('/projects/backstage/api/member')).status,404);
  }finally{
    await rm(temp,{recursive:true,force:true,maxRetries:3});
  }
});
