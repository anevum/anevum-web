// ANEVUM Sites V004: review-only static render. No Worker deployments or production data.
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { STUDIO_V2_CSS, STUDIO_V2_HTML, STUDIO_V2_JS } from "./studio-v2.mjs";
import { SMOKEBREAK_PRIVATE_PREVIEW } from "./smokebreak-concept.mjs";

const outDir = resolve(process.argv[2] || "sites/.review");
await mkdir(outDir, { recursive: true });
const publicMarkup = STUDIO_V2_HTML
  .replace('<link rel="stylesheet" href="/assets/studio-v2.css">', "<style>" + STUDIO_V2_CSS + "</style>")
  .replace('<script src="/assets/studio-v2.js" defer></script>', "<script>" + STUDIO_V2_JS + "</script>");
if (!publicMarkup.includes('name="consent"') || !publicMarkup.includes("sf-hero-title") || !publicMarkup.includes("@media")) {
  throw Error("Candidate visual preview lacks expected styles or consent content");
}
await writeFile(resolve(outDir, "studio.html"), publicMarkup, "utf8");
await writeFile(resolve(outDir, "smokebreak-private.html"), SMOKEBREAK_PRIVATE_PREVIEW, "utf8");
console.log("Generated static, review-only ANEVUM Sites previews in", outDir);
