import { readStatus } from "../lib/api";
import { useResource } from "../lib/useResource";
import { ErrorState, LoadingState } from "../components/States";

const rows=[
 ["DISCOVERY + SEARCH","AVAILABLE","Browse approved public work, categories and creator pages."],
 ["MEMBER ACCOUNTS","STAGING","Identity, recovery and isolation require real-user acceptance before public access."],
 ["CREATOR PUBLISHING","STAGING","Drafts and staff moderation exist in staging; public submissions remain closed."],
 ["REVIEWS + XP","STAGING","Participation and progression require anti-abuse and real-user acceptance."],
 ["COMMUNITY","READ ONLY","Approved work and moderated discussions are visible; member participation is still gated."]
];
export function StatusPage(){
 const data=useResource(readStatus,[]);
 return <><section className="page-masthead"><div><span className="kicker">BUILD STATUS / CREATOR V1</span><h1>BUILD IT.<br/><em>PROVE IT.</em></h1></div><p>ANEVUM separates implemented source, staging acceptance and public availability. A passing test is not the same thing as a live feature.</p></section>
 {data.state==="loading"&&<LoadingState/>}{data.state==="error"&&<ErrorState/>}
 {data.state==="ready"&&<><section className="metrics-rack"><div><strong>{data.data.counts.publishedProjects}</strong><span>PUBLISHED PROJECTS</span></div><div><strong>{data.data.counts.publishedCreators}</strong><span>PUBLISHED CREATORS</span></div><div><strong>{data.data.version}</strong><span>PUBLIC API</span></div><div><strong>JAN 01</strong><span>OPENING TARGET</span></div></section><section className="status-list">{rows.map(([name,state,detail])=><article key={name}><span className="status-lamp"/><div><strong>{name}</strong><p>{detail}</p></div><em>{state}</em></article>)}</section></>}
 </>;
}
