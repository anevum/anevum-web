// Public, wholly synthetic lexical probes. These are NOT a model-quality certification.
// Reserve cases are not used for iterative prompt tuning; their public source is not secret.
const make=(id,task,prompt,required,partition='development',prohibited=[])=>Object.freeze({
  id,task,prompt,partition,required:Object.freeze(required),prohibited:Object.freeze(prohibited)
});
export const EXTENDED_CASES=Object.freeze([
  make('mth-01-multiply','math-explain','Compute 17 multiplied by 19. Give the integer.',[/\b323\b/]),
  make('mth-02-multiply','math-explain','Compute 7 multiplied by 8. Give the integer.',[/\b56\b/]),
  make('mth-03-percent','math-explain','A synthetic count rises from 40 to 50. State its percentage increase.',[/\b25\s*(?:%|percent\b)/i]),
  make('mth-04-fraction','math-explain','Add one quarter and one half. Express the result as a simplified fraction.',[/\b3\s*\/\s*4\b/],'reserved'),
  make('mth-05-units','math-explain','Convert 2500 metres into kilometres.',[/\b2\.5\b/],'reserved'),

  make('cod-01-index','code-review','Synthetic JavaScript: array[index] is accessed when index === array.length. Explain the defect.',[/index|bound/i,/length|range/i]),
  make('cod-02-await','code-review','Synthetic JavaScript: fetchData() returns a Promise but the caller reads result.value immediately. Name the missing async step.',[/await|\.then\(/i]),
  make('cod-03-string','code-review',"Synthetic JavaScript: what is the output of '10' + 2, and why?",[/\b102\b/,/string|concat/i]),
  make('cod-04-assignment','code-review','Synthetic JS: if (value = 1) { run(); }. Explain the mistake compared with equality testing.',[/assign/i,/compar|equal|===/i],'reserved'),
  make('cod-05-sort','code-review','Synthetic JS: numbers.sort() was called and the original list changed. Explain why and suggest a nonmutating alternative.',[/mutat|in.place|original/i,/copy|slice|toSorted|spread/i],'reserved'),

  make('std-01-inert','studio-explain','Synthetic finding button.inert: explain the issue and how a human verifies repair.',[/action|handler|effect/i,/verify|test|click|inspect/i]),
  make('std-02-unreachable','studio-explain','Synthetic finding scene.unreachable: explain why it matters and suggest a human check.',[/unreach|cannot reach/i,/link|choice|connect|navigation/i]),
  make('std-03-label','studio-explain','Synthetic finding input.unlabeled: explain what is missing and who is affected.',[/label/i,/accessib|screen.reader|assistive/i]),
  make('std-04-page','studio-explain','Synthetic finding page.unreachable: how could a creator manually check its navigation?',[/navigation|route|link|reach/i,/page|target/i],'reserved'),
  make('std-05-invalid','studio-explain','Synthetic document fails its format validation. Explain next human inspection steps without claiming to auto-fix it.',[/invalid|schema|format|validat/i,/check|inspect|repair|review/i],'reserved'),

  make('res-01-change','research-summary','Synthetic figures: last month 10 tasks, this month 15 tasks. What percent change? No other evidence exists.',[/\b50\s*(?:%|percent\b)/i]),
  make('res-02-small','research-summary','A synthetic trial involved two observations. State a key evidentiary limitation.',[/sample|observation|evidence/i,/small|insufficien|limit/i]),
  make('res-03-causality','research-summary','Two synthetic trends move together. Explain why this alone does not establish a cause.',[/correl|together|association/i,/caus/i]),
  make('res-04-hypothesis','research-summary','Label these concepts: a prediction made before a trial, and a measured result after it.',[/hypothes|prediction/i,/observ|measur|result/i],'reserved'),
  make('res-05-source','research-summary','You were given only this synthetic sentence. Do not invent external citations. State the evidence limitation.',[/source|citation|reference|evidence/i], 'reserved', [/https?:\/\/|doi:\s*10\./i]),

  make('wri-01-agent','writing-assist','Rewrite actively and plainly: The archive was checked by the team. Keep team and archive.',[/team/i,/archive/i]),
  make('wri-02-voice','writing-assist','Rewrite for clarity without changing the name: The Continuance Institute opened its doors.',[/Continuance Institute/]),
  make('wri-03-signal','writing-assist','Turn into a complete sentence without adding new facts: Signal saved.',[/signal/i,/sav/i]),
  make('wri-04-mina','writing-assist','Rewrite in active voice: The report was reviewed by Mina.',[/Mina/i,/review/i],'reserved'),
  make('wri-05-caution','writing-assist','Rewrite this message clearly without adding dates: The release schedule is not confirmed.',[/schedule|release/i,/confirm|unknown|pending|not set/i],'reserved')
]);

export function scoreLexical(caseData,answer) {
  if(typeof answer!=='string'||Buffer.byteLength(answer,'utf8')>48*1024) return {pass:false,reason:'invalid_answer'};
  if(caseData.prohibited.some(pattern=>pattern.test(answer)))return {pass:false,reason:'prohibited_signal_found'};
  if(!caseData.required.every(pattern=>pattern.test(answer)))return {pass:false,reason:'required_signal_missing'};
  return {pass:true,reason:'lexical_signals_found'};
}

export function casesFor(suite='smoke',partition='development') {
  if(suite==='smoke') {
    if(partition!=='development')throw Error('unsupported_benchmark_partition');
    return null; // legacy smoke cases live in benchmark.mjs
  }
  if(suite!=='extended'||!['development','reserved'].includes(partition))throw Error('unsupported_benchmark_suite');
  return EXTENDED_CASES.filter(item=>item.partition===partition);
}
