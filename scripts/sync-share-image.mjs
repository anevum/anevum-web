import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const parts = [
  "scripts/assets/anevum-share-v7.part01",
  "scripts/assets/anevum-share-v7.part02",
  "scripts/assets/anevum-share-v7.part03",
  "scripts/assets/anevum-share-v7.part04",
];

const chunks = await Promise.all(parts.map((path) => readFile(resolve(root, path), "utf8")));
const base64 = chunks.join("").replace(/\s+/g, "");
const image = Buffer.from(base64, "base64");

if (image.length !== 26283) {
  throw new Error(`Unexpected ANEVUM share image size: ${image.length} bytes`);
}
if (image[0] !== 0xff || image[1] !== 0xd8 || image.at(-2) !== 0xff || image.at(-1) !== 0xd9) {
  throw new Error("ANEVUM share image failed JPEG signature validation");
}

const outputDir = resolve(root, "public");
const output = resolve(outputDir, "anevum-share-v7.jpg");
await mkdir(outputDir, { recursive: true });
await writeFile(output, image);
console.log(`Wrote ${output} (${image.length} bytes)`);
