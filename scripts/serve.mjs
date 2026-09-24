import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const root = new URL("../site/", import.meta.url).pathname;
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8"
};

http.createServer(async (req, res) => {
  try {
    const requested = normalize(decodeURIComponent(new URL(req.url, "http://localhost").pathname));
    let file = join(root, requested === "/" ? "index.html" : requested);
    const info = await stat(file).catch(() => null);
    if (!info?.isFile()) file = join(root, "index.html");
    const body = await readFile(file);
    res.writeHead(200, {
      "content-type": types[extname(file)] || "application/octet-stream",
      "cache-control": "no-store"
    });
    res.end(body);
  } catch {
    res.writeHead(500);
    res.end("Server error");
  }
}).listen(4173, "127.0.0.1", () => {
  console.log("ANEVUM preview http://127.0.0.1:4173");
});
