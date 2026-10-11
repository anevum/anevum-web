"""Temporary exact-parent source assembly. No ref update, deploy or provider secret."""
import base64
import hashlib
import json
import os
from pathlib import Path
import subprocess
import urllib.request

ROOT = Path.cwd()
PARENT = 'e5fa31b9fc766487f7b2ef913602380de3235f24'
assert subprocess.check_output(['git','rev-parse','HEAD^'],text=True).strip() == PARENT
changed = {}

def replace(path, old, new, count=1):
    source = changed.get(path, (ROOT/path).read_text())
    assert source.count(old) == count, (path, source.count(old), old[:100])
    changed[path] = source.replace(old,new)

replace('src/server/member.mjs', 'import { betterAuth } from "better-auth";',
 'import { betterAuth } from "better-auth";\nimport { learningProgressEndpoint, exportLearningProgress, deleteLearningProgress } from "./member-learning-progress.mjs";')
replace('src/server/member.mjs', '          ]);\n        }\n      }\n    },\n    session:',
 '          ]);\n          await deleteLearningProgress(env.MEMBER_DB, user.id);\n        }\n      }\n    },\n    session:')
replace('src/server/member.mjs', '  if (pathname.startsWith("/api/member/studio/")) {',
 '  if (pathname === "/api/member/learning/progress" || pathname.startsWith("/api/member/learning/progress/")) {\n    return learningProgressEndpoint(request, env, user, verifiedOrigin, pathname);\n  }\n  if (pathname.startsWith("/api/member/studio/")) {')
replace('src/server/member.mjs', '      commonsContributions: socialContributions',
 '      commonsContributions: socialContributions,\n      learningProgress: await exportLearningProgress(db, user.id)')
replace('src/App.tsx', 'const MemberBeta = lazy(() => import("./pages/MemberBeta"));',
 'const MemberBeta = lazy(() => import("./pages/MemberBeta"));\nconst MemberLearning = lazy(() => import("./pages/MemberLearning"));')
replace('src/App.tsx', '  "/me/beta": "Member beta checklist',
 '  "/me/learning": "My learning - ANEVUM",\n  "/me/beta": "Member beta checklist')
replace('src/App.tsx', '  "/me/beta": "Private member tools and test availability.",',
 '  "/me/learning": "Your optional private lesson progress.",\n  "/me/beta": "Private member tools and test availability.",')
replace('src/App.tsx', '        <Route path="/me/beta" element={<Suspense fallback={<Loader />}><CommonsV5 content={<MemberBeta />} /></Suspense>} />',
 '        <Route path="/me/beta" element={<Suspense fallback={<Loader />}><CommonsV5 content={<MemberBeta />} /></Suspense>} />\n        <Route path="/me/learning" element={<Suspense fallback={<Loader />}><CommonsV5 content={<MemberLearning />} /></Suspense>} />')
replace('src/commons/site-navigation.ts',
 '  {path:"/me/beta",label:"Member checklist",icon:"check",description:"Available account tests"}',
 '  {path:"/me/beta",label:"Member checklist",icon:"check",description:"Available account tests"},\n  {path:"/me/learning",label:"My learning",icon:"book",description:"Optional private lesson progress"}')
replace('src/commons/RhenLearning.tsx', '<Link to="/field-notes">Read published research records</Link>',
 '<Link to="/field-notes">Read published research records</Link><Link to="/me/learning">Optional saved progress</Link>')
replace('package.json', 'tests/v5-rhen-free-lessons.test.mjs ',
 'tests/v5-rhen-free-lessons.test.mjs tests/v5-learning-progress.test.mjs tests/v5-learning-progress-client.test.mjs tests/v5-learning-progress-wiring.test.mjs ')
replace('tests/v5-learning-progress.test.mjs', 'import.metaurl', 'import.meta.url')
replace('scripts/visual-ops-browser-qa.mjs', '"/products/rhen/learn/not-a-real-lesson", "/sign-in", "/command", "/me/settings", "/me/rewards", "/me/beta", "/apps/rhen/connect"',
 '"/products/rhen/learn/not-a-real-lesson", "/sign-in", "/command", "/me/settings", "/me/rewards", "/me/beta", "/me/learning", "/apps/rhen/connect"')
replace('scripts/visual-ops-browser-qa.mjs', '  await verifyRhenLearningPage(send, route); // data-rhen-learning public and keyboard checks',
 '''  await verifyRhenLearningPage(send, route); // data-rhen-learning public and keyboard checks
  if (route === "/me/learning") {
    let result;
    for(let i=0;i<80;i++) {
      result=await send("Runtime.evaluate",{expression:`(() => {
        const root=document.querySelector('.anevum-commons-v5-mount')?.shadowRoot;
        const page=root?.querySelector('[data-member-learning="true"]');
        return {ready:page?.textContent.includes('No sign-in is needed to read.'),
          title:page?.querySelector('h1')?.textContent,
          buttons:page?.querySelectorAll('button').length,
          lessons:page?.querySelectorAll('.ml-lesson').length,
          robots:document.querySelector('meta[name="robots"]')?.content,
          canonical:!!document.querySelector('link[rel="canonical"]')};
      })()`,returnByValue:true});
      if(result.result?.value?.ready)break;
      await sleep(125);
    }
    const state=result.result?.value;
    if(!state?.ready || state.title!=="My learning" || state.buttons!==0 || state.lessons!==2 ||
       !state.robots?.startsWith("noindex") || state.canonical)
      throw Error("Anonymous private learning route failed: "+JSON.stringify(state));
  }''')

for path,content in changed.items():
    (ROOT/path).write_text(content)
paths = list(changed) + [
 'src/data/rhen-lesson-registry.mjs','migrations-learning/0009_member_learning_progress.sql',
 'src/server/member-learning-progress.mjs','src/member/learning-progress.ts',
 'src/pages/MemberLearning.tsx','src/styles/member-learning.css',
 'tests/v5-learning-progress-client.test.mjs','tests/v5-learning-progress-wiring.test.mjs',
 'docs/ANEVUM.WEB.BUILD.2026-10-11.019.PRIVATE-LEARNING-PROGRESS.md'
]
subprocess.run(['node','--experimental-strip-types','--test',*map(str, sorted(Path('tests').glob('v5-learning-progress*.test.mjs')))],check=True)
subprocess.run(['node','--check','src/server/member.mjs'],check=True)
subprocess.run(['git','diff','--check'],check=True)
results=[]
for path in paths:
    raw=(ROOT/path).read_bytes()
    expected=hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\x00'+raw).hexdigest()
    req=urllib.request.Request('https://api.github.com/repos/anevum/anevum-web/git/blobs',
      data=json.dumps({'content':base64.b64encode(raw).decode(),'encoding':'base64'}).encode(),
      headers={'Authorization':'Bearer '+os.environ['GH_TOKEN'],'Accept':'application/vnd.github+json','Content-Type':'application/json'},method='POST')
    with urllib.request.urlopen(req,timeout=20) as response: value=json.load(response)
    assert value['sha']==expected
    results.append({'path':path,'sha':expected,'bytes':len(raw)})
print('R3_REVIEWED_BLOBS='+json.dumps(results),flush=True)
Path('r3-reviewed-blobs.json').write_text(json.dumps(results,indent=2))
