#!/usr/bin/env python3
"""One-use exact-parent source assembly. Upload Git blobs only; never refs or releases."""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import urllib.request

REPO = "anevum/anevum-web"
BRANCH = "refs/heads/build/anevum-v5-free-rhen-learning-20261011"
BASE = "5c53fa530a495f022094fe3cc4903b43a8fc138c"
assert os.environ.get("GITHUB_REPOSITORY") == REPO
assert os.environ.get("GITHUB_REF") == BRANCH
assert subprocess.check_output(["git", "rev-parse", "HEAD^"], text=True).strip() == BASE

paths = ["src/App.tsx", "src/commons/CommonsPages.tsx", "src/commons/CommonsV5.tsx", "worker.mjs", "src/data/public-routes.json", "scripts/visual-ops-browser-qa.mjs", "package.json"]
source = {p: subprocess.check_output(["git", "show", BASE + ":" + p]).decode("utf-8") for p in paths}
for p, s in source.items():
    assert Path(p).read_text(encoding="utf-8") == s, "Unexpected changed parent: " + p
changes = {}
def swap(s, old, new, label):
    assert s.count(old) == 1, "Replacement context changed: " + label
    return s.replace(old, new, 1)

p = "src/App.tsx"
s = source[p]
s = swap(s, 'import { fieldNotes } from "./data/fieldNotes";', 'import { fieldNotes } from "./data/fieldNotes";\nimport { rhenLessonBySlug } from "./data/rhen-learning";', p + " import")
s = swap(s, '  "/products/rhen": "RHEN \u2014 ANEVUM",', '  "/products/rhen": "RHEN \u2014 ANEVUM",\n  "/products/rhen/learn": "Free RHEN lessons \u2014 ANEVUM",', p + " title")
needle = '  "/products/rhen": "RHEN is ANEVUM\'s research application under V5 reconstruction. Legacy live trading is suspended; member brokerage and execution are not available.",'
s = swap(s, needle, needle + '\n  "/products/rhen/learn": "Two free lessons covering market orders, trading costs, risk mathematics and research evidence. No account or broker required.",', p + " description")
s = swap(s, '  "/products/rhen", "/products/rhen/evidence", "/products/rhen/architecture",', '  "/products/rhen", "/products/rhen/learn", "/products/rhen/evidence", "/products/rhen/architecture",', p + " index")
s = swap(s, '  if (pathname.startsWith("/field-notes/")) {', '  if (pathname.startsWith("/products/rhen/learn/")) {\n    const slug = pathname.slice("/products/rhen/learn/".length);\n    return Boolean(rhenLessonBySlug(slug));\n  }\n  if (pathname.startsWith("/field-notes/")) {', p + " lookup")
s = swap(s, '    } else if (path.startsWith("/products/rhen/releases/")) {', '    } else if (path.startsWith("/products/rhen/learn/")) {\n      const slug = path.slice("/products/rhen/learn/".length);\n      const lesson = rhenLessonBySlug(slug);\n      title = lesson ? lesson.title + " \u2014 Free RHEN Learning \u2014 ANEVUM" : "Lesson not found \u2014 ANEVUM";\n      description = lesson?.summary || descriptions["/products/rhen/learn"];\n    } else if (path.startsWith("/products/rhen/releases/")) {', p + " dynamic metadata")
needle = '        <Route path="/products/rhen" element={<Suspense fallback={<Loader />}><CommonsV5 /></Suspense>} />'
s = swap(s, needle, needle + '\n        <Route path="/products/rhen/learn" element={<Suspense fallback={<Loader />}><CommonsV5 /></Suspense>} />\n        <Route path="/products/rhen/learn/:slug" element={<Suspense fallback={<Loader />}><CommonsV5 /></Suspense>} />', p + " routes")
changes[p] = s

