import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { memberAuthClient } from "../member/auth-client";
import { useMemberAvailability } from "../member/useMemberAvailability";
import { verifyBetaProbe, type BetaCheck, type BetaStatus } from "../member/beta-probe.ts";
import OwnerPersonalPaperReadiness from "./OwnerPersonalPaperReadiness";
type State = BetaStatus | "checking" | "error";
type Results = Record<BetaCheck, State>;
const initial: Results = {account:"checking",workspace:"checking",draft:"checking",discussions:"checking"};
const checks: ReadonlyArray<{key:BetaCheck;title:string;path:string;url:string;description:string;action:string}> = [
  {key:"account",title:"My ANEVUM account",path:"/me/settings",url:"/api/member/me",
   description:"Review and edit your profile, then verify changes persist after sign-out.",action:"Edit my profile"},
  {key:"workspace",title:"My private RHEN workspace",path:"/apps/rhen",url:"/api/member/rhen/workspace",
   description:"Reserve an independent workspace when enabled. This does not connect a broker.",action:"Open RHEN"},
  {key:"draft",title:"My non-executing bot draft",path:"/apps/rhen/setup",url:"/api/member/rhen/draft",
   description:"Create, save and revise configuration without submitting trades.",action:"Open my draft"},
  {key:"discussions",title:"Commons discussion pilot",path:"/communities",url:"/api/member/commons/posts",
   description:"Discussion posting stays restricted until moderation and privacy review are complete.",action:"Explore discussions"}
];
const labels: Record<State,string> = {
  checking:"Checking",available:"Available to test",disabled:"Not enabled",
  restricted:"Restricted","sign-in-required":"Sign-in required",error:"Could not verify"
};
function Checks({memberId}:{memberId:string}) {
  const [results,setResults] = useState<Results>(initial);
  const [revision,setRevision] = useState(0);
  useEffect(()=>{
    const controller=new AbortController();
    setResults(initial);
    for(const check of checks) {
      void (async()=>{
        let state: State="error";
        try {
          const response=await fetch(check.url,{method:"GET",credentials:"same-origin",
            cache:"no-store",redirect:"manual",signal:controller.signal});
          const data: unknown=response.status===200?await response.json():null;
          if(!controller.signal.aborted)state=verifyBetaProbe(check.key,response.status,data,memberId);
        } catch {state="error";}
        if(!controller.signal.aborted)setResults(old=>({...old,[check.key]:state}));
      })();
    }
    return ()=>controller.abort();
  },[memberId,revision]);
  return <section className="c2-beta" aria-labelledby="beta-heading">
    <header className="c2-beta-header">
      <p className="workshop-kicker">ANEVUM / PRIVATE BETA</p>
      <h1 id="beta-heading">Test your account and tools</h1>
      <p>Only features verified for your current account appear as available. No brokerage or execution permission is inferred.</p>
      <button type="button" onClick={()=>setRevision(v=>v+1)}>Recheck my access</button>
    </header>
    <div className="c2-beta-grid" aria-live="polite">
      {checks.map(check=><article className="c2-beta-card" key={check.key}>
        <div className="c2-beta-card-title"><h2>{check.title}</h2>
          <span data-beta-state={results[check.key]}>{labels[results[check.key]]}</span></div>
        <p>{check.description}</p>
        {results[check.key]==="available"?
          <Link to={check.path}>{check.action} →</Link>:
          <p className="c2-beta-muted">{results[check.key]==="checking"?"Verifying…":
            results[check.key]==="error"?"Verification failed. No permission granted.":
            results[check.key]==="sign-in-required"?"Sign in again.":
            results[check.key]==="restricted"?"Requires separate authorization.":
            "Closed until approved and deployed."}</p>}
      </article>)}
    </div>
    <OwnerPersonalPaperReadiness memberId={memberId}/>
    <section className="c2-beta-guide">
      <h2>Begin testing</h2>
      <p>Save RHEN from <Link to="/command">Command</Link>, follow project updates, edit your <Link to="/me/settings">profile</Link>, and read <Link to="/field-notes">Field Notes</Link>. Then sign out and sign back in to check persistence.</p>
      <p>Membership never requires an Alpaca account. Personal trading, rewards, funding and public posting remain separately gated. Never share API keys, tokens, account exports or session cookies in feedback.</p>
      <p><Link to="/help">Help and account support →</Link></p>
    </section>
  </section>;
}
export default function MemberBeta(){
  const availability=useMemberAvailability();
  const {data:session,isPending}=memberAuthClient.useSession();
  if(availability==="checking"||isPending)return <section className="c2-beta"><p role="status">Checking member access…</p></section>;
  if(availability!=="available")return <section className="c2-beta"><h1>Beta unavailable</h1><p>No member capabilities are enabled until registration can be verified.</p><Link to="/sign-in?next=beta">Recheck sign-in</Link></section>;
  if(!session?.user?.id)return <section className="c2-beta"><h1>Sign in to test your account</h1><Link to="/sign-in?next=beta">Continue with Google</Link></section>;
  return <Checks key={session.user.id} memberId={session.user.id}/>;
}
