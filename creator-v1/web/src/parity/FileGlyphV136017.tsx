/** Original ANEVUM file-type engraving for the local source workbench.
 * Visual only: no file parsing, runtime execution, network access or ownership.
 */
export type FileKind='html'|'css'|'javascript'|'json'|'markdown'|'text';
export function fileKind(path:string):FileKind{
 const extension=path.split('/').pop()?.split('.').pop()?.toLowerCase();
 switch(extension){
  case 'html':case 'htm':return 'html';
  case 'css':return 'css';
  case 'js':case 'mjs':case 'ts':case 'tsx':return 'javascript';
  case 'json':return 'json';
  case 'md':case 'markdown':return 'markdown';
  default:return 'text';
 }
}
export function FileGlyphV136017({path}:{path:string}){
 const kind=fileKind(path);
 return <svg className="p136017-file-glyph" data-file-kind={kind}
  width="19" height="20" viewBox="0 0 24 26" fill="none"
  aria-hidden="true" focusable="false">
  <path d="M3.5 1.5H15.5L20.5 6.5V24.5H3.5Z"
   fill="currentColor" fillOpacity=".08" stroke="currentColor"
   strokeOpacity=".82" strokeWidth="1.35"/>
  <path d="M15.5 1.5V6.5H20.5" stroke="currentColor" strokeWidth="1.2" strokeOpacity=".7"/>
  {kind==='html'&&<g stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11L6 14L9 17M15 11L18 14L15 17M13.4 9.8L10.6 18.2"/>
   </g>}
  {kind==='css'&&<g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <path d="M9 10.5C6 10.5 7.5 12.7 5.8 13.8C7.5 14.7 6 17.5 9 17.5M15 10.5C18 10.5 16.5 12.7 18.2 13.8C16.5 14.7 18 17.5 15 17.5"/>
    <path d="M11 14H13"/>
   </g>}
  {kind==='javascript'&&<g fill="currentColor"><rect x="6.4" y="10.1" width="11.2" height="7.8" rx="1.1" fillOpacity=".15"/><path d="M9.4 11.2V15.3C9.4 16.5 8.8 16.9 7.7 16.5M12 16.2C12.8 16.7 15.4 17.3 15.6 15.6C15.8 14.3 13.1 14.4 13.1 12.6C13.1 11.8 14.6 11.7 15.4 12.2" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/></g>}
  {kind==='json'&&<g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M9 10H7.8V13.2L6.5 14L7.8 14.8V18H9M15 10H16.2V13.2L17.5 14L16.2 14.8V18H15"/><circle cx="11.1" cy="14" r=".7" fill="currentColor"/><circle cx="13" cy="14" r=".7" fill="currentColor"/></g>}
  {kind==='markdown'&&<g stroke="currentColor" strokeWidth="1.45" strokeLinecap="round"><path d="M6.5 17V11L9 14L11.5 11V17M14 11V17M12.6 15.5L14 17L15.4 15.5"/></g>}
  {kind==='text'&&<g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M6.5 11H16.5M6.5 14H15M6.5 17H12.5"/></g>}
 </svg>;
}
