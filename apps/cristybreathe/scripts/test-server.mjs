// Local synthetic-data harness. This never runs on the production Worker.
import {createServer} from 'node:http';
import {readFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {openDatabase,keys,issuer,envFor} from '../tests/fixtures.mjs';
const root=fileURLToPath(new URL('..',import.meta.url));
const signing=await keys();
const realFetch=globalThis.fetch;
globalThis.fetch=async (url,options)=>String(url)===issuer+'/cdn-cgi/access/certs'?Response.json({keys:[signing.pub]}):realFetch(url,options);
mkdirSync(resolve(root,'.private'),{recursive:true});
const file=resolve(root,'.private/browser-test.sqlite');
let DB;
try{DB=openDatabase(file,false);DB.db.prepare('SELECT revision FROM entries LIMIT 1').get();}catch{DB?.db.close();DB=openDatabase(file);}
const env=envFor(DB);
const {default:worker}=await import('../dist/worker.mjs?'+Date.now());
createServer(async(req,res)=>{
 try{
 const chunks=[];for await(const chunk of req)chunks.push(chunk);
 const headers=new Headers(req.headers);headers.set('cf-access-jwt-assertion',await signing.token());
 const request=new Request('http://127.0.0.1:8787'+req.url,{method:req.method,headers,body:['GET','HEAD'].includes(req.method)?undefined:Buffer.concat(chunks)});
 const response=await worker.fetch(request,env);
 res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
 }catch(error){console.error(error.name);res.writeHead(500);res.end('Synthetic test server error');}
}).listen(8787,'127.0.0.1',()=>console.log('Synthetic local workspace: http://127.0.0.1:8787'));
