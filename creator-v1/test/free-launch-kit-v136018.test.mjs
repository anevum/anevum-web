import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildProjectLaunchKit} from "../web/src/lib/launch-kit-v136018.ts";

const source=path=>readFileSync(new URL(path,import.meta.url),"utf8");
const project={id:"a1b2c3d4e5f60718293a4b5c6d7e8f90",title:"The Continuance Lab"};

test("approved projects have a stable free link and scriptless HTML embed",()=>{
  const kit=buildProjectLaunchKit(project,"https://anevum.com");
  assert.equal(kit.url,"https://anevum.com/projects/"+project.id);
  assert.equal(kit.shareText,"Explore The Continuance Lab on ANEVUM: "+kit.url);
  assert.equal(kit.embedHtml,
    '<a href="'+kit.url+'" rel="noopener noreferrer">Explore The Continuance Lab on ANEVUM</a>');
  assert.equal(Object.isFrozen(kit),true);
  assert.ok(!/script|iframe|img|pixel|tracking|paid/i.test(kit.embedHtml));
});

test("preview links retain the real /creator/ route base, never rewrite to production",()=>{
  const kit=buildProjectLaunchKit(project,"https://preview.example.org","/creator/");
  assert.equal(kit.url,"https://preview.example.org/creator/projects/"+project.id);
  assert.equal(buildProjectLaunchKit(project,"http://127.0.0.1:4178","/creator/").url,
    "http://127.0.0.1:4178/creator/projects/"+project.id);
  for(const prefix of ["//evil.example/","/creator/../","/creator?mode=a/","creator/"]){
    assert.throws(()=>buildProjectLaunchKit(project,"https://anevum.com",prefix));
  }
});

test("title is safely escaped in creator-copyable HTML and never executable",()=>{
  const kit=buildProjectLaunchKit({id:"project-1",title:'  A <script>alert("hi")</script> & more  '},
    "https://anevum.com");
  assert.ok(!kit.embedHtml.includes("<script>"));
  assert.ok(kit.embedHtml.includes("&lt;script&gt;"));
  assert.ok(kit.embedHtml.includes("&quot;hi&quot;"));
  assert.ok(kit.embedHtml.includes("&amp; more"));
  assert.match(kit.embedHtml,/Explore A &lt;script&gt;/);
});

test("rejects invalid project IDs, names and origins",()=>{
  for(const id of ["", "../other", "a/b","../", "%2F", "<script>", "x".repeat(129)]){
    assert.throws(()=>buildProjectLaunchKit({...project,id},"https://anevum.com"));
  }
  for(const title of [""," \n","x".repeat(181)]){
    assert.throws(()=>buildProjectLaunchKit({...project,title},"https://anevum.com"));
  }
  for(const origin of [
    "javascript:alert(1)","http://example.com","https://evil.com/alternate/",
    "https://user:pass@example.com","https://example.com/?token=123",
    "https://example.com/#secret","ftp://example.com"
  ])assert.throws(()=>buildProjectLaunchKit(project,origin));
});

test("a project companion reuses existing verified data and layout without new endpoints",()=>{
  const page=source("../web/src/pages/ProjectPage.tsx");
  const panel=source("../web/src/components/ProjectLaunchKit.tsx");
  const css=source("../web/src/components/project-launch-kit-v136018.css");
  assert.ok(page.indexOf('if(project.state==="error")')<page.indexOf('<ProjectLaunchKit key={p.id} project={p}/>'));
  assert.match(page,/<ProjectLaunchKit key=\{p\.id\} project=\{p\}\/>/);
  assert.match(panel,/import\.meta\.env\.BASE_URL/);
  assert.match(panel,/navigator\.share/);
  assert.match(panel,/Copy announcement/);
  assert.match(panel,/kit\.shareText/);
  assert.match(panel,/navigator\.clipboard\?\.writeText/);
  assert.match(panel,/ref=\{linkRef\}/);
  assert.match(panel,/ref=\{announcementDetailsRef\}/);
  assert.match(panel,/ref=\{announcementRef\}/);
  assert.match(panel,/value=\{kit\.shareText\}/);
  assert.match(panel,/ref=\{embedDetailsRef\}/);
  assert.match(panel,/ref=\{embedRef\}/);
  assert.match(panel,/\.current\.open=true/);
  assert.match(panel,/field\?\.select\(\)/);
  assert.match(panel,/available for manual copying/);
  assert.match(panel,/readOnly value=\{kit\.embedHtml\}/);
  assert.match(panel,/role="status"/);
  assert.ok(!/fetch\(|XMLHttpRequest|WebSocket|localStorage|sessionStorage|sendBeacon|iframe|publish\(/.test(panel));
  assert.match(css,/\.avp-launch-kit/);
  assert.ok(!/body\s*\{|html\s*\{|@import|@font-face|url\(\s*https?:/.test(css));
});
