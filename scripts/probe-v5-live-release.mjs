// Anonymous, read-only checks after the website testing release.
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
const ORIGIN="https://anevum.com";
const ACCESS="wispy-tooth-095a.cloudflareaccess.com";
export async function probeV5LiveRelease(request=fetch){
  const checks=[];
  const get=path=>request(ORIGIN+path,{method:"GET",redirect:"manual",cache:"no-store",
    signal:AbortSignal.timeout(15000)});
  for(const path of ["/","/products","/help","/updates","/command","/sign-in","/me/settings"]){
    const r=await get(path);
    if(r.status!==200||!r.headers.get("content-type")?.includes("text/html"))
      throw Error("V5 page unavailable: "+path);
    const html=await r.text();
    if(path==="/"&&!html.includes("anevum-commons-v5-mount"))
      throw Error("Production homepage is still the older release.");
    checks.push(path);
  }
  for(const path of ["/studio","/api/member/studio/status","/api/member/studio/entries",
    "/api/member/studio/overview"]){
    const r=await get(path);
    if(![302,303].includes(r.status)||new URL(r.headers.get("location")||"",ORIGIN).hostname!==ACCESS)
      throw Error("Staff Access challenge missing: "+path);
    checks.push(path);
  }
  const entries=await get("/api/public/studio/entries");
  if(entries.status!==200)throw Error("Public Studio read model unavailable.");
  const data=await entries.json();
  const keys=["slug","kind","title","summary","publishedAt"];
  if(data.schemaVersion!=="anevum.studio.v1"||data.available!==true||!Array.isArray(data.entries)||
    data.entries.some(e=>!e||Object.keys(e).some(k=>!keys.includes(k))))
    throw Error("Public Studio response exposes unsupported fields.");
  checks.push("public Studio publications only");
  const trading=await get("/api/public/trading/live");
  const state=await trading.json();
  if(trading.status!==503||state.status!=="SUSPENDED_FOR_REBUILD"||state.execution_enabled!==false)
    throw Error("Trading suspension boundary changed.");
  checks.push("trading suspended");
  return {success:true,checks,authenticatedOwnerAcceptance:"PENDING"};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{console.log(JSON.stringify(await probeV5LiveRelease()));}
  catch(error){console.error("V5 live release probe failed: "+error.message);process.exitCode=1;}
}
