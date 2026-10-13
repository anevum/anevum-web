import { Link } from "react-router-dom";
import type {ForumAuthor,ForumPost} from "../lib/forum-api";
import {forumMemberPath} from "../lib/forum-api";
import {OrbitalMark} from "./OrbitalMark";

function initials(name:string):string {
  const parts=name.trim().split(/\s+/u).filter(Boolean);
  const result=parts.length>1?parts.slice(0,2).map(part=>part.slice(0,1)).join(""):parts[0]?.slice(0,2)||"?";
  return result.toLocaleUpperCase();
}
function avatarTone(handle:string):number {
  let n=0;
  for(const c of handle)n=(n*31+c.charCodeAt(0))%65521;
  return n%5;
}
export function ForumAuthorCard({author,large=false}:{author:ForumAuthor;large?:boolean}){
  return <aside className={"forum-author-card forum-author-tone-"+avatarTone(author.handle)+(large?" forum-author-large":"")}>
    <Link className="forum-author-avatar-link" to={forumMemberPath(author.handle)} aria-label={"Open "+author.displayName+"'s member profile"}>
      <span className="forum-author-avatar" aria-hidden="true"><span>{initials(author.displayName)}</span><OrbitalMark/></span>
    </Link>
    <div className="forum-author-identity">
      <Link className="forum-author-name" to={forumMemberPath(author.handle)}>{author.displayName}</Link>
      <Link className="forum-author-handle" to={forumMemberPath(author.handle)}>@{author.handle}</Link>
      <span className="forum-author-rank">LEVEL {author.level} <span aria-hidden="true">✦</span></span>
    </div>
    <div className="forum-author-achievements" aria-label="Verified earned badges">
      {author.badges.length
        ?author.badges.slice(0,5).map(b=><span className="forum-author-badge" key={b.key} title={b.name}><span aria-hidden="true">{b.symbol}</span><span className="forum-author-badge-label">{b.name}</span></span>)
        :<span className="forum-author-unbadged">NO EARNED BADGES YET</span>}
    </div>
    {author.artifact&&<div className="forum-author-artifact"><span>ORBIT ARTIFACT</span><strong>{author.artifact}</strong></div>}
  </aside>;
}
const timestamp=(v:number)=>new Date(v*1000).toISOString();
function displayedTime(v:number):string{
  return new Date(v*1000).toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"});
}
export function ForumPostCard({post,children}:{post:ForumPost;children?:React.ReactNode}){
  return <article className="forum-post" id={"message-"+post.id}>
    <ForumAuthorCard author={post.author}/>
    <div className="forum-post-body">
      <div className="forum-post-meta"><span className="forum-post-type">{post.starter?"ORIGINAL POST":"REPLY"}</span><time dateTime={timestamp(post.createdAt)}>{displayedTime(post.createdAt)}</time></div>
      <p className="forum-post-message">{post.body}</p>
      {children&&<div className="forum-post-actions">{children}</div>}
    </div>
  </article>;
}
