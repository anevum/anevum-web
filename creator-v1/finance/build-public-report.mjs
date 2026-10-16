#!/usr/bin/env node
/**
 * ANEVUM monthly supporter accounting *draft* exporter.
 *
 * Run only on an isolated workstation with private ledger documents. No
 * network calls; no secrets, account IDs, invoice IDs, dates of individual
 * transactions, customer names or payout data are emitted in the public JSON.
 *
 * Usage: node finance/build-public-report.mjs --input /private/ledger.json
 *       --output /tmp/anevum-finance-preview.json
 *
 * This CLI refuses to write into the repository, because publishing a report
 * requires independent human review of its aggregates and methodology.
 */
import {readFile,writeFile,realpath,stat} from 'node:fs/promises';
import {dirname,resolve,relative,isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildPublicFinanceReport} from './public-report.mjs';

const root=resolve(fileURLToPath(new URL('../../',import.meta.url)));
const args=process.argv.slice(2);
const options={};
for(let i=0;i<args.length;i+=2){
 const name=args[i];
 if(!['--input','--output'].includes(name)||!args[i+1]||options[name])
  throw Error('Usage: --input /private/ledger.json --output /tmp/reviewed-draft.json');
 options[name]=args[i+1];
}
if(args.length!==4||!options['--input']||!options['--output'])
 throw Error('Specify both an input private file and a separate output draft file');
const input=resolve(options['--input']),output=resolve(options['--output']);
if(!isAbsolute(options['--input'])||!isAbsolute(options['--output']))
 throw Error('Use absolute file paths; do not store ledgers in the source repository');
const inRel=relative(root,input),outRel=relative(root,output);
const inRepo=p=>p===''||(!p.startsWith('..')&&!isAbsolute(p));
if(inRepo(inRel)||inRepo(outRel))
 throw Error('Private ledger inputs and draft report outputs must be outside the source checkout');
if(input===output)throw Error('Refusing to overwrite the private ledger');
const dir=await realpath(dirname(output));
if(inRepo(relative(root,dir)))throw Error('The output directory resolves into the repository');
try{await stat(output);throw Error('Output already exists: will not overwrite an earlier reviewed report');}
catch(e){if(e?.code!=='ENOENT')throw e}
const body=await readFile(input,'utf8');
if(body.length>8_000_000)throw Error('Ledger exceeds safe input size');
const result=buildPublicFinanceReport(JSON.parse(body));
// No reviewer's private notes or evidence hashes appear in this file.
// Publication into the public web bundle is an explicitly separate action.
await writeFile(output,JSON.stringify(result,null,2)+'\n',{flag:'wx',mode:0o600});
process.stdout.write('Validated aggregate draft written for human review (NOT PUBLISHED).\n');
