/* ANEVUM PACKAGE / release-bound creator cover validation.
 * PNG only for the pilot. Deterministic file/structure/CRC/dimension inspection.
 * Image approval remains the independent human review of the associated release.
 */
import { crc32, PackageError } from "./archive.mjs";

export const COVER_PATH = "_anevum/cover.png";
export const COVER_LIMIT = 3 * 1048576;
const PNG_SIGNATURE = [137,80,78,71,13,10,26,10];
const text = new TextDecoder("ascii");
const read = (v,offset) => v.getUint32(offset,false);

export async function prepareCover(file) {
  // Multipart parsers may represent an unselected file input as an empty string.
  // Named empty files still go through the PNG validation below.
  if (file === null || file === undefined || file === "" ||
    (typeof file.name === "string" && file.name === "" && file.size === 0)) return null;
  if (typeof file.arrayBuffer !== "function" || typeof file.name !== "string" ||
      !/\.png$/i.test(file.name) || file.name.length > 160)
    throw new PackageError("Project artwork must be a PNG file");
  if (!Number.isSafeInteger(file.size) || file.size < 70 || file.size > COVER_LIMIT)
    throw new PackageError("PNG cover must be between 70 bytes and 3 MiB",413);
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.length !== file.size || PNG_SIGNATURE.some((n,i) => bytes[i] !== n))
    throw new PackageError("Cover is not a valid PNG image");
  const v = new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  let at = 8, first = true, sawData = false, done = false, width = 0, height = 0;
  while (at < bytes.length) {
    if (at + 12 > bytes.length) throw new PackageError("PNG cover is truncated");
    const length = read(v,at), type = text.decode(bytes.subarray(at+4,at+8));
    const stop = at + 12 + length;
    if (!/^[A-Za-z]{4}$/.test(type) || length > COVER_LIMIT || stop > bytes.length)
      throw new PackageError("PNG cover has an invalid chunk");
    const expected = read(v,at+8+length);
    if (crc32(bytes.subarray(at+4,at+8+length)) !== expected)
      throw new PackageError("PNG cover has a corrupt checksum");
    if (first) {
      if (type !== "IHDR" || length !== 13)
        throw new PackageError("PNG cover is missing its image header");
      width = read(v,at+8); height = read(v,at+12);
      const depth=bytes[at+16],color=bytes[at+17];
      if (width<640 || height<360 || width>4096 || height>4096 ||
          width*height>12000000 || width/height<0.5 || width/height>3 ||
          depth!==8 || ![2,6].includes(color) ||
          bytes[at+18]!==0 || bytes[at+19]!==0 || bytes[at+20]!==0)
        throw new PackageError("Use a non-interlaced 8-bit RGB/RGBA PNG, 640–4096px wide and 360–4096px tall");
      first = false;
    } else if (type === "IHDR") throw new PackageError("PNG contains multiple image headers");
    if (type === "IDAT") sawData = true;
    if (type === "IEND") {
      if (!sawData || length !== 0 || stop !== bytes.length)
        throw new PackageError("PNG cover has an incomplete image body");
      done = true;
    }
    // Ancillary PNG chunks are tolerated, but additional critical image
    // formats beyond RGB/RGBA are intentionally outside this narrow pilot.
    if (!["IHDR","IDAT","IEND","PLTE"].includes(type) && /^[A-Z]/.test(type))
      throw new PackageError("PNG cover has an unsupported critical chunk");
    at = stop;
    if (done) break;
  }
  if (!done || at !== bytes.length)
    throw new PackageError("PNG cover is missing its ending marker");
  return { bytes, width, height, mime:"image/png", path:COVER_PATH };
}
