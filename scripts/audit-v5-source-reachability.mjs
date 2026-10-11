/**
 * ANEVUM V5 static source inventory.
 * Conservative: NEVER remove any file based only on graph membership.
 * All analysis is offline, read-only and deterministic.
 */
import fs from "node:fs";
import path from "node:path";
import {pathToFileURL} from "node:url";
import { parse } from "@babel/parser";

const SUFFIXES=["",".ts",".tsx",".mts",".cts",".mjs",".cjs",".js",".jsx",".json",".css",".svg",".png",".jpg",".jpeg",".webp"];
const SKIP=new Set([".git","node_modules","dist",".wrangler","coverage",".tmp","tmp",".cache",".next","build","artifacts"]);
const posix=value=>value.split(path.sep).join("/");

export function listAuditFiles(root) {
  const found=[],pending=[root];
  while(pending.length){
    const dir=pending.pop();
    for(const item of fs.readdirSync(dir,{withFileTypes:true})){
      if(item.isSymbolicLink())continue;
      const target=path.join(dir,item.name);
      if(item.isDirectory()){if(!SKIP.has(item.name))pending.push(target);}
      else if(item.isFile())found.push(posix(path.relative(root,target)));
    }
  }
  return found.sort();
}
function extract(file,content){
  const imports=[];
  let dynamic=0;
  if(file.endsWith(".css")){
    for(const match of content.matchAll(/@import\s+(?:url\(\s*)?["']([^"']+)["']\s*\)?/g))imports.push(match[1]);
    return {imports,dynamic};
  }
  if(!/\.(?:[cm]?[jt]sx?)$/.test(file))return {imports,dynamic};

  // TypeScript 7 ships a native tsc without a stable compiler API.
  // Use the explicit Babel parser dependency; never silently downgrade
  // the production tsc executable to TypeScript 6.
  const isTypeScript=/\.(?:ts|tsx|mts|cts)$/.test(file);
  const isJsx=/\.(?:tsx|jsx)$/.test(file);
  const plugins=[
    ...(isTypeScript?["typescript"]:[]),
    ...(isJsx?["jsx"]:[])
  ];
  const ast=parse(content,{sourceType:"unambiguous",plugins});

  const literal=node=>node?.type==="StringLiteral"?node.value:null;
  function visit(node){
    if(!node||typeof node!=="object"||typeof node.type!=="string")return;
    if(["ImportDeclaration","ExportNamedDeclaration","ExportAllDeclaration"].includes(node.type)){
      const spec=literal(node.source);
      if(spec!==null)imports.push(spec);
    }
    if(node.type==="ImportExpression"){
      const spec=literal(node.source);
      if(spec!==null)imports.push(spec); else dynamic++;
    }
    if(node.type==="CallExpression"&&(
      node.callee?.type==="Import"||
      (node.callee?.type==="Identifier"&&node.callee.name==="require")
    )){
      const spec=literal(node.arguments?.[0]);
      if(spec!==null)imports.push(spec); else dynamic++;
    }
    for(const [key,value] of Object.entries(node)){
      if(["loc","start","end","extra","comments","leadingComments","trailingComments","innerComments"].includes(key))continue;
      if(Array.isArray(value)){
        for(const item of value)if(item&&typeof item==="object")visit(item);
      }else if(value&&typeof value==="object")visit(value);
    }
  }
  visit(ast);
  return {imports,dynamic};
}
function resolveImport(owner,specifier,files){
  if(!specifier.startsWith("."))return {external:true};
  const clean=specifier.replace(/[?#].*$/,"");
  const base=path.posix.normalize(path.posix.join(path.posix.dirname(owner),clean));
  if(base===".."||base.startsWith("../")||base.startsWith("/"))return {escaped:true};
  const candidates=SUFFIXES.map(s=>base+s);
  for(const suffix of SUFFIXES.slice(1))candidates.push(base+"/index"+suffix);
  const matched=candidates.find(file=>files.has(file));
  return matched?{matched}:{unresolved:true};
}

export function auditSourceReachability(rootDir=process.cwd()){
  const root=path.resolve(rootDir);
  for(const required of ["src/main.tsx","worker.mjs","src/App.tsx"]){
    if(!fs.existsSync(path.join(root,required)))throw Error("V5 audit missing source root: "+required);
  }
  const list=listAuditFiles(root),files=new Set(list),edges=new Map(),unresolved=[],nonliteral=[];
  for(const file of list){
    if(!/\.(?:[cm]?[jt]sx?|css)$/.test(file))continue;
    const refs=extract(file,fs.readFileSync(path.join(root,file),"utf8"));
    if(refs.dynamic)nonliteral.push({file,count:refs.dynamic});
    const deps=[];
    for(const specifier of refs.imports){
      const item=resolveImport(file,specifier,files);
      if(item.matched)deps.push(item.matched);
      else if(item.unresolved||item.escaped)unresolved.push({file,specifier,escaped:!!item.escaped});
    }
    edges.set(file,[...new Set(deps)].sort());
  }
  function visit(roots){
    const visited=new Set(),todo=[...roots];
    while(todo.length){
      const file=todo.pop();
      if(!files.has(file)||visited.has(file))continue;
      visited.add(file);
      for(const dep of edges.get(file)||[])todo.push(dep);
    }
    return visited;
  }
  const roots=["src/main.tsx","worker.mjs"];
  const auxiliaryRoots=list.filter(x=>/^(tests|scripts)\/.*\.(?:[cm]?[jt]sx?)$/.test(x));
  const runtime=visit(roots),auxiliary=visit(auxiliaryRoots);
  const pages=list.filter(x=>/^src\/pages\/[^/]+\.tsx$/.test(x)).map(file=>({
    file,status:runtime.has(file)?"RUNTIME_REACHABLE":auxiliary.has(file)?"NON_RUNTIME_REFERENCE":"UNREACHED_REVIEW"
  }));
  function witnesses(start){
    const paths=new Map(start.map(file=>[file,[file]])),todo=[...start];
    for(let i=0;i<todo.length;i++){
      const file=todo[i];
      for(const dep of edges.get(file)||[]){
        if(paths.has(dep))continue;
        paths.set(dep,[...paths.get(file),dep]);todo.push(dep);
      }
    }
    return paths;
  }
  const runtimePaths=witnesses(roots),auxiliaryPaths=witnesses(auxiliaryRoots);
  return {
    version:"anevum.v5.source-reachability.v1",
    runtimeRoots:roots,
    counts:{
      inspectedFiles:list.length,scannedModules:edges.size,runtimeReachable:runtime.size,
      auxiliaryRoots:auxiliaryRoots.length,pages:pages.length,
      activePages:pages.filter(x=>x.status==="RUNTIME_REACHABLE").length,
      nonRuntimeReferencePages:pages.filter(x=>x.status==="NON_RUNTIME_REFERENCE").length,
      unreachedReviewPages:pages.filter(x=>x.status==="UNREACHED_REVIEW").length
    },
    pages,
    pageEvidence:pages.map(({file})=>({
      file,
      runtimePath:runtimePaths.get(file)||null,
      auxiliaryPath:auxiliaryPaths.get(file)||null,
      importers:[...edges].filter(([,deps])=>deps.includes(file)).map(([owner])=>owner).sort(),
      dependencies:edges.get(file)||[]
    })),
    runtimeUnresolved:unresolved.filter(x=>runtime.has(x.file)),
    runtimeDynamic:nonliteral.filter(x=>runtime.has(x.file)),
    limitations:[
      "No source file or cloud resource is automatically deleted",
      "Constructed imports and non-import references are not proof of unreachability",
      "History, bookmarks and rollback artifacts need independent review"
    ]
  };
}

if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  const report=auditSourceReachability();
  if(process.argv.includes("--json"))console.log(JSON.stringify(report,null,2));
  else{
    console.log("ANEVUM V5 source graph: "+JSON.stringify(report.counts));
    console.log("UNREACHED_REVIEW: "+report.pages.filter(x=>x.status==="UNREACHED_REVIEW").map(x=>x.file).join(", "));
    console.log("Unresolved runtime edges: "+report.runtimeUnresolved.length);
  }
  if(report.runtimeUnresolved.length)process.exitCode=1;
}
