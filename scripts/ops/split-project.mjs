#!/usr/bin/env node
import {execFileSync} from 'node:child_process';
import {existsSync,readFileSync,realpathSync} from 'node:fs';
import {dirname,join,resolve,relative,sep,isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=dirname(fileURLToPath(import.meta.url));
const catalog=JSON.parse(readFileSync(join(root,'repo-catalog.json'),'utf8'));
const args=process.argv.slice(2),get=(k)=>{const n=args.indexOf(k);return n<0?null:args[n+1]};
const git=(cwd,...a)=>execFileSync('git',a,{cwd,encoding:'utf8',timeout:1200000}).trim();
try {
 if(args.includes('--help')){console.log('Usage: --project brandle|cristybreathe [--source checkout] [--execute --output new-dir]');process.exit(0)}
 const project=catalog.projects.find(p=>p.id===get('--project'));
 if(!project)throw Error('Unknown project');
 const source=realpathSync(resolve(get('--source')||join(root,'../..')));
 if(realpathSync(git(source,'rev-parse','--show-toplevel'))!==source)throw Error('Not source checkout root');
 const prefix=project.source_path;
 if(prefix.includes('..')||!/^[a-z0-9/-]+$/.test(prefix))throw Error('Unsafe prefix');
 for(const f of ['README.md','LICENSE','.github/workflows/ci.yml'])if(!existsSync(join(source,prefix,f)))throw Error('Missing '+f);
 if(git(source,'status','--porcelain','--',prefix))throw Error('Uncommitted project changes');
 const current=git(source,'ls-files','--',prefix).split('\n').filter(Boolean);
 const historical=git(source,'log','--format=','--name-only','HEAD','--',prefix).split('\n').filter(Boolean);
 if(!current.length)throw Error('No source files');
 const danger=/(^|\/)(\.env(\..*)?|\.dev\.vars(\..*)?|wrangler\.private\.jsonc|\.private|dist|node_modules)(\/|$)|\.(pem|p12|pfx|sqlite|sqlite3|db|key)$/i;
 for(const p of new Set([...current,...historical]))if(!p.startsWith(prefix+'/')||danger.test(p.slice(prefix.length+1)))throw Error('Unsafe historical filename: '+p);
 if(git(source,'ls-files','--stage','--',prefix).split('\n').some(s=>s.startsWith('160000 ')))throw Error('Submodule requires review');
 console.log('Preflight passed',project.id,current.length,'tracked files');
 if(!args.includes('--execute')){if(get('--output'))throw Error('Output requires --execute');console.log('No changes');process.exit(0)}
 const outarg=get('--output');if(!outarg)throw Error('Missing --output');
 const out=resolve(outarg),rel=relative(source,out);
 if(existsSync(out)||rel===''||(!rel.startsWith('..'+sep)&&rel!=='..'&&!isAbsolute(rel)))throw Error('Destination must be new and outside source');
 const sha=git(source,'subtree','split','--prefix='+prefix,'HEAD');
 git(source,'init','--initial-branch=main',out);
 git(out,'fetch','--no-tags',source,sha);
 git(out,'reset','--hard','FETCH_HEAD');
 if(git(out,'status','--porcelain'))throw Error('Dirty export');
 console.log('Local export',out,'commit',git(out,'rev-parse','HEAD'));
 console.log('Audit full history and secrets before independent publication. No push or deployment performed.');
}catch(e){console.error('REJECTED:',e.message);process.exitCode=1}
