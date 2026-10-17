import {Link} from 'react-router-dom';
import {LevelEmblem,AwardEmblem,LEVEL_ARTIFACTS} from './LevelEmblem';
import {MemberPortrait} from './MemberPortrait';
import {SupporterIdentity} from './SupporterSeal';
import type {SupporterAppearance} from '../lib/canonical-beta';
import './member-identity-v061.css';

/** A single identity contract across approved posts, replies, wall updates and public member cards.
 * Only server-verified, explicitly public level and selected earned award fields may be passed.
 * Native scene rendering stays in the inspector: 128px genuine 3D artwork renders animate
 * as lightweight miniature specimens so long feeds do not exhaust mobile WebGL contexts.
 */
export type PublicIdentity={
 handle:string;
 displayName:string;
 avatar:boolean;
 level:number|null;
 featuredAwards:string[];
 supporterAppearance?:SupporterAppearance;
};
const AWARDS:Record<string,string>={
 first_signal:'First Signal',
 world_shaper:'World Shaper'
};
export function CompactMemberIdentity({member,href,className='',size='standard'}:{
 member:PublicIdentity;href?:string;className?:string;size?:'standard'|'compact'
}){
 const level=typeof member.level==='number'&&Number.isSafeInteger(member.level)&&member.level>=1&&member.level<=30?member.level:null;
 const specimen=level===null?null:LEVEL_ARTIFACTS[level-1];
 const awards=[...new Set(member.featuredAwards.filter(id=>Object.hasOwn(AWARDS,id)))].slice(0,3);
 const url=href||'/@'+member.handle;
 return <Link to={url} className={'av61-identity av61-identity--'+size+(className?' '+className:'')}
    aria-label={member.displayName+' @'+member.handle+(level===null?'':' · Level '+level+' '+specimen?.name)+(awards.length?' · '+awards.map(id=>AWARDS[id]).join(', '):'')}>
   <span className="av61-portrait-zone">
    <span className="av61-photo"><MemberPortrait name={member.displayName}
      src={member.avatar?(href==='/member'?'/api/v1/member/media/avatar':'/api/v1/members/'+member.handle+'/media/avatar'):undefined}
      supporterFrame={member.supporterAppearance?.frame}/></span>
    {specimen&&<span className="av61-specimen" title={'Evolution Level '+level+' · '+specimen.name}>
      <LevelEmblem level={level!} size={size==='compact'?38:44}/>
    </span>}
   </span>
   <span className="av61-member-copy">
    <strong className="av61-member-name">{member.displayName}</strong>
    <small className="av61-member-handle">@{member.handle}</small>
    <span className="av61-member-rewards">
     {specimen&&<span className="av61-level-label" title={specimen.name}>LVL {String(level).padStart(2,'0')} <span className="av61-specimen-name">· {specimen.name}</span></span>}
     {awards.length>0&&<span className="av61-award-list" aria-label="Featured earned awards">{awards.map(id=><span key={id} title={AWARDS[id]} className="av61-award"><AwardEmblem award={id}/></span>)}</span>}
     {member.supporterAppearance&&<span className="av61-supporter"><SupporterIdentity appearance={member.supporterAppearance} compact/></span>}
    </span>
   </span>
  </Link>;
}
