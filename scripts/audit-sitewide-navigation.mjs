#!/usr/bin/env node
/**
 * ANEVUM sitewide route reference inventory. Read-only and fail-closed on
 * unreadable source. This is a static source audit, not a live HTTP crawl.
 *
 * node scripts/audit-sitewide-navigation.mjs
 * node scripts/audit-sitewide-navigation.mjs --json
 * node scripts/audit-sitewide-navigation.mjs --output evidence/sitewide-navigation.json
 */
import {readFile, readdir, mkdir, writeFile} from "node:fs/promises";
import {dirname, extname, join, resolve} from "node:path";
import {parse} from "@babel/parser";

const root = resolve(process.cwd());
const apps = [
  {name:"apex-v5", source:"src", entry:"src/App.tsx"},
  {name:"creator-v1", source:"creator-v1/web/src", entry:"creator-v1/web/src/App.tsx"}
];
const extensions = new Set([".js",".jsx",".ts",".tsx"]);
// Explicit non-React owners; still require real hosted URL verification.
// Never treat a private Worker route as a public React page.
const alternateOwners = Object.freeze({
  "apex-v5": {
    "/devon-akins-resume.pdf": {kind:"generated-document",source:"scripts/render-founder-resume.py"}
  },
  "creator-v1": {
    "/upload": {kind:"worker-route",source:"anevum.com/upload*"},
    "/upload/v3": {kind:"worker-route",source:"anevum.com/upload*"},
    "/staff": {kind:"protected-worker-route",source:"anevum.com/staff*"},
    "/portfolio": {kind:"bundled-public-content",source:"creator-v1/web/public/portfolio/index.html"}
  }
});
const args = process.argv.slice(2);
const outputIndex = args.indexOf("--output");
if (outputIndex !== -1 && (!args[outputIndex + 1] || args[outputIndex + 1].startsWith("--"))) {
  throw new Error("--output requires an output filename");
}

