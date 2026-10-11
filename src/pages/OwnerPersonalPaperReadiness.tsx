import { useEffect,useState } from "react";
import { verifiedOwnerPaperStatus,type OwnerPersonalPaperStatus } from "../member/owner-paper-status.ts";
type Stage="checking"|"not-owner"|"disabled"|"verified"|"error";
export default function OwnerPersonalPaperReadiness({memberId}:{memberId:string}){
 const [stage,setStage]=useState<Stage>("checking");
 const [paper,setPaper]=useState<OwnerPersonalPaperStatus|null>(null);
 useEffect(()=>{
   const controller=new AbortController();
   setStage("checking");setPaper(null);
   void (async()=>{
     try{
       const session=await fetch("/api/command/session",{
         method:"GET",credentials:"same-origin",cache:"no-store",redirect:"manual",signal:controller.signal
       });
       if(!session.ok){if(!controller.signal.aborted)setStage("not-owner");return;}
       const authorization:unknown=await session.json();
       if(!authorization||typeof authorization!=="object"||
         (authorization as Record<string,unknown>).auth_source!=="cloudflare_access"||
         (authorization as Record<string,unknown>).command_admin!==true||
         (authorization as Record<string,unknown>).owner_member_bound!==true){
         if(!controller.signal.aborted)setStage("not-owner");
         return;
       }
       const result=await fetch("/api/member/owner-paper/status",{
         method:"GET",credentials:"same-origin",cache:"no-store",redirect:"manual",signal:controller.signal
       });
       if(controller.signal.aborted)return;
       if(result.status===503){setStage("disabled");return;}
       if(!result.ok)throw Error("Unavailable");
       const status=verifiedOwnerPaperStatus(await result.json());
       if(!controller.signal.aborted){setPaper(status);setStage("verified");}
     }catch{if(!controller.signal.aborted){setPaper(null);setStage("error");}}
   })();
   return ()=>controller.abort();
 },[memberId]);
 if(stage==="not-owner"||stage==="checking")return null;
 return <section className="c2-beta-guide" data-beta-owner-paper={stage} aria-labelledby="owner-paper-title">
   <h2 id="owner-paper-title">Developer-only personal PAPER account</h2>
   <p>This is an isolated read-only connection test for the verified ANEVUM owner, not the broker connection experience available to other members. It cannot place orders or access live funds.</p>
   {stage==="verified"&&paper?
     <p role="status">PAPER account ending {paper.accountEnding} · provider status {paper.providerStatus}. No execution authority.</p>:
     <p role={stage==="error"?"alert":"status"}>{stage==="disabled"?
       "Not enabled. No personal paper credentials have been connected through this page.":
       "Private paper status could not be verified. No brokerage data will be shown."}</p>}
 </section>;
}
