import {DatabaseSync} from 'node:sqlite';
import {readFileSync,mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
export function openDatabase(path=':memory:',migrate=true) {
  const db=new DatabaseSync(path);
  if(migrate) for(const file of ['0001_foundation.sql','0002_personal_workspace.sql']) db.exec(readFileSync(new URL('../migrations/'+file,import.meta.url),'utf8'));
  return {db,prepare(sql) {
    const statement=db.prepare(sql);let args=[];
    const api={bind(...values){args=values;return api;},async first(){return statement.get(...args)||null;},async all(){return {results:statement.all(...args)};},async run(){const result=statement.run(...args);return {meta:{changes:Number(result.changes)}};}};
    return api;
  },async batch(statements){db.exec('BEGIN');try{const values=[];for(const s of statements) values.push(await s.run());db.exec('COMMIT');return values;}catch(e){db.exec('ROLLBACK');throw e;}}};
}
export const issuer='https://cristybreathe-test.cloudflareaccess.com';
export const audience='test-audience';
export const emails=['cristy@example.com','devon@example.com'];
export async function keys() {
  const pair=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',hash:'SHA-256',modulusLength:2048,publicExponent:new Uint8Array([1,0,1])},true,['sign','verify']);
  const pub=await crypto.subtle.exportKey('jwk',pair.publicKey);pub.kid='fixture-key';
  const encode=data=>Buffer.from(JSON.stringify(data)).toString('base64url');
  return {pub,async token(email=emails[0],overrides={},header={}) {
    const now=Math.floor(Date.now()/1000),h=encode({alg:'RS256',kid:pub.kid,...header}),p=encode({email,sub:'test-'+email,iss:issuer,aud:[audience],iat:now,exp:now+3600,...overrides});
    const sig=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',pair.privateKey,new TextEncoder().encode(h+'.'+p));
    return h+'.'+p+'.'+Buffer.from(sig).toString('base64url');
  }};
}
export const envFor=DB=>({DB,ACCESS_ISSUER:issuer,ACCESS_AUD:audience,ALLOWED_EMAILS:emails.join(',')});
export const temporaryDB=()=>join(mkdtempSync(join(tmpdir(),'cristybreathe-')),'test.sqlite');
