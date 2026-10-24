import {useState} from 'react';
import {Link} from 'react-router-dom';
import {Icon} from '../components/Icons';
import {OrbitalMark} from '../components/OrbitalMark';
import {StudioAssetShelfV116,type StudioAsset} from './StudioAssetShelfV116';
import type {StudioModeV116} from './StudioNavigationV116';

export function StudioOtherModesV116({mode,onAdd}:{
 mode:Exclude<StudioModeV116,'Scene'|'Playtest'>;onAdd:(asset:StudioAsset)=>void
}){
 const [frame,setFrame]=useState<'desktop'|'mobile'>('desktop');
 const [interfaceTitle,setInterfaceTitle]=useState('Explore the Continuance');
 const [interfaceAction,setInterfaceAction]=useState('Enter world');
 const [interfaceTheme,setInterfaceTheme]=useState<'cosmic'|'auric'>('cosmic');
 const [demoClicked,setDemoClicked]=useState(false);
 const [tab,setTab]=useState<'scene.ts'|'interface.css'>('scene.ts');
 const [code,setCode]=useState({
  'scene.ts':'// ANEVUM / local source sample\n// Displayed text is NOT executed or published.\n\nexport const world = {\n  name: "Sky Archipelago",\n  editor: "Creator Studio",\n  atmosphere: "celestial"\n};\n',
  'interface.css':'/* ANEVUM / local style sample */\n.world-screen {\n  background: #071727;\n  color: #e9f5ff;\n  border: 1px solid #547d9b;\n}\n'
 });
 if(mode==='Assets')return <div className="csn-alternate csn-asset-mode">
  <div className="csn-mode-intro"><div><span>ASSET FOUNDRY / OWNED & PROCEDURAL</span><h2>Build your world from the elements.</h2>
   <p>Each available starter adds an actual primitive to the unsaved in-memory 3D scene. Future imports are marked preview-only.</p></div></div>
  <StudioAssetShelfV116 onAdd={onAdd} expanded onToggle={()=>{}} large/>
 </div>;
 if(mode==='Interface')return <div className="csn-alternate">
  <div className="csn-mode-intro"><div><span>INTERFACE BUILDER / LOCAL SAMPLE</span><h2>Design an experience, not just a screen.</h2>
   <p>A visual component editor with responsive preview. This sample does not overwrite the existing V113 declarative interface document.</p></div>
   <div className="csn-frame-toggle" role="group" aria-label="Responsive interface preview"><button type="button" aria-pressed={frame==='desktop'} onClick={()=>setFrame('desktop')}>Desktop</button><button type="button" aria-pressed={frame==='mobile'} onClick={()=>setFrame('mobile')}>Mobile</button></div>
  </div>
  <div className="csn-interface-layout">
   <div className="csn-interface-preview-zone">
    <div className={'csn-interface-canvas '+(frame==='mobile'?'is-phone':'')}>
     <div className="csn-interface-window"><span/><span/><span/><small>WORKSPACE / INTERFACE PREVIEW</small></div>
     <div className={'csn-interface-preview '+(interfaceTheme==='auric'?'is-auric':'')}>
      <OrbitalMark className="csn-preview-mark"/>
      <span>ANEVUM / CONTINUANCE INSTITUTE</span>
      <h3>{interfaceTitle||'Untitled experience'}</h3>
      <p>Build worlds. Create experiences. Design what doesn't exist yet.</p>
      <button type="button" onClick={()=>setDemoClicked(x=>!x)}>{demoClicked?'Sample action confirmed':interfaceAction||'Continue'} <Icon name="arrow" size={15}/></button>
      {demoClicked&&<small role="status">Local button state updated. Nothing was saved or published.</small>}
     </div>
    </div>
   </div>
   <div className="csn-interface-editor">
    <div className="csn-panel-eyebrow">COMPONENT PROPERTIES</div>
    <label>Heading<input value={interfaceTitle} maxLength={75} onChange={e=>setInterfaceTitle(e.target.value)}/></label>
    <label>Button label<input value={interfaceAction} maxLength={36} onChange={e=>setInterfaceAction(e.target.value)}/></label>
    <div className="csn-panel-eyebrow">VISUAL PRESET</div>
    <div className="csn-frame-toggle" role="group" aria-label="Sample theme"><button type="button" aria-pressed={interfaceTheme==='cosmic'} onClick={()=>setInterfaceTheme('cosmic')}>Celestial</button><button type="button" aria-pressed={interfaceTheme==='auric'} onClick={()=>setInterfaceTheme('auric')}>Auric</button></div>
    <div className="csn-nonpersistent">Sample controls affect the visual preview only. Real V113 components, file revisions and publishing are separate gated capabilities.</div>
   </div>
  </div>
 </div>;
 if(mode==='Scripts')return <div className="csn-alternate">
  <div className="csn-mode-intro"><div><span>CODE & LOGIC / RESTRICTED SAMPLE</span><h2>Write the systems behind your world.</h2>
   <p>Source editing with clear file context. Text is local to this preview, is not executed, and never replaces a V111 project revision.</p></div></div>
  <div className="csn-code-shell">
   <div className="csn-code-filetabs" role="tablist" aria-label="Sample source files">
    {(['scene.ts','interface.css'] as const).map(f=><button type="button" role="tab" key={f} aria-selected={tab===f} onClick={()=>setTab(f)}>{f}</button>)}
    <span>UNSAVED / SAMPLE</span>
   </div>
   <div className="csn-code-content"><aside aria-hidden="true">{code[tab].split('\n').map((_,i)=><span key={i}>{i+1}</span>)}</aside>
    <textarea aria-label={'Edit synthetic '+tab} value={code[tab]} onChange={e=>setCode(v=>({...v,[tab]:e.target.value}))}
     maxLength={32000} spellCheck={false} autoCapitalize="off" autoCorrect="off"/></div>
   <div className="csn-code-status"><span>{tab} · UTF-8 SAMPLE</span><span>{new TextEncoder().encode(code[tab]).length.toLocaleString()} bytes</span><span>Execution disabled</span></div>
  </div>
  <div className="csn-nonpersistent">For authenticated, revisioned source files, use the existing private Creator Studio workspace after its access gate is enabled.</div>
 </div>;
 return <div className="csn-alternate csn-publish">
  <div className="csn-mode-intro"><div><span>PUBLISH & DEPLOY / RELEASE GATES</span><h2>From private creation to reviewed experience.</h2>
   <p>A professional release flow must distinguish local work from server-confirmed revisions, package playtests and approved publication.</p></div></div>
  <div className="csn-publish-grid">
   <div className="csn-publish-card"><span>01 / WORLD DOCUMENT</span><h3>Local 3D prototype</h3><p>The GPU editor is operational in this review. Its unsaved sample is not a deployable member package.</p><strong className="csn-publish-status is-local">LOCAL ONLY</strong></div>
   <div className="csn-publish-card"><span>02 / PRIVATE REVISION</span><h3>Save a verified build</h3><p>Requires the existing owner-scoped V111 file service and separately approved migration.</p><strong className="csn-publish-status">NOT CONNECTED</strong></div>
   <div className="csn-publish-card"><span>03 / PLAYTEST & REVIEW</span><h3>Package and validate</h3><p>Existing native package workflow remains authoritative for sandboxed executable content and moderation.</p><strong className="csn-publish-status">INDEPENDENT GATE</strong></div>
  </div>
  <div className="csn-publish-links"><Link to="/studio/packages">Open existing package workflow <Icon name="arrow" size={16}/></Link><Link to="/studio/records">View creator records <Icon name="arrow" size={16}/></Link></div>
 </div>;
}
