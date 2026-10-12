import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
export const helper = fileURLToPath(new URL('./fixture-db.py', import.meta.url));
export function database(path) {
  return { prepare(sql) { let params = []; const stmt = { bind(...values) { params = values; return stmt; }, async all() {
    const r = spawnSync('python', [helper,path,'query'],{input:JSON.stringify({sql,params}),encoding:'utf8'});
    if(r.status!==0)throw new Error(r.stderr);
    return JSON.parse(r.stdout);
  }}; return stmt; }};
}
