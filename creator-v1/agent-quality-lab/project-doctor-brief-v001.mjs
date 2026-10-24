// Deterministic, content-minimized diagnostic brief for future IREN guidance.
// A brief contains only curated messages and structural file paths; no source text.
const MAX_RECOMMENDATIONS=4;
const SEVERITY=Object.freeze({error:0,warning:1,info:2});

export function projectDoctorBrief(result) {
 if (!result || typeof result!=='object' || !Array.isArray(result.findings)) {
  throw TypeError('Expected Project Doctor result.');
 }
 const counts={error:0,warning:0,info:0};
 const sorted=[];
 for(const item of result.findings) {
  if (!Object.hasOwn(SEVERITY,item.severity) ||
      typeof item.code!=='string' || typeof item.path!=='string' ||
      typeof item.message!=='string' || typeof item.nextStep!=='string') {
   throw TypeError('Unexpected diagnostic finding.');
  }
  counts[item.severity]++;
  sorted.push(item);
 }
 sorted.sort((a,b)=>SEVERITY[a.severity]-SEVERITY[b.severity] ||
  a.path.localeCompare(b.path) || a.code.localeCompare(b.code));
 const valid=result.valid===true;
 const status=!valid?'invalid':
  counts.error+counts.warning>0?'review':'no_structural_warnings';
 const headline=!valid?'Document validation failed; leave the original source unchanged.':
  status==='review'?'Review '+(counts.error+counts.warning)+' potential structural issue(s).':
  counts.info>0?'No structural warnings; review '+counts.info+' informational notice(s).':
  'No issues detected by the current limited checks.';
 return {
  schema:'anevum.project-doctor.brief.v001',
  status,headline,counts,
  checkedFindings:result.findings.length,
  listTruncated:result.truncated===true,
  recommendations:sorted.slice(0,MAX_RECOMMENDATIONS).map(item=>({
   code:item.code,severity:item.severity,path:item.path,
   message:item.message,nextStep:item.nextStep
  })),
  disclaimer:'These are bounded diagnostic suggestions, not a successful build, security certification, publication approval or automatic repair.'
 };
}
