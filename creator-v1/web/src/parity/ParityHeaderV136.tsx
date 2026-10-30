import type {FormEvent, RefObject} from "react";
import {Link,NavLink} from "react-router-dom";
import {OrbitalMark} from "../components/OrbitalMark";
import {Icon} from "../components/Icons";
import {HEADER_NAV} from "../lib/site-navigation";
type Props={memberDestination:string;canonicalMember:boolean;query:string;onQuery:(v:string)=>void;onSearch:(e:FormEvent<HTMLFormElement>)=>void;onOpenLauncher:()=>void;onOpenIren:()=>void;menuOpen:boolean;onToggleMenu:()=>void;menuButton:RefObject<HTMLButtonElement|null>};
export function ParityHeaderV136({memberDestination,canonicalMember,query,onQuery,onSearch,onOpenLauncher,onOpenIren,menuOpen,onToggleMenu,menuButton}:Props){
 return <header className="p136-header"><div className="p136-header-inner">
  <Link to="/" className="p136-brand" aria-label="ANEVUM homepage"><OrbitalMark className="p136-brand-mark"/><span><strong>ANEVUM</strong><small>INDEPENDENT CREATIVE STUDIO</small></span></Link>
  <nav data-iren-anchor="navigation-desktop" className="p136-main-nav" aria-label="Primary navigation">{HEADER_NAV.map(({to,label})=><NavLink key={to} to={to} end={to==="/"} className={({isActive})=>isActive?"is-active":""}>{label}</NavLink>)}</nav>
  <form role="search" className="p136-header-search" onSubmit={onSearch}><Icon name="search" size={19}/><input type="search" maxLength={100} aria-label="Search published projects" placeholder="Search approved work..." value={query} onChange={e=>onQuery(e.target.value)}/><kbd aria-hidden="true">↵</kbd></form>
  <div className="p136-header-actions"><button type="button" className="p136-header-iren" onClick={onOpenIren}>IREN</button><button type="button" className="p136-mobile-search" onClick={onOpenLauncher} aria-label="Search ANEVUM"><Icon name="search" size={20}/></button><Link to={memberDestination} className="p136-account" aria-label={canonicalMember?"My member space":"Join ANEVUM"}><Icon name="people" size={20}/></Link><button data-iren-anchor="navigation" ref={menuButton} type="button" className="p136-nav-menu" onClick={onToggleMenu} aria-label={menuOpen?"Close site navigation":"Open site navigation"} aria-controls="av79-navigation" aria-haspopup="dialog" aria-expanded={menuOpen}><Icon name={menuOpen?"close":"menu"} size={21}/></button></div>
 </div></header>;
}