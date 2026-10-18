#!/usr/bin/env node
/**
 * Porchlight V001.3 — fictional review served on localhost or a trusted Wi-Fi.
 * NO real addresses, accounts, telemetry, database, cloud, or payments.
 */
import http from 'node:http';
import os from 'node:os';
import {readFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';

const directory=dirname(fileURLToPath(import.meta.url));
const usage=[
  'Usage: node server.mjs [--lan] [--port 0..65535] [--minutes 1..240]',
  'Default: localhost-only port 4177, automatically stops after 60 minutes.',
  '--lan: expose the FICTIONAL demo on your own trusted Wi-Fi only.',
  '--port 0: choose a random free port.'
].join('\n');
function parse(args) {
 let lan=false,port=4177,minutes=60;
 for(let i=0;i<args.length;i++){
  const key=args[i];
  if(key==='--lan'){lan=true;continue}
  if(key==='--help'||key==='-h'){console.log(usage);process.exit(0)}
  if(key==='--port'||key==='--minutes'){
   const value=args[++i];
   if(!/^\d+$/.test(value||''))throw Error('Expected a nonnegative integer after '+key);
   const n=Number(value);
   if(!Number.isSafeInteger(n))throw Error('Number out of range');
   if(key==='--port'){if(n>65535)throw Error('Port out of range');port=n}
   else{if(n<1||n>240)throw Error('Minutes must be 1..240');minutes=n}
   continue;
  }
  throw Error('Unknown argument: '+key);
 }
 return{lan,port,minutes};
}
let config;
try{config=parse(process.argv.slice(2))}
catch(e){console.error(e.message+'\n'+usage);process.exit(2)}
const page=readFileSync(join(directory,'index.html'));
const html=page.toString('utf8');
for(const marker of ['FICTIONAL OFFLINE REVIEW','NO LIVE HOUSEHOLDS',"connect-src 'none'","window.fetch = async"]){
 if(!html.includes(marker)){console.error('Refusing to serve HTML without required fictional-review marker: '+marker);process.exit(3)}
}
const ips=Object.values(os.networkInterfaces()).flat().filter(x=>x&&x.family==='IPv4'&&!x.internal&&/^[0-9.]+$/.test(x.address)).map(x=>x.address);
const trustedHosts=new Set(['localhost','127.0.0.1','::1',...ips]);
const headers={
 'Cache-Control':'no-store, private, max-age=0',
 'Pragma':'no-cache',
 'Referrer-Policy':'no-referrer',
 'X-Content-Type-Options':'nosniff',
 'X-Frame-Options':'DENY',
 'Cross-Origin-Resource-Policy':'same-origin',
 'Permissions-Policy':'geolocation=(), camera=(), microphone=()',
 'Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'none'; font-src 'none'; img-src data:; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
};
const server=http.createServer((request,response)=>{
 let hostname,port;
 try{
  const raw=request.headers.host||'';
  if(raw.length>100)throw Error('Invalid host');
  const parsed=new URL('http://'+raw);
  hostname=parsed.hostname.replace(/^\[|\]$/g,'').toLowerCase();
  port=parsed.port;
 }catch{hostname=null}
 const serverPort=String(server.address()?.port||config.port);
 if(!trustedHosts.has(hostname)||(port&&port!==serverPort)){
  response.writeHead(421,{...headers,'Content-Type':'text/plain; charset=utf-8'});
  return response.end('Unrecognized host. Fictional demo is limited to local network.');
 }
 if(!['GET','HEAD'].includes(request.method)){
  response.writeHead(405,{...headers,'Allow':'GET, HEAD','Content-Type':'text/plain; charset=utf-8'});
  return response.end('Read-only fictional review server.');
 }
 const pathname=request.url?.split('?')[0]||'';
 if(pathname==='/health'){
  response.writeHead(200,{...headers,'Content-Type':'application/json; charset=utf-8'});
  return response.end(request.method==='HEAD'?undefined:JSON.stringify({ok:true,fictional:true,cloud:false,realHomes:false,storage:false}));
 }
 if(pathname!=='/'&&pathname!=='/index.html'){
  response.writeHead(404,{...headers,'Content-Type':'text/plain; charset=utf-8'});
  return response.end('Not found');
 }
 response.writeHead(200,{...headers,'Content-Type':'text/html; charset=utf-8','Content-Length':page.length});
 response.end(request.method==='HEAD'?undefined:page);
});
server.maxHeadersCount=32;
server.headersTimeout=10000;
server.requestTimeout=10000;
server.on('error',e=>{console.error('Local review server error: '+e.message);process.exitCode=1});
server.listen(config.port,config.lan?'0.0.0.0':'127.0.0.1',()=>{
 const port=server.address().port;
 console.log('ANEVUM PORCHLIGHT — FICTIONAL PHONE REVIEW — NO REAL PEOPLE');
 console.log('PORT='+port);
 console.log('Local: http://127.0.0.1:'+port+'/');
 if(config.lan){
  console.log('WARNING: open to other devices on YOUR Wi-Fi. Never enter real household data.');
  if(!ips.length)console.log('No local IPv4 address detected.');
  for(const ip of ips)console.log('Phone (same Wi-Fi): http://'+ip+':'+port+'/');
 }else console.log('Only this computer can connect. Add --lan for a phone on trusted Wi-Fi.');
 console.log('Review expires after '+config.minutes+' minute(s). Ctrl+C stops earlier.');
});
const expiry=setTimeout(()=>{console.log('Fictional review expired.');server.close()},config.minutes*60000);
expiry.unref();
for(const name of ['SIGINT','SIGTERM'])process.once(name,()=>server.close(()=>process.exit(0)));
