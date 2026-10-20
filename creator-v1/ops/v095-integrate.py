"""One-use, exact-preimage source edit on the authorized V095 development branch.
No deployment, account, database, credential or external-service operations.
The workflow removes this assembler after committing the ordinary source diff.
"""
from pathlib import Path
import subprocess
ROOT=Path('.')
def change(path,old,new,count=1):
    p=ROOT/path
    s=p.read_text()
    if s.count(old)!=count:
        raise RuntimeError(f'Unexpected source in {path}: {old[:100]}')
    p.write_text(s.replace(old,new))

a='site/alpha/v003/api.mjs'
change(a,'import { mintPreview } from "./tokens.mjs";','import { mintPreview } from "./tokens.mjs";\nimport {nativeStudioApi} from "./native-ui-api-v095.mjs";')
change(a,'async function api(req,env,path,ctx) {','async function api(req,env,path,ctx) {\n  if(path.startsWith("/api/v1/packages/native/"))return nativeStudioApi(req,env,{\n    member,pilot,staff,ownerList,reviewList,moderationList,getProject,getDraft,isolatedHost,expiredDraft\n  });')
change(a,'  const old=protectedMode&&project?await getDraft(env.DB,project):null;','  const old=protectedMode&&project?await getDraft(env.DB,project):null;\n  const expectedDraft=body.get("expected_release_id");\n  if(expectedDraft!==null&&(!UUID.test(expectedDraft)||expectedDraft!==old?.id))\n    return fail(409,"The private build changed. Reopen your project before replacing it.");')
change(a,'async function submit(env,u,id) {','async function submit(env,u,id,expectedRelease=null) {')
change(a,'  if(!release||release.status!=="ready") return fail(409,"This project has no ready build to submit");','  if(expectedRelease!==null&&release?.id!==expectedRelease)return fail(409,"The private build changed. Reopen it before submitting.");\n  if(!release||release.status!=="ready") return fail(409,"This project has no ready build to submit");')
change(a,'  const input=await req.json().catch(()=>null);','  const input=await readBoundedJson(req,4096);\n  if(input?.expected_release_id!==undefined&&(!UUID.test(input.expected_release_id)||input.expected_release_id!==release.id))\n    return fail(409,"The submitted release changed. Reopen and review the actual build.");')
change(a,'  const body=await req.json().catch(()=>null);\n  const action=body?.action;','  const body=await readBoundedJson(req,4096);\n  if(body?.expected_release_id!==undefined&&(!UUID.test(body.expected_release_id)||body.expected_release_id!==p.live_release_id))\n    return fail(409,"The approved release changed. Reopen the release before moderating it.");\n  const action=body?.action;')
change(a,'const reason=action==="suspend"?body.reason?.trim():null;','const reason=action==="suspend"&&typeof body.reason==="string"?body.reason.trim():null;')
change(a,'"UPDATE anevum_package_projects SET status=?,review_reason=?,updated_at=? WHERE id=? AND status=?",\n    action==="suspend"?"suspended":"published",reason,Math.floor(Date.now()/1000),id,p.status);','"UPDATE anevum_package_projects SET status=?,review_reason=?,updated_at=? WHERE id=? AND status=? AND live_release_id=?",\n    action==="suspend"?"suspended":"published",reason,Math.floor(Date.now()/1000),id,p.status,p.live_release_id);')
change(a,'async function discardReadyDraft(env,u,id) {','async function discardReadyDraft(env,u,id,expectedRelease=null) {')
change(a,'discardDraft(env,u.id,id,Math.floor(Date.now()/1000))','discardDraft(env,u.id,id,Math.floor(Date.now()/1000),expectedRelease)')
change(a,'  if(!release||release.status!=="ready")return fail(409,"Only an unsubmitted private build can be discarded");','  if(expectedRelease!==null&&release?.id!==expectedRelease)return fail(409,"The private build changed. Reopen it before discarding.");\n  if(!release||release.status!=="ready")return fail(409,"Only an unsubmitted private build can be discarded");')
change(a,'  if(m[2]==="save"){','  let expectedRelease=null;\n  if(["save","submit","discard"].includes(m[2])&&req.body){\n    const body=await readBoundedJson(req,4096);\n    if(body?.expected_release_id!==undefined){\n      if(typeof body.expected_release_id!=="string"||!UUID.test(body.expected_release_id))return fail(422,"Invalid release identifier");\n      expectedRelease=body.expected_release_id;\n    }\n  }\n  if(m[2]==="save"){')
change(a,'saveDraft(env,u.id,m[1],Math.floor(Date.now()/1000))','saveDraft(env,u.id,m[1],Math.floor(Date.now()/1000),expectedRelease)')
change(a,'if(m[2]==="submit")return submit(env,u,m[1]);','if(m[2]==="submit")return submit(env,u,m[1],expectedRelease);')
change(a,'if(m[2]==="discard")return discardReadyDraft(env,u,m[1]);','if(m[2]==="discard")return discardReadyDraft(env,u,m[1],expectedRelease);')
s='site/alpha/v003/resource-service.mjs'
for name in ['saveDraft','discardDraft']:
    change(s,f'export async function {name}(env,ownerId,projectId,now){{',f'export async function {name}(env,ownerId,projectId,now,expectedRelease=null){{')
