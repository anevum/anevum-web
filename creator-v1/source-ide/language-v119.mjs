/**
 * ANEVUM V119 deterministic source editing and syntax tokenization.
 * Pure text. No evaluated code, network, DOM HTML rendering or writes.
 */
const KEYWORDS=new Set('as async await break case catch class const continue debugger default delete do else enum export extends finally for from function if implements import in instanceof interface let new of private protected public readonly return static super switch this throw try type typeof var void while yield satisfies infer keyof namespace declare abstract get set'.split(' '));
const TYPES=new Set('string number boolean unknown never any bigint object Promise Array Record Map Set HTMLElement WorldDocument WorldNode WorldKind'.split(' '));
const CONSTANTS=new Set('true false null undefined NaN Infinity'.split(' '));
const CSS_VALUES=new Set('none block flex grid inline inline-block absolute relative fixed sticky auto inherit initial unset transparent solid dashed dotted hidden visible center space-between start end repeat minmax var calc rgb rgba hsl hsla linear-gradient radial-gradient'.split(' '));
const IDENT=/[A-Za-z_$]/,IDENT_CONT=/[\w$-]/;
const NUMBER=/^(?:0x[\da-f]+|0b[01]+|\d+(?:\.\d+)?(?:e[+-]?\d+)?)(?:px|rem|em|vh|vw|%|s|ms|deg)?/i;
const PUNCT='()[]{}.,:;';
export const SOURCE_LANGUAGES=Object.freeze(['typescript','javascript','css','json','markdown','html','world','text']);
export function editorLanguage(filename){
 const n=(typeof filename==='string'?filename:'').toLowerCase();
 if(n.endsWith('.world.anevum')||n.endsWith('.scene.anevum'))return 'world';
 if(/\.(tsx?|mts|cts)$/.test(n))return 'typescript';
 if(/\.(jsx?|mjs|cjs)$/.test(n))return 'javascript';
 if(/\.(css|scss)$/.test(n))return 'css';
 if(/\.(json|jsonc|ui\.anevum|asset\.anevum|playtest\.anevum)$/.test(n))return 'json';
 if(/\.(md|mdx|txt|markdown)$/.test(n))return 'markdown';
 if(/\.(html?|svg)$/.test(n))return 'html';
 return 'text';
}
function token(text,kind='text'){return {text,kind};}
function push(out,text,kind='text'){
 if(!text)return;
 const last=out.at(-1);
 if(last?.kind===kind)last.text+=text;else out.push(token(text,kind));
}
function scanMarkdown(line,state){
 const out=[];
 if(/^\s*\u0060{3}/.test(line)){
  push(out,line,'keyword');state.fenced=!state.fenced;return out;
 }
 if(state.fenced){push(out,line,'string');return out;}
 const head=line.match(/^(\s{0,3}#{1,6}\s+)/);
 let i=0;if(head){push(out,head[0],'heading');i=head[0].length;}
 const rx=/(\*\*[^*]+\*\*|\u0060[^\u0060]+\u0060|\[[^\]]+\]\([^)]+\)|\bhttps?:\/\/\S+)/g;
 rx.lastIndex=i;let m;
 while((m=rx.exec(line))){
  push(out,line.slice(i,m.index),head?'heading':'text');
  push(out,m[0],m[0].startsWith(String.fromCharCode(96))?'string':'function');
  i=rx.lastIndex;
 }
 push(out,line.slice(i),head?'heading':'text');return out;
}
function scanLine(line,lang,state){
 if(lang==='markdown')return scanMarkdown(line,state);
 if(lang==='text')return [token(line)];
 if(lang==='world'&&line.startsWith('ANEVUM_WORLD_V1'))
  return[token('ANEVUM_WORLD_V1','keyword'),token(line.slice(15))];
 const out=[],n=line.length,css=lang==='css',json=lang==='json'||lang==='world',html=lang==='html';
 let i=0;
 while(i<n){
  if(state.comment){
   const finish=line.indexOf('*/',i);
   if(finish<0){push(out,line.slice(i),'comment');break;}
   push(out,line.slice(i,finish+2),'comment');i=finish+2;state.comment=false;continue;
  }
  if(state.htmlComment){
   const finish=line.indexOf('-->',i);
   push(out,line.slice(i,finish<0?n:finish+3),'comment');
   i=finish<0?n:finish+3;
   if(finish>=0)state.htmlComment=false;
   continue;
  }
  if(html&&line.startsWith('<!--',i)){
   const finish=line.indexOf('-->',i+4);
   push(out,line.slice(i,finish<0?n:finish+3),'comment');
   i=finish<0?n:finish+3;
   if(finish<0)state.htmlComment=true;
   continue;
  }
  if(line.startsWith('/*',i)){
   const finish=line.indexOf('*/',i+2);
   push(out,line.slice(i,finish<0?n:finish+2),'comment');
   i=finish<0?n:finish+2;
   if(finish<0)state.comment=true;
   continue;
  }
  if(!css&&!json&&!html&&line.startsWith('//',i)){push(out,line.slice(i),'comment');break;}
  if(line[i]==='"'||line[i]==="'"||(!json&&!css&&!html&&line[i]===String.fromCharCode(96))){
   const quote=line[i];let j=i+1;
   while(j<n){if(line[j]==='\\'){j+=2;continue;}if(line[j++]===quote)break;}
   const value=line.slice(i,Math.min(j,n));
   const after=line.slice(Math.min(j,n)).trimStart();
   push(out,value,json&&quote==='"'&&after.startsWith(':')?'property':'string');
   i=Math.min(j,n);continue;
  }
  if(html&&line[i]==='<'){
   const tag=line.slice(i).match(/^<\/?[A-Za-z][\w:-]*/);
   if(tag){push(out,tag[0],'tag');i+=tag[0].length;continue;}
  }
  if(css&&line[i]==='#'&&/^#[a-f\d]{3,8}\b/i.test(line.slice(i))){
   const m=line.slice(i).match(/^#[a-f\d]{3,8}\b/i);
   push(out,m[0],'number');i+=m[0].length;continue;
  }
  if(/\d/.test(line[i])&&(i===0||!/[A-Za-z_$]/.test(line[i-1]))){
   const m=line.slice(i).match(NUMBER);
   if(m){push(out,m[0],'number');i+=m[0].length;continue;}
  }
  if(IDENT.test(line[i])||(css&&line[i]==='-'&&IDENT.test(line[i+1]||''))){
   let j=i+1;while(j<n&&IDENT_CONT.test(line[j]))j++;
   const word=line.slice(i,j),rest=line.slice(j);
   let kind='text';
   if(html&&/^\s*=/.test(rest))kind='attribute';
   else if(json)kind=CONSTANTS.has(word)?'literal':'text';
   else if(css){
    if(rest.trimStart().startsWith(':'))kind='property';
    else if(CSS_VALUES.has(word))kind='keyword';
    else if(rest.trimStart().startsWith('('))kind='function';
    else kind='selector';
   }else if(KEYWORDS.has(word))kind='keyword';
   else if(CONSTANTS.has(word))kind='literal';
   else if(TYPES.has(word)||/^[A-Z]/.test(word))kind='type';
   else if(rest.trimStart().startsWith('('))kind='function';
   else if(rest.trimStart().startsWith(':'))kind='property';
   push(out,word,kind);i=j;continue;
  }
  if(css&&line[i]==='@'){
   const m=line.slice(i).match(/^@[\w-]+/);
   if(m){push(out,m[0],'keyword');i+=m[0].length;continue;}
  }
  if(/[+\-*\/%=!<>|&?^~]/.test(line[i])){
   let j=i+1;while(j<n&&/[=><|&?]/.test(line[j])&&j-i<3)j++;
   push(out,line.slice(i,j),'operator');i=j;continue;
  }
  if(PUNCT.includes(line[i])){push(out,line[i],'punct');i++;continue;}
  push(out,line[i]);i++;
 }
 return out.length?out:[token('')];
}
export function highlightSource(source,filename,maxLines=2500){
 const code=typeof source==='string'?source:'';
 const language=editorLanguage(filename);
 const parts=code.split('\n'),state={comment:false,htmlComment:false,fenced:false};
 return {language,lines:parts.slice(0,Math.max(1,Math.min(maxLines,5000))).map(line=>scanLine(line,language,state)),
  truncated:parts.length>maxLines};
}
export function sourceCursor(text,start,end=start){
 const s=Math.min((text||'').length,Math.max(0,start||0)),line=(text||'').slice(0,s).split('\n');
 return {line:line.length,column:line.at(-1).length+1,selection:Math.max(0,(end||0)-s)};
}
export function editorIndent(text,start,end,width=2,outdent=false){
 const src=String(text),tab=' '.repeat(width===4?4:2);
 const safeStart=Math.max(0,Math.min(src.length,start)),safeEnd=Math.max(safeStart,Math.min(src.length,end));
 if(safeStart===safeEnd&&!outdent){
  const next=src.slice(0,safeStart)+tab+src.slice(safeEnd);
  return {text:next,start:safeStart+tab.length,end:safeStart+tab.length};
 }
 const lineStart=src.lastIndexOf('\n',safeStart-1)+1;
 const finalEnd=src.indexOf('\n',safeEnd);
 const last=finalEnd<0?src.length:finalEnd;
 const body=src.slice(lineStart,last),rows=body.split('\n');
 const edited=rows.map(row=>outdent?row.replace(new RegExp('^ {1,'+tab.length+'}'),''):tab+row);
 const next=src.slice(0,lineStart)+edited.join('\n')+src.slice(last);
 if(start===end){
  const n=edited[0].length-rows[0].length;
  return {text:next,start:Math.max(lineStart,start+n),end:Math.max(lineStart,start+n)};
 }
 const firstDelta=edited[0].length-rows[0].length;
 const total=edited.join('\n').length-body.length;
 return {text:next,start:Math.max(lineStart,safeStart+firstDelta),end:Math.max(lineStart,safeEnd+total)};
}
export function editorEnter(text,start,end){
 const src=String(text),s=Math.max(0,Math.min(src.length,start)),e=Math.max(s,Math.min(src.length,end));
 const line=src.slice(src.lastIndexOf('\n',s-1)+1,s);
 const leading=(line.match(/^[ \t]*/)||[''])[0];
 const open=/[{\[(]\s*$/.test(line);
 const inset='\n'+leading+(open?'  ':'');
 return {text:src.slice(0,s)+inset+src.slice(e),start:s+inset.length,end:s+inset.length};
}
export function findSource(text,query,from=0,sensitive=false,reverse=false){
 if(!query)return null;
 const hay=sensitive?String(text):String(text).toLocaleLowerCase('en');
 const needle=sensitive?query:query.toLocaleLowerCase('en');
 if(!needle)return null;
 const p=Math.max(0,Math.min(hay.length,from));
 let index=reverse?hay.lastIndexOf(needle,p-1):hay.indexOf(needle,p);
 if(index<0)index=reverse?hay.lastIndexOf(needle):hay.indexOf(needle);
 return index>=0?{start:index,end:index+query.length}:null;
}
export function replaceSourceAll(source,query,replacement,sensitive=false){
 const text=String(source),find=String(query),newText=String(replacement);
 if(!find)return {text,count:0};
 const hay=sensitive?text:text.toLocaleLowerCase('en');
 const needle=sensitive?find:find.toLocaleLowerCase('en');
 let cursor=0,count=0,out='';
 while(true){
  const idx=hay.indexOf(needle,cursor);
  if(idx<0)break;
  out+=text.slice(cursor,idx)+newText;cursor=idx+find.length;count++;
  if(count>5000)throw Error('Replacement limit reached');
 }
 return {text:count?out+text.slice(cursor):text,count};
}
export function prettyJsonSource(text,indent=2){
 return JSON.stringify(JSON.parse(text),null,indent===4?4:2)+'\n';
}