async function filesUnder(dir) {
  const found = [];
  for (const entry of await readdir(join(root,dir),{withFileTypes:true})) {
    const path = join(dir,entry.name);
    if (entry.isDirectory() && !["node_modules","dist","build",".git"].includes(entry.name)) {
      found.push(...await filesUnder(path));
    } else if (entry.isFile() && extensions.has(extname(entry.name))) {
      found.push(path.replaceAll("\\","/"));
    }
  }
  return found.sort();
}
function visit(value,fn) {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (const entry of value) visit(entry,fn);
    return;
  }
  if (typeof value.type === "string") fn(value);
  for (const [name,child] of Object.entries(value)) {
    if (["loc","extra","comments","leadingComments","trailingComments","innerComments"].includes(name)) continue;
    if (child && typeof child === "object") visit(child,fn);
  }
}
function jsxName(value) {
  if (!value) return "";
  if (value.type === "JSXIdentifier") return value.name;
  if (value.type === "JSXMemberExpression") return jsxName(value.property);
  return "";
}
function attr(node,name) {
  return (node.attributes||[]).find(entry => entry.type === "JSXAttribute" && jsxName(entry.name) === name);
}
function literalPaths(node) {
  if (!node) return [];
  if (node.type === "StringLiteral") return [node.value];
  if (node.type === "JSXExpressionContainer") return literalPaths(node.expression);
  if (node.type === "ConditionalExpression") return [...literalPaths(node.consequent),...literalPaths(node.alternate)];
  if (node.type === "LogicalExpression") return literalPaths(node.right);
  if (node.type === "TemplateLiteral") {
    if (!node.expressions.length) return [node.quasis.map(x => x.value.cooked||"").join("")];
    return [(node.quasis[0]?.value.cooked||"") + "<dynamic>"];
  }
  if (node.type === "BinaryExpression" && node.operator === "+") {
    if (node.left.type === "StringLiteral" && node.right.type === "StringLiteral") {
      return [node.left.value+node.right.value];
    }
    const left = literalPaths(node.left);
    return left.length ? left.map(x => x+"<dynamic>") : ["<dynamic>"];
  }
  return ["<dynamic>"];
}
function strip(path) {
  const value=path.split("?")[0].split("#")[0];
  return value.length>1 ? value.replace(/\/+$/,"") : value;
}
function routeRegex(path) {
  if (path === "*" || path === "/*") return null;
  const pieces=strip(path).split("/").map(piece => {
    if (piece === "*") return ".*";
    if (piece.startsWith(":")) return piece === ":memberHandle" ? "@[a-z][a-z0-9_]{2,29}" : "[^/]+";
    return [...piece].map(ch => "\\^$.*+?()[]{}|".includes(ch) ? "\\"+ch : ch).join("");
  });
  let joined=pieces.join("/");
  if (path.endsWith("/*")) joined=joined.replace(/\/\.\*$/,"(?:/.*)?");
  return new RegExp("^"+joined+"$");
}
function line(node) { return node.loc?.start?.line || 0; }
function navSurface(path) {
  return /(?:Shell|ParityHeader|ConsoleWayfinder|PageNav|PortalLauncher)\.tsx$/.test(path) ||
    /(?:site-navigation|portal-destinations)\.ts$/.test(path);
}
function reference(path,node,target,kind) {
  return {file:path,line:line(node),target,kind,navSurface:navSurface(path)};
}
async function audit(app) {
  const files=await filesUnder(app.source);
  const asts=new Map();
  for (const path of files) {
    const source=await readFile(join(root,path),"utf8");
    try {
      asts.set(path,{source,ast:parse(source,{sourceType:"unambiguous",plugins:["typescript","jsx"]})});
    } catch(error) {
      throw new Error("Failed to parse "+path+": "+error.message);
    }
  }
  const entry=asts.get(app.entry);
  if (!entry) throw new Error("Missing route entrypoint "+app.entry);
  const routes=[];
  visit(entry.ast.program,node => {
    if (node.type !== "JSXOpeningElement" || jsxName(node.name) !== "Route") return;
    const pathAttribute=attr(node,"path");
    const indexAttribute=attr(node,"index");
    if (!pathAttribute && !indexAttribute) return;
    const paths=pathAttribute ? literalPaths(pathAttribute.value) : ["/"];
    if (paths.length !== 1 || paths[0] === "<dynamic>") return;
    const path=paths[0].startsWith("/") ? paths[0] : "/"+paths[0];
    const element=attr(node,"element");
    const value=element?entry.source.slice(element.start,element.end):"";
    const redirect=/<Navigate\b|\b[A-Za-z]+Redirect\b|\bLegacyRhenOperatorRoute\b/.test(value);
    routes.push({path,redirect,file:app.entry,line:line(node)});
  });
  const compiled=routes.map(r => ({...r,regex:routeRegex(r.path)})).filter(r=>r.regex);
  const links=[];
  let dynamicExpressions=0,externalLiterals=0,relativeLiterals=0;
  for (const path of files) {
    const seen=new Set();
    function add(node,raw,kind) {
      for (const target of literalPaths(raw)) {
        const id=line(node)+":"+kind+":"+target;
        if (seen.has(id)) continue;
        seen.add(id);
        if (target.includes("<dynamic>")) { dynamicExpressions++; continue; }
        if (/^https?:\/\//.test(target)) { externalLiterals++; continue; }
        if (!target.startsWith("/") || target.startsWith("//")) {
          if (target && target !== "#" && !target.startsWith("#") && !/^(?:mailto:|tel:|javascript:)/.test(target)) relativeLiterals++;
          continue;
        }
        const destination=strip(target);
        if (/^\/(?:api|creator\/api|assets|images|fonts|icons|favicon|_)(?:\/|$)/.test(destination)) continue;
        links.push(reference(path,node,target,kind));
      }
    }
    visit(asts.get(path).ast.program,node => {
      if (node.type === "JSXOpeningElement") {
        for (const key of ["to","href"]) {
          const a=attr(node,key);
          if (a) add(a,a.value,"jsx-"+key);
        }
      }
      if (node.type === "ObjectProperty" && !node.computed) {
        const key=node.key.name||node.key.value;
        if (key === "to" || key === "href" ||
            (key === "path" && /(?:site-navigation|portal-destinations)\.ts$/.test(path))) {
          add(node,node.value,"object-"+key);
        }
      }
      if (node.type === "CallExpression" && node.callee.type === "Identifier" &&
          ["navigate","redirect"].includes(node.callee.name) && node.arguments.length) {
        add(node,node.arguments[0],"navigate-call");
      }
    });
  }
  const canonical=[],aliases=[],unresolved=[],alternateOwnerLinks=[];
  for (const link of links) {
    const dest=strip(link.target);
    const match=compiled.find(route=>route.regex.test(dest));
    if (!match) {
      const owner=alternateOwners[app.name]?.[dest];
      if (owner) alternateOwnerLinks.push({...link,owner:owner.kind,evidence:owner.source,verification:"HOSTED_CHECK_REQUIRED"});
      else unresolved.push(link);
    }
    else if (match.redirect) aliases.push({...link,declaredBy:match.path});
    else canonical.push(link);
  }
  function sortRefs(a,b) {
    return a.file.localeCompare(b.file)||a.line-b.line||a.target.localeCompare(b.target);
  }
  return {
    name:app.name,entry:app.entry,sourceFiles:files.length,
    routes:routes.sort((a,b)=>a.path.localeCompare(b.path)),
    links:links.length,canonicalLinks:canonical.length,
    dynamicExpressions,relativeLiterals,externalLiterals,
    aliasLinks:aliases.sort(sortRefs),
    alternateOwnerLinks:alternateOwnerLinks.sort(sortRefs),
    unresolvedLinks:unresolved.sort(sortRefs)
  };
}
const reports=[];
for (const app of apps) reports.push(await audit(app));
const report={
  schema:"ANEVUM.SITEWIDE.ROUTE_AUDIT.V1",
  scope:"Static React source only. Not a live link crawl, deployed Worker inventory, dynamic resolution or authenticated browser audit.",
  generatedAt:new Date().toISOString(),
  apps:reports,
  totals:{
    sourceFiles:reports.reduce((n,x)=>n+x.sourceFiles,0),
    declaredRoutes:reports.reduce((n,x)=>n+x.routes.length,0),
    staticLinks:reports.reduce((n,x)=>n+x.links,0),
    canonicalLinks:reports.reduce((n,x)=>n+x.canonicalLinks,0),
    aliasLinks:reports.reduce((n,x)=>n+x.aliasLinks.length,0),
    alternateOwnerLinks:reports.reduce((n,x)=>n+x.alternateOwnerLinks.length,0),
    unresolvedLinks:reports.reduce((n,x)=>n+x.unresolvedLinks.length,0),
    dynamicExpressions:reports.reduce((n,x)=>n+x.dynamicExpressions,0)
  }
};
if (outputIndex>=0) {
  const dest=resolve(root,args[outputIndex+1]);
  await mkdir(dirname(dest),{recursive:true});
  await writeFile(dest,JSON.stringify(report,null,2)+"\n");
}
if (args.includes("--json")) {
  process.stdout.write(JSON.stringify(report,null,2)+"\n");
} else {
  process.stdout.write(JSON.stringify({
    scope:report.scope,totals:report.totals,
    apps:reports.map(x=>({
      name:x.name,sourceFiles:x.sourceFiles,declaredRoutes:x.routes.length,
      links:x.links,aliasCount:x.aliasLinks.length,externalOwnerCount:x.alternateOwnerLinks.length,unresolvedCount:x.unresolvedLinks.length,
      dynamicExpressions:x.dynamicExpressions,
      visibleAliases:x.aliasLinks.filter(y=>y.navSurface).slice(0,12),
      externalOwnerExamples:x.alternateOwnerLinks.slice(0,15),
      unresolvedExamples:x.unresolvedLinks.slice(0,12)
    }))
  },null,2)+"\n");
}