for text in ['There is no private test build to save','Only an unsubmitted private build can be discarded']:
    old=f'  if(r?.status!=="ready")throw new ResourceError("{text}",409);'
    change(s,old,'  if(expectedRelease!==null&&r?.id!==expectedRelease)throw new ResourceError("The private build changed. Reopen it before continuing.",409);\n'+old)
change('site/alpha/v003/native-ui-api-v095.mjs',"return response({contract:'native-creator-v095',project:record,preview,","return response({contract:'native-creator-v095',memberId:preview?user.id:null,project:record,preview,")
change('site/alpha/v003/unified-creation-bridge-v009.mjs','  if(request.method==="POST"){','''  // Native UI uses the same deployed namespace API, never a new route owner.
  // The explicit flag is OFF until the matching React build and backend pass.
  if(request.method==="GET"&&env.PACKAGE_NATIVE_STUDIO_ENABLED==="true"&&!route.target.startsWith("/api/")){
    let destination=null;
    if(route.target==="/upload/v3"){
      const update=url.searchParams.get("update");
      destination=update&&new RegExp("^"+UUID+"$").test(update)?"/studio/packages/"+update:"/studio/packages/new";
    }else if(route.target==="/packages")destination="/studio/packages";
    else if(route.target==="/staff/packages")destination="/studio/packages/review";
    else if(route.target.startsWith("/play/v3/"))destination="/projects/package/"+route.target.slice("/play/v3/".length)+(url.searchParams.get("preview")==="1"?"?preview=1":"");
    if(destination){const headers=responseHeaders();headers.set("location",destination);return new Response(null,{status:302,headers});}
  }
  if(request.method==="POST"){''')
c='creator-v1/web/src/lib/native-creator-v095.ts'
change(c,"contract:'native-creator-v095';project:NativeProject;preview:boolean;","contract:'native-creator-v095';memberId:string|null;project:NativeProject;preview:boolean;")
change(c,'readNativePlayback(id:string,preview:boolean,signal?:AbortSignal)','readNativePlayback(id:string,preview:boolean,signal?:AbortSignal,memberId:string|null=null)')
change(c,"const v=await request('native/projects/'+id+(preview?'?preview=1':''),{signal});contract(v);","const v=await request('native/projects/'+id+(preview?'?preview=1':''),{signal});contract(v);\n if(preview&&(!memberId||v.memberId!==memberId))throw new CreatorRequestError('The signed-in account changed. Reopen your playtest.',401);")
change(c,' return value.reviewReason==null||string(value.reviewReason,1000);',""" for(const [key,max] of [['draftTitle',100],['draftSummary',500],['reviewReason',1000]] as const)if(value[key]!=null&&!string(value[key],max))return false;
 if(value.draftStatus!=null&&!['ready','pending_review','rejected','draft','published'].includes(String(value.draftStatus)))return false;
 if(value.draftCategory!=null&&!['game','app','simulation','story'].includes(String(value.draftCategory)))return false;
 if(value.retention!=null&&!['test','saved'].includes(String(value.retention)))return false;
 return true;""")
