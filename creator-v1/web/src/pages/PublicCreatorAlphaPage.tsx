import {useEffect,useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import {ALPHA_MAX_CSS,ALPHA_MAX_HTML,alphaTemplates,buildAlphaDocument,type AlphaSource} from '../lib/public-alpha-v096';
import './public-alpha-v096.css';

type Viewport='phone'|'tablet'|'desktop';
type Tab='html'|'css';
const initial=alphaTemplates[0];
const frameWidths:Record<Viewport,string>={phone:'390px',tablet:'768px',desktop:'100%'};

function exportLocalHTML(source:AlphaSource){
 const doc=buildAlphaDocument(source);
 const blob=new Blob([doc],{type:'text/html;charset=utf-8'});
 const url=URL.createObjectURL(blob);
 const anchor=document.createElement('a');
 anchor.href=url;anchor.download='anevum-guest-creation.html';
 document.body.append(anchor);anchor.click();anchor.remove();
 window.setTimeout(()=>URL.revokeObjectURL(url),1000);
}

export function PublicCreatorAlphaPage(){
 const [template,setTemplate]=useState(initial.id);
 const [source,setSource]=useState<AlphaSource>(()=>({...initial.source}));
 const [preview,setPreview]=useState(()=>buildAlphaDocument(initial.source));
 const [revision,setRevision]=useState(0);
 const [viewport,setViewport]=useState<Viewport>('phone');
 const [tab,setTab]=useState<Tab>('html');
 const [live,setLive]=useState(true);
 const [notice,setNotice]=useState('Ready for your first experiment.');
 const editor=useRef<HTMLTextAreaElement|null>(null);
 const dirty=preview!==buildAlphaDocument(source);
 useEffect(()=>{
  if(!live)return;
  const timer=window.setTimeout(()=>{
   setPreview(buildAlphaDocument(source));
   setRevision(x=>x+1);
  },380);
  return()=>window.clearTimeout(timer);
 },[source,live]);
 useEffect(()=>{
  // A different route never inherits a guest's unsaved scratchpad.
  return()=>{editor.current=null};
 },[]);

 function chooseTemplate(id:string){
  const selected=alphaTemplates.find(item=>item.id===id);
  if(!selected)return;
  if((source.html!==alphaTemplates.find(item=>item.id===template)?.source.html||
      source.css!==alphaTemplates.find(item=>item.id===template)?.source.css)&&
     !window.confirm('Replace this temporary experiment with a starter layout? Export your HTML first if you want to keep it.'))return;
  setTemplate(id);
  setSource({...selected.source});
  setPreview(buildAlphaDocument(selected.source));
  setRevision(x=>x+1);
  setNotice('Loaded '+selected.name+'. This experiment is only in this browser tab.');
 }
 function update(value:string){
  const field=tab;
  const limit=field==='html'?ALPHA_MAX_HTML:ALPHA_MAX_CSS;
  setSource(s=>({...s,[field]:value.slice(0,limit)}));
  setNotice('Local changes have not been saved to ANEVUM.');
 }
 function run(){
  setPreview(buildAlphaDocument(source));setRevision(x=>x+1);
  setNotice('Local preview refreshed. No files were uploaded.');
 }
 function download(){
  exportLocalHTML(source);
  setNotice('Exported one HTML file to your device. Nothing was uploaded.');
 }
 const value=source[tab],limit=tab==='html'?ALPHA_MAX_HTML:ALPHA_MAX_CSS;
 return <section className="ap96-root" aria-labelledby="ap96-heading" data-public-alpha="v096">
  <header className="ap96-top">
   <div><p className="ap96-eyebrow">ANEVUM / CONTINUANCE INSTITUTE / CREATOR STUDIO</p>
    <span className="ap96-tag">PUBLIC EXPERIMENT / ALPHA</span>
    <h1 id="ap96-heading">Your next idea <em>starts here.</em></h1>
    <p className="ap96-intro">No invitation. No extra login. Open the link, make something, and see it take shape. Start with a template or write your own HTML and CSS.</p>
    <div className="ap96-access"><span className="ap96-access-dot" aria-hidden="true"/> Public to anyone with the URL · Unlisted · No cloud storage</div>
   </div>
   <aside className="ap96-access-panel">
    <strong>01 / TRY IT FIRST</strong>
    <p>You're editing in a temporary local workspace. Refreshing or leaving may lose your edits.</p>
    <Link to="/join">Sign in to ANEVUM <span aria-hidden="true">↗</span></Link>
    <small>Account creation unlocks the separately protected private Studio where available. This guest experiment does not transfer automatically.</small>
   </aside>
  </header>

  <section className="ap96-template-panel" aria-labelledby="ap96-template-heading">
   <div><p className="ap96-eyebrow">STARTING SIGNAL</p><h2 id="ap96-template-heading">Choose your canvas.</h2></div>
   <div className="ap96-template-list">
    {alphaTemplates.map(item=><button key={item.id} type="button"
      className={'ap96-template'+(template===item.id?' is-current':'')}
      aria-pressed={template===item.id} onClick={()=>chooseTemplate(item.id)}>
      <strong>{item.name}</strong><span>{item.detail}</span>
    </button>)}
   </div>
  </section>

  <section className="ap96-workspace" aria-label="Anonymous creation workspace">
   <div className="ap96-workspace-bar">
    <div className="ap96-window-mark"><span/><span/><span/></div>
    <div className="ap96-window-title"><strong>CREATOR / LOCAL WORKSPACE</strong><span>Nothing here is published</span></div>
    <button type="button" className="ap96-download" onClick={download}>Export HTML <span aria-hidden="true">↗</span></button>
   </div>
   <div className="ap96-editor-grid">
    <section className="ap96-code-pane" aria-label="Source editor">
     <div className="ap96-code-bar">
      <div className="ap96-tabs" role="group" aria-label="Source file">
       <button type="button" className={tab==='html'?'is-active':''} aria-pressed={tab==='html'} onClick={()=>setTab('html')}>index.html</button>
       <button type="button" className={tab==='css'?'is-active':''} aria-pressed={tab==='css'} onClick={()=>setTab('css')}>styles.css</button>
      </div>
      <span className="ap96-code-count">{value.length.toLocaleString()} / {limit.toLocaleString()}</span>
     </div>
     <div className="ap96-code-surface">
      <div className="ap96-code-gutter" aria-hidden="true">{Array.from({length:Math.min(value.split('\n').length+5,32)},(_,i)=><span key={i}>{i+1}</span>)}</div>
      <textarea ref={editor} id="ap96-source" aria-label={tab==='html'?'Edit HTML source':'Edit CSS source'}
       value={value} onChange={event=>update(event.target.value)}
       spellCheck={false} autoCapitalize="off" autoCorrect="off"
       maxLength={limit} rows={17} wrap="off"/>
     </div>
     <footer className="ap96-code-footer">
      <span><span className="ap96-local-dot"/> Browser only</span>
      <span>{tab==='html'?'HTML5':'CSS3'} · {value.split('\n').length} lines</span>
     </footer>
    </section>
    <section className="ap96-preview-pane" aria-label="Live design preview">
     <div className="ap96-preview-bar">
      <div><p className="ap96-preview-kicker">PREVIEW / IN THIS TAB</p><strong>See what you're making.</strong></div>
      <div className="ap96-devices" role="group" aria-label="Preview screen width">
       {(['phone','tablet','desktop'] as const).map(name=><button type="button" key={name}
          aria-pressed={viewport===name} className={viewport===name?'is-active':''}
          onClick={()=>setViewport(name)}>{name}</button>)}
      </div>
     </div>
     <div className="ap96-stage">
      <div className={'ap96-stage-frame ap96-stage-'+viewport} style={{width:frameWidths[viewport]}}>
       <div className="ap96-stage-chrome"><span aria-hidden="true"/> <strong>{viewport} view</strong><span>LOCAL / SAFE PREVIEW</span></div>
       <iframe key={revision} title="Anonymous HTML and CSS preview" sandbox=""
         referrerPolicy="no-referrer" srcDoc={preview} className="ap96-frame"/>
      </div>
     </div>
     <div className="ap96-preview-footer">
      <label><input type="checkbox" checked={live} onChange={event=>setLive(event.target.checked)}/> Auto-preview</label>
      <span aria-live="polite">{dirty?'Pending changes':'Preview current'}</span>
      <button type="button" onClick={run}>Run preview</button>
     </div>
    </section>
   </div>
  </section>

  <div className="ap96-end">
   <p role="status" aria-live="polite" className="ap96-notice">{notice}</p>
   <div className="ap96-guidelines">
    <p><strong>What works:</strong> HTML, CSS, responsive layout, simple native controls, and one-file export.</p>
    <p><strong>Not active in guest mode:</strong> JavaScript execution, third-party networking, cloud storage, uploads, publishing, staff review, and earned XP.</p>
   </div>
   <div className="ap96-next">
    <div><p className="ap96-eyebrow">READY TO BUILD FURTHER?</p><h2>Make something worth sharing.</h2><p>Keep the exported file, then use the authenticated Creator Studio for private project records and the reviewed publishing process.</p></div>
    <Link to="/studio">Explore Creator Studio <span aria-hidden="true">↗</span></Link>
   </div>
  </div>
 </section>;
}
