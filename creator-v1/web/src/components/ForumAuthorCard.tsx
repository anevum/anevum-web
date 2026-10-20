import type {ForumAuthor} from '../lib/member-forums';
import {CompactMemberIdentity} from './CompactMemberIdentity';
export function ForumAuthorCard({author}:{author:ForumAuthor}){
 return <CompactMemberIdentity member={author} className="cf-author" size="compact"/>;
}