change(c,'Promise<{id:string;release_id:string}>',"Promise<{id:string;release_id:string;status:'ready'|'published'}>")
change(c,' return {id:v.id,release_id:v.release_id};'," if(v.status!=='ready'&&v.status!=='published')throw new CreatorRequestError('Upload status is uncertain. Reload your build library.',502);\n return {id:v.id,release_id:v.release_id,status:v.status};")
change(c," await request('projects/'+id+'/'+endpoint,{body:{action,reason,expected_release_id:releaseId}});",""" const value=await request('projects/'+id+'/'+endpoint,{body:{action,reason,expected_release_id:releaseId}});
 const expected:Record<BuildAction,[string,string|boolean]>={save:['saved',true],submit:['status','pending_review'],discard:['discarded',true],delete:['deleted',true],publish:['status','published'],reject:['status','rejected'],suspend:['status','suspended'],restore:['status','published']};
 const [key,result]=expected[action];
 if(!object(value)||value[key]!==result)throw new CreatorRequestError('The action result could not be confirmed. Reload the build before retrying.',502);""")
u='creator-v1/web/src/pages/NativeCreatorStudio.tsx'
change(u,'signal=>readNativePlayback(projectId,preview,signal)','signal=>readNativePlayback(projectId,preview,signal,identity.id)')
change(u,'navigate(nativePlayerPath(result.id,true));',"navigate(nativePlayerPath(result.id,result.status!=='published'));")
a='creator-v1/web/src/App.tsx'
change(a,'const PublicBoardsPage = lazy(','''const NativeCreatorStudioPage=lazy(()=>import("./pages/NativeCreatorStudio").then(m=>({default:m.NativeCreatorStudioPage})));
const NativePackagePlayerPage=lazy(()=>import("./pages/NativeCreatorStudio").then(m=>({default:m.NativePackagePlayerPage})));
const creatorFallback=<LoadingState label="Opening Creator Studio"/>;
const PublicBoardsPage = lazy(''')
change(a,'    <Route path="studio" element={<CanonicalStudioPage/>}/>','''    <Route path="studio/packages" element={<Suspense fallback={creatorFallback}><NativeCreatorStudioPage/></Suspense>}/>
    <Route path="studio/packages/new" element={<Suspense fallback={creatorFallback}><NativeCreatorStudioPage mode="new"/></Suspense>}/>
    <Route path="studio/packages/review" element={<Suspense fallback={creatorFallback}><NativeCreatorStudioPage mode="review"/></Suspense>}/>
    <Route path="studio/packages/:projectId" element={<Suspense fallback={creatorFallback}><NativeCreatorStudioPage mode="edit"/></Suspense>}/>
    <Route path="projects/package/:projectId" element={<Suspense fallback={creatorFallback}><NativePackagePlayerPage/></Suspense>}/>
    <Route path="studio" element={<CanonicalStudioPage/>}/>''')
