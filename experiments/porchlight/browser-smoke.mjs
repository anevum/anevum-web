import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import {join} from "node:path";
import {chromium} from "playwright";
const directory=fileURLToPath(new URL("./",import.meta.url));
const paths=new Map([["/","index.html"],["/index.html","index.html"],["/styles.css","styles.css"],["/app.js","app.js"],["/model.mjs","model.mjs"]]);
const mime={".html":"text/html", ".css":"text/css", ".js":"text/javascript", ".mjs":"text/javascript"};
const server=createServer(async(req,res)=>{
  const path=paths.get(new URL(req.url,"http://localhost").pathname);
  if(!path){res.writeHead(404);res.end("Not found");return;}
  try{
    const content=await readFile(join(directory,path));
    const ext=path.slice(path.lastIndexOf("."));
    res.writeHead(200,{"Content-Type":mime[ext]+"; charset=utf-8","Cache-Control":"no-store"});
    res.end(content);
  }catch(e){res.writeHead(500);res.end("Read error");}
});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const port=server.address().port, errors=[];
let browser;
try{
  browser=await chromium.launch({headless:true});
  for(const w of [320,390,768,1440]){
    const page=await browser.newPage({viewport:{width:w,height:830},deviceScaleFactor:1});
    page.on("pageerror",e=>errors.push(w+" "+e.message));
    await page.clock.install({time:new Date("2026-10-24T20:00:00Z")});
    await page.goto("http://127.0.0.1:"+port+"/",{waitUntil:"load"});
    await page.getByText("Your block.").waitFor({state:"visible"});
    await page.locator("#activeCount").waitFor();
    assert.equal((await page.locator("#activeCount").innerText()).trim(),"4","initial approved synthetic host count "+w);
    assert.equal(await page.locator(".house-row").count(),4,"initial public demo directory "+w);
    const dims=await page.evaluate(()=>({
      overflow:document.documentElement.scrollWidth-window.innerWidth,
      drawing:document.getElementById("scene").width>100 &&
        document.getElementById("scene").height>100
    }));
    assert.ok(dims.overflow<=2,"unexpected overflow at "+w+": "+dims.overflow);
    assert.ok(dims.drawing,"canvas did not size at "+w);
    if(w===390){
      await page.getByRole("button",{name:"Treats",exact:true}).click();
      assert.equal(await page.locator(".house-row").count(),2,"Treats filter");
      await page.getByRole("button",{name:"All",exact:true}).click();
      await page.getByRole("button",{name:"Stage a mock host request"}).click();
      assert.equal(await page.locator(".house-row").count(),4,"pending should not be public");
      await page.getByRole("button",{name:"Simulate organizer approval"}).click();
      assert.equal(await page.locator(".house-row").count(),5,"approved should be public");
      await page.getByRole("button",{name:"Withdraw mock consent"}).click();
      assert.equal(await page.locator(".house-row").count(),4,"withdrawn should immediately disappear");
      await page.getByRole("button",{name:"Zoom in"}).click();
      await page.getByRole("button",{name:"Rotate right"}).click();
      await page.getByRole("button",{name:"Reset view"}).click();
      await page.locator(".house-row").first().click();
      assert.ok((await page.locator("#selected-panel").innerText()).includes("DEMOS")===false);
      assert.ok((await page.locator("#selected-panel").innerText()).includes("Not a real residence"));
    }
    await page.screenshot({path:join(directory,"porchlight-"+w+".png"),fullPage:true});
    console.log("PASS browser synthetic pilot at",w,"px");
    await page.close();
  }
  // The distributable must also run as a file, without a host or external assets.
  const offline=await browser.newPage({viewport:{width:390,height:844}});
  offline.on("pageerror",e=>errors.push("offline "+e.message));
  await offline.clock.install({time:new Date("2026-10-24T20:00:00Z")});
  await offline.goto(new URL("./porchlight-offline.html",import.meta.url).href,{waitUntil:"load"});
  await offline.locator("#activeCount").waitFor();
  assert.equal((await offline.locator("#activeCount").innerText()).trim(),"4","standalone offline approved host count");
  await offline.getByRole("button",{name:"Stage a mock host request"}).click();
  await offline.getByRole("button",{name:"Simulate organizer approval"}).click();
  assert.equal((await offline.locator("#activeCount").innerText()).trim(),"5","offline mock approval");
  await offline.screenshot({path:join(directory,"porchlight-offline-proof.png"),fullPage:true});
  await offline.close();
  console.log("PASS offline single-file browser acceptance");
  assert.deepEqual(errors,[],"uncaught browser JS errors");
}finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
