/** V109 read-only Cloudflare native Studio AUTH version-routing preflight.
 * Inputs MUST come from exact provider readback, never browser/client headers.
 * The result cannot approve deployment, accounts, publishing or human QA.
 *
 * Cloudflare version overrides work only for versions listed in the current
 * target Worker deployment. A stale service-binding override falls back to
 * the deployment's normal traffic percentages. Source: Cloudflare Workers docs.
 */
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

export const CONTROLLER='anevum-package-alpha-v003-control';
export const AUTH_TARGET='anevum-apex-prelaunch-gateway';
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const plain=x=>x&&typeof x==='object'&&!Array.isArray(x)?x:{};
const validVersion=x=>typeof x==='string'&&UUID.test(x);
const prefix=id=>validVersion(id)?id.slice(0,8):null;
const validateDeployment=d=>{
 const rows=plain(d).versions;
 if(!Array.isArray(rows)||rows.length<1||rows.length>2)return null;
 if(rows.some(x=>!validVersion(x?.version_id)||typeof x?.percentage!=='number'||
  !Number.isFinite(x.percentage)||x.percentage<0||x.percentage>100))return null;
 if(new Set(rows.map(x=>x.version_id)).size!==rows.length)return null;
 if(Math.abs(rows.reduce((sum,x)=>sum+x.percentage,0)-100)>0.000001)return null;
 return rows;
};
const unique=xs=>[...new Set(xs)];

/** Scope is protected testing only; a green result is not production approval.
 * @param {object} input provider snapshots: controllerDeployment, controllerVersion, apexDeployment.
 */
export function assessNativeAuthVersionRouting(input){
 const x=plain(input),reasons=[];
 const controllerVersions=validateDeployment(x.controllerDeployment);
 const apexVersions=validateDeployment(x.apexDeployment);
 if(!controllerVersions)reasons.push('CONTROLLER_DEPLOYMENT_UNVERIFIED');
 if(!apexVersions)reasons.push('APEX_DEPLOYMENT_UNVERIFIED');
 const active=controllerVersions?.find(v=>v.percentage===100);
 if(!active||controllerVersions.length!==1)reasons.push('CONTROLLER_VERSION_NOT_EXCLUSIVE');
 const version=plain(x.controllerVersion);
 if(!validVersion(version.id)||!active||active.version_id!==version.id)
  reasons.push('CONTROLLER_VERSION_NOT_CURRENT');
 const bindings=version.resources?.bindings;
 if(!Array.isArray(bindings))reasons.push('CONTROLLER_BINDINGS_UNVERIFIED');
 const lookup=name=>Array.isArray(bindings)?bindings.filter(v=>v?.name===name):[];
 const service=lookup('AUTH');
 if(service.length!==1||service[0].type!=='service'||service[0].service!==AUTH_TARGET)
  reasons.push('AUTH_SERVICE_BINDING_MISMATCH');
 const override=lookup('PACKAGE_CANONICAL_AUTH_VERSION');
 const pinned=override.length===1&&override[0].type==='plain_text'?override[0].text:null;
 if(!validVersion(pinned))reasons.push('AUTH_VERSION_PIN_INVALID_OR_MISSING');
 const member=validVersion(pinned)?apexVersions?.find(v=>v.version_id===pinned):null;
 if(validVersion(pinned)&&apexVersions&&!member)
  reasons.push('AUTH_PIN_NOT_IN_CURRENT_APEX_DEPLOYMENT');
 if(member&&member.percentage!==0)
  reasons.push('AUTH_PIN_NOT_ISOLATED_AT_ZERO_PERCENT');
 const status=reasons.length?'blocked':'protected_review_candidate';
 return {
  status,reasons:unique(reasons),readOnly:true,
  protectedReviewCandidate:status==='protected_review_candidate',
  productionReleaseAuthorized:false,
  signedInJourneyVerified:false,
  controllerVersionPrefix:prefix(version.id),
  requestedAuthVersionPrefix:prefix(pinned),
  apexDeploymentVersions:(apexVersions||[]).map(v=>({
   versionPrefix:prefix(v.version_id),percentage:v.percentage
  })),
  requestedAuthTrafficPercent:member?.percentage??null
 };
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 if(process.argv.length!==3){
  console.error('Usage: node native-auth-pin-preflight-v109.mjs <read-only-provider-snapshot.json>');
  process.exitCode=2;
 }else{
  try{
   const snapshot=JSON.parse(readFileSync(process.argv[2],'utf8'));
   const report=assessNativeAuthVersionRouting(snapshot);
   console.log(JSON.stringify(report,null,2));
   if(!report.protectedReviewCandidate)process.exitCode=2;
  }catch{
   console.error('Unable to verify read-only provider snapshot');
   process.exitCode=2;
  }
 }
}