p = "src/commons/CommonsPages.tsx"
s = source[p]
s = swap(s, 'import StudioPublications from "./StudioPublications";', 'import StudioPublications from "./StudioPublications";\nimport RhenLearning, {RhenLessonCards} from "./RhenLearning";', p + " import")
needle = '        ["Research & Field Notes", "Published investigations and methodology, with failure and uncertainty recorded rather than hidden.", "/field-notes"],'
s = swap(s, needle, needle + '\n        ["Free RHEN lessons", "Read market order mechanics and risk/evidence mathematics. No account or broker required.", "/products/rhen/learn"],', p + " product link")
needle = '    <Intro kicker="COMMONS / LEARNING" title="Learn by examining real work">A reading path through methods and software experiments\u2014not a claim that a course, trading result or personalized instruction is ready.</Intro>'
s = swap(s, needle, '    <Intro kicker="COMMONS / LEARNING" title="Learn by examining real work">Start with two complete, free RHEN lessons on market orders and evidence-based trading research. No payment, registration or brokerage connection is needed. The rest of this page links to actual published work.</Intro>\n    <section className="c2-section" aria-labelledby="rh-public-lessons-title">\n      <h2 id="rh-public-lessons-title">Free RHEN learning path</h2>\n      <p>Read both lessons, work the synthetic examples and check your understanding. These pages are education, not financial recommendations or live strategy reports.</p>\n      <RhenLessonCards/>\n      <div className="c2-action-row"><Link to="/products/rhen/learn">Browse the full learning path \u2192</Link></div>\n    </section>', p + " learning landing")
s = swap(s, '  if (pathname === "/products/rhen") return <RhenOverview/>;', '  if (pathname === "/products/rhen") return <RhenOverview/>;\n  if (pathname === "/products/rhen/learn") return <RhenLearning/>;\n  if (pathname.startsWith("/products/rhen/learn/")) return <RhenLearning slug={pathname.slice("/products/rhen/learn/".length)}/>;', p + " dispatch")
changes[p] = s

p = "src/commons/CommonsV5.tsx"
s = swap(source[p], 'import studioCss from "../styles/commons-v5-studio.css?inline";', 'import studioCss from "../styles/commons-v5-studio.css?inline";\nimport rhenLearningCss from "../styles/commons-v5-rhen-learning.css?inline";', p + " style import")
s = swap(s, '+"\\n"+liveCss+"\\n"+studioCss}</style>', '+"\\n"+liveCss+"\\n"+studioCss+"\\n"+rhenLearningCss}</style>', p + " style scope")
changes[p] = s

p = "worker.mjs"
s = swap(source[p], 'import { fieldNotes } from "./src/data/fieldNotes";', 'import { fieldNotes } from "./src/data/fieldNotes";\nimport { rhenLessonBySlug } from "./src/data/rhen-learning";', p + " import")
s = swap(s, '    "/products/rhen/evidence": {', '    "/products/rhen/learn": {\n      title: "Free RHEN lessons \u2014 ANEVUM",\n      description: "Two free lessons covering market orders, trading costs, risk mathematics and research evidence. No account or broker required."\n    },\n    "/products/rhen/evidence": {', p + " index metadata")
s = swap(s, '  if (pathname.startsWith("/field-notes/")) {', '  if (pathname.startsWith("/products/rhen/learn/")) {\n    const slug = pathname.slice("/products/rhen/learn/".length);\n    const lesson = rhenLessonBySlug(slug);\n    if (lesson) return {\n      title: lesson.title + " \u2014 Free RHEN Learning \u2014 ANEVUM",\n      description: lesson.summary,\n      url: "https://anevum.com/products/rhen/learn/" + lesson.slug\n    };\n  }\n  if (pathname.startsWith("/field-notes/")) {', p + " lesson metadata")
changes[p] = s

p = "src/data/public-routes.json"
rows = json.loads(source[p])
index = next(i for i, r in enumerate(rows) if r["path"] == "/products/rhen")
extras = [{"path": path, "label": label, "nav": False, "sitemap": True} for path, label in [("/products/rhen/learn", "RHEN Learning"), ("/products/rhen/learn/market-orders-and-quotes", "Market Orders and Quotes"), ("/products/rhen/learn/risk-math-and-strategy-evidence", "Risk Math and Strategy Evidence")]]
assert not any(a["path"] == b["path"] for a in extras for b in rows)
rows[index+1:index+1] = extras
changes[p] = json.dumps(rows, indent=2) + "\n"

p = "scripts/visual-ops-browser-qa.mjs"
s = 'import {verifyRhenLearningPage} from "./v5-rhen-learning-browser.mjs";\n' + source[p]
route_line = [line for line in s.splitlines() if line.startswith("const publicRoutes = ")]
assert len(route_line) == 1
new_line = swap(route_line[0], '"/learn", "/sign-in",', '"/learn", "/products/rhen/learn", "/products/rhen/learn/market-orders-and-quotes", "/products/rhen/learn/risk-math-and-strategy-evidence", "/products/rhen/learn/not-a-real-lesson", "/sign-in",', p + " browser routes")
s = swap(s, route_line[0], new_line, p + " public route line")
needle = '  if (!routeReady.ready) throw new Error("Route did not hydrate before visual assertion: "+JSON.stringify({route,...routeReady}));'
s = swap(s, needle, needle + '\n  await verifyRhenLearningPage(send, route); // data-rhen-learning public and keyboard checks', p + " browser assertion")
needle = '    "/learn":["learn",["Learn by examining real work","A practical research loop"]],'
replacement = '''    "/learn":["learn",["Learn by examining real work","A practical research loop","Free RHEN learning path"]],
    "/products/rhen/learn":["rhen-lessons",["rh-learn","Understand the market. Test the evidence.","No registration"]],
    "/products/rhen/learn/market-orders-and-quotes":["rhen-lesson-orders",["rh-lesson","How orders meet a market","Check your understanding"]],
    "/products/rhen/learn/risk-math-and-strategy-evidence":["rhen-lesson-evidence",["rh-lesson","Risk math and strategy evidence","Check your understanding"]],'''
