/** Supplement the import graph with conservative literal file-reference evidence. */
import fs from "node:fs";
import path from "node:path";
import {pathToFileURL} from "node:url";
import {parse} from "@babel/parser";
import {auditSourceReachability,listAuditFiles} from "./audit-v5-source-reachability.mjs";

function literalValue(node){
  if(node?.type==="StringLiteral")return node.value;
  if(node?.type==="TemplateLiteral"&&node.expressions.length===0)return node.quasis[0].value.cooked;
  if(node?.type==="BinaryExpression"&&node.operator==="+"){
    const left=literalValue(node.left),right=literalValue(node.right);
    if(left!==null&&right!==null)return left+right;
  }
  return null;
}

function pathLiterals(file,content){
  const plugins=[...(/\.(?:ts|tsx|mts|cts)$/.test(file)?["typescript"]:[]),...(/\.(?:tsx|jsx)$/.test(file)?["jsx"]:[])];
  const ast=parse(content,{sourceType:"unambiguous",plugins}),found=[];
  function visit(node){
    if(!node||typeof node!=="object"||typeof node.type!=="string")return;
    const value=literalValue(node);
    if(value!==null)found.push({value,line:node.loc.start.line,kind:"STATIC_PATH_LITERAL"});
    // A known suffix of path.join(ROOT, 'src', 'pages', 'X.tsx') is evidence,
    // even when ROOT cannot be evaluated. It is not proof of a filesystem read.
    if(node.type==="CallExpression"&&node.callee?.type==="MemberExpression"&&
      node.callee.object?.type==="Identifier"&&node.callee.object.name==="path"&&
      node.callee.property?.name==="join"){
      let suffix=[];
      for(const arg of node.arguments){
        const part=literalValue(arg);
        if(part===null)suffix=[];else suffix.push(part);
      }
      if(suffix.length)found.push({value:suffix.join("/"),line:node.loc.start.line,kind:"STATIC_JOIN_SUFFIX"});
    }
    for(const [key,child] of Object.entries(node)){
      if(["loc","extra","comments","leadingComments","trailingComments","innerComments"].includes(key))continue;
      if(Array.isArray(child))child.forEach(visit);else if(child&&typeof child==="object")visit(child);
    }
  }
  visit(ast);return found;
}

export function auditLegacyPageRetention(rootDir=process.cwd()){
  const root=path.resolve(rootDir),graph=auditSourceReachability(root);
  const files=listAuditFiles(root),pages=new Set(graph.pages.map(x=>x.file)),references=new Map();
  for(const owner of files){
    const code=/\.(?:[cm]?[jt]sx?)$/.test(owner),doc=/\.(?:md|html|json|jsonc|ya?ml|py|css|sh)$/.test(owner);
    if(!code&&!doc)continue;
    const content=fs.readFileSync(path.join(root,owner),"utf8");
    const literals=code?pathLiterals(owner,content):content.split(/\r?\n/).flatMap((line,i)=>
      [...pages].filter(file=>line.includes(file)).map(value=>({value,line:i+1,kind:"TEXT_PATH_MENTION"})));
    for(const {value,line,kind} of literals){
      const clean=value.replace(/[?#].*$/,"");
      // UI labels such as 'Research' are not source paths. Require an explicit
      // relative/root source prefix or a filename extension before resolving.
      if(!clean.startsWith("./")&&!clean.startsWith("../")&&!clean.startsWith("src/")&&!clean.endsWith(".tsx"))continue;
      const candidates=[clean,path.posix.normalize(path.posix.join(path.posix.dirname(owner),clean))];
      if(clean.startsWith("/"))continue;
      for(const candidate of candidates){
        for(const target of [candidate,candidate+".tsx"]){
          if(!pages.has(target)||target===owner)continue;
          const items=references.get(target)||[];
          if(!items.some(x=>x.file===owner&&x.line===line&&x.kind===kind))items.push({file:owner,line,kind});
          references.set(target,items);
        }
      }
    }
  }
  const review=graph.pages.map(page=>{
    const evidence=graph.pageEvidence.find(x=>x.file===page.file);
    const refs=(references.get(page.file)||[]).sort((a,b)=>a.file.localeCompare(b.file)||a.line-b.line||a.kind.localeCompare(b.kind));
    const operational=refs.filter(x=>x.kind!=="TEXT_PATH_MENTION");
    const decision=page.status==="RUNTIME_REACHABLE"?"RETAIN_RUNTIME":
      page.status==="NON_RUNTIME_REFERENCE"?"RETAIN_AUXILIARY_DEPENDENCY":
      operational.length?"RETAIN_LITERAL_REFERENCE":"MANUAL_REVIEW_REQUIRED";
    return {...page,decision,...evidence,references:refs};
  });
  return {
    version:"anevum.v5.legacy-page-retention.v1",
    counts:{pages:review.length,runtime:review.filter(x=>x.decision==="RETAIN_RUNTIME").length,
      auxiliary:review.filter(x=>x.decision==="RETAIN_AUXILIARY_DEPENDENCY").length,
      literalReference:review.filter(x=>x.decision==="RETAIN_LITERAL_REFERENCE").length,
      manualReview:review.filter(x=>x.decision==="MANUAL_REVIEW_REQUIRED").length},
    pages:review,runtimeUnresolved:graph.runtimeUnresolved,runtimeDynamic:graph.runtimeDynamic,
    deletionAuthorized:false,
    limitations:[
      "Literal paths and join suffixes are retention evidence, not proof of execution or absence of other references",
      "Computed paths, aliases, globs, filesystem directory scans, remote references and deployment-specific roots require manual review",
      "No route, source, historical content, migration or resource is modified or automatically deleted",
      "Production main and rollback sources can still depend on pages absent from this draft runtime graph"
    ]
  };
}

if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  const report=auditLegacyPageRetention();
  console.log(process.argv.includes("--json")?JSON.stringify(report,null,2):JSON.stringify(report.counts));
  if(report.runtimeUnresolved.length)process.exitCode=1;
}
