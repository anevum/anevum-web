import {useEffect,useMemo,useState,type ReactNode} from 'react';
import {Link,NavLink,useLocation} from 'react-router-dom';
import {Icon} from '../components/Icons';
import {studioList,studioGet,studioAssets,type StudioProject,type StudioAsset} from '../lib/canonical-studio';
import {readWithDeadline} from '../../../shared/read-deadline.mjs';
import './studio-spatial-workspace-v136.css';

const projectIdPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
type PrivateDirectory={projects:StudioProject[];canReview:boolean;uploadsReady:boolean};
type PrivateDetail={project:StudioProject|null;assets:StudioAsset[]|null;assetError:string};
type ReadState<T>={key:string;phase:'loading'|'ready'|'error';data:T|null;error:string};
const explanation='Private project files are quarantined and are not published or made playable by being listed here.';
function validProject(value:unknown):value is StudioProject{
  if(!value||typeof value!=='object'||Array.isArray(value))return false;
  const item=value as Partial<StudioProject>;
  return typeof item.id==='string'&&projectIdPattern.test(item.id)&&
    typeof item.title==='string'&&typeof item.category==='string'&&
    typeof item.status==='string'&&typeof item.revision==='number'&&
    typeof item.updatedAt==='number';
}
function validAsset(value:unknown):value is StudioAsset{
  if(!value||typeof value!=='object'||Array.isArray(value))return false;
  const asset=value as Partial<StudioAsset>;
  return typeof asset.id==='string'&&/^[a-f0-9]{32}$/.test(asset.id)&&
    typeof asset.name==='string'&&typeof asset.kind==='string'&&
    typeof asset.status==='string'&&typeof asset.sizeBytes==='number';
}
const human=(value:string)=>value.replaceAll('_',' ').toUpperCase();
function readError(value:unknown){
  return value instanceof Error?value.message:'The private Studio service is unavailable.';
}
/** A route-aware, read-only console chrome around the canonical Studio.
 * The canonical editor and all save, submit, review and upload controls remain
 * independently owned and unchanged. No private content reaches world shaders.
 */
