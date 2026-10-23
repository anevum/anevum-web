import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {SOURCE,RUN,ARTIFACT,inventory,verifyFrontend,offlineConfig} from '../ops/v116-offline-worker-package.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');

test('V116 immutable source and artifact identity are merged release, not legacy V112',()=>{
 assert.equal(SOURCE,'a3c94b3ebdc6103347e76f8a5234904978da67e3');
 assert.equal(RUN,39887377952);
 assert.equal(ARTIFACT,12472563668);
 assert.notEqual(SOURCE,'e96bea83c67883d227c8c733bba80afb95f8b633');
});

test('offline Worker config cannot introduce routes, production exposure, uploads or altered member privileges',()=>{
 const c=offlineConfig('/tmp/public-fixture','/tmp/anevum-fixture');
 assert.equal(c.name,'anevum-apex-prelaunch-gateway');
 assert.deepEqual(c.routes,[]);
 assert.equal(c.workers_dev,false);
 assert.equal(c.preview_urls,false);
 assert.equal(c.upload_source_maps,false);
 assert.equal(c.assets.run_worker_first,true);
 assert.equal(c.vars.CANONICAL_CREATOR_UPLOADS_ENABLED,'false');
 assert.equal(c.vars.CANONICAL_XP_TEST_ENABLED,'false');
 assert.equal(c.d1_databases.length,2);
 assert.equal(Object.hasOwn(c,'secrets'),false);
 assert.equal(Object.hasOwn(c,'secret_text'),false);
});

test('asset inventory rejects symlink inputs and records content hashes',()=>{
 const dir=mkdtempSync(join(tmpdir(),'av116-'));
 try{
   mkdirSync(join(dir,'assets'));
   writeFileSync(join(dir,'assets','genuine.txt'),'ANEVUM');
   const rows=inventory(dir);
   assert.deepEqual(rows,[{path:'assets/genuine.txt',bytes:6,sha256:hash('ANEVUM')}]);
 } finally {rmSync(dir,{recursive:true,force:true});}
});

test('V116 source manifest cannot be replaced by older source or fictional acceptance',()=>{
 const script=readFileSync(new URL('../ops/v116-offline-worker-package.mjs',import.meta.url),'utf8');
 assert.match(script,/assert\.equal\(m\.sourceSha,SOURCE/);
 assert.match(script,/assert\.deepEqual\(files,expected/);
 assert.match(script,/assert\.equal\(browser\.status,'PASS'/);
 assert.match(script,/for\(const width of \[320,390,1440\]\)/);
 assert.match(script,/cloudflareReadbackFresh:false/);
 assert.match(script,/uploadAuthorized:false/);
 assert.match(script,/productionReleaseApproved:false/);
 assert.doesNotMatch(script,/cloudflare\.request|wrangler deploy --|CLOUDFLARE_API_TOKEN|fetch\('https:\/\/api\.cloudflare\.com/);
});
