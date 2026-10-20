/* ANEVUM.WEB.BUILD.2026-10-18.001.UNIVERSAL-PACKAGE-PLAYER
 * Deterministic, dependency-free ZIP preflight/extraction for browser builds.
 * Explicit alpha ceilings protect the 128 MiB Worker memory limit.
 */
export const ZIP_LIMITS = Object.freeze({
  archive: 20 * 1048576,
  inflated: 48 * 1048576,
  singleFile: 12 * 1048576,
  files: 180,
  path: 240,
  ratio: 400
});

const MIME = Object.freeze({
  html: "text/html; charset=utf-8", htm: "text/html; charset=utf-8",
  js: "text/javascript; charset=utf-8", mjs: "text/javascript; charset=utf-8",
  css: "text/css; charset=utf-8", json: "application/json; charset=utf-8",
  webmanifest: "application/manifest+json", txt: "text/plain; charset=utf-8",
  glsl: "text/plain; charset=utf-8", wgsl: "text/plain; charset=utf-8",
  vert: "text/plain; charset=utf-8", frag: "text/plain; charset=utf-8",
  map: "application/json; charset=utf-8",
  wasm: "application/wasm", bin: "application/octet-stream",
  data: "application/octet-stream", glb: "model/gltf-binary",
  gltf: "model/gltf+json", png: "image/png", jpg: "image/jpeg",
  jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif",
  ico: "image/x-icon", avif: "image/avif",
  mp3: "audio/mpeg", wav: "audio/wav", ogg: "audio/ogg",
  m4a: "audio/mp4", mp4: "video/mp4", webm: "video/webm",
  woff: "font/woff", woff2: "font/woff2", ttf: "font/ttf",
  otf: "font/otf"
});

