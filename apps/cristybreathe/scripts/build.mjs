import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
import {resolve,relative,extname,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webmanifest':'application/manifest+json'};
const assets={};
async function walk(path) {
  for (const entry of await readdir(path,{withFileTypes:true})) {
    const file=resolve(path,entry.name);
    if (entry.isDirectory()) await walk(file);
    else {const bytes=await readFile(file),ext=extname(file),key='/'+relative(resolve(root,'public'),file).replaceAll('\\','/');assets[key==='/index.html'?'/':key]={type:types[ext]||'application/octet-stream',content:bytes.toString(['.png','.jpg'].includes(ext)?'base64':'utf8'),base64:['.png','.jpg'].includes(ext)};}
  }
}
await walk(resolve(root,'public'));
let auth=await readFile(resolve(root,'src/auth.mjs'),'utf8');
let source=(await readFile(resolve(root,'src/worker.mjs'),'utf8')).replace("import {identity} from './auth.mjs';",'').replace(/^export /gm,'');
auth=auth.replace(/^export /gm,'');
await mkdir(resolve(root,'dist'),{recursive:true});
await writeFile(resolve(root,'dist/worker.mjs'),auth+'\n'+source+'\nconst ASSETS='+JSON.stringify(assets)+';\nexport default createWorker(ASSETS);\n');
console.log('Built CristyBreathe with '+Object.keys(assets).length+' private assets.');
