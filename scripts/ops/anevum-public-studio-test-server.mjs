import {createServer} from "node:http";
import worker from "../../apps/anevum-public-studio/worker.mjs";
const host="127.0.0.1";
const port=4178;
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url||"/","https://anevum.com");
  const response=await worker.fetch(new Request(url,{method:req.method}));
  res.writeHead(response.status,Object.fromEntries(response.headers));
  res.end(Buffer.from(await response.arrayBuffer()));
 }catch(e){res.writeHead(500,{"Content-Type":"text/plain"});res.end("Test server error");}
});
server.listen(port,host,()=>console.log("Public Studio QA loopback server ready on "+host+":"+port));
