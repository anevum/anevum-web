import {Link} from 'react-router-dom';
import {useResource} from '../lib/useResource';
import {forumRequest,type ForumThreadPage,FORUM_TOPICS} from '../lib/member-forums';
import {ForumAuthorCard} from './ForumAuthorCard';
import '../pages/forums.css';

/** Real approved canonical forum threads only; disabled or empty forum adds no
 * speculative homepage content. Existing Creator V1 public feed is unaffected. */
export function MemberForumHighlights(){
 const index=useResource(signal=>forumRequest<ForumThreadPage>('/api/v1/community/threads','GET',undefined,signal),[]);
 if(index.state!=='ready'||index.data.items.length===0)return null;
 const items=index.data.items.slice(0,4);
 return <section className="cf-highlights" aria-labelledby="cf-highlights-title">
  <header className="cf-highlight-head"><div>
   <span className="cf-kicker">CONTINUANCE INSTITUTE / PUBLIC COMMONS</span>
   <h2 id="cf-highlights-title">Across the <em>community.</em></h2>
   <p>Genuine approved conversations from members of ANEVUM.</p>
  </div><Link to="/community">EXPLORE DISCUSSIONS ↗</Link></header>
  <div className="cf-highlight-list">{items.map(item=>
   <article className="cf-highlight" key={item.id}>
    <div className="cf-thread-meta"><span>{FORUM_TOPICS.find(x=>x[0]===item.topic)?.[1]||'DISCUSSION'}</span>
     <time dateTime={new Date(item.publishedAt*1000).toISOString()}>{new Date(item.publishedAt*1000).toLocaleDateString()}</time></div>
    <h3><Link to={'/community/threads/'+item.id}>{item.title}</Link></h3>
    <p>{item.body.length>170?item.body.slice(0,167)+'…':item.body}</p>
    <div className="cf-thread-foot"><ForumAuthorCard author={item.author}/>
     <Link to={'/community/threads/'+item.id} className="cf-count">{item.replyCount} REPLIES ↗</Link>
    </div>
   </article>)}</div>
 </section>;
}
