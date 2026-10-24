/**
 * ANEVUM NEXT / V134.
 * Review-only, local interactive UI evidence for the shared visual language.
 * NOT the production Creator Studio and does not persist, execute JS, or publish.
 */
import {useMemo,useRef,useState,type KeyboardEvent,type ReactNode,type UIEvent} from "react";
import {OrbitalMark} from "../components/OrbitalMark";

type FileId="index.html"|"styles.css"|"main.ts";
type Material="nebula"|"metal"|"signal";
type PreviewTab="scene"|"html";
type EditorFiles=Record<FileId,string>;
const entries:readonly {id:FileId;label:string;icon:string;kind:string}[]=[
  {id:"index.html",label:"index.html",icon:"H",kind:"html"},
  {id:"styles.css",label:"styles.css",icon:"C",kind:"css"},
  {id:"main.ts",label:"main.ts",icon:"TS",kind:"typescript"}
];
const samples:EditorFiles={
  "index.html":[
    '<article class="world-card">',
    '  <span class="eyebrow">ANEVUM / OPEN WORLDS</span>',
    '  <h1>Imagine beyond the ordinary.</h1>',
    '  <p>Build, explore and share your next creation.</p>',
    '  <span class="world-link">Enter the world &rarr;</span>',
    '</article>'
  ].join("\n"),
  "styles.css":[
    ':root {',
    '  color-scheme: dark;',
    '  font-family: system-ui, sans-serif;',
    '}',
    'body {',
    '  margin: 0;',
    '  min-height: 100vh;',
    '  padding: 32px;',
    '  display: grid;',
    '  place-items: center;',
    '  background: #0b142b;',
    '  color: #f4f7ff;',
    '}',
    '.world-card {',
    '  max-width: 440px;',
    '  padding: 36px;',
    '  border-radius: 20px;',
    '  background: linear-gradient(130deg,#243763,#0e1830);',
    '  box-shadow: 0 24px 70px #020713;',
    '}',
    '.eyebrow { color: #93dafa; font-size: 12px; }',
    'h1 { font-size: 32px; line-height: 1.1; }',
    'p { color: #d2ddec; }',
    '.world-link { color: #d7a8ff; }'
  ].join("\n"),
  "main.ts":[
    '// ANEVUM / sample interaction contract',
    'type World = { title: string; published: boolean };',
    '',
    'const currentWorld: World = {',
    '  title: "A world in progress",',
    '  published: false',
    '};',
    '',
    'export function describeWorld(world: World): string {',
    '  return world.published ? "Live" : "Preview only";',
    '}',
    '',
    '// This example is colorized but NOT executed.'
  ].join("\n")
};
const tokenPattern=/(<!--[\s\S]*?-->|\/\*[\s\S]*?\*\/|\/\/[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|#[0-9a-fA-F]{3,8}\b|<\/?[A-Za-z][\w-]*|\b(?:export|import|const|let|function|return|if|else|interface|type|class|new|void|number|string|boolean|true|false|document)\b|\b\d+(?:\.\d+)?\b|\b(?:color|background|display|font-size|border-radius|padding|box-shadow)\b)/g;
function tokenClass(value:string){
  if(value.startsWith("//")||value.startsWith("/*")||value.startsWith("<!--"))return "comment";
  if(value.startsWith('"')||value.startsWith("'"))return "string";
  if(value.startsWith("#"))return "color";
  if(value.startsWith("<"))return "tag";
  if(/^\d/.test(value)||value==="true"||value==="false")return "number";
  return "keyword";
}
function coloredSource(raw:string):ReactNode[]{
  const nodes:ReactNode[]=[];
  let last=0,index=0;
  for(const match of raw.matchAll(tokenPattern)){
    const start=match.index ?? 0;
    if(start>last)nodes.push(raw.slice(last,start));
    const word=match[0];
    nodes.push(<span key={index++} className={"av134-token--"+tokenClass(word)}>{word}</span>);
    last=start+word.length;
  }
  if(last<raw.length)nodes.push(raw.slice(last));
  return nodes;
}
function isolatedPreview(html:string,css:string):string{
  // The opaque-origin sandbox disallows all scripts, forms and top navigation.
  // The CSP blocks every network request and all script execution.
  const csp="<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src 'none'; connect-src 'none'; media-src 'none'; frame-src 'none'; form-action 'none'; base-uri 'none'\">";
  return "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\">"+
    csp+"<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">"+
    "<style>"+css.replace(/<\/style/gi,"")+"</style></head><body>"+html+"</body></html>";
}
export function NextVisualLabV134(){
  const [files,setFiles]=useState<EditorFiles>(()=>({...samples}));
  const [active,setActive]=useState<FileId>("index.html");
  const [material,setMaterial]=useState<Material>("nebula");
  const [previewTab,setPreviewTab]=useState<PreviewTab>("scene");
  const editorRef=useRef<HTMLTextAreaElement>(null);
  const overlayRef=useRef<HTMLPreElement>(null);
  const gutterRef=useRef<HTMLPreElement>(null);
  const text=files[active];
  const lines=useMemo(()=>Array.from({length:text.split("\n").length},(_,i)=>i+1).join("\n"),[text]);
  const colored=useMemo(()=>coloredSource(text),[text]);
  const preview=useMemo(()=>isolatedPreview(files["index.html"],files["styles.css"]),[files]);
  const dirty=entries.some(item=>files[item.id]!==samples[item.id]);
  function setFile(id:FileId){setActive(id);}
  function changeText(next:string){
    if(next.length>12000)return;
    setFiles(current=>({...current,[active]:next}));
  }
  function handleScroll(event:UIEvent<HTMLTextAreaElement>){
    const {scrollTop,scrollLeft}=event.currentTarget;
    if(overlayRef.current){overlayRef.current.scrollTop=scrollTop;overlayRef.current.scrollLeft=scrollLeft;}
    if(gutterRef.current)gutterRef.current.scrollTop=scrollTop;
  }
  function handleEditorKeys(event:KeyboardEvent<HTMLTextAreaElement>){
    if(event.key!=="Tab")return;
    event.preventDefault();
    const input=event.currentTarget,start=input.selectionStart,end=input.selectionEnd;
    const next=text.slice(0,start)+"  "+text.slice(end);
    changeText(next);
    requestAnimationFrame(()=>{input.selectionStart=start+2;input.selectionEnd=start+2;});
  }
  function handleFileKeys(event:KeyboardEvent<HTMLButtonElement>,id:FileId){
    if(!["ArrowDown","ArrowUp","ArrowLeft","ArrowRight","Home","End"].includes(event.key))return;
    event.preventDefault();
    const i=entries.findIndex(entry=>entry.id===id);
    const dest=event.key==="Home"?0:event.key==="End"?entries.length-1:
      (i+(event.key==="ArrowDown"||event.key==="ArrowRight"?1:-1)+entries.length)%entries.length;
    setFile(entries[dest].id);
    const all=event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    all?.[dest]?.focus();
  }
  function resetSample(){setFiles({...samples});}
  return <section className="av134-lab" aria-labelledby="av134-lab-title">
    <div className="av134-heading">
      <div>
        <p className="av134-kicker">ANEVUM / Continuance Institute / NEXT design review</p>
        <h1 id="av134-lab-title">A more cohesive creative workspace.</h1>
        <p>Explore the implemented visual language: orbital depth, purposeful glass, clear navigation, file colors and editable code.</p>
      </div>
      <span className="av134-chip">SOURCE PREVIEW / NOT PUBLISHED</span>
    </div>
    <div className="av134-workspace">
      <header className="av134-toolbar">
        <div className="av134-toolbar-brand"><OrbitalMark/> <span>CREATOR STUDIO / VISUAL SYSTEM LAB</span></div>
        <span className="av134-local">LOCAL REVIEW ONLY <small>· No server writes</small></span>
      </header>
      <div className="av134-tree" role="tablist" aria-label="Sample project files">
        <p className="av134-pane-label">EXPLORER / SAMPLE PROJECT</p>
        {entries.map(item=><button
          type="button" role="tab" id={"av134-tab-"+item.kind}
          aria-controls="av134-editor-panel" aria-selected={active===item.id}
          tabIndex={active===item.id?0:-1}
          key={item.id} className="av134-file"
          onClick={()=>setFile(item.id)}
          onKeyDown={e=>handleFileKeys(e,item.id)}>
          <span className={"av134-file-icon av134-file-icon--"+item.kind} aria-hidden="true">{item.icon}</span>
          <span className="av134-file-name">{item.label}</span>
        </button>)}
      </div>
      <div className="av134-source" id="av134-editor-panel" role="tabpanel" aria-labelledby={"av134-tab-"+entries.find(e=>e.id===active)!.kind}>
        <div className="av134-source-title">
          <strong>{active} {files[active]!==samples[active]?"· EDITED":""}</strong>
          <button type="button" onClick={resetSample} disabled={!dirty}>Reset sample</button>
        </div>
        <div className="av134-code-shell">
          <pre ref={gutterRef} className="av134-gutter" aria-hidden="true">{lines}</pre>
          <div className="av134-code-layer">
            <pre ref={overlayRef} className="av134-highlight" aria-hidden="true">{colored}{"\n"}</pre>
            <textarea
              ref={editorRef} className="av134-input"
              aria-label={"Edit sample "+active}
              value={text} spellCheck={false} wrap="off" maxLength={12000}
              onChange={e=>changeText(e.target.value)}
              onKeyDown={handleEditorKeys} onScroll={handleScroll}
            />
          </div>
        </div>
      </div>
      <aside className="av134-preview" aria-label="Visual and HTML preview">
        <p className="av134-pane-label">PREVIEW / CONTINUANCE</p>
        <div className="av134-material" aria-label="Preview mode">
          <button type="button" aria-pressed={previewTab==="scene"} onClick={()=>setPreviewTab("scene")}>Orbital scene</button>
          <button type="button" aria-pressed={previewTab==="html"} onClick={()=>setPreviewTab("html")}>HTML / CSS</button>
        </div>
        {previewTab==="scene"?<>
          <div className="av134-scene" data-material={material} role="img" aria-label={"Layered orbital depth visualization, "+material+" material"}>
            <span className="av134-scene-arch"/>
            <span className="av134-scene-core"><OrbitalMark/></span>
            <span className="av134-scene-caption">CONTINUANCE / DEPTH ENGINE STUDY</span>
          </div>
          <div className="av134-material" aria-label="Orbital material variants">
            {(["nebula","metal","signal"] as const).map(item=><button type="button" key={item} aria-pressed={material===item} onClick={()=>setMaterial(item)}>{item}</button>)}
          </div>
          <p className="av134-caption">This orbit uses real CSS gradients, transforms and shadows. It is decorative, not a claim of a running 3D game engine.</p>
        </>:<>
          <iframe className="av134-live-frame" title="Sandboxed local HTML and CSS preview" sandbox="" referrerPolicy="no-referrer" srcDoc={preview}/>
          <p className="av134-caption">Edit index.html or styles.css to update this isolated render. Scripts and network requests are blocked. main.ts is never executed.</p>
        </>}
      </aside>
    </div>
    <p className="av134-footnote">Functional local demonstration. Source edits are in memory, not attached to a real project. Publishing, multi-file persistence and scene authoring remain separately gated in Creator Studio development.</p>
  </section>;
}
