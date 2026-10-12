import { readFileSync, writeFileSync } from 'node:fs';
const p=new URL('./ui/',import.meta.url);
const items=[['PAGE','index.html'],['STYLE','styles.css'],['CLIENT','client.mjs']];
const code=items.map(([name,file])=>'export const '+name+' = '+JSON.stringify(readFileSync(new URL(file,p),'utf8'))+';').join('\n')+'\n';
writeFileSync(new URL('./join.mjs',import.meta.url),code,'utf8');
console.log('Generated member join UI module:',code.length,'characters');