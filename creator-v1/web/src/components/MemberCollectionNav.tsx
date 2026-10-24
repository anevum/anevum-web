import {Link} from 'react-router-dom';
import {MEMBER_COLLECTION_DESTINATIONS,type MemberCollectionSection} from '../lib/member-collection-map';
import '../member-collection-nav.css';

/** Source-only UI flag. Feature is absent from normal builds. Existing private
 * resource loaders and account boundaries are left untouched. */
export const MEMBER_COLLECTION_NAV_REVIEW=import.meta.env.VITE_MEMBER_COLLECTION_NAV_REVIEW==='true';

export function MemberCollectionNav({current}: {current:MemberCollectionSection}){
 if(!MEMBER_COLLECTION_NAV_REVIEW)return null;
 return <nav className="mc-hub-nav" aria-label="My collection navigation">
  <div className="mc-hub-heading"><span className="mc-hub-eyebrow">YOUR COLLECTION</span><span className="mc-hub-subtitle">One place for the things that belong to you.</span></div>
  <div className="mc-hub-links">{MEMBER_COLLECTION_DESTINATIONS.map(item=>
   <Link key={item.id} to={item.to} aria-current={current===item.id?'page':undefined}
    title={item.description} className={'mc-hub-link'+(current===item.id?' is-active':'')}>
    {item.label}
   </Link>)}</div>
 </nav>;
}
