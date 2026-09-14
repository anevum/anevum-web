export type WikiSection = {
  title: string;
  body: string[];
  items?: string[];
};

export type WikiDetail = {
  slug: string;
  sourceState: string;
  sourceLabel: string;
  lead: string;
  sections: WikiSection[];
};

// Curated from the live Transcosmic Canon Wiki on 2026-09-14.
// This file is a publication-safe projection, not a browser mirror of private Notion.
// Source page publication notes and the Website Publishing Queue remain authoritative.
export const wikiDetails: Record<string, WikiDetail> = {
  merva: {
    slug: "merva",
    sourceState: "SOURCE-LOCKED / WEBSITE READY",
    sourceLabel: "TC-391 · REPLY ERA",
    lead: "Merva is the principal Ovaran city through which REPLY enters everyday life: a large, layered working city in the Ordan Republic and Kesra Basin where water systems, transit, science, manufacturing, clinics, markets and family life are all ordinary parts of the setting.",
    sections: [
      {
        title: "Physical setting and climate",
        body: [
          "Merva sits on a broad terrace above an active floodplain. Distant highlands and the Keral Range feed part of the basin, while lower country descends toward terminal basins.",
          "The city lives with both sides of water risk: upland flood pulses and long dry-season storage decline. Its year moves through a long warm/dry season, hot dusty pre-rain weeks, an abrupt wet-season transition and a short green season."
        ]
      },
      {
        title: "Urban form",
        body: ["Merva is dense without being uniformly vertical. Opening-state districts are distinct enough to shape everyday movement and social life."],
        items: [
          "Old Channel Core — older canal street patterns, markets, civic buildings and restored waterworks.",
          "Central Terrace — government, universities, major hospitals, dense transit and mixed-use towers.",
          "North Works — treatment, fabrication, rail/freight and technical yards in the opening state.",
          "Reservoir Green — flood-storage landscapes, parks, recreation and newer housing.",
          "East Fan — large mixed-income residential districts across an older distributary fan.",
          "South Exchange — logistics, markets, intercity transit and newer industrial campuses.",
          "Upper Steps — cooler, wealthier terrace neighborhoods and older homes.",
          "Outer Fields — periurban agriculture, protected growing systems and satellite towns."
        ]
      },
      {
        title: "Transit and infrastructure",
        body: [
          "Layered electric public transit includes metro, elevated lines across flood channels, rapid surface services and regional rail, while freight is largely separated from passenger cores.",
          "Water infrastructure is visible in ordinary life: flood markers, reclaimed-water labels, reservoir-condition displays, storm drains, canal maintenance, non-potable irrigation loops, building cistern access and seasonal warnings."
        ]
      },
      {
        title: "Civic layers",
        body: [
          "Merva has elected municipal government inside Ordan's decentralized constitutional system. The Ordan national government, Merva municipal government and Kesra Basin Water Authority are distinct authorities.",
          "Basin-scale trunk storage, forecasting and cross-jurisdiction water obligations are not simply municipal or national property."
        ]
      },
      {
        title: "Economy and daily life",
        body: [
          "Merva supports advanced engineering, manufacturing, logistics, universities, hospitals, precision technical work, food processing and research.",
          "Its markets, schools, restaurants, apartment districts, neighborhood sports, clinics and family life matter as much to the setting as its laboratories. The city is not collapsing at the opening of REPLY; water stress appears first through resilience, maintenance pressure, prices and political argument."
        ]
      }
    ]
  },
  ovara: {
    slug: "ovara",
    sourceState: "SOURCE-LOCKED / WEBSITE READY",
    sourceLabel: "TC-390 · REPLY ERA",
    lead: "Ovara is a technologically mature, politically plural human world in the Helor System. REPLY enters through the Kesra Basin, the Ordan Republic and Merva, but those places are not proxies for the whole planet.",
    sections: [
      {
        title: "Political plurality",
        body: [
          "Ovara contains 29 sovereign states. There is no planetary sovereign government and no single capital entitled to speak for the world.",
          "Modern states cross older civilizational regions, watersheds, language families and historical trade zones. Migration, mixed families, global media and international institutions make every modern state internally diverse."
        ]
      },
      {
        title: "Major cultural-geographic regions",
        body: ["The public record uses broad analytical regions without treating them as ethnic boxes."],
        items: [
          "Kesra interior — seasonal basin hydrology and Vares-family languages.",
          "Inner Karev monsoon coast — deltas, cyclones, dense cities and maritime trade.",
          "Western Keral highlands — snow-fed watersheds, valley autonomy and strong geology/civil-protection traditions.",
          "Ilyan Arc — equatorial maritime region known for navigation, oceanography and compact water systems.",
          "Oshera lake belt — abundant freshwater, agriculture and energy production.",
          "Northern Karev dry plateau — groundwater science, drought crops and redundancy.",
          "Southern Oshera coast — stormy maritime region with shipyards, fisheries and atmospheric science."
        ]
      },
      {
        title: "Languages and scientific exchange",
        body: [
          "Ovara contains multiple unrelated language families. Two widely used international scientific and technical lingua francas coexist with machine translation and native languages.",
          "Scientific publishing commonly preserves multilingual abstracts and standardized measurement notation. No one regional language defines what it means to be Ovaran."
        ]
      },
      {
        title: "Technology and ordinary life",
        body: [
          "Precision metrology, modern hospitals, climate and hydrological modeling, high-capacity transit, advanced materials, industrial automation, global telecommunications and large public infrastructure are normal parts of Ovaran civilization.",
          "Capability is uneven by region and sector, but Ovara already possesses serious science and engineering before contact."
        ]
      },
      {
        title: "A world larger than the plot",
        body: [
          "Water carries different practical and symbolic meanings in different regions. Kesra cultures may emphasize responsibility around scarcity while maritime, monsoon and lake regions experience water differently.",
          "Reader-facing rule: avoid treating a claim belonging to one state, region, profession, class, religion, generation or person as something all Ovarans believe."
        ]
      }
    ]
  },
  neral: {
    slug: "neral",
    sourceState: "SOURCE-LOCKED / WEBSITE READY",
    sourceLabel: "TC-400 · REPLY ERA",
    lead: "Neral is an inhabited human world in the Irsen System and the other established planetary endpoint of the mature Veyra–Neral connected civilization. By REPLY, it is ordinary connected-world geography rather than a remote mystery.",
    sections: [
      {
        title: "Relationship to Veyra",
        body: [
          "Neral and Veyra are joined by mature Road / Skygate infrastructure supporting routine passenger travel, freight, professional exchange, family ties, research and long-duration work.",
          "Shared technical standards exist where safe Road operation requires them. Sovereignty, civic life, language, architecture and social history remain local."
        ]
      },
      {
        title: "Neral Skygate",
        body: [
          "The principal Road endpoint is Neral Skygate, a permanent Neran gate-city rather than a Veyran terminal transplanted to another world.",
          "Its Road-control interfaces interoperate with Serein Skygate while its city form, materials, public spaces, institutions and visual lineage remain recognizably Neran."
        ]
      },
      {
        title: "Ordinary interworld life",
        body: [
          "People travel between Veyra and Neral for work, study, family, restoration projects, research and ordinary travel. A move between worlds can be a serious life decision without being exploration of an alien frontier.",
          "Mixed-world families and professional lives exist across the Road without making local differences obsolete."
        ]
      },
      {
        title: "Civilizational rule",
        body: [
          "The mature network must never be framed as Veyra having absorbed Neral. Neral remains a contributing civilization whose science, design traditions, public institutions and cultural inheritance shaped the shared Road era.",
          "Standardization at the interface is cooperation, not assimilation."
        ]
      }
    ]
  },
  veyra: {
    slug: "veyra",
    sourceState: "SOURCE-LOCKED / CURATED PUBLIC OVERVIEW",
    sourceLabel: "TC-40 · RHEL SYSTEM",
    lead: "Veyra is the inhabited terrestrial planet of the Rhel System: ocean-dominated, geologically active, magnetically protected and orbited by one large moon, Ione. Humanity evolved naturally and locally here.",
    sections: [
      {
        title: "Atmosphere",
        body: ["Veyra has a nitrogen-oxygen atmosphere suitable for native human life: approximately 77.1% nitrogen, 21.5% oxygen, 0.9% argon and related inert gases, about 0.05% carbon dioxide, with variable water vapor."]
      },
      {
        title: "Interior and geology",
        body: [
          "Veyra contains a solid metallic inner core, liquid iron-rich outer core, convecting silicate mantle and mobile crust divided into tectonic plates.",
          "Core motion generates the global magnetic field. Geological activity continues through residual formation heat, radioactive decay, core crystallization, mantle convection and limited tidal input from Ione."
        ]
      },
      {
        title: "Oceans",
        body: ["About 68% of the surface is ocean. The oceans form one connected body divided geographically into major basins."],
        items: [
          "Maren Ocean — largest ocean, with the deepest trenches, broad abyssal plains, powerful currents and volcanic island chains.",
          "Halar Ocean — the ocean into whose northwestern region the Serein Sea opens.",
          "Neth Ocean — colder northern waters with widespread seasonal ice.",
          "Southern Ring Ocean — uninterrupted high-latitude ocean around Sovar and a major driver of deep circulation.",
          "Serein Sea — strongly tidal tectonic marginal sea bordered by marshes, cliffs, estuaries and dense settlement."
        ]
      },
      {
        title: "Continents",
        body: ["Veyra has six major continents. Their names and broad physical character are source-locked; their definitive mapped silhouettes are not yet approved for publication."],
        items: [
          "Rethan — largest and most populous; Greater Serein lies on its southeastern coast.",
          "Avarra — broad equatorial and tropical land with extensive river systems and high biodiversity.",
          "Kelmor — northern crystalline terrain shaped by glaciation, mountains, fjords and forests.",
          "Namar — southern mid-latitude plateaus, grasslands, salt basins, deserts and major solar-energy regions.",
          "Talune — fragmented oceanic continent of large islands, shelves, volcanic arcs and reef systems.",
          "Sovar — southern polar continent, largely ice-covered."
        ]
      },
      {
        title: "Greater Serein physical setting",
        body: [
          "Cape Serein stands on resistant black basalt and uplifted rift rock. Old Meridian occupies older, more stable continental crust inland. Westbank occupies elevated river and estuary terraces.",
          "Low Harrow occupies younger delta sediment, reclaimed marsh, old tidal channels, flood deposits and artificial fill. Alder Channel carries river discharge, tides, runoff, storm surge and sediment."
        ]
      }
    ]
  },
  ione: {
    slug: "ione",
    sourceState: "SOURCE-LOCKED / CURATED PHYSICAL OVERVIEW",
    sourceLabel: "TC-38 · RHEL SYSTEM",
    lead: "Ione is Veyra's large tidally locked moon, an airless rocky body with ancient highlands, basaltic plains, impact basins and polar cold traps. Its public record is intentionally limited to physical and scientific orientation.",
    sections: [
      {
        title: "Physical character",
        body: [
          "Ione has a radius of roughly 1,900 km, surface gravity around 0.18 Vg, an orbital period of about 28 Veyran days, negligible atmosphere and mostly ancient geology with limited residual thermal activity.",
          "It presents nearly the same hemisphere toward Veyra at all times."
        ]
      },
      {
        title: "Origin",
        body: [
          "Ione formed from impact debris after an early collision between young Veyra and the differentiated planetary embryo later named Eidra.",
          "The event melted much of Veyra's outer layers, altered its rotation and axial tilt, placed silicate material into orbit and produced the debris from which Ione accreted."
        ]
      },
      {
        title: "Effects on Veyra",
        body: ["Ione has major ordinary physical consequences for its parent planet."],
        items: [
          "Drives strong ocean tides.",
          "Gradually slows Veyra's rotation.",
          "Helps stabilize Veyra's axial tilt.",
          "Affects coastal ecosystems and ocean mixing.",
          "Produces regular eclipse cycles and measurable crustal tides."
        ]
      },
      {
        title: "Visual boundary",
        body: [
          "The public site must distinguish ordinary lunar geography from later classified scientific history. No map or illustration should present a measurement label as a literal buried destination inside Ione."
        ]
      }
    ]
  }
};

export function getWikiDetail(slug: string) {
  return wikiDetails[slug];
}
