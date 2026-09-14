export type VisualKey =
  | "merva"
  | "person"
  | "neral"
  | "ovara"
  | "connected"
  | "grainit"
  | "iren"
  | "skygate"
  | "continuance"
  | "road"
  | "event"
  | "deep-three"
  | "ione"
  | "cape"
  | "serein"
  | "veyra";

export type PublicObject = {
  id: string;
  slug: string;
  title: string;
  type: string;
  section: "UNIVERSE" | "ATLAS" | "ARCHIVE";
  route: string;
  sourceRoute: string;
  sourceUrl: string;
  summary: string;
  renderMode: "FULL" | "CURATED" | "TEASER";
  spoilerLevel: "SAFE" | "LIGHT";
  publicWindow: "NOW";
  replyGate: "PRE-RELEASE" | "NOT IN REPLY / UNRECONCILED";
  priority: number;
  visualKey: VisualKey;
  visualStatus: "LOCKED" | "PROVISIONAL" | "PLANNED" | "UNSPECIFIED";
  publicNote: string;
  facts?: Array<[string, string]>;
};

export const PUBLIC_SYNC = {
  source: "Live Transcosmic Canon Wiki + Website Publishing Queue",
  syncedAt: "2026-09-14",
  count: 21,
};

// This is a publication-safe projection, not a mirror of private Notion. It was
// reconciled against the live Website Publishing Queue on 2026-09-14. Only
// records passing the current public gate are serialized into the browser.
export const publicObjects: PublicObject[] = [
  {
    id: "atlas.merva", slug: "merva", title: "Merva", type: "SETTLEMENT", section: "ATLAS",
    route: "/wiki/merva", sourceRoute: "/atlas/ovara/merva", sourceUrl: "https://app.notion.com/p/3db88cc2ef1481548859d08fa10cfa69",
    summary: "The principal Ovaran city of REPLY, in the Ordan Republic and Kesra Basin: a lived-in city shaped by canals, water storage and reclamation systems, transit, industry, clinics, markets, family life and precision technical work.",
    renderMode: "FULL", spoilerLevel: "SAFE", publicWindow: "NOW", replyGate: "PRE-RELEASE", priority: 10, visualKey: "merva", visualStatus: "PLANNED",
    publicNote: "Opening-state geography, climate, districts, transit, daily life, civic layers and water/infrastructure character are public. Later contact-site transformation remains withheld.",
    facts: [["World", "Ovara"], ["State", "Ordan Republic"], ["Region", "Kesra Basin"], ["Population", "~7.8 million"]],
  },
  {
    id: "universe.nali-solan", slug: "nali-solan", title: "Nali Solan", type: "PERSON", section: "UNIVERSE",
    route: "/wiki/nali-solan", sourceRoute: "/universe/people/nali-solan", sourceUrl: "https://app.notion.com/p/3db88cc2ef1481eca1a8db64047cbe5b",
    summary: "A 29-year-old precision instrumentation and calibration specialist in Merva, Ovara, exacting about traceability, physical failure and what a technician can honestly sign their name to.",
    renderMode: "FULL", spoilerLevel: "SAFE", publicWindow: "NOW", replyGate: "PRE-RELEASE", priority: 10, visualKey: "person", visualStatus: "PLANNED",
    publicNote: "Age, home, profession, practical worldview and ordinary-life context are public. Discovery consequences, later contact role and end state remain withheld.",
    facts: [["Age", "29"], ["Home", "Merva"], ["World", "Ovara"], ["Field", "Precision metrology"]],
  },
  {
    id: "atlas.neral-reply-era", slug: "neral", title: "Neral — REPLY Era", type: "PLANET", section: "ATLAS",
    route: "/wiki/neral", sourceRoute: "/atlas/neral", sourceUrl: "https://app.notion.com/p/3db88cc2ef148195a195e7197d816dfe",
    summary: "An inhabited human world in the Irsen System and the other established planetary endpoint of the mature Veyra–Neral network: sovereign, culturally distinct and connected by mature Road/Skygate infrastructure.",
    renderMode: "FULL", spoilerLevel: "SAFE", publicWindow: "NOW", replyGate: "PRE-RELEASE", priority: 10, visualKey: "neral", visualStatus: "PLANNED",
    publicNote: "Current-era world orientation and ordinary connected-world life are public. Founding-era Elias/Jon Zero history is not part of this public record.",
    facts: [["System", "Irsen"], ["Status", "Sovereign inhabited world"], ["Connection", "Mature Road/Skygate network"]],
  },
  {
    id: "atlas.ovara", slug: "ovara", title: "Ovara", type: "PLANET", section: "ATLAS",
    route: "/wiki/ovara", sourceRoute: "/atlas/ovara", sourceUrl: "https://app.notion.com/p/3db88cc2ef14816e8781f26c961514da",
    summary: "A technologically mature, politically plural human world in the Helor System. REPLY enters Ovara through the Kesra Basin and Merva, where infrastructure, science, ordinary work and civic life shape the opening civilization.",
    renderMode: "FULL", spoilerLevel: "SAFE", publicWindow: "NOW", replyGate: "PRE-RELEASE", priority: 10, visualKey: "ovara", visualStatus: "PLANNED",
    publicNote: "High-level geography, climate, 29-state political plurality, multiple cultural regions and ordinary technology are public. Contact outcomes remain withheld.",
    facts: [["System", "Helor"], ["Sovereign states", "29"], ["Opening lens", "Kesra Basin / Merva"]],
  },
  {
    id: "universe.rena-sol", slug: "rena-sol", title: "Rena Sol", type: "PERSON", section: "UNIVERSE",
    route: "/wiki/rena-sol", sourceRoute: "/universe/people/rena-sol", sourceUrl: "https://app.notion.com/p/3db88cc2ef14812f9162cf96ab50dbf4",
    summary: "A 118-year-old Human Systems Scientist in Greater Serein whose work focuses on cognitive metrology, group decision systems, corrigibility and the effects of prestige on judgment.",
    renderMode: "FULL", spoilerLevel: "SAFE", publicWindow: "NOW", replyGate: "PRE-RELEASE", priority: 10, visualKey: "person", visualStatus: "PLANNED",
    publicNote: "Age, mature-network setting, profession, correction/privacy themes and ordinary family context are public. Later institutional and contact-process roles remain withheld.",
    facts: [["Age", "118"], ["Home", "Greater Serein"], ["Field", "Human Systems Science"]],
  },
  {
    id: "universe.connected-worlds", slug: "connected-worlds", title: "Connected Worlds Civilization", type: "HISTORICAL ERA", section: "UNIVERSE",
    route: "/wiki/connected-worlds", sourceRoute: "/universe/connected-worlds", sourceUrl: "https://app.notion.com/p/3c288cc2ef1481d7be5dd3544b5abd95",
    summary: "The mature Veyra–Neral civilization in which inhabited Skygates and a reciprocal Road support ordinary interworld travel while both worlds remain sovereign and culturally distinct.",
    renderMode: "CURATED", spoilerLevel: "SAFE", publicWindow: "NOW", replyGate: "PRE-RELEASE", priority: 9, visualKey: "connected", visualStatus: "LOCKED",
    publicNote: "The current REPLY-era concept of mature connected-world civilization is public. Stale future-book framing and founding-history explanations are omitted.",
    facts: [["Worlds", "Veyra / Neral"], ["Infrastructure", "Road + inhabited Skygates"], ["Political rule", "Separate sovereignty"]],
  },
  {
    id: "universe.grainit", slug: "grainit", title: "GRAINIT", type: "THEORY", section: "UNIVERSE",
    route: "/wiki/grainit", sourceRoute: "/universe/science/grainit", sourceUrl: "https://app.notion.com/p/3ae88cc2ef148170b599f5fa3ae40bf4",
    summary: "Devon Akins's exploratory covariant finite-resolution and quasilocal geometry program for quantum gravity. A grainit is a resolution-bounded geometric datum; fictional transport extensions remain separate.",
    renderMode: "CURATED", spoilerLevel: "LIGHT", publicWindow: "NOW", replyGate: "NOT IN REPLY / UNRECONCILED", priority: 9, visualKey: "grainit", visualStatus: "PROVISIONAL",
    publicNote: "Only the high-level public science explainer is released. A grainit is not a literal particle, cube, graph node or transport channel.",
  },
  {
    id: "universe.iren", slug: "iren", title: "IREN", type: "TECHNOLOGY", section: "UNIVERSE",
    route: "/wiki/iren", sourceRoute: "/universe/technology/iren", sourceUrl: "https://app.notion.com/p/3d088cc2ef148126b3aec41d16c2d3d9",
    summary: "The mature civilization's provenance-aware artificial-intelligence interface and intelligence layer, used across learning, research, planning, public systems and daily life without replacing legitimate human authority.",
    renderMode: "CURATED", spoilerLevel: "SAFE", publicWindow: "NOW", replyGate: "PRE-RELEASE", priority: 9, visualKey: "iren", visualStatus: "UNSPECIFIED",
    publicNote: "Ordinary use, provenance, uncertainty and bounded authority are public. Deep implementation history and later-era doctrine remain withheld.",
  },
  {
    id: "universe.lio-sol", slug: "lio-sol", title: "Lio Sol", type: "PERSON", section: "UNIVERSE",
    route: "/wiki/lio-sol", sourceRoute: "/universe/people/lio-sol", sourceUrl: "https://app.notion.com/p/3db88cc2ef148183b964f11e6c4fd911",
    summary: "A 76-year-old Greater Serein public-garden conservator and horticultural restoration specialist who provides an ordinary-life view of the mature connected-world civilization.",
    renderMode: "FULL", spoilerLevel: "SAFE", publicWindow: "NOW", replyGate: "PRE-RELEASE", priority: 9, visualKey: "person", visualStatus: "PLANNED",
    publicNote: "Age, work and ordinary mature-life context are public. Later travel and family-arc resolution remain withheld.",
    facts: [["Age", "76"], ["Home", "Greater Serein"], ["Work", "Garden conservation"]],
  },
  {
    id: "atlas.serein-skygate", slug: "serein-skygate", title: "Serein Skygate", type: "ORBITAL GATE-CITY", section: "ATLAS",
    route: "/wiki/serein-skygate", sourceRoute: "/atlas/serein-skygate", sourceUrl: "https://app.notion.com/p/3c288cc2ef1481d3a25ff1e72e27e361",
    summary: "Veyra's inhabited orbital gate-city and mature Road endpoint serving Greater Serein, presented through ordinary civic, transit and infrastructure life.",
    renderMode: "CURATED", spoilerLevel: "SAFE", publicWindow: "NOW", replyGate: "PRE-RELEASE", priority: 9, visualKey: "skygate", visualStatus: "PLANNED",
    publicNote: "Current-era gate-city orientation is public. Founding chronology and later-series development remain withheld.",
  },
  {
    id: "universe.talin-vel", slug: "talin-vel", title: "Talin Vel", type: "PERSON", section: "UNIVERSE",
    route: "/wiki/talin-vel", sourceRoute: "/universe/people/talin-vel", sourceUrl: "https://app.notion.com/p/3db88cc2ef1481a08250f8bec79ba315",
    summary: "A 30-year-old gateborn boundary-metrology specialist. The public record is restricted to Talin's opening identity and ordinary professional context.",
    renderMode: "FULL", spoilerLevel: "SAFE", publicWindow: "NOW", replyGate: "PRE-RELEASE", priority: 9, visualKey: "person", visualStatus: "PLANNED",
    publicNote: "Opening identity only. First-visitor and later crossing material remain withheld by the release window.",
    facts: [["Age", "30"], ["Identity", "Gateborn"], ["Field", "Boundary metrology"]],
  },
  {
    id: "universe.continuance", slug: "continuance-institute", title: "Continuance Institute", type: "ORGANIZATION", section: "UNIVERSE",
    route: "/wiki/continuance-institute", sourceRoute: "/universe/institutions/continuance", sourceUrl: "https://app.notion.com/p/3ae88cc2ef1481bbafacf790c34d2750",
    summary: "A large mature-era scientific and engineering institution with a Cape Serein presence, public mission, distinct staff culture and bounded institutional authority.",
    renderMode: "CURATED", spoilerLevel: "SAFE", publicWindow: "NOW", replyGate: "PRE-RELEASE", priority: 8, visualKey: "continuance", visualStatus: "LOCKED",
    publicNote: "Current mature-era institution, Cape presence and public mission are released. Classified human-transfer history and later outcomes remain withheld.",
  },
  {
    id: "universe.open-road", slug: "open-road", title: "Open Road", type: "INTERWORLD INFRASTRUCTURE", section: "UNIVERSE",
    route: "/wiki/open-road", sourceRoute: "/universe/technology/open-road", sourceUrl: "https://app.notion.com/p/3bf88cc2ef148185a01fd61d67815125",
    summary: "A mature two-ended interworld connection maintained by paired Skygates and used for ordinary passenger and freight movement between connected worlds.",
    renderMode: "CURATED", spoilerLevel: "SAFE", publicWindow: "NOW", replyGate: "PRE-RELEASE", priority: 8, visualKey: "road", visualStatus: "UNSPECIFIED",
    publicNote: "Ordinary current-era transit is public. Founding ancestry, old series progression and future institutional detail are withheld.",
  },
  {
    id: "universe.skygate", slug: "skygate-megastructure", title: "Skygate Megastructure", type: "TECHNOLOGY / CITY", section: "UNIVERSE",
    route: "/wiki/skygate-megastructure", sourceRoute: "/universe/technology/skygate", sourceUrl: "https://app.notion.com/p/3c288cc2ef1481b381c9d71571d93567",
    summary: "An inhabited orbital ring-city built around a Road boundary, combining habitation, transit, civic services, maintenance, freight and utility systems.",
    renderMode: "CURATED", spoilerLevel: "SAFE", publicWindow: "NOW", replyGate: "PRE-RELEASE", priority: 8, visualKey: "skygate", visualStatus: "UNSPECIFIED",
    publicNote: "Current-era infrastructure, habitation, transit, utilities and civic life are public. Founding chronology and later-series industrial detail are withheld.",
  },
  {
    id: "archive.d3-17", slug: "d3-17", title: "D3-17", type: "HISTORICAL EVENT", section: "ARCHIVE",
    route: "/wiki/d3-17", sourceRoute: "/archive/events/d3-17", sourceUrl: "https://app.notion.com/p/3ae88cc2ef1481fb8a6ed8c5f36ea848",
    summary: "A teaser-level historical record of an Old Meridian accident and research incident. Its later meaning, classified provenance and consequences remain withheld.",
    renderMode: "TEASER", spoilerLevel: "LIGHT", publicWindow: "NOW", replyGate: "NOT IN REPLY / UNRECONCILED", priority: 7, visualKey: "event", visualStatus: "LOCKED",
    publicNote: "Only the opening-era incident and approved scientific/data language are public. The ultimate meaning and later consequences remain sealed.",
  },
  {
    id: "atlas.neral-skygate", slug: "neral-skygate", title: "Neral Skygate", type: "ORBITAL GATE-CITY", section: "ATLAS",
    route: "/wiki/neral-skygate", sourceRoute: "/atlas/neral-skygate", sourceUrl: "https://app.notion.com/p/3c288cc2ef1481b98b9eca552059cf34",
    summary: "The Neran orbital gate-city at the far end of the mature Veyra–Neral Road, preserving a distinct Neran civic and architectural lineage while interoperating technically with Serein Skygate.",
    renderMode: "CURATED", spoilerLevel: "SAFE", publicWindow: "NOW", replyGate: "PRE-RELEASE", priority: 7, visualKey: "skygate", visualStatus: "PLANNED",
    publicNote: "Current-era gate-city distinction and Road role are public. Founding history and unreconciled arrival-era material are withheld.",
  },
  {
    id: "archive.deep-three", slug: "deep-three", title: "Deep Three", type: "FACILITY", section: "ARCHIVE",
    route: "/wiki/deep-three", sourceRoute: "/archive/deep-three", sourceUrl: "https://app.notion.com/p/3ae88cc2ef1481a792ccfdc8725375a1",
    summary: "A curated public archive record of a Veyran lunar research station and scientific artifact. Classified anomaly, transfer and later historical interpretation remain withheld.",
    renderMode: "CURATED", spoilerLevel: "LIGHT", publicWindow: "NOW", replyGate: "NOT IN REPLY / UNRECONCILED", priority: 6, visualKey: "deep-three", visualStatus: "LOCKED",
    publicNote: "Public representation remains historical/scientific only. Hidden anomaly infrastructure and transfer-development history are withheld.",
  },
  {
    id: "atlas.ione", slug: "ione", title: "Ione", type: "MOON", section: "ATLAS",
    route: "/wiki/ione", sourceRoute: "/atlas/ione", sourceUrl: "https://app.notion.com/p/3ae88cc2ef1481a7ba4df0fda01d2ce2",
    summary: "Veyra's large tidally locked moon: an airless rocky body with ancient highlands, basaltic plains, impact basins and polar cold traps, presented publicly at physical and scientific depth only.",
    renderMode: "CURATED", spoilerLevel: "SAFE", publicWindow: "NOW", replyGate: "NOT IN REPLY / UNRECONCILED", priority: 5, visualKey: "ione", visualStatus: "PROVISIONAL",
    publicNote: "Only the physical/scientific lunar overview is public. Classified Deep Three and D3-17 lineage remains withheld.",
    facts: [["Radius", "~1,900 km"], ["Gravity", "~0.18 Vg"], ["Rotation", "Tidally locked"], ["Atmosphere", "Negligible"]],
  },
  {
    id: "atlas.cape-serein", slug: "cape-serein", title: "Cape Serein", type: "SETTLEMENT", section: "ATLAS",
    route: "/wiki/cape-serein", sourceRoute: "/atlas/veyra/cape-serein", sourceUrl: "https://app.notion.com/p/3ae88cc2ef1481d19c31e0fa4e30e2bb",
    summary: "A coastal district of Greater Serein built across black cliffs, marsh causeways, observation ground and engineered shelves, including the Continuance Institute campus.",
    renderMode: "CURATED", spoilerLevel: "SAFE", publicWindow: "NOW", replyGate: "PRE-RELEASE", priority: 4, visualKey: "cape", visualStatus: "PLANNED",
    publicNote: "Current-era coast, research district, weather, infrastructure and Continuance campus context are public. Superseded arrival chronology is not.",
  },
  {
    id: "atlas.greater-serein", slug: "greater-serein", title: "Greater Serein", type: "REGION / METROPOLIS", section: "ATLAS",
    route: "/wiki/greater-serein", sourceRoute: "/atlas/veyra/greater-serein", sourceUrl: "https://app.notion.com/p/3ae88cc2ef1481168229cb7cac0c8948",
    summary: "A dense coastal metropolis and city-region containing Cape Serein, Westbank, Low Harrow, Southbank District, Old Meridian and the Serein basin.",
    renderMode: "CURATED", spoilerLevel: "SAFE", publicWindow: "NOW", replyGate: "PRE-RELEASE", priority: 3, visualKey: "serein", visualStatus: "PROVISIONAL",
    publicNote: "Current-era geography, districts, infrastructure and ordinary mature-life context are public. Obsolete prior-draft chronology is not.",
  },
  {
    id: "atlas.veyra", slug: "veyra", title: "Veyra", type: "PLANET", section: "ATLAS",
    route: "/wiki/veyra", sourceRoute: "/atlas/veyra", sourceUrl: "https://app.notion.com/p/3ae88cc2ef1481a9a430c6993465893e",
    summary: "A geologically active, ocean-dominated terrestrial planet orbiting Rhel, with a nitrogen-oxygen atmosphere, strong magnetic field, active plate tectonics and one large moon, Ione.",
    renderMode: "CURATED", spoilerLevel: "SAFE", publicWindow: "NOW", replyGate: "PRE-RELEASE", priority: 2, visualKey: "veyra", visualStatus: "PROVISIONAL",
    publicNote: "A current-era planetary overview is public. The definitive planetary map is not yet approved, so the website must not invent coastlines or definitive geography.",
    facts: [["Radius", "~6,510 km"], ["Ocean coverage", "~68%"], ["Day", "24 standard hours"], ["Year", "365.242 days"], ["Moon", "Ione"]],
  },
  {
    id: "universe.elias-venn", slug: "elias-venn", title: "Elias Venn", type: "PERSON", section: "UNIVERSE",
    route: "/wiki/elias-venn", sourceRoute: "/universe/characters/elias-venn", sourceUrl: "https://app.notion.com/p/3ae88cc2ef1481acb455f4ba7405e168",
    summary: "A historical Veyran researcher whose public record is restricted to spoiler-safe identity, personality and background. Later classified history and Road-era consequences remain withheld.",
    renderMode: "CURATED", spoilerLevel: "SAFE", publicWindow: "NOW", replyGate: "NOT IN REPLY / UNRECONCILED", priority: 1, visualKey: "person", visualStatus: "LOCKED",
    publicNote: "Only spoiler-safe historical identity/background material is public. Later classified history and long Road legacy remain withheld.",
  },
];

export const featuredPublicObjects = publicObjects.slice(0, 10);

export function getPublicObjectBySlug(slug: string) {
  return publicObjects.find((record) => record.slug === slug);
}

export function searchPublicObjects(query: string, section: string = "ALL") {
  const normalized = query.trim().toLowerCase();
  return publicObjects.filter((record) => {
    const sectionMatch = section === "ALL" || record.section === section;
    const queryMatch = !normalized || [record.title, record.type, record.section, record.summary].join(" ").toLowerCase().includes(normalized);
    return sectionMatch && queryMatch;
  });
}
