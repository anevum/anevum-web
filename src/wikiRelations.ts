import { getPublicObjectBySlug, type PublicObject } from "./publicObjects";

// Public-only relation graph. This deliberately links only records already
// cleared for the website; private Notion relationships are never exposed.
const relatedSlugs: Record<string, string[]> = {
  merva: ["ovara", "nali-solan"],
  "nali-solan": ["merva", "ovara"],
  neral: ["neral-skygate", "connected-worlds", "open-road", "serein-skygate"],
  ovara: ["merva", "nali-solan"],
  "rena-sol": ["lio-sol", "greater-serein", "veyra"],
  "connected-worlds": ["veyra", "neral", "open-road", "serein-skygate", "neral-skygate", "skygate-megastructure"],
  grainit: ["iren"],
  iren: ["connected-worlds", "grainit"],
  "lio-sol": ["rena-sol", "greater-serein", "veyra"],
  "serein-skygate": ["greater-serein", "open-road", "skygate-megastructure", "neral-skygate", "connected-worlds"],
  "talin-vel": ["serein-skygate", "neral", "veyra"],
  "continuance-institute": ["cape-serein", "greater-serein", "veyra"],
  "open-road": ["connected-worlds", "skygate-megastructure", "serein-skygate", "neral-skygate", "neral"],
  "skygate-megastructure": ["open-road", "serein-skygate", "neral-skygate", "connected-worlds"],
  "d3-17": ["deep-three", "elias-venn"],
  "neral-skygate": ["neral", "open-road", "skygate-megastructure", "serein-skygate", "connected-worlds"],
  "deep-three": ["ione", "d3-17"],
  ione: ["veyra", "deep-three"],
  "cape-serein": ["greater-serein", "continuance-institute", "veyra"],
  "greater-serein": ["cape-serein", "continuance-institute", "serein-skygate", "veyra"],
  veyra: ["ione", "greater-serein", "cape-serein", "serein-skygate", "connected-worlds"],
  "elias-venn": ["d3-17"],
};

export function getRelatedPublicObjects(slug: string, limit = 6): PublicObject[] {
  return (relatedSlugs[slug] || [])
    .map((candidate) => getPublicObjectBySlug(candidate))
    .filter((record): record is PublicObject => Boolean(record))
    .slice(0, limit);
}
