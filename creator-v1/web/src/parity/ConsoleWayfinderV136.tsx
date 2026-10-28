import {useEffect,useRef,type KeyboardEvent} from 'react';
import {NavLink,useLocation} from 'react-router-dom';
import {Icon} from '../components/Icons';
import {OrbitalMark} from '../components/OrbitalMark';
import {isSiteLinkSelected} from '../lib/site-navigation';
import {useLivingWorld,type WorldSector} from './LivingWorldState';
import './console-wayfinder-v136.css';

const stations=[
 {to:'/',label:'Home',small:'Entrance',icon:'home',sector:'hero'},
 {to:'/severance',label:'Severance',small:'Game',icon:'games',sector:'hero'},
 {to:'/discover',label:'Discover',small:'Projects',icon:'explore',sector:'portal'},
 {to:'/status',label:'Status',small:'Build',icon:'status',sector:'portal'}
] as const satisfies ReadonlyArray<{to:string;label:string;small:string;icon:string;sector:WorldSector}>;
type Props={onOpenSearch:()=>void;onOpenIren:()=>void;memberDestination:string;memberLabel:string;memberInitial:string|null};
export function ConsoleWayfinderV136({onOpenSearch,onOpenIren,memberDestination,memberLabel,memberInitial}:Props){
 const {setPreviewSector}=useLivingWorld();
 const location=useLocation();
 const ref=useRef<HTMLElement>(null);
 // Keep the visual selection marker on the same canonical section as NavLink,
 // including nested creator, Commons and Studio screens.
 const index=stations.findIndex(s=>isSiteLinkSelected(location.pathname,s.to));
 useEffect(()=>{setPreviewSector(null)},[location.pathname,location.search,setPreviewSector]);
 useEffect(()=>()=>setPreviewSector(null),[setPreviewSector]);
 function onKey(event:KeyboardEvent<HTMLElement>){
   if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key))return;
   const links=Array.from(ref.current?.querySelectorAll<HTMLAnchorElement>('a[data-station]')||[]);
   if(!links.length)return;
   const selected=links.indexOf(document.activeElement as HTMLAnchorElement);
   const step=event.key==='ArrowRight'||event.key==='ArrowDown'?1:-1;
   const next=event.key==='Home'?0:event.key==='End'?links.length-1:selected<0?(step===1?0:links.length-1):(selected+step+links.length)%links.length;
   event.preventDefault();links[next].focus();
 }
 return <nav ref={ref} className="p136-console-wayfinder" aria-label="ANEVUM console wayfinder" onKeyDown={onKey} onMouseLeave={()=>setPreviewSector(null)} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node))setPreviewSector(null)}}>
   <span className="p136-console-ident" aria-hidden="true"><OrbitalMark className="p136-console-ident-mark"/><span>ANEVUM / CONTINUANCE</span></span>
   <div className="p136-console-stations">
     {stations.map((station,i)=><NavLink data-station="" key={station.to} to={station.to} end={station.to==='/'} aria-label={station.label} onFocus={()=>setPreviewSector(station.sector)} onMouseEnter={()=>setPreviewSector(station.sector)}
       className={({isActive})=>'p136-console-station'+(isActive?' is-active':'')} data-sector={station.sector}>
       <span className="p136-console-icon"><Icon name={station.icon} size={20}/></span>
       <span className="p136-console-title"><strong>{station.label}</strong><small>{station.small}</small></span>
       {i===index&&<span className="p136-console-selection" aria-hidden="true"/>}
     </NavLink>)}
   </div>
   <div className="p136-console-utilities">
    <button type="button" className="p136-console-command" onClick={onOpenSearch} aria-label="Search and quick navigation" title="Search and quick navigation">
      <Icon name="search" size={19}/><span>COMMAND</span><kbd>⌘ K</kbd>
    </button>
    <button type="button" className="p136-console-ir" onClick={onOpenIren} aria-label="Open IREN companion">
      <span className="p136-console-ir-light" aria-hidden="true"/> <span>IREN</span>
    </button>
    <NavLink to={memberDestination} className="p136-console-member" aria-label={memberLabel}>
       <span className="p136-console-member-orbit" aria-hidden="true">{memberInitial||<Icon name="people" size={18}/>}</span>
    </NavLink>
   </div>
 </nav>;
}