export function StudioSpatialWorkspaceV136({memberId,children}:{
  memberId:string;children:ReactNode
}){
  const location=useLocation();
  const [railOpen,setRailOpen]=useState(()=>typeof window!=='undefined'&&
    window.matchMedia('(min-width: 1024px)').matches);
  const [query,setQuery]=useState('');
  const [refresh,setRefresh]=useState(0);
  const [directory,setDirectory]=useState<ReadState<PrivateDirectory>>({
    key:'',phase:'loading',data:null,error:''
  });
  const [detail,setDetail]=useState<ReadState<PrivateDetail>>({
    key:'',phase:'loading',data:null,error:''
  });
  const recordId=(location.pathname.match(/^\/studio\/([a-f0-9-]{36})$/)?.[1]||'');
  const selectedId=projectIdPattern.test(recordId)?recordId:null;
  const directoryKey=memberId+':'+refresh+':'+location.pathname;
  const detailKey=memberId+':'+(selectedId||'');
  useEffect(()=>{
    const controller=new AbortController();
    setDirectory({key:directoryKey,phase:'loading',data:null,error:''});
    readWithDeadline(signal=>studioList(signal),controller.signal).then(result=>{
      if(controller.signal.aborted)return;
      if(!result||!Array.isArray(result.projects)||typeof result.canReview!=='boolean'||
        typeof result.uploadsReady!=='boolean'||!result.projects.every(validProject))
        throw Error('Invalid private Studio directory response.');
      setDirectory({key:directoryKey,phase:'ready',data:{
        projects:result.projects.slice().sort((a,b)=>b.updatedAt-a.updatedAt),
        canReview:result.canReview,uploadsReady:result.uploadsReady
      },error:''});
    }).catch(error=>{
      if(!controller.signal.aborted)setDirectory({key:directoryKey,phase:'error',data:null,error:readError(error)});
    });
    return()=>controller.abort();
  },[directoryKey]);
  useEffect(()=>{
    if(!selectedId){
      setDetail({key:detailKey,phase:'ready',data:null,error:''});
      return;
    }
    const controller=new AbortController();
    setDetail({key:detailKey,phase:'loading',data:null,error:''});
    // Project and asset reads are independently authorized by the canonical
    // HttpOnly session. Partial asset failure never implies the asset list is empty.
    Promise.allSettled([
      readWithDeadline(signal=>studioGet(selectedId,signal),controller.signal),
      readWithDeadline(signal=>studioAssets(selectedId,signal),controller.signal)
    ]).then(([projectResult,assetsResult])=>{
      if(controller.signal.aborted)return;
      if(projectResult.status==='rejected'){
        setDetail({key:detailKey,phase:'error',data:null,error:readError(projectResult.reason)});
        return;
      }
      const record=projectResult.value?.project;
      if(!validProject(record)||record.id!==selectedId){
        setDetail({key:detailKey,phase:'error',data:null,error:'Invalid private project response.'});
        return;
      }
      const raw=assetsResult.status==='fulfilled'?assetsResult.value?.assets:null;
      const assets=Array.isArray(raw)&&raw.every(validAsset)?raw:null;
      setDetail({key:detailKey,phase:'ready',data:{
        project:record,assets,
        assetError:assets===null?'Private assets cannot be listed right now.': ''
      },error:''});
    });
    return()=>controller.abort();
  },[detailKey,selectedId]);
  const current=directory.key===directoryKey?directory:null;
  const selected=detail.key===detailKey?detail:null;
  const projects=current?.phase==='ready'?current.data?.projects||[]:[];
  const matching=useMemo(()=>{
    const needle=query.trim().toLowerCase();
    return needle?projects.filter(p=>(p.title+' '+p.slug+' '+p.category).toLowerCase().includes(needle)):projects;
  },[projects,query]);
  const currentRoute=(location.pathname==='/studio'||location.pathname==='/studio/records')?'STUDIO INDEX':
    location.pathname==='/studio/new'?'NEW PRIVATE RECORD':
    location.pathname.startsWith('/studio/packages')?'PLAYABLE WORKSPACE':
    location.pathname==='/studio/review'?'REVIEW DESK':
    selectedId?'PROJECT EDITOR':'CREATOR WORKSPACE';
  return <div className="p136-studio-console" data-studio-console="v136.009" data-explorer-open={railOpen}>
    <div className="p136-studio-console-head">
      <div className="p136-studio-console-led" aria-hidden="true"/>
      <div className="p136-studio-console-headline">
        <span>CONTINUANCE INSTITUTE / AUTHORING SYSTEM</span>
        <strong>{currentRoute}</strong>
      </div>
      <span className="p136-studio-console-private"><Icon name="save" size={13}/> PRIVATE SESSION</span>
      <button type="button" className="p136-studio-console-toggle"
        aria-expanded={railOpen} aria-controls="p136-studio-explorer"
        onClick={()=>setRailOpen(x=>!x)}>
        <Icon name="library" size={18}/>{railOpen?'Hide explorer':'Project explorer'}
      </button>
    </div>
    <div className="p136-studio-console-layout">
      {railOpen&&<aside id="p136-studio-explorer" className="p136-studio-console-explorer"
        aria-label="Private Studio project explorer">
        <div className="p136-studio-console-kicker">WORKSPACE NAVIGATOR <span>01</span></div>
        <nav className="p136-studio-console-shortcuts" aria-label="Studio workspace destinations">
          <NavLink to="/studio" end><Icon name="home" size={16}/> Studio home</NavLink>
          <NavLink to="/studio/records" end><Icon name="library" size={16}/> Private records</NavLink>
          <NavLink to="/studio/packages"><Icon name="create" size={16}/> Playable builds</NavLink>
          <NavLink to="/studio/new" end><Icon name="star" size={16}/> New private record</NavLink>
          {current?.data?.canReview===true&&<NavLink to="/studio/review" end><Icon name="status" size={16}/> Review desk</NavLink>}
        </nav>
        <div className="p136-studio-console-divider"/>
        <div className="p136-studio-console-row">
          <strong>PROJECT RECORDS</strong>
          <button type="button" className="p136-studio-console-refresh"
            onClick={()=>setRefresh(n=>n+1)} aria-label="Refresh private project records">
            <Icon name="status" size={15}/>
          </button>
        </div>
        <label className="p136-studio-console-find">
          <span className="visually-hidden">Find my private projects</span>
          <Icon name="search" size={16}/>
          <input type="search" value={query} onChange={e=>setQuery(e.target.value)}
            placeholder="Find a project" maxLength={100}/>
        </label>
        {(!current||current.phase==='loading')&&
          <p className="p136-studio-console-message" role="status">Reading your private project directory…</p>}
        {current?.phase==='error'&&<div className="p136-studio-console-message" role="alert">
          <p>Private project directory unavailable.</p>
          <button type="button" onClick={()=>setRefresh(n=>n+1)}>Retry</button>
        </div>}
        {current?.phase==='ready'&&<>
          <p className="p136-studio-console-count">{matching.length} OF {projects.length} PRIVATE RECORDS</p>
          <nav className="p136-studio-console-tree" aria-label="My private projects">
            {matching.map(p=><Link key={p.id} to={'/studio/'+p.id}
              aria-current={p.id===selectedId?'page':undefined} title={p.title}>
              <span className="p136-studio-console-tree-icon" aria-hidden="true"><Icon name="library" size={17}/></span>
              <span className="p136-studio-console-tree-label"><strong>{p.title}</strong><small>{human(p.status)} · REV {p.revision}</small></span>
            </Link>)}
            {matching.length===0&&<p className="p136-studio-console-message">
              {projects.length===0?'No private project records yet.':'No projects match this search.'}
            </p>}
          </nav>
        </>}
        <div className="p136-studio-console-footnote">
          <span className="p136-studio-console-dot" aria-hidden="true"/>
          Protected by your verified session. Nothing in this explorer is public.
        </div>
      </aside>}
      <div className="p136-studio-console-stage" data-studio-stage="canonical">
        {children}
      </div>
      {selectedId&&<aside className="p136-studio-console-inspector" aria-label="Selected project inspector">
        <div className="p136-studio-console-kicker">CONTEXT INSPECTOR <span>02</span></div>
        {(!selected||selected.phase==='loading')&&
          <p className="p136-studio-console-message" role="status">Inspecting private record…</p>}
        {selected?.phase==='error'&&<p className="p136-studio-console-message" role="alert">
          {selected.error}
        </p>}
        {selected?.phase==='ready'&&selected.data?.project&&<>
          <div className="p136-studio-console-inspector-head">
            <strong>{selected.data.project.title}</strong>
            <span>{human(selected.data.project.status)} / REV {selected.data.project.revision}</span>
          </div>
          <p className="p136-studio-console-kicker">PRIVATE ATTACHMENTS</p>
          {selected.data.assets===null?<p className="p136-studio-console-message" role="status">
            {selected.data.assetError}</p>:
            <ul className="p136-studio-console-assets">
              {selected.data.assets.map(asset=><li key={asset.id}>
                <Icon name="library" size={17}/>
                <span><strong>{asset.name}</strong>
                  <small>{human(asset.kind)} / {human(asset.status)} / {(asset.sizeBytes/1048576).toFixed(2)} MiB</small>
                </span>
              </li>)}
              {selected.data.assets.length===0&&<li className="p136-studio-console-message">No attached files in this private record.</li>}
            </ul>}
          <p className="p136-studio-console-footnote">{explanation}</p>
          <Link className="p136-studio-console-view" to={'/studio/'+selected.data.project.id}>
            <Icon name="arrow" size={15}/> Edit canonical project record
          </Link>
        </>}
      </aside>}
    </div>
  </div>;
}
