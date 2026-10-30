import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFileSync,existsSync,statSync,mkdirSync} from "node:fs";
import {resolve,extname,join,sep} from "node:path";
import {chromium} from "playwright";

const root=resolve("creator-v1/dist/web");
const dir=resolve("evidence/studio-v143");
mkdirSync(dir,{recursive:true});
const mime={".html":"text/html; charset=utf-8",".css":"text/css",".js":"text/javascript",".svg":"image/svg+xml",".png":"image/png",".webp":"image/webp",".jpg":"image/jpeg",".json":"application/json",".mp4":"video/mp4"};
const failures=[];
const server=createServer((req,res)=>{
 if(!["GET","HEAD"].includes(req.method||"")){res.writeHead(405);return res.end()}
 const url=new URL(req.url||"/","http://127.0.0.1");
 if(url.pathname.startsWith("/api/")){const body=url.pathname.includes("/status")?{version:"synthetic",counts:{publishedProjects:0,publishedCreators:0},features:{}}:url.pathname.includes("/projects")||url.pathname.includes("/creators")?{items:[],nextCursor:null,count:0}:null;res.writeHead(200,{"content-type":"application/json"});return res.end(JSON.stringify(body))}
 let file=resolve(root,"."+decodeURIComponent(url.pathname));
 if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403);return res.end()}
 if(!existsSync(file)||!statSync(file).isFile()){
  if(extname(file)){res.writeHead(404);return res.end()}
  file=join(root,"index.html");
 }
 res.writeHead(200,{"content-type":mime[extname(file)]||"application/octet-stream","cache-control":"no-store"});
 res.end(req.method==="HEAD"?undefined:readFileSync(file));
});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const origin="http://127.0.0.1:"+server.address().port;
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
try{
 for(const width of [1440,390,320]){
  const context=await browser.newContext({viewport:{width,height:width===1440?900:800},reducedMotion:"reduce"});
  await context.route("**/*",async route=>{
   const request=route.request(),url=new URL(request.url());
   if(url.origin!==origin||!["GET","HEAD"].includes(request.method())){failures.push("Outbound request: "+request.url());return route.abort()}
   return route.continue();
  });
  const page=await context.newPage();
  page.on("pageerror",err=>failures.push(width+" "+String(err)));
  for(const [route,selector] of [["/","[data-studio-identity]"],["/worlds",'[data-studio-page="worlds"]'],["/games",'[data-studio-page="games"]'],["/journal",'[data-studio-page="journal"]'],["/about",'[data-studio-page="about"]']]){
   await page.goto(origin+route,{waitUntil:"domcontentloaded"});
   await page.locator(selector).waitFor({timeout:12000});
   const dimensions=await page.evaluate(()=>({document:document.documentElement.scrollWidth,viewport:innerWidth}));
   assert.ok(dimensions.document<=dimensions.viewport+2,`Horizontal overflow: ${route} ${width} ${JSON.stringify(dimensions)}`);
   await page.screenshot({path:join(dir,(route==="/":"home":route.slice(1))+"-"+width+".png"),fullPage:true,animations:"disabled"});
  }
  await page.goto(origin+"/");
  assert.equal(await page.getByRole("link",{name:/ENTER TRANSCOSMIC/}).getAttribute("href"),"/worlds");
  await page.getByRole("link",{name:/ENTER TRANSCOSMIC/}).click();
  await page.waitForURL(origin+"/worlds");
  assert.ok((await page.locator("main").innerText()).includes("TRANSCOSMIC"));
  await page.goto(origin+"/studio");
  assert.equal(await page.locator("main").count(),1,"Protected Studio route remains mounted");
  await context.close();
 }
 assert.deepEqual(failures,[]);
 console.log("ANEVUM V143 browser QA PASS: 1440/390/320, five studio pages, no page exceptions or external requests.");
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
