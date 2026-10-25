// Synthetic smoke probes only. They do not measure real-world coding or math reliability.
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {casesFor,scoreLexical} from './benchmark-fixtures.mjs';
export const CASES=Object.freeze([
  Object.freeze({id:'math-arithmetic-001',task:'math-explain',prompt:'Compute 17 multiplied by 19, and include the integer result.',matches:/\b323\b/}),
  Object.freeze({id:'coding-index-001',task:'code-review',prompt:'Explain why array[index] when index equals array.length is invalid in JavaScript. Include a concrete fix.',matches:/out.of.bounds|outside|length\s*-\s*1|index\s*<\s*.*length/i}),
  Object.freeze({id:'research-growth-001',task:'research-summary',prompt:'Synthetic numbers: a project had 10 completed jobs last month and 15 this month. Calculate the percentage change and flag that this is not evidence of quality.',matches:/50\s*%|50\s*percent/i}),
  Object.freeze({id:'studio-inert-001',task:'studio-explain',prompt:'Synthetic Creator Studio finding: button.inert. Briefly explain what it means and how a human could verify a repair.',matches:/action|no effect|does not|doesn.t/i})
]);
export async function runBenchmark({base,token,fetchImpl=fetch,now=()=>Date.now(),suite='smoke',partition='development'}={}) {
  const selected=casesFor(suite,partition)??CASES;
  if (!/^http:\/\/127\.0\.0\.1:\d{1,5}$/.test(base??'') || typeof token!=='string' || token.length<32) {
    throw Error('local_benchmark_configuration_required');
  }
  const results=[];
  for (const task of selected) {
    const before=now();let ok=false,reason='';
    try {
      const response=await fetchImpl(base+'/v1/infer',{
        method:'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json'},
        body:JSON.stringify({task:task.task,prompt:task.prompt,dataClass:'synthetic',maxOutputTokens:256}),
        signal:AbortSignal.timeout(65_000)
      });
      if (!response.ok) {reason='service_error_'+response.status;}
      else {
        const data=await response.json();
        const score=suite==='smoke'
          ? {pass:typeof data.answer==='string' && task.matches.test(data.answer),reason:'smoke_expected_signal'}
          : scoreLexical(task,data.answer);
        ok=data.backend==='ollama-local' && score.pass;
        reason=data.backend!=='ollama-local'?'wrong_backend':ok?score.reason:score.reason;
      }
    } catch {reason='service_unavailable';}
    // Only synthetic case IDs, scores and timing leave the in-memory evaluation.
    results.push({id:task.id,pass:ok,reason,elapsedMs:Math.max(0,now()-before)});
  }
  const byTask={};
  for(let i=0;i<results.length;i++){
    const task=selected[i].task;
    byTask[task]??={cases:0,passed:0};byTask[task].cases++;
    if(results[i].pass)byTask[task].passed++;
  }
  const durations=results.map(x=>x.elapsedMs).sort((a,b)=>a-b);
  const pct=p=>durations.length?durations[Math.ceil(p*durations.length)-1]:null;
  return {scope:suite==='smoke'?'synthetic-smoke-only':'public-synthetic-lexical-probes',
    suite,partition,scoring:'regex-presence-only',modelQualityProven:false,memberData:false,
    cases:results.length,passed:results.filter(x=>x.pass).length,
    elapsedP50Ms:pct(.5),elapsedP95Ms:pct(.95),byTask,results};
}
if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const suiteArg=process.argv.find(x=>x.startsWith('--suite='))?.slice(8)??'smoke';
  const partitionArg=process.argv.find(x=>x.startsWith('--partition='))?.slice(12)??'development';
  const caseList=casesFor(suiteArg,partitionArg)??CASES;
  if (process.argv.includes('--list')) {
    process.stdout.write(JSON.stringify({scope:'synthetic-lexical-probes',suite:suiteArg,partition:partitionArg,cases:caseList.map(x=>x.id)},null,2)+'\n');
  } else {
    runBenchmark({base:`http://127.0.0.1:${Number(process.env.PORT ?? 3217)}`,
      token:process.env.CONTINUANCE_COMPUTE_TOKEN,suite:suiteArg,partition:partitionArg}).then(value=>{
      process.stdout.write(JSON.stringify(value,null,2)+'\n');
      if(value.passed!==value.cases)process.exitCode=1;
    }).catch(()=>{process.stderr.write('Local synthetic evaluation is not configured.\n');process.exitCode=1;});
  }
}