p='creator-v1/web/src/pages/CanonicalStudioPage.tsx'
change(p,"import './canonical-studio.css';","import './canonical-studio.css';\nimport {nativeCreatorEnabled} from '../lib/native-creator-v095';\nimport {NativeStudioNavigation} from './NativeCreatorStudio';")
change(p,'  <nav className="st-nav" aria-label="Studio navigation">','  {nativeCreatorEnabled?<NativeStudioNavigation/>:<nav className="st-nav" aria-label="Studio navigation">')
change(p,"  </nav>\n  {mode==='list'?","  </nav>}\n  {mode==='list'?")
change(p,'href="/upload">OPEN PLAYABLE UPLOAD','href={nativeCreatorEnabled?"/studio/packages/new":"/upload"}>OPEN PLAYABLE UPLOAD')
change(p,'return <main className="st-root" aria-label="Creator Studio">','return <section className="st-root" aria-label="Creator Studio">')
change(p,' </main>;',' </section>;')
p='creator-v1/web/src/components/CreatorPackageGallery.tsx'
change(p,"import './creator-package-gallery-v010.css';","import './creator-package-gallery-v010.css';\nimport {nativeCreatorEnabled,nativePlayerPath,nativeBuildPath} from '../lib/native-creator-v095';")
change(p,'href={work.playUrl}',"href={nativeCreatorEnabled?import.meta.env.BASE_URL.replace(/\\/$/,'')+nativePlayerPath(work.id):work.playUrl}")
change(p,'href={work.previewUrl}',"href={nativeCreatorEnabled?import.meta.env.BASE_URL.replace(/\\/$/,'')+nativePlayerPath(work.id,true):work.previewUrl}")
change(p,"href={'/upload/v3?update='+encodeURIComponent(work.id)}","href={nativeCreatorEnabled?import.meta.env.BASE_URL.replace(/\\/$/,'')+nativeBuildPath(work.id):'/upload/v3?update='+encodeURIComponent(work.id)}")
p='creator-v1/web/a-staging-worker.mjs'
change(p,'function protect(response,method,forceNoStore=false){','function protect(response,method,forceNoStore=false,nativePlayer=false){')
change(p,'"img-src \'self\' data: blob:; connect-src \'self\'; font-src \'self\'; "+','"img-src \'self\' data: blob:; connect-src \'self\'; font-src \'self\'; "+\n    (nativePlayer?"frame-src https://anevum-package-alpha-v003-runtime.devonakins.workers.dev; ":"")+')
change(p,'return protect(await env.ASSETS.fetch(clean),request.method);','return protect(await env.ASSETS.fetch(clean),request.method,false,env.PACKAGE_NATIVE_STUDIO_ENABLED==="true");')
p='tests/alpha-package-v003.test.mjs'
change(p,'    prepare(sql){\n      const statement=(args=[])=>({','    prepare(sql){\n      // Map D1 numbered placeholders to equivalent node:sqlite bindings.\n      const bound=args=>/[?][1-9]/.test(sql)?[Object.fromEntries(args.map((v,i)=>["?"+(i+1),v]))]:args;\n      const statement=(args=[])=>({')
for method in ['get','all','run']:
    change(p,f'sqlite.prepare(sql).{method}(...args)',f'sqlite.prepare(sql).{method}(...bound(args))')
p='tests/native-creator-v095.test.mjs'
change(p,'const statement=(args=[])=>({','const bound=args=>/[?][1-9]/.test(sql)?[Object.fromEntries(args.map((v,i)=>["?"+(i+1),v]))]:args;const statement=(args=[])=>({')
for method in ['get','all','run']:
    change(p,f'sqlite.prepare(sql).{method}(...args)',f'sqlite.prepare(sql).{method}(...bound(args))')
p='creator-v1/ops/v091-release-acceptance.mjs'
old="  for(const gate of ['founder_staff_session','reviewer_staff_session','creator_journey','cross_account_identity']){"
change(p,old,"  if(record.native_candidate_pending===true)throw Error('V095 native application candidate remains unverified; the previous V091 upload cannot be promoted for changed source.');\n"+old)
p=Path('creator-v1/test/v091-release-acceptance.test.mjs')
p.write_text(p.read_text()+"\ntest('new native application cannot reuse the previous immutable deployment candidate',()=>{\n assert.throws(()=>verifyV091Acceptance({...complete(),native_candidate_pending:true}),/candidate remains unverified/);\n});\n")
Path('.github/workflows/v095-native-creator-qa.yml').write_text(Path('creator-v1/ops/v095-native-qa-template.txt').read_text())
print('V095_EXACT_SOURCE_EDITS_APPLIED; NO DEPLOYMENT OR ACCOUNT OPERATIONS')
