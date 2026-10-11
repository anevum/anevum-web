import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {rhenLessons,rhenLessonBySlug} from "../src/data/rhen-learning.ts";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const app=read("src/App.tsx"),worker=read("worker.mjs");
const pages=read("src/commons/CommonsPages.tsx"),shell=read("src/commons/CommonsV5.tsx");
const page=read("src/commons/RhenLearning.tsx"),css=read("src/styles/commons-v5-rhen-learning.css");
const routes=JSON.parse(read("src/data/public-routes.json"));
const qa=read("scripts/visual-ops-browser-qa.mjs"),pkg=JSON.parse(read("package.json"));

test("two complete, distinct, reviewed lessons are available for free",()=>{
 assert.equal(rhenLessons.length,2);
 assert.deepEqual(rhenLessons.map(l=>l.slug),["market-orders-and-quotes","risk-math-and-strategy-evidence"]);
 for(const lesson of rhenLessons){
   assert.strictEqual(rhenLessonBySlug(lesson.slug),lesson);
   assert.match(lesson.version,/^\d+\.\d+\.\d+$/);
   assert.equal(lesson.reviewedOn,"2026-10-11");
   assert.ok(lesson.estimatedMinutes>=5&&lesson.estimatedMinutes<=20);
   assert.ok(lesson.sections.length>=4);
   assert.ok(lesson.outcomes.length>=3);
   assert.ok(lesson.glossary.length>=5);
   assert.ok(lesson.check.length>=3);
   assert.ok(lesson.sources.length>=2);
   const words=lesson.sections.flatMap(s=>s.paragraphs).join(" ").split(/\s+/).length;
   assert.ok(words>=425,lesson.slug+" is not sufficiently developed ("+words+" words)");
   for(const section of lesson.sections){
     assert.ok(section.heading.length>12);
     assert.ok(section.paragraphs.length>=1);
     assert.ok(section.paragraphs.every(p=>p.length>=65));
     if(section.example)assert.ok(section.example.steps.length>=3&&section.example.conclusion.length>=80);
   }
   for(const item of lesson.check){
     assert.ok(item.question.endsWith("?"));
     assert.ok(item.explanation.length>=65);
   }
   const urls=new Set();
   for(const source of lesson.sources){
     const url=new URL(source.url);
     assert.equal(url.protocol,"https:");
     assert.ok(["www.investor.gov","www.finra.org"].includes(url.hostname));
     assert.ok(!urls.has(url.href));urls.add(url.href);
     assert.ok(source.context.length>30);
   }
 }
 assert.equal(rhenLessonBySlug("nonexistent"),undefined);
 assert.equal(rhenLessonBySlug("../private"),undefined);
});

test("lesson 1 explains quote costs, non-guaranteed fills, and separate paper/live authority",()=>{
 const first=JSON.stringify(rhenLessons[0]);
 for(const word of ["spread","limit order","market order","stop","partial fills","$1,001.00","$999.00","−$2.00","Live execution","historical","paper"]){
   assert.ok(first.toLowerCase().includes(word.toLowerCase()),"Lesson 1 omits "+word);
 }
 assert.ok(Math.abs((50.05-49.95)*20-2)<1e-10);
});

test("lesson 2 uses self-consistent expected-value and net-cost examples",()=>{
 const second=JSON.stringify(rhenLessons[1]);
 assert.ok(second.includes("−$0.13"));
 assert.ok(second.includes("−$0.05"));
 assert.ok(second.includes("held-out")||second.includes("holdout"));
 assert.ok(second.includes("Look-ahead"));
 assert.ok(second.includes("paper"));
 assert.ok(second.includes("falsifiable")||second.includes("could be wrong"));
 assert.ok(Math.abs(0.55*0.80-0.45*1-0.12+0.13)<1e-10);
 assert.ok(Math.abs(1000*0.0012-0.40-0.60-0.25+0.05)<1e-10);
});

test("all learning pages route within existing public Commons, not a new service",()=>{
 for(const path of ["/products/rhen/learn","/products/rhen/learn/:slug"]){
   assert.ok(app.includes('<Route path="'+path+'" element={<Suspense fallback={<Loader />}><CommonsV5 /></Suspense>} />'));
   assert.ok(routes.some(r=>r.path===path||path==="/products/rhen/learn/:slug"&&r.path.startsWith("/products/rhen/learn/")));
 }
 for(const lesson of rhenLessons)assert.ok(routes.some(r=>r.path==="/products/rhen/learn/"+lesson.slug&&r.sitemap===true));
 assert.match(app,/rhenLessonBySlug\(slug\)/);
 assert.match(worker,/rhenLessonBySlug\(slug\)/);
 assert.match(worker,/"\/products\/rhen\/learn": \{/);
 assert.match(pages,/if \(pathname === "\/products\/rhen\/learn"\) return <RhenLearning\/>/);
 assert.match(pages,/if \(pathname\.startsWith\("\/products\/rhen\/learn\/"\)\)/);
 assert.match(pages,/<RhenLessonCards\/>/);
 assert.match(pages,/to="\/products\/rhen\/learn"/);
 assert.match(shell,/commons-v5-rhen-learning\.css\?inline/);
 assert.match(shell,/rhenLearningCss/);
 assert.match(pkg.scripts["test:foundation"],/tests\/v5-rhen-free-lessons\.test\.mjs/);
});

test("lesson UX includes sources, keyboard-native self checks, mobile and reduced-motion rules",()=>{
 assert.match(page,/data-rhen-learning="lesson"/);
 assert.match(page,/data-rhen-learning="index"/);
 assert.match(page,/<details key=\{item\.question\}>/);
 assert.match(page,/<summary>/);
 assert.match(page,/aria-label="Breadcrumb"/);
 assert.match(page,/dateTime=\{lesson\.reviewedOn\}/);
 assert.match(page,/noopener noreferrer/);
 assert.match(page,/RhenLessonCards/);
 assert.match(page,/data-rhen-learning="missing"/);
 assert.doesNotMatch(page,/useEffect|useState|localStorage|sessionStorage|brokerToken|\/api\/|fetch\(|order_submit/i);
 assert.match(css,/@media\(max-width:720px\)/);
 assert.match(css,/@media\(max-width:380px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css, /summary:focus-visible/);
 assert.match(qa,/data-rhen-learning/);
 for(const lesson of rhenLessons)assert.ok(qa.includes("/products/rhen/learn/"+lesson.slug),lesson.slug+" missing from browser QA");
});

test("no fake performance figures or financial operating authority are introduced",()=>{
 assert.doesNotMatch(page,/Math\.random|simulatedResults|broker_account|trade_execute|order_submit|setInterval/);
 const all=JSON.stringify(rhenLessons);
 assert.ok(all.includes("synthetic")||all.includes("hypothetical"));
 assert.ok(all.includes("does not activate orders")||page.includes("No account or money is needed"));
 assert.ok(all.includes("FINRA"));
 assert.ok(all.includes("Investor.gov"));
});
