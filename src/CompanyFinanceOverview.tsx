import { useEffect, useRef, useState } from 'react';
import { loadFinanceSnapshot, type FinanceSnapshot } from './financeClient';
import './commandOverview.css';
import { syncCurrentUser, type MemberSession } from './memberClient';

function number(value: unknown) { return typeof value === 'number' && Number.isFinite(value) ? new Intl.NumberFormat('en-US', {maximumFractionDigits:2, minimumFractionDigits:2}).format(value) : '—'; }
export function CompanyFinanceOverview({session,onAuth}:{session:MemberSession|null;onAuth:()=>void}) {
 const [snapshot,setSnapshot]=useState<FinanceSnapshot|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[paused,setPaused]=useState(false),[now,setNow]=useState(Date.now()),[cycle,setCycle]=useState(0);
 const generation=useRef(0);
 useEffect(()=>{setSnapshot(null);setError('')},[session?.user.id]);
 useEffect(()=>{
  setBusy(false);
  const epoch=++generation.current; let timer:ReturnType<typeof setTimeout>; let controller:AbortController|undefined;
  async function refresh(){
   if(!session || document.hidden || paused) return;
   setBusy(true);
   try {
    const current=await syncCurrentUser();
    if(!current?.access_token) throw new Error('Sign in with your administrator RHENLINK to connect finance.');
    controller=new AbortController();
    const data=await loadFinanceSnapshot(current);
    if(data?.mode!=='READ_ONLY'||!Number.isFinite(Date.parse(data.generatedAt))||typeof data.gateway?.connected!=='boolean'||!Array.isArray(data.positions))throw new Error('The broker returned an invalid snapshot.');
    if(epoch===generation.current){setSnapshot(data);setError('');setNow(Date.now())}
   } catch(e) {if(epoch===generation.current)setError(e instanceof Error?e.message:'Finance is temporarily unavailable.');}
   finally {if(epoch===generation.current){setBusy(false);timer=setTimeout(refresh,5000)}}
  }
  const visible=()=>{clearTimeout(timer);controller?.abort();generation.current++;};
  // Resume starts a fresh effect, so requests never overlap after a tab switch.
  const visibility=()=>{if(document.hidden)visible();else setCycle(x=>x+1)};
  refresh();document.addEventListener('visibilitychange',visibility);
  return()=>{generation.current++;clearTimeout(timer);controller?.abort();document.removeEventListener('visibilitychange',visibility)};
 },[session?.user.id,paused,cycle]);
 useEffect(()=>{const t=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(t)},[]);
 const age=snapshot?Math.floor((now-Date.parse(snapshot.generatedAt))/1000):null;
 const fresh=age!==null&&Number.isFinite(age)&&age>=-5&&age<=20;
 const status=!session?'SIGN IN REQUIRED':error?'CONNECTION ERROR':!snapshot?'CONNECTING':!snapshot.gateway.connected?'BROKER DISCONNECTED':paused?'PAUSED':fresh?'RECENT SNAPSHOT':'STALE SNAPSHOT';
 const account=snapshot?.account;
 return <section className="finance-portal" aria-label="Financial portal">
  <div className="finance-heading"><div><div className="eyebrow">COMMAND / FINANCE</div><h2>Know where you stand.</h2><p>Company cash and investments, with the source beside every number.</p></div><span className="tag">READ ONLY</span></div>
  <div className="finance-toolbar"><strong>{status}</strong><div><button className="btn small" disabled={!session} onClick={()=>setPaused(x=>!x)}>{paused?'Resume updates':'Pause updates'}</button><button className="btn small" disabled={!session||busy||paused} onClick={()=>setCycle(x=>x+1)}>{busy?'Refreshing…':'Refresh now'}</button></div></div>
  {!session&&<div className="notice"><p>Connect your administrator RHENLINK to read the protected broker feed.</p><button className="btn primary" onClick={onAuth}>Sign in to finance</button></div>}
  {error&&<p className="notice" role="status">{error} {snapshot?'Previous values are retained below and are not current.':''}</p>}
  {snapshot&&!snapshot.gateway.connected&&<p className="notice">The broker session is disconnected. Check IB Gateway and approve IB Key if requested. Values below are the last supplied snapshot.</p>}
  <div className="finance-metrics">{[['Portfolio value',account?.netLiquidation],['Total broker cash',account?.totalCash],['Available funds',account?.availableFunds],['Unrealized P&L',account?.unrealizedPnl]].map(([label,value])=><div className="finance-metric" key={String(label)}><span>{label}</span><strong>{number(value)}</strong><small>INTERACTIVE BROKERS · BASE CURRENCY</small></div>)}</div>
  <p className="finance-caption">{snapshot?`Source generated ${new Date(snapshot.generatedAt).toLocaleString()} · ${age!==null&&age>=0?age+' seconds ago':'timestamp unavailable'}`:'No authenticated account snapshot received.'} Account currency is not supplied by this feed. Refreshes every 5 seconds while this page is visible; quote delays depend on broker permissions.</p>
  <div className="finance-sources"><article><h3>Interactive Brokers</h3><p>{snapshot?.gateway.connected?'Broker connected':'Awaiting broker connection'}</p><small>Investments and broker cash</small></article><article><h3>Stripe</h3><p>Not connected to Command</p><small>Sales, fees, payouts · no balance imported</small></article><article><h3>Revolut</h3><p>Not connected to Command</p><small>Operating cash · no balance imported</small></article></div>
  <div className="finance-heading"><h3>Holdings</h3><span>{snapshot?.positions.length??'—'} positions</span></div>
  <div className="finance-table-scroll"><table className="finance-table"><thead><tr><th>Asset</th><th>Quantity</th><th>Price</th><th>Value</th><th>Unrealized P&L</th><th>Currency</th></tr></thead><tbody>{snapshot?.positions.map((p,i)=><tr key={p.contract.conId+'-'+i}><th>{p.contract.symbol}</th><td>{number(p.quantity)}</td><td>{number(p.marketPrice)}</td><td>{number(p.marketValue)}</td><td>{number(p.unrealizedPnl)}</td><td>{p.contract.currency}</td></tr>)}</tbody></table></div>
  {!snapshot?.positions.length&&<p className="finance-caption">{snapshot?.gateway.connected&&snapshot.account?'No positions reported in this snapshot.':'Holdings appear after an authorized broker connection.'}</p>}
  <p className="finance-caption">Operating cash and broker cash are separate. A combined company total, runway, and performance history will appear only when their source data is connected.</p>
 </section>;
}
