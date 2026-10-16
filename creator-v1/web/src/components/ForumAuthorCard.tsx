import {Link} from 'react-router-dom';
import {LevelEmblem,AwardEmblem} from './LevelEmblem';
import {MemberPortrait} from './MemberPortrait';
import type {ForumAuthor} from '../lib/member-forums';
export function ForumAuthorCard({author}:{author:ForumAuthor}){
 return <Link className="cf-author" to={'/@'+author.handle}>
  <MemberPortrait name={author.displayName}
   src={author.avatar?'/api/v1/members/'+author.handle+'/media/avatar':undefined}/>
  <span className="cf-author-copy"><strong>{author.displayName}</strong>
   <small>@{author.handle}</small>
   <span className="cf-author-awards">{author.featuredAwards.map(id=>
    <span key={id} title={id.replaceAll('_',' ')}><AwardEmblem award={id}/></span>)}</span>
  </span>
  {author.level!==null&&<span className="cf-author-level">
    <LevelEmblem level={author.level} size={45}/><small>LVL {author.level}</small>
  </span>}
 </Link>;
}
