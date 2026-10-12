import { readFileSync, writeFileSync } from 'node:fs';
const p = new URL('./ui/',import.meta.url);
const html=readFileSync(new URL('index.html',p),'utf8');
const styles=readFileSync(new URL('styles.css',p),'utf8');
const client=readFileSync(new URL('client.mjs',p),'utf8');
const placeholder='<!-- ANEVUM_BRAND_MARK -->';
if(html.split(placeholder).length!==2)throw new Error('Canonical ANEVUM mark placeholder must appear exactly once');
const code=[
  "import {BRAND_MARK,BRAND_CSS} from '../shared/brand.mjs';",
  'export const PAGE = '+JSON.stringify(html)+'.replace('+JSON.stringify(placeholder)+',BRAND_MARK);',
  'export const STYLE = '+JSON.stringify(styles)+'+BRAND_CSS;',
  'export const CLIENT = '+JSON.stringify(client)+';'
].join('\n')+'\n';
writeFileSync(new URL('./join.mjs',import.meta.url),code,'utf8');
console.log('Generated branded member UI module:',code.length,'characters');
