import {Icon} from '../components/Icons';
import {classifyFile} from '../../../studio-next/project-tree-v116.mjs';

/** Decorative but semantic filename glyphs; exact filename remains accessible
 * to assistive technology through its enclosing file/tabpanel label.
 */
const FILE_STYLES:Record<string,{symbol:string;label:string;icon:string}>={
 folder:{symbol:'',label:'Folder',icon:'folder'},
 world:{symbol:'3D',label:'World scene',icon:'box'},
 interface:{symbol:'UI',label:'Interface',icon:'layout-dashboard'},
 script:{symbol:'TS',label:'Source script',icon:'file-code'},
 asset:{symbol:'A',label:'Asset',icon:'layers'},
 playtest:{symbol:'▶',label:'Playtest',icon:'play'},
 config:{symbol:'{}',label:'Configuration',icon:'braces'},
 document:{symbol:'',label:'Document',icon:'file-text'},
 audio:{symbol:'♪',label:'Audio',icon:'music'},
 typescript:{symbol:'TS',label:'TypeScript',icon:'file-code'},
 javascript:{symbol:'JS',label:'JavaScript',icon:'file-code'},
 css:{symbol:'#',label:'Stylesheet',icon:'palette'},
 html:{symbol:'<',label:'HTML document',icon:'code'},
 json:{symbol:'{}',label:'JSON data',icon:'braces'},
 markdown:{symbol:'M↓',label:'Markdown',icon:'file-text'}
};
export function studioFileKind(name:string,isFolder=false){
 if(isFolder)return 'folder';
 const n=(name||'').toLowerCase();
 if(/\.(ts|tsx|mts|cts)$/.test(n))return 'typescript';
 if(/\.(js|jsx|mjs|cjs)$/.test(n))return 'javascript';
 if(/\.(css|scss)$/.test(n))return 'css';
 if(/\.(html?|svg)$/.test(n))return 'html';
 if(/\.(md|mdx|markdown)$/.test(n))return 'markdown';
 if(/\.(mp3|wav|ogg|flac)$/.test(n))return 'audio';
 const fileKind=classifyFile(name);
 return FILE_STYLES[fileKind]?fileKind:'document';
}
export function StudioFileIconV119({name,folder=false,size=17}:{
 name:string;folder?:boolean;size?:number;
}){
 const kind=studioFileKind(name,folder),meta=FILE_STYLES[kind]||FILE_STYLES.document;
 return <span className={'csi-file-icon is-'+kind} aria-hidden="true" data-file-kind={kind}
  style={{width:size+3,height:size+3}} title={meta.label}>
  <Icon name={meta.icon} size={size}/>
  {meta.symbol&&<span className="csi-file-icon-code">{meta.symbol}</span>}
 </span>;
}
