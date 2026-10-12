import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {BRAND_MARK,BRAND_CSS,BRAND_FAVICON,BRAND_VERSION} from '../shared/brand.mjs';

const here=dirname(fileURLToPath(import.meta.url));
const previewPath=process.argv[2]||resolve(here,'../../community-preview/worker.js');
const preview=readFileSync(previewPath,'utf8');
if(!preview.includes('ANEVUM CINEMATIC CREATOR PREVIEW'))throw new Error('Approved artwork reference missing');
function assetConstant(name){
  const line=preview.split('\n').find(row=>row.startsWith('const '+name+'='));
  if(!line)throw new Error('Missing source-controlled asset '+name);
  return JSON.parse(line.slice(('const '+name+'=').length).replace(/;\s*$/,''));
}
const ASSETS=assetConstant('ASSETS');
let PAGE=readFileSync(resolve(here,'shell.html'),'utf8');
const marker='<!-- ANEVUM_BRAND_MARK -->';
if(PAGE.split(marker).length!==2)throw new Error('ANEVUM mark must be injected exactly once');
if(!PAGE.includes('src="/client.mjs"')||!PAGE.includes('href="/styles.css"')||!PAGE.includes('href="/favicon.svg"'))throw new Error('Missing public shell assets');
if(/<script(?![^>]*\bsrc=)[^>]*>|on(?:click|load|error)\s*=|<iframe/i.test(PAGE))throw new Error('Public shell must not contain inline code');
PAGE=PAGE.replace(marker,BRAND_MARK);
if(!PAGE.includes('ANEVUM V1 / IN DEVELOPMENT'))throw new Error('Read-only feature status disclosure missing');
const STYLES=readFileSync(resolve(here,'shell.css'),'utf8')+'\n'+BRAND_CSS;
const CLIENT=readFileSync(resolve(here,'client.mjs'),'utf8');
if(/const p=\[|View demo profile|stellarfox|Fictional showcase data/i.test(PAGE+CLIENT))throw new Error('Design demo fixtures are not public data');
const generated=Object.entries({PAGE,STYLES,CLIENT,ASSETS,BRAND_FAVICON}).map(([k,v])=>'export const '+k+'='+JSON.stringify(v)+';').join('\n');
writeFileSync(resolve(here,'generated.mjs'),generated+'\n');
let api=readFileSync(resolve(here,'../api/worker.mjs'),'utf8').replace('export function safePublicUrl','function safePublicUrl').replace('export default {','const api = {');
const runtime=readFileSync(resolve(here,'runtime.mjs'),'utf8').replace(/^import .*;\n/gm,'');
const bundled='// ANEVUM CREATOR V1 PUBLIC READ-ONLY WORKER\n'+generated.replaceAll('export const ','const ')+'\n'+api+'\n'+runtime;
mkdirSync(resolve(here,'../dist'),{recursive:true});
writeFileSync(resolve(here,'../dist/worker.mjs'),bundled);
writeFileSync(resolve(here,'../dist/build-manifest.json'),JSON.stringify({
  version:'0.1.0',
  visualBuild:'orbit-public-shell-v1',
  brandVersion:BRAND_VERSION,
  shellSha256:createHash('sha256').update(PAGE).digest('hex'),
  approvedSourceSha256:createHash('sha256').update(preview).digest('hex'),
  workerSha256:createHash('sha256').update(bundled).digest('hex'),
  bytes:Buffer.byteLength(bundled),
  artworkCount:Object.keys(ASSETS).length
},null,2));
console.log('Built ANEVUM Creator V1 Orbit shell: '+Buffer.byteLength(bundled)+' bytes, '+Object.keys(ASSETS).length+' existing artwork assets.');
