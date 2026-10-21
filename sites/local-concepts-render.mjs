// ANEVUM Sites private review artifact generator. Never deploys a Worker.
import {mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {LOCAL_CONCEPTS,LOCAL_CONCEPT_JS,localConceptIndex,localConceptPage} from "./local-concepts.mjs";
const output=resolve(process.argv[2]||"/tmp/anevum-sites-local-review");
await mkdir(output,{recursive:true});
const rewrite=html=>html
 .replaceAll('href="/concepts"','href="./index.html"')
 .replace(/href="\/concepts\/([a-z0-9-]+)"/g,'href="./$1.html"')
 .replace('src="/assets/local-concepts.js"','src="./local-concepts.js"')
 .replace('href="/"','href="./index.html"');
await writeFile(resolve(output,"index.html"),rewrite(localConceptIndex()));
await writeFile(resolve(output,"local-concepts.js"),LOCAL_CONCEPT_JS);
for (const concept of LOCAL_CONCEPTS) {
 const page=localConceptPage(concept.slug);
 if(!page)throw Error("Missing concept "+concept.slug);
 await writeFile(resolve(output,concept.slug+".html"),rewrite(page));
}
console.log("Created",LOCAL_CONCEPTS.length,"fictional review concepts at",output);