s = swap(s, needle, replacement, p + " evidence captures")
changes[p] = s

p = "package.json"
pkg = json.loads(source[p])
pkg["scripts"]["test:foundation"] = swap(pkg["scripts"]["test:foundation"], "tests/v5-studio-operations.test.mjs", "tests/v5-studio-operations.test.mjs tests/v5-rhen-free-lessons.test.mjs", p + " tests")
changes[p] = json.dumps(pkg, indent=2) + "\n"

p = "src/commons/RhenLearning.tsx"
s = Path(p).read_text(encoding="utf-8")
s = swap(s, 'data-rhen-learning="missing">', 'data-rhen-learning="missing" data-page-state="not-found">', p + " missing state")
s = swap(s, 'return <LessonDetail lesson={lesson}/>;', 'return <LessonDetail key={lesson.slug} lesson={lesson}/>;', p + " state reset")
changes[p] = s

p = "src/data/rhen-learning.ts"
s = Path(p).read_text(encoding="utf-8")
s = swap(s, '$0.60 of slippage and $0.25 of other fees', '$0.60 of additional slippage beyond the spread and $0.25 of other fees', p + " cost convention")
needle = '      {name:"SEC Investor.gov \u2014 Types of Orders",'
s = swap(s, needle, '      {name:"SEC Investor.gov \u2014 Extended-Hours Trading",url:"https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins-42",context:"Lower liquidity, wider spreads, eligible order instructions and session-specific risks."},\n' + needle, p + " liquidity reference")
needle = '      {name:"FINRA Rule 2270 \u2014 Day-Trading Risk Disclosure Statement",'
s = swap(s, needle, '      {name:"scikit-learn \u2014 Cross-validation and time-series evaluation",url:"https://scikit-learn.org/stable/modules/cross_validation.html",context:"Separating development, model selection and held-out temporal evaluation; avoiding repeated test-set selection."},\n' + needle, p + " holdout reference")
changes[p] = s

p = "tests/v5-rhen-free-lessons.test.mjs"
s = Path(p).read_text(encoding="utf-8")
s = swap(s, '["www.investor.gov","www.finra.org"].includes', '["www.investor.gov","www.finra.org","scikit-learn.org"].includes', p + " sources")
changes[p] = s

for p, s in changes.items():
    Path(p).write_text(s, encoding="utf-8")
subprocess.run(["node", "--experimental-strip-types", "--test", "tests/v5-rhen-free-lessons.test.mjs"], check=True)
subprocess.run(["node", "--check", "scripts/v5-rhen-learning-browser.mjs"], check=True)
subprocess.run(["node", "--check", "scripts/visual-ops-browser-qa.mjs"], check=True)
subprocess.run(["git", "diff", "--check"], check=True)

# Each call adds one immutable public-source blob. No ref, workflow, release or provider action.
url = "https://api.github.com/repos/" + REPO + "/git/blobs"
manifest = []
for p, s in changes.items():
    payload = json.dumps({"content": s, "encoding": "utf-8"}).encode("utf-8")
    request = urllib.request.Request(url, data=payload, method="POST", headers={"Authorization": "Bearer " + os.environ["GH_TOKEN"], "Accept": "application/vnd.github+json", "Content-Type": "application/json", "X-GitHub-Api-Version": "2022-11-28"})
    with urllib.request.urlopen(request, timeout=30) as response:
        sha = json.load(response)["sha"]
    content = s.encode("utf-8")
    expected = hashlib.sha1(b"blob " + str(len(content)).encode("ascii") + b"\0" + content).hexdigest()
    assert sha == expected, "Git blob mismatch: " + p
    manifest.append({"path": p, "sha": sha, "bytes": len(content)})
print("ANEVUM_LEARNING_BLOBS=" + json.dumps(manifest, separators=(",", ":")))
Path("learning-integration-blobs.json").write_text(json.dumps({"base": BASE, "files": manifest, "dedicatedTests": "passed"}, indent=2) + "\n", encoding="utf-8")
