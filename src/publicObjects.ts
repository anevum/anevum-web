export type PublicObject = {
  id: string;
  slug: string;
  title: string;
  type: string;
  section: "UNIVERSE" | "ATLAS" | "ARCHIVE";
  route: string;
  sourceRoute: string;
  summary: string;
  renderMode: "FULL" | "CURATED" | "TEASER";
  spoilerLevel: "SAFE" | "LIGHT";
  publicWindow: "NOW";
  replyGate: "PRE-RELEASE" | "NOT IN REPLY / UNRECONCILED";
};

// This registry contains only records that currently pass both public gates:
// the source is Website Ready and the Website Publishing Queue row is Public.
// Summaries are intentionally narrower than the private canon source.
export const publicObjects: PublicObject[] = [
  {
    id: "atlas.ovara",
    slug: "ovara",
    title: "Ovara",
    type: "PLANET",
    section: "ATLAS",
    route: "/wiki/ovara",
    sourceRoute: "/atlas/ovara",
    summary:
      "A human world and one of REPLY's opening settings, presented through spoiler-safe geography, climate, civic plurality, and ordinary technology.",
    renderMode: "FULL",
    spoilerLevel: "SAFE",
    publicWindow: "NOW",
    replyGate: "PRE-RELEASE",
  },
  {
    id: "atlas.merva",
    slug: "merva",
    title: "Merva",
    type: "SETTLEMENT",
    section: "ATLAS",
    route: "/wiki/merva",
    sourceRoute: "/atlas/ovara/merva",
    summary:
      "An Ovaran city represented publicly through its urban geography, daily life, water and infrastructure character, and opening-state institutions.",
    renderMode: "FULL",
    spoilerLevel: "SAFE",
    publicWindow: "NOW",
    replyGate: "PRE-RELEASE",
  },
  {
    id: "atlas.neral-reply-era",
    slug: "neral",
    title: "Neral — REPLY Era",
    type: "PLANET",
    section: "ATLAS",
    route: "/wiki/neral",
    sourceRoute: "/atlas/neral",
    summary:
      "A sovereign, inhabited connected world in the mature REPLY era, culturally distinct from Veyra and linked through established Road and Skygate infrastructure.",
    renderMode: "FULL",
    spoilerLevel: "SAFE",
    publicWindow: "NOW",
    replyGate: "PRE-RELEASE",
  },
  {
    id: "atlas.serein-skygate",
    slug: "serein-skygate",
    title: "Serein Skygate",
    type: "ORBITAL GATE-CITY",
    section: "ATLAS",
    route: "/wiki/serein-skygate",
    sourceRoute: "/atlas/serein-skygate",
    summary:
      "An inhabited Veyran orbital gate-city and mature Road endpoint, presented through ordinary civic and transit life rather than founding-era history.",
    renderMode: "CURATED",
    spoilerLevel: "SAFE",
    publicWindow: "NOW",
    replyGate: "PRE-RELEASE",
  },
  {
    id: "atlas.neral-skygate",
    slug: "neral-skygate",
    title: "Neral Skygate",
    type: "ORBITAL GATE-CITY",
    section: "ATLAS",
    route: "/wiki/neral-skygate",
    sourceRoute: "/atlas/neral-skygate",
    summary:
      "The Neran orbital gate-city at the far end of the mature Veyra–Neral Road, culturally and architecturally distinct from its Veyran counterpart.",
    renderMode: "CURATED",
    spoilerLevel: "SAFE",
    publicWindow: "NOW",
    replyGate: "PRE-RELEASE",
  },
  {
    id: "universe.open-road",
    slug: "open-road",
    title: "Open Road",
    type: "INTERWORLD INFRASTRUCTURE",
    section: "UNIVERSE",
    route: "/wiki/open-road",
    sourceRoute: "/universe/technology/open-road",
    summary:
      "A continuously stabilized two-ended connection maintained by paired Skygates and used for ordinary passenger and freight transit between connected worlds.",
    renderMode: "CURATED",
    spoilerLevel: "SAFE",
    publicWindow: "NOW",
    replyGate: "PRE-RELEASE",
  },
  {
    id: "universe.skygate",
    slug: "skygate-megastructure",
    title: "Skygate Megastructure",
    type: "TECHNOLOGY / CITY",
    section: "UNIVERSE",
    route: "/wiki/skygate-megastructure",
    sourceRoute: "/universe/technology/skygate",
    summary:
      "An inhabited orbital ring-city built around a Road boundary, combining habitation, transit, civic services, maintenance, freight, and utility systems.",
    renderMode: "CURATED",
    spoilerLevel: "SAFE",
    publicWindow: "NOW",
    replyGate: "PRE-RELEASE",
  },
  {
    id: "universe.iren",
    slug: "iren",
    title: "IREN",
    type: "AI / INTERFACE LAYER",
    section: "UNIVERSE",
    route: "/wiki/iren",
    sourceRoute: "/universe/technology/iren",
    summary:
      "A mature AI and interface layer used throughout ordinary life and institutions, designed to preserve provenance and uncertainty without governing or self-authorizing high-consequence action.",
    renderMode: "CURATED",
    spoilerLevel: "SAFE",
    publicWindow: "NOW",
    replyGate: "PRE-RELEASE",
  },
  {
    id: "universe.continuance",
    slug: "continuance-institute",
    title: "Continuance Institute",
    type: "INSTITUTION",
    section: "UNIVERSE",
    route: "/wiki/continuance-institute",
    sourceRoute: "/universe/institutions/continuance",
    summary:
      "A large scientific and engineering institution with a Cape Serein presence, a public mission, a distinct staff culture, and bounded institutional authority.",
    renderMode: "CURATED",
    spoilerLevel: "SAFE",
    publicWindow: "NOW",
    replyGate: "PRE-RELEASE",
  },
  {
    id: "universe.talin-vel",
    slug: "talin-vel",
    title: "Talin Vel",
    type: "PERSON",
    section: "UNIVERSE",
    route: "/wiki/talin-vel",
    sourceRoute: "/universe/people/talin-vel",
    summary:
      "A 30-year-old gateborn boundary-metrology specialist. This public record is restricted to Talin's opening identity.",
    renderMode: "FULL",
    spoilerLevel: "SAFE",
    publicWindow: "NOW",
    replyGate: "PRE-RELEASE",
  },
  {
    id: "universe.grainit",
    slug: "grainit",
    title: "GRAINIT",
    type: "THEORY",
    section: "UNIVERSE",
    route: "/wiki/grainit",
    sourceRoute: "/universe/science/grainit",
    summary:
      "Devon Akins's exploratory finite-resolution and quasilocal geometry program, presented publicly at a high level with fictional transport extensions withheld.",
    renderMode: "CURATED",
    spoilerLevel: "LIGHT",
    publicWindow: "NOW",
    replyGate: "NOT IN REPLY / UNRECONCILED",
  },
  {
    id: "archive.d3-17",
    slug: "d3-17",
    title: "D3-17",
    type: "HISTORICAL EVENT",
    section: "ARCHIVE",
    route: "/wiki/d3-17",
    sourceRoute: "/archive/events/d3-17",
    summary:
      "A teaser-level historical record of an Old Meridian accident and research incident. Its later meaning and consequences remain withheld.",
    renderMode: "TEASER",
    spoilerLevel: "LIGHT",
    publicWindow: "NOW",
    replyGate: "NOT IN REPLY / UNRECONCILED",
  },
];

export const featuredPublicObjects = publicObjects.slice(0, 8);

export function getPublicObjectBySlug(slug: string) {
  return publicObjects.find((record) => record.slug === slug);
}

export function searchPublicObjects(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return publicObjects;

  return publicObjects.filter((record) =>
    [record.title, record.type, record.section, record.summary]
      .join(" ")
      .toLowerCase()
      .includes(normalized),
  );
}
