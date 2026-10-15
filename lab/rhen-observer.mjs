// ANEVUM Lab RHEN owner observation adapter — GET-only, fail closed.
// NO ORDER/TRANSFER/STRATEGY CONTROL. Keys, if later provisioned,
// live only in this Access-protected Worker's secret bindings, never in HTML.
// The source engine is retired and remains OFFLINE independent of brokerage reads.
import {RHEN_REVIEW} from './rhen-snapshot.mjs';
export const RHEN_OBSERVER_SCHEMA='anevum.lab.rhen-observer.v1';
export const BROKER_PAPER_HOST='https://paper-api.alpaca.markets';
export const BROKER_LIVE_HOST='https://api.alpaca.markets';
const EXACT_PATHS=Object.freeze(['/v2/account','/v2/positions','/v2/orders?status=all&limit=24&direction=desc','/v2/clock']);
const STOPPED=Object.freeze({state:'OFFLINE',scanner:'NOT_RUNNING',execution:'DISABLED',last_scan_at:null,active_universe:null,events:[],source:'NONE'});
function cleanText(value,max=40){
 return typeof value==='string'?value.replace(/[<>\u0000-\u001f]/g,'').slice(0,max):'';
}
function money(value){
 if(value===null||value===undefined||value==='')return null;
 const n=typeof value==='number'?value:typeof value==='string'&&/^-?\d+(?:\.\d+)?$/.test(value.trim())?Number(value):NaN;
 return Number.isFinite(n)&&Math.abs(n)<1e15?n:null;
}
function qty(value){return money(value);}
function date(value){
 if(typeof value!=='string'||value.length>60)return null;
 const t=Date.parse(value);return Number.isFinite(t)?new Date(t).toISOString():null;
}
function err(message){return {status:'UNAVAILABLE',message};}
const unavailable=()=>({
 schema:RHEN_OBSERVER_SCHEMA,observed_at:new Date().toISOString(),
 provider:{state:'NOT_CONNECTED',environment:'NONE',source:'NONE',observed_at:null},
 account:null,account_state:'NOT_CONNECTED',positions:null,positions_state:'NOT_CONNECTED',
 orders:null,orders_state:'NOT_CONNECTED',market:null,market_state:'NOT_CONNECTED',
 scanner:STOPPED,engine:STOPPED,source_commit:RHEN_REVIEW.source_commit,
 attribution:'NOT_VERIFIED',equity_history:null,errors:[],
});
export function projectAccount(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return null;
 const equity=money(raw.equity),cash=money(raw.cash),buyingPower=money(raw.buying_power),
 previousEquity=money(raw.last_equity);
 if(equity===null||cash===null||buyingPower===null)return null;
 return {
  equity,cash,buying_power:buyingPower,
  previous_equity:previousEquity,
  day_pl:previousEquity!==null?Math.round((equity-previousEquity)*100)/100:null,
  currency:raw.currency==='USD'?'USD':'UNVERIFIED',
  broker_status:cleanText(raw.status,24),
  account_blocked:raw.account_blocked===true, trading_blocked:raw.trading_blocked===true,
  long_market_value:money(raw.long_market_value),short_market_value:money(raw.short_market_value),
 };
}
export function projectPositions(raw){
 if(!Array.isArray(raw)||raw.length>200)return null;
 const result=[];
 for(const row of raw.slice(0,12)){
  if(!row||typeof row!=='object')return null;
  const symbol=cleanText(row.symbol,17);
  if(!/^[A-Z][A-Z0-9.]{0,14}$/.test(symbol))return null;
  result.push({symbol,qty:qty(row.qty),side:row.side==='long'?'long':row.side==='short'?'short':'unknown',
   market_value:money(row.market_value),unrealized_pl:money(row.unrealized_pl),
   current_price:money(row.current_price)});
 }
 return result;
}
export function projectOrders(raw){
 if(!Array.isArray(raw)||raw.length>500)return null;
 const result=[];
 for(const row of raw.slice(0,12)){
  if(!row||typeof row!=='object')return null;
  const symbol=cleanText(row.symbol,17);
  if(!/^[A-Z][A-Z0-9.]{0,14}$/.test(symbol))return null;
  const side=row.side==='buy'?'buy':row.side==='sell'?'sell':'unknown';
  result.push({symbol,side,status:cleanText(row.status,35),filled_qty:qty(row.filled_qty),
   filled_avg_price:money(row.filled_avg_price),qty:qty(row.qty),notional:money(row.notional),
   at:date(row.filled_at)||date(row.submitted_at),source:'BROKER_ORDER',bot_attribution:'NOT_VERIFIED'});
 }
 return result;
}
export function projectClock(raw){
 if(!raw||typeof raw!=='object'||typeof raw.is_open!=='boolean')return null;
 return {is_open:raw.is_open,timestamp:date(raw.timestamp),next_open:date(raw.next_open),next_close:date(raw.next_close)};
}
const headers={Accept:'application/json'};
async function safeGet(host,path,secret,fetcher){
 if(!EXACT_PATHS.includes(path))throw Error('Out-of-contract path');
 const response=await fetcher(host+path,{
  method:'GET',redirect:'error',signal:AbortSignal.timeout(4500),
  headers:{...headers,'APCA-API-KEY-ID':secret.key,'APCA-API-SECRET-KEY':secret.secret},
 });
 if(!response?.ok)throw Error('Broker unavailable');
 const type=response.headers?.get('content-type')||'';
 if(!type.toLowerCase().includes('application/json'))throw Error('Broker response was not JSON');
 const body=await response.text();
 if(body.length>240000)throw Error('Broker response exceeded limit');
 return JSON.parse(body);
}
export async function getRhenObservation(env={},fetcher=fetch){
 const payload=unavailable();
 const mode=env.RHEN_LAB_BROKER_MODE;
 const enabled=env.RHEN_LAB_BROKER_VIEW_ENABLED==='true';
 const key=env.RHEN_LAB_BROKER_KEY_ID,secret=env.RHEN_LAB_BROKER_SECRET_KEY;
 if(!enabled||!['paper','live'].includes(mode)||typeof key!=='string'||!key||typeof secret!=='string'||!secret){
  return payload;
 }
 const host=mode==='paper'?BROKER_PAPER_HOST:BROKER_LIVE_HOST;
 const auth={key,secret};
 payload.provider={state:'CONNECTING',environment:mode.toUpperCase(),source:'ALPACA_TRADING_API',observed_at:null};
 const calls=await Promise.allSettled(EXACT_PATHS.map(path=>safeGet(host,path,auth,fetcher)));
 const account=calls[0].status==='fulfilled'?projectAccount(calls[0].value):null;
 const positions=calls[1].status==='fulfilled'?projectPositions(calls[1].value):null;
 const orders=calls[2].status==='fulfilled'?projectOrders(calls[2].value):null;
 const clock=calls[3].status==='fulfilled'?projectClock(calls[3].value):null;
 payload.account=account;payload.account_state=account?'OBSERVED':'UNAVAILABLE';
 payload.positions=positions;payload.positions_state=positions?'OBSERVED':'UNAVAILABLE';
 payload.orders=orders;payload.orders_state=orders?'OBSERVED':'UNAVAILABLE';
 payload.market=clock;payload.market_state=clock?'OBSERVED':'UNAVAILABLE';
 const complete=Boolean(account&&positions&&orders&&clock);
 payload.provider.state=complete?'CONNECTED':'DEGRADED';
 payload.provider.observed_at=complete?payload.observed_at:null;
 if(!complete)payload.errors.push('One or more broker reads failed. Missing fields are unavailable, never zero.');
 // These data are direct broker observations, NOT authenticated bot cycles.
 // No account identifiers, order IDs, activity streams, secrets or positions histories are disclosed.
 return payload;
}
