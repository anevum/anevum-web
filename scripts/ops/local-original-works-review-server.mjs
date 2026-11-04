// CI-only HTTP adapter for exercising the actual isolated review Worker.
// No network listener except 127.0.0.1 and no authentication bypass in Cloudflare.
// Requests enter the Worker on backstage.anevum.com and its ASSETS binding
// resolves the files using the same path rewrite used in production.
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import path from "node:path";
import worker from "./original-works-review-worker.mjs";

const root = path.resolve("dist/client");
const port = Number(process.env.OW_REVIEW_PORT || 4174);
const contentTypes = {
  ".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",
  ".css":"text/css; charset=utf-8",".json":"application/json",
  ".svg":"image/svg+xml",".png":"image/png",".jpg":"image/jpeg",
  ".jpeg":"image/jpeg",".webp":"image/webp",".ico":"image/x-icon",
  ".woff2":"font/woff2",".pdf":"application/pdf"
};

async function getAsset(request) {
  const pathname = decodeURIComponent(new URL(request.url).pathname);
  const relative = pathname.replace(/^\/+/, "") || "index.html";
  const file = path.resolve(root, relative);
  if (!(file === root || file.startsWith(root + path.sep))) {
    return new Response("Not found", {status:404});
  }
  try {
    const bytes = await readFile(file);
    return new Response(bytes, {headers:{
      "Content-Type":contentTypes[path.extname(file)] || "application/octet-stream",
      "Cache-Control":"no-store"
    }});
  } catch (error) {
    if (error?.code !== "ENOENT" && error?.code !== "EISDIR") throw error;
    if (pathname.startsWith("/assets/") || path.extname(pathname)) {
      return new Response("Not found", {status:404});
    }
    const html = await readFile(path.join(root, "index.html"));
    return new Response(html, {headers:{"Content-Type":"text/html; charset=utf-8"}});
  }
}

const server = createServer(async (incoming, outgoing) => {
  try {
    const url = new URL(incoming.url || "/", "https://backstage.anevum.com");
    const request = new Request(url.toString(), {method:incoming.method,headers:incoming.headers});
    const response = await worker.fetch(request, {ASSETS:{fetch:getAsset}});
    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    outgoing.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error(error);
    outgoing.writeHead(500, {"Content-Type":"text/plain"});
    outgoing.end("Test server error");
  }
});
server.listen(port, "127.0.0.1", () => {
  console.log("Original Works review CI listener on 127.0.0.1:" + port);
});