export class PackageError extends Error {
  constructor(message, status = 422) { super(message); this.name = "PackageError"; this.status = status; }
}
function invalid(message) { throw new PackageError(message); }
const read16 = (v, p) => v.getUint16(p, true);
const read32 = (v, p) => v.getUint32(p, true);
const decoder = new TextDecoder("utf-8", { fatal: true });
const ENCODER = new TextEncoder();
const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let n = i;
  for (let j = 0; j < 8; j++) n = n & 1 ? (n >>> 1) ^ 0xedb88320 : n >>> 1;
  CRC_TABLE[i] = n >>> 0;
}
export function crc32(input) {
  let crc = 0xffffffff;
  for (let i = 0; i < input.length; i++) crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ input[i]) & 255];
  return (crc ^ 0xffffffff) >>> 0;
}
export function assetMime(path) {
  return MIME[path.slice(path.lastIndexOf(".") + 1).toLowerCase()] || null;
}
export function safeAssetPath(path) {
  if (typeof path !== "string" || path.length > ZIP_LIMITS.path || !path || path !== path.normalize("NFC")
      || path.startsWith("/") || path.includes("\\") || path.includes("%")
      || /[\x00-\x1f\x7f?#:]/.test(path) || /^[a-z]:/i.test(path)
      || path.split("/").some(s => !s || s === "." || s === ".." || s.startsWith(".") || s.endsWith(" "))) return false;
  return true;
}
function fileName(bytes, flags) {
  if (!(flags & 0x800) && bytes.some(b => b > 127)) invalid("Non-UTF-8 ZIP filenames are not supported");
  try { return decoder.decode(bytes); } catch { invalid("Invalid UTF-8 ZIP filename"); }
}
function rejectZip64(extra) {
  const view = new DataView(extra.buffer, extra.byteOffset, extra.byteLength);
  for (let p = 0; p + 4 <= extra.length;) {
    const type = read16(view, p), size = read16(view, p + 2);
    if (p + 4 + size > extra.length) invalid("Invalid ZIP extra field");
    if (type === 0x0001) invalid("ZIP64 archives require the large-build pipeline");
    p += 4 + size;
  }
}
export function inspectZip(data) {
  const buf = data instanceof Uint8Array ? data : new Uint8Array(data);
  if (buf.length < 22 || buf.length > ZIP_LIMITS.archive) invalid("ZIP exceeds 20 MiB alpha limit or is empty");
  const v = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  let end = -1;
  for (let p = buf.length - 22; p >= Math.max(0, buf.length - 65557); p--) {
    if (read32(v, p) === 0x06054b50 && p + 22 + read16(v, p + 20) === buf.length) { end = p; break; }
  }
  if (end < 0) invalid("ZIP end record missing");
  if (read16(v, end + 4) || read16(v, end + 6)) invalid("Multi-disk ZIP is unsupported");
  const count = read16(v, end + 10), cdSize = read32(v, end + 12), cdAt = read32(v, end + 16);
  if (count !== read16(v, end + 8) || count === 65535 || cdAt === 0xffffffff || cdSize === 0xffffffff)
    invalid("ZIP64 and split archives require the large-build pipeline");
  if (!count || count > ZIP_LIMITS.files || cdAt + cdSize !== end)
    invalid("Invalid ZIP directory or too many files (180 maximum)");
  const seen = new Set(), entries = [], ranges = [];
  let p = cdAt, total = 0;
  for (let n = 0; n < count; n++) {
    if (p + 46 > end || read32(v, p) !== 0x02014b50) invalid("Corrupt ZIP central directory");
    const madeBy = read16(v, p + 4), flags = read16(v, p + 8), method = read16(v, p + 10);
    const crc = read32(v, p + 16), packed = read32(v, p + 20), unpacked = read32(v, p + 24);
    const nameLen = read16(v, p + 28), extraLen = read16(v, p + 30), commentLen = read16(v, p + 32);
    const disk = read16(v, p + 34), attrs = read32(v, p + 38), localAt = read32(v, p + 42);
    const next = p + 46 + nameLen + extraLen + commentLen;
    if (next > end || !nameLen || disk || flags & 0x2041 || ![0, 8].includes(method)
        || packed === 0xffffffff || unpacked === 0xffffffff) invalid("Unsupported or corrupt ZIP entry");
    // Disallow symlinks and special UNIX files, including disguised symlinks.
    const unixType = (attrs >>> 16) & 0xf000;
    if ((madeBy >>> 8) === 3 && unixType && unixType !== 0x8000 && unixType !== 0x4000)
      invalid("ZIP links and special files are not allowed");
    const nameBytes = buf.subarray(p + 46, p + 46 + nameLen);
    const name = fileName(nameBytes, flags), dir = name.endsWith("/");
    rejectZip64(buf.subarray(p + 46 + nameLen, p + 46 + nameLen + extraLen));
    const normalized = dir ? name.slice(0, -1) : name;
    if (!safeAssetPath(normalized)) invalid("Unsafe file path: " + name.slice(0, 90));
    const folded = normalized.toLocaleLowerCase("en-US");
    if (seen.has(folded)) invalid("Duplicate/case-conflicting ZIP entry: " + name.slice(0, 90));
    seen.add(folded);
    if (localAt + 30 > cdAt || read32(v, localAt) !== 0x04034b50)
      invalid("Missing ZIP local file header");
    if (read16(v, localAt + 6) !== flags || read16(v, localAt + 8) !== method)
      invalid("ZIP central/local header mismatch");
    const lNameLen = read16(v, localAt + 26), lExtra = read16(v, localAt + 28);
    const dataAt = localAt + 30 + lNameLen + lExtra, dataEnd = dataAt + packed;
    if (dataEnd > cdAt || lNameLen !== nameLen) invalid("ZIP data extends outside archive");
    for (let j = 0; j < nameLen; j++) if (buf[localAt + 30 + j] !== nameBytes[j]) invalid("ZIP filenames disagree");
    if (!(flags & 8) && (read32(v, localAt + 14) !== crc || read32(v, localAt + 18) !== packed || read32(v, localAt + 22) !== unpacked))
      invalid("ZIP size or checksum mismatch");
    if (dir) {
      if (packed || unpacked) invalid("ZIP directory contains data");
    } else {
      if (!assetMime(name)) invalid("Unsupported project asset: " + name.slice(0, 90));
      if (unpacked > ZIP_LIMITS.singleFile || (!packed && unpacked)
          || unpacked > Math.max(1, packed) * ZIP_LIMITS.ratio)
        invalid("ZIP entry is too large or excessively compressed: " + name.slice(0, 90));
      total += unpacked;
      if (total > ZIP_LIMITS.inflated) invalid("Expanded project exceeds 48 MiB alpha limit");
      entries.push({ path: name, mime: assetMime(name), packed, unpacked, method, crc, dataAt, dataEnd });
    }
    ranges.push({ start: localAt, end: dataEnd });
    p = next;
  }
  if (p !== end || !entries.some(e => e.path === "index.html"))
    invalid("ZIP must include index.html at its root");
  ranges.sort((a, b) => a.start - b.start);
  for (let i = 1; i < ranges.length; i++) if (ranges[i].start < ranges[i - 1].end)
    invalid("Overlapping ZIP entries are not allowed");
  return { entries, expandedBytes: total, archiveBytes: buf.length, entrypoint: "index.html" };
}
export async function extractEntry(data, entry) {
  const buf = data instanceof Uint8Array ? data : new Uint8Array(data);
  const packed = buf.subarray(entry.dataAt, entry.dataEnd);
  const stream = new Blob([packed]).stream();
  const source = entry.method === 8 ? stream.pipeThrough(new DecompressionStream("deflate-raw")) : stream;
  const reader = source.getReader(), chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > entry.unpacked || size > ZIP_LIMITS.singleFile) invalid("Decompression exceeds declared limit: " + entry.path);
      chunks.push(value);
    }
  } catch (e) {
    await reader.cancel().catch(() => {});
    if (e instanceof PackageError) throw e;
    invalid("Unable to decompress " + entry.path);
  }
  if (size !== entry.unpacked) invalid("Decompressed size mismatch: " + entry.path);
  const out = new Uint8Array(size);
  let offset = 0;
  for (const part of chunks) { out.set(part, offset); offset += part.length; }
  if (crc32(out) !== entry.crc) invalid("CRC32 mismatch: " + entry.path);
  if (entry.path === "index.html") {
    let html;
    try { html = decoder.decode(out); } catch { invalid("index.html must be UTF-8"); }
    if (!/<(?:!doctype\s+html|html\b|head\b|body\b|script\b|div\b)/i.test(html.slice(0, 4096)))
      invalid("index.html does not appear to be a web document");
  }
  return out;
}
export async function sha256Hex(bytes) {
  const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return Array.from(hash, b => b.toString(16).padStart(2, "0")).join("");
}
export const encodePath = path => path.split("/").map(s => encodeURIComponent(s)).join("/");
