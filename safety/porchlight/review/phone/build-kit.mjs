/**
 * Reproducibly assemble the phone-review bundle from the canonical Porchlight
 * public UI. Do not hand-maintain a second HTML source in GitHub.
 */
import {mkdirSync,copyFileSync,existsSync,readFileSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const here=dirname(fileURLToPath(import.meta.url));
const target=resolve(process.argv[2]||'evidence/porchlight-v001/porchlight-phone-review');
mkdirSync(join(target,'test'),{recursive:true});
const generator=resolve(here,'../build-preview.mjs');
execFileSync(process.execPath,[generator,join(target,'index.html')],{stdio:'inherit'});
for(const filename of ['server.mjs','README.md','REVIEW-NOTES.md','START-MAC-LINUX.sh','START-WINDOWS.cmd']){
  copyFileSync(join(here,filename),join(target,filename));
}
copyFileSync(join(here,'test','server.test.mjs'),join(target,'test','server.test.mjs'));
const html=readFileSync(join(target,'index.html'),'utf8');
assert.match(html,/FICTIONAL OFFLINE REVIEW/);
assert.match(html,/NO LIVE HOUSEHOLDS/);
assert.match(html,/connect-src 'none'/);
assert.ok(existsSync(join(target,'server.mjs')));
console.log('PORCHLIGHT_PHONE_REVIEW_PACKAGE=SOURCE_REPRODUCIBLE');
