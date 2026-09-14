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

// Publication-safe projection from the live Transcosmic Canon Wiki and the
// Website Publishing Queue, reconciled 2026-09-14. This is deliberately not a
// mirror of private Notion content. Each article stops at the strictest current
// publication boundary established by its source page and queue record.
export const wikiDetails: Record<string, WikiDetail> = {
  merva: {
    slug: "merva",
    sourceState: "SOURCE-LOCKED / WEBSITE READY",
    sourceLabel: "TC-391 · REPLY ERA",
    lead: "Merva is the principal Ovaran city through which REPLY enters everyday life: a large working city in the Ordan Republic and Kesra Basin where water systems, transit, science, manufacturing, clinics, markets and family life are ordinary parts of the setting.",
    sections: [
      {
        title: "Physical setting and climate",
        body: [
          "Merva sits on a broad terrace above an active floodplain. Distant highlands and the Keral Range feed part of the basin, while lower country descends toward terminal basins.",
          "The city lives with both sides of water risk: upland flood pulses and long dry-season storage decline. Its year moves through a long warm and dry season, hot dusty pre-rain weeks, an abrupt wet-season transition and a short green season."
        ]
      },
      {
        title: "Urban form",
        body: ["Merva is dense without being uniformly vertical. Opening-state districts are distinct enough to shape everyday movement and social life."],
        items: [
          "Old Channel Core — older canal street patterns, markets, civic buildings and restored waterworks.",
          "Central Terrace — government, universities, major hospitals, dense transit and mixed-use towers.",
          "North Works — treatment, fabrication, rail and freight, and technical yards in the opening state.",
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
          "Water infrastructure is visible in ordinary life through flood markers, reclaimed-water labels, reservoir-condition displays, drains, canal maintenance, irrigation loops, building cistern access and seasonal warnings."
        ]
      },
      {
        title: "Civic layers",
        body: [
          "Merva has elected municipal government inside Ordan's decentralized constitutional system. The Ordan national government, Merva municipal government and Kesra Basin Water Authority are distinct authorities.",
          "Basin-scale storage, forecasting and cross-jurisdiction water obligations are not simply municipal or national property."
        ]
      },
      {
        title: "Economy and daily life",
        body: [
          "Merva supports advanced engineering, manufacturing, logistics, universities, hospitals, precision technical work, food processing and research.",
          "Its markets, schools, restaurants, apartment districts, neighborhood sports, clinics and family life matter as much to the setting as its laboratories. Opening-state water stress appears first through maintenance pressure, prices, resilience work and political argument rather than societal collapse."
        ]
      }
    ]
  },

  "nali-solan": {
    slug: "nali-solan",
    sourceState: "SOURCE-LOCKED / WEBSITE READY",
    sourceLabel: "TC-392 · REPLY OPENING",
    lead: "Nali Solan is a 29-year-old precision instrumentation and calibration specialist in Merva whose professional instinct is to ask what a measurement can actually support, who verified it and what a person can honestly sign their name to.",
    sections: [
      {
        title: "Identity",
        body: [
          "Nali lives in Merva, in the Ordan Republic on Ovara, and works inside an Ovaran precision-metrology facility.",
          "She is highly trained and respected by people who understand the work, but her career still exists inside ordinary pressures of certification, reputation, housing and professional stability."
        ]
      },
      {
        title: "Professional lens",
        body: [
          "Nali pays attention to traceability, wear, seals, connectors, contamination paths, instrument history, workarounds and the practical consequence of signing a measurement.",
          "She is wary of prestige being mistaken for evidence and of abstract certainty that ignores the physical chain underneath it."
        ]
      },
      {
        title: "Family and ordinary life",
        body: [
          "Nali is the younger sister of Kerin Solan. Their family history includes periods when repairs, interrupted work and professional training had real household consequences.",
          "Outside work she has a developing relationship with Mervan toolmaker Esan Ved and a small social life rooted in Merva rather than the prestige of her field."
        ]
      },
      {
        title: "Professional boundary",
        body: [
          "Nali is an instrumentation and calibration specialist, not the senior theoretical authority on every phenomenon her instruments may detect. Her strength is knowing when a measurement chain is defensible and when evidence does not yet justify a cleaner story."
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
          "Neral and Veyra are joined by mature Road and Skygate infrastructure supporting routine passenger travel, freight, professional exchange, family ties, research and long-duration work.",
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
          "The mature network is not Veyra absorbing Neral. Neral remains a contributing civilization whose science, design traditions, public institutions and cultural inheritance shaped the shared Road era.",
          "Standardization at the interface is cooperation, not assimilation."
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
          "Western Keral highlands — snow-fed watersheds, valley autonomy and strong geology and civil-protection traditions.",
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
          "A claim belonging to one state, region, profession, class, religion, generation or person should never be mistaken for something all Ovarans believe."
        ]
      }
    ]
  },

  "rena-sol": {
    slug: "rena-sol",
    sourceState: "SOURCE-LOCKED / WEBSITE READY",
    sourceLabel: "TC-393 · REPLY OPENING",
    lead: "Rena Sol is a 118-year-old Human Systems Scientist in Greater Serein whose work focuses on cognitive metrology, high-consequence group decision systems, corrigibility and the ways prestige can distort judgment.",
    sections: [
      {
        title: "Identity and mature life",
        body: [
          "Rena is a healthy mature adult in a civilization where long life is ordinary infrastructure rather than a supernatural exception.",
          "Her chronological age should not be reduced to a simplistic one-number biological age."
        ]
      },
      {
        title: "Professional field",
        body: [
          "Her work draws on psychology, cognitive science, neuroscience, psychometrics, human factors, organizational science and human-AI interaction.",
          "She studies how competent people and institutions become wrong together when hierarchy, confidence and information flow change what people are willing to say or reconsider."
        ]
      },
      {
        title: "Corrigibility",
        body: [
          "Rena is particularly concerned with whether powerful people and systems remain genuinely reachable by correction rather than merely performing openness to it.",
          "She notices when estimates move after a senior person speaks, when supposedly independent evidence is no longer independent and when confidence outruns accuracy."
        ]
      },
      {
        title: "Family and ordinary life",
        body: [
          "Rena is a parent as well as a senior professional. Her adult child, Lio Sol, has a mature life and career independent of Rena's work.",
          "Their relationship gives her public ideas about privacy, correction and autonomy an ordinary family scale where expertise cannot settle every disagreement."
        ]
      }
    ]
  },

  "connected-worlds": {
    slug: "connected-worlds",
    sourceState: "CANONICAL / CURATED PUBLIC",
    sourceLabel: "TC-235 · REPLY ERA",
    lead: "The connected-worlds civilization is the mature Veyra–Neral era in which two sovereign, culturally distinct human worlds share a reciprocal Road and inhabited Skygates as ordinary public infrastructure.",
    sections: [
      {
        title: "Two worlds, not one state",
        body: [
          "Veyra and Neral remain sovereign and culturally distinct. Shared infrastructure does not erase local government, language, architecture, family life or historical identity.",
          "Technical cooperation is strongest where the Road requires common safety and interoperability."
        ]
      },
      {
        title: "Ordinary interworld life",
        body: [
          "Passenger travel, freight, commuting, study, research, family ties and long-duration work can cross the Road without turning every journey into exploration.",
          "The achievement is visible precisely because much of the extraordinary infrastructure has become routine enough to support ordinary schedules and ordinary disagreements."
        ]
      },
      {
        title: "Gate-cities",
        body: [
          "The Road is anchored by two inhabited orbital gate-cities rather than a single portal. Serein Skygate and Neral Skygate cooperate technically while remaining products of different civilizations.",
          "People can be born, work, attend school, receive medical care and build community on the gate-cities themselves."
        ]
      },
      {
        title: "Public orientation",
        body: [
          "This record describes the current REPLY-era setting only. Founding history, ancient individual biographies and future-series development are intentionally outside this public article."
        ]
      }
    ]
  },

  grainit: {
    slug: "grainit",
    sourceState: "CANONICAL / LOCKED PUBLIC VISUAL LANGUAGE",
    sourceLabel: "TC-64 · CURATED SCIENCE",
    lead: "GRAINIT is Devon Akins's exploratory covariant finite-resolution and quasilocal geometry program for quantum gravity. A grainit is a resolution-bounded geometric datum, not a literal particle, cube, graph node or unit of space.",
    sections: [
      {
        title: "Finite-resolution idea",
        body: [
          "The public GRAINIT explainer begins from a simple constraint: physical information is gathered through finite regions, finite instruments and finite resolution rather than from perfectly isolated mathematical points.",
          "The theory asks how geometric information and relationships should be represented when neighboring bounded regions cannot be treated as if their cross-boundary correlations vanish before the full state is solved."
        ]
      },
      {
        title: "What a grainit is",
        body: [
          "A grainit is a resolution-bounded geometric datum used inside the exploratory framework. It is not a microscopic object or a claim that spacetime is literally tiled by cubes.",
          "Public visual language should use bounded regions, measurements, cross-boundary relations, covariance, residual behavior and fit stabilization rather than magical fields or portal imagery."
        ]
      },
      {
        title: "Scientific boundary",
        body: [
          "The program remains exploratory. Public presentation must distinguish proposed mathematical structure and required physical benchmarks from completed empirical proof.",
          "Fictional macroscopic transport extensions belong to a separate layer and are not evidence for real-world transport physics."
        ]
      }
    ]
  },

  iren: {
    slug: "iren",
    sourceState: "CANONICAL / CURATED PUBLIC",
    sourceLabel: "TC-388 · REPLY ERA",
    lead: "IREN is the mature civilization's provenance-aware artificial-intelligence interface and intelligence layer: a partner used across learning, research, planning, public systems and daily life without replacing human sovereignty or legitimate authority.",
    sections: [
      {
        title: "Ordinary use",
        body: [
          "IREN helps people interpret information, learn, create, plan, communicate and coordinate complex systems. Its presence is normal enough to appear in household, educational, scientific, maintenance and civic contexts.",
          "Capability does not automatically grant authority over private systems, resources or high-consequence decisions."
        ]
      },
      {
        title: "Provenance and uncertainty",
        body: [
          "A mature IREN answer is expected to preserve where important claims came from and how certain they are. Summaries do not replace the underlying evidence.",
          "For consequential questions, the system should distinguish observation, established knowledge, active models, inference, forecast, dispute and genuine unknowns rather than flattening them into one confident voice."
        ]
      },
      {
        title: "Human authority",
        body: [
          "IREN is not the government and does not self-authorize high-consequence physical or civic action simply because a computational recommendation appears optimal.",
          "People and institutions remain responsible for law, consent, values, resource authority and the decision to act."
        ]
      },
      {
        title: "A mature interface",
        body: [
          "The system feels advanced partly because people can inspect, challenge, limit and sometimes ignore it. Better intelligence does not require pretending uncertainty, privacy or disagreement have disappeared."
        ]
      }
    ]
  },

  "lio-sol": {
    slug: "lio-sol",
    sourceState: "SOURCE-LOCKED / WEBSITE READY",
    sourceLabel: "TC-394 · REPLY OPENING",
    lead: "Lio Sol is a 76-year-old Greater Serein public-garden conservator and horticultural restoration specialist whose life shows the mature connected-world civilization at ordinary human scale.",
    sections: [
      {
        title: "Identity",
        body: [
          "Lio uses they and them pronouns, lives in Greater Serein and works as an educated, secure, non-elite professional.",
          "Roads, long adult lives, IREN-assisted systems and movement between inhabited worlds are ordinary infrastructure to them rather than historical wonders."
        ]
      },
      {
        title: "Professional lens",
        body: [
          "Lio notices which plants are actually thriving, substrate and moisture conditions, maintenance history, how people use public space and where a beautiful system depends on invisible routine labor.",
          "Their work treats restoration as a living practice rather than an attempt to freeze a place at one ideal historical moment."
        ]
      },
      {
        title: "Privacy and autonomy",
        body: [
          "Lio's life explores whether more measurement, prediction or optimization automatically makes a life better. They value the right to choose what becomes continuously legible to institutions and other people.",
          "That position is not anti-science. It asks whether a voluntary choice remains genuinely voluntary even when a system is useful and statistically persuasive."
        ]
      },
      {
        title: "Ordinary mature life",
        body: [
          "Public transit, gardens and maintenance crews, ordinary IREN use, mixed-world social ties, long-term relationships and interworld mobility all belong to Lio's world before extraordinary events enter the frame."
        ]
      }
    ]
  },

  "serein-skygate": {
    slug: "serein-skygate",
    sourceState: "CANONICAL / WEBSITE READY",
    sourceLabel: "TC-229 · VEYRA ENDPOINT",
    lead: "Serein Skygate is Veyra's inhabited orbital gate-city and one physical endpoint of the mature Veyra–Neral Road, combining homes and civic life with transit, freight, docking, utilities and precision Road infrastructure.",
    sections: [
      {
        title: "Relationship to Greater Serein",
        body: [
          "The gate serves Greater Serein and is visible from the metropolitan region below as an enormous engineered circle or arc. It occupies orbital or near-space rather than hanging directly over downtown.",
          "Dedicated Gateport and orbital transit systems connect the gate-city to the region below."
        ]
      },
      {
        title: "Urban character",
        body: [
          "Serein Skygate grows out of Veyran infrastructure traditions rather than generic space-station design. Mature districts combine adaptive structures, public transit, water and ecological systems, hospitals, civic services and carefully separated residential, industrial and precision-scientific zones.",
          "Worldward districts face Veyra; Roadward districts face the aperture and Neral when the Road is open. Heavy freight and hazardous maintenance are separated from the largest passenger flows."
        ]
      },
      {
        title: "A permanent city",
        body: [
          "People live permanently on the gate. Schools, housing, sanitation, parks, local services, food, recreation and ordinary municipal responsibilities exist alongside Road operations.",
          "A resident can simply be from Serein Gate. Gateborn identity does not replace ordinary Veyran citizenship or family history."
        ]
      },
      {
        title: "Visual distinction",
        body: [
          "Serein Skygate and Neral Skygate share technical interface standards without being visual copies. The inhabited Veyran structure should read as a product of Veyran materials, planning and civic infrastructure."
        ]
      }
    ]
  },

  "talin-vel": {
    slug: "talin-vel",
    sourceState: "SOURCE-LOCKED / OPENING IDENTITY ONLY",
    sourceLabel: "TC-399 · REPLY OPENING",
    lead: "Talin Vel is a 30-year-old gateborn Serein Skygate boundary-metrology and field-systems specialist who approaches problems through measurement, maintenance, calibration and the physical behavior of systems.",
    sections: [
      {
        title: "Identity",
        body: [
          "Talin was born on Serein Skygate and lives in Alder Ward. She is Veyran and gateborn, with a Veyran father and Neran mother.",
          "She grew up inside systems earlier generations considered civilization-scale achievements, so Road schedules, calibration chains, mixed-world families and IREN-assisted maintenance are ordinary parts of life."
        ]
      },
      {
        title: "Work and training",
        body: [
          "Her path combines technical-secondary study, advanced mathematics and physics, cooperative placement, university-level precision-metrology and relational-systems training, apprenticeship hours, Road-boundary safety certification and repeated field recertification.",
          "Routine work includes sensor calibration, timing and metrology checks, thermal and vibration correction, failure investigation, hardware-lineage review and field diagnostics."
        ]
      },
      {
        title: "Technical lens",
        body: [
          "Talin notices vibration, pressure-door cycling, bearing changes, ventilation rhythm, sensor drift, maintenance quality and physical system behavior before reaching for a grand explanation.",
          "She prefers raw traces, incident history and plainly displayed uncertainty over prestige or performative complexity."
        ]
      },
      {
        title: "Family and ordinary life",
        body: [
          "Her family crosses Veyran, Neran, orbital and planetside experience. Talin's home life includes ordinary questions about housing, professional advancement, desirable districts, hobbies and whether better status is worth worse hours.",
          "She collects obsolete transit tokens and decommissioned hardware, repairs old mechanical objects for fun and prefers crowded food halls to formal restaurants."
        ]
      }
    ]
  },

  "continuance-institute": {
    slug: "continuance-institute",
    sourceState: "CANONICAL / LOCKED PUBLIC INSTITUTION",
    sourceLabel: "TC-59 · MATURE ERA",
    lead: "The Continuance Institute is a large scientific and engineering institution with a major Cape Serein presence, public research functions, infrastructure expertise and bounded authority. Its public identity is built from ordinary advanced science and engineering rather than mysticism.",
    sections: [
      {
        title: "Public institution",
        body: [
          "Continuance operates at the scale of a recognizable scientific and engineering institution: laboratories, test sites, public functions, contractors, grants, standards, procurement, archives, maintenance, offices and specialist staff.",
          "Its reputation comes from scale, competence and long institutional continuity, not from behaving like a secret order."
        ]
      },
      {
        title: "Cape Serein presence",
        body: [
          "The Cape campus is integrated into black basalt cliffs and a severe coastal environment. Tall research structures, occupied campus bases, enclosed bridges, cliff laboratories, transit and service approaches, maintenance infrastructure and storm-capable materials all belong to its public visual identity.",
          "The architecture has to work under salt, wind, rain, corrosion and heavy scientific-service demands."
        ]
      },
      {
        title: "Human systems behind the science",
        body: [
          "The institution includes loading access, weatherproofing, machine rooms, clean spaces, cafeterias, security, backups, cooling, plumbing, storage, shift changes, paperwork, calibration, breakdowns and repairs.",
          "Extraordinary technical capability grows out of believable operational systems and ordinary professional labor."
        ]
      },
      {
        title: "Bounded authority",
        body: [
          "Continuance is not a planetary government and does not own every system it helps build. The public record presents a major institution whose scientific and engineering authority remains limited by law, external institutions, evidence and the scope of its actual responsibilities."
        ]
      }
    ]
  },

  "open-road": {
    slug: "open-road",
    sourceState: "CANONICAL / CURATED PUBLIC",
    sourceLabel: "TC-223 · MATURE INFRASTRUCTURE",
    lead: "An Open Road is a continuously stabilized two-ended interworld connection maintained by paired Skygates. People, vehicles and cargo cross through a framed boundary as ordinary public transit rather than through a magical vortex or a tunnel spanning normal space.",
    sections: [
      {
        title: "Two endpoints",
        body: [
          "The Veyra–Neral Road is maintained by two separate local Skygates, one at each endpoint. They are not one physical ring stretching between worlds.",
          "When the Road is active, the two central apertures act as the paired boundaries of one uniquely certified relation."
        ]
      },
      {
        title: "More than the visible ring",
        body: [
          "The visible circular frame is only the traffic boundary. Mature Road operation also depends on distributed metrology, precision timing, endpoint-state models, power, cooling, computation, structural sensing, maintenance, traffic control and active cooperation from the far endpoint.",
          "The system remains under continuous control rather than simply being switched on and forgotten."
        ]
      },
      {
        title: "What travelers see",
        body: [
          "When inactive, the aperture is ordinary local space. When active, the other endpoint is directly visible through the opening: its local sky, atmosphere, surface and nearby infrastructure as geometry allows.",
          "The default visual is therefore a real view into another place, not an abstract glowing energy surface."
        ]
      },
      {
        title: "Operational limits",
        body: ["The public infrastructure does not behave like an arbitrary destination dial."],
        items: [
          "It requires an identified, cooperating endpoint.",
          "It does not select historical eras or duplicate travelers.",
          "It cannot remain safely open when endpoint identity or control becomes nonunique.",
          "It is a two-ended system rather than something one world can operate alone."
        ]
      }
    ]
  },

  "skygate-megastructure": {
    slug: "skygate-megastructure",
    sourceState: "CANONICAL / WEBSITE READY",
    sourceLabel: "TC-226 · MATURE OPEN ROAD",
    lead: "A mature Skygate is a colossal inhabited orbital ring-city built around the visible boundary of an Open Road. The portal is not a glowing surface attached to a station; the city and the endpoint machine are one engineered megastructure.",
    sections: [
      {
        title: "Core geometry",
        body: ["The mature structure is organized around three principal systems."],
        items: [
          "Inner Road Frame — nonrotating precision structure defining the usable boundary and carrying immediate sensing and control.",
          "Habitation Rings — counter-rotating inhabited belts providing artificial gravity and continuous city life.",
          "Outer Utility and Transit Ring — mostly fixed infrastructure for docks, freight, power, cooling, maintenance and orbital operations."
        ]
      },
      {
        title: "One ring-city",
        body: [
          "The inhabited belts continue around most of the circumference, interrupted only where engineering and transfer systems require it. Circumferential transit makes the structure function as a city-region rather than a small station.",
          "Roadward districts face the aperture; worldward districts face the home world. Ordinary habitation remains separated from the most sensitive boundary hardware."
        ]
      },
      {
        title: "A place, not a machine room",
        body: [
          "A mature Skygate has addresses, neighborhoods, schools, hospitals, parks, commerce, civic administration, emergency services, utilities, waste processing, water recovery and ordinary politics.",
          "People can be born on the gate and spend their lives there. Gateborn identity is cultural, not a separate biological category."
        ]
      },
      {
        title: "Two civilizations",
        body: [
          "Veyra and Neral each possess a separate Skygate. Road interface and safety standards are shared; surrounding city architecture, language, food, law, public space and civic culture remain recognizably different."
        ]
      }
    ]
  },

  "d3-17": {
    slug: "d3-17",
    sourceState: "CANONICAL / TEASER ONLY",
    sourceLabel: "TC-85 · ARCHIVE",
    lead: "D3-17 is a historical Old Meridian research incident and accident dated VY 3112.11.12. The current public record deliberately stops at the event's opening-era surface and does not explain what later institutions eventually made of it.",
    sections: [
      {
        title: "Public archive state",
        body: [
          "D3-17 belongs in the public Archive as an incident record rather than as a solved-history article. It establishes an Old Meridian precision-research environment, an unauthorized validation state and a serious mechanical and electrical accident.",
          "The public treatment preserves uncertainty instead of using later history to explain the event backward."
        ]
      },
      {
        title: "Visual rule",
        body: [
          "Approved opening-era imagery is grounded in a physical laboratory: instrumentation, service structure, damaged equipment, emergency lighting and an isolation platform.",
          "There is no visible spacetime rupture, portal, duplicate person, remote vision or supernatural effect in the public scene language."
        ]
      },
      {
        title: "What remains sealed",
        body: [
          "The far-remote relation, classified Continuance provenance, later engineering lineage, First Crossing consequences and retrospective historical meaning remain outside the current public window."
        ]
      }
    ]
  },

  "neral-skygate": {
    slug: "neral-skygate",
    sourceState: "CANONICAL / CURATED PUBLIC",
    sourceLabel: "TC-230 · NERAN ENDPOINT",
    lead: "Neral Skygate is the Neran orbital gate-city at the far end of the mature Veyra–Neral Road. It shares Road-control standards with Serein Skygate while preserving a visibly Neran architectural, civic and engineering lineage.",
    sections: [
      {
        title: "Standard interface, local city",
        body: [
          "The common Road machinery must interoperate safely across both worlds. That does not make Neral Skygate a copy of the Veyran endpoint.",
          "The gate-city retains Neran choices in structural rhythm, public space, housing, materials, language, signage, food districts, institutions and the relationship between industry and civic life."
        ]
      },
      {
        title: "Visual lineage",
        body: [
          "Current design direction carries forward darker stone, ceramic and weathered-metal lineages into advanced materials; broad terraced and enclosed districts; warm interior public space; large low-gravity spans; and visible water and thermal infrastructure.",
          "These are civilizational design constraints, not permission to freeze Neral in an older technological era."
        ]
      },
      {
        title: "Civic life",
        body: [
          "Neral Skygate is a permanent city with ordinary municipal responsibilities rather than a terminal district run entirely by Road operators.",
          "People raised on the ring can participate in gateborn culture while remaining Neran and preserving local family, language, civic and political traditions."
        ]
      }
    ]
  },

  "deep-three": {
    slug: "deep-three",
    sourceState: "SOURCE-LOCKED / CURATED ARCHIVE",
    sourceLabel: "TC-52 · IONE FACILITY",
    lead: "Deep Three, formally Lunar Deep Station Three, is a Veyran research station on Ione. Its current public record treats it as a physical lunar facility and historical scientific artifact while keeping the classified installation beneath that public identity sealed.",
    sections: [
      {
        title: "Public identity",
        body: [
          "Deep Three belongs to a sequence of deep-lunar geology and engineering facilities. The public-facing station is practical, hardened, aged and maintained rather than monumental or mystical.",
          "Its setting belongs to Ione's airless rocky environment and to a tradition of difficult lunar measurement and engineering work."
        ]
      },
      {
        title: "Research environment",
        body: [
          "The public article can establish ordinary station functions, scientific instrumentation, lunar operations and the physical fact of a buried research facility without revealing the purpose of restricted lower systems.",
          "Visual language should emphasize real infrastructure, service access, metrology and environmental engineering rather than a glowing portal."
        ]
      },
      {
        title: "Archive boundary",
        body: [
          "Hidden anomaly infrastructure, restricted lower-installation purpose, transfer-development history and later Road implications remain sealed. The public facility record is not a shortcut into the classified history."
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
  },

  "cape-serein": {
    slug: "cape-serein",
    sourceState: "SOURCE-LOCKED / WEBSITE READY",
    sourceLabel: "TC-36 · GREATER SEREIN",
    lead: "Cape Serein is a coastal district of Greater Serein built across black basalt cliffs, wet marsh, causeways and engineered coastal shelves. The Continuance Institute is part of the district, but the coast remains a place before it becomes an institution.",
    sections: [
      {
        title: "Physical setting",
        body: [
          "Dark water, black rock, exposed cliffs, marsh causeways and the Serein Sea define the district. Wind, spray, fog, salt, storms and tidal loading are persistent physical conditions rather than background decoration.",
          "Research architecture has to adapt visibly to that environment instead of erasing it."
        ]
      },
      {
        title: "Research district",
        body: [
          "Cape includes public research and education, ordinary district services, secured institutional campus, observation structures, cliff laboratories, launch and heavy-engineering shelves, and controlled coastal access.",
          "Its public scientific identity includes astronomy, climate, ocean measurement, orbital research and precision time."
        ]
      },
      {
        title: "Infrastructure pressures",
        body: ["The built environment is shaped by practical coastal engineering constraints."],
        items: [
          "Salt corrosion and extreme wind.",
          "Wave loading, cliff erosion and marsh settlement.",
          "Storm access failures and tidal variation.",
          "Vibration control for precision measurement.",
          "Separation of public and secure circulation without turning the district into a fortress."
        ]
      },
      {
        title: "Visual boundary",
        body: [
          "Locked component references exist for the marsh-causeway approach and Continuance campus exterior, but no single definitive district-wide skyline is approved. Public design should preserve that distinction rather than inventing a final skyline."
        ]
      }
    ]
  },

  "greater-serein": {
    slug: "greater-serein",
    sourceState: "SOURCE-LOCKED / PROVISIONAL VISUAL LAYER",
    sourceLabel: "TC-42 · CURRENT ERA",
    lead: "Greater Serein is a dense coastal metropolis and city-region containing Cape Serein, Westbank, Low Harrow, Southbank District, Old Meridian and the Serein basin, shaped by water, basalt, marsh, transport history and long-lived infrastructure.",
    sections: [
      {
        title: "One coastal civilization",
        body: [
          "Greater Serein is not a collage of generic futuristic districts. Its built form responds to local rain, marsh, basalt, channels, wind, salt, flood control, maintenance culture, transport history and differences in wealth and land condition.",
          "Shared technology appears differently across districts because the physical problems differ."
        ]
      },
      {
        title: "District geography",
        body: [
          "Cape Serein occupies the exposed black-basalt coast and research district. Low Harrow is especially rain-heavy and flood-shaped. Old Meridian sits on older, more stable inland ground. Westbank occupies elevated terraces with major medical and institutional fabric. Southbank extends into lower coastal and basin infrastructure.",
          "Alder Channel, the Serein Basin and the Serein Sea are major organizing environmental features."
        ]
      },
      {
        title: "Movement and infrastructure",
        body: [
          "The metropolitan region is tied together by layered road, rail, public transit, bridges, flood infrastructure and causeways. Transport is part of the city's environmental adaptation rather than a decorative futuristic overlay.",
          "Public facilities, hospitals, universities, markets and research districts exist inside an urban system that has accumulated multiple construction eras."
        ]
      },
      {
        title: "Visual authority",
        body: [
          "The current visual authority is layered: district geography is controlled by the civic map, while approved environmental references govern the Alder Channel and marsh approach, Low Harrow street conditions and Cape institutional exterior.",
          "No definitive Greater Serein skyline is locked, so public visuals must not invent one and present it as settled canon."
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
        body: ["Veyra has six major continents. Their names and broad physical character are source-locked; definitive mapped silhouettes are not yet approved for publication."],
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

  "elias-venn": {
    slug: "elias-venn",
    sourceState: "SOURCE-LOCKED / CURATED HISTORICAL PROFILE",
    sourceLabel: "TC-86 · FIRST CROSSING ERA",
    lead: "Elias Venn is a Veyran mathematical-physics thinker from the First Crossing era whose strengths and failures are unusually uneven: capable of seeing difficult relationships with startling clarity while struggling with routine obligations, sequencing and sustained reliability.",
    sections: [
      {
        title: "Public-safe profile",
        body: [
          "As a young adult Elias studies mathematical physics and gains practical familiarity with Old Meridian's lower-lab clock and instrumentation work. His theoretical ability is genuine; so are attendance problems, missed work, failed or repeated practical requirements and poor decisions that damage his academic path.",
          "His historical profile preserves the difference between ability and reliability rather than turning brilliance into an excuse for harm or instability."
        ]
      },
      {
        title: "Teaching instinct",
        body: [
          "Elias loves teaching and explanation. Turning a difficult idea into something another person can understand is one of the clearest places where he feels capable and alive.",
          "His intellectual ambition therefore exists alongside a very human desire to be useful to other people rather than as isolated genius mythology."
        ]
      },
      {
        title: "Family aspiration",
        body: [
          "His deepest private aspiration is less grand than his scientific ambition: he wants to become a dependable father and build a family life more stable than the one he inherited.",
          "That aspiration does not erase the consequences of addiction, disappearance, broken promises or unsafe choices."
        ]
      },
      {
        title: "D3-17 boundary",
        body: [
          "D3-17 damages Elias's academic path and leaves lasting consequences. The current public profile stops there.",
          "Later traveler status, destination, alternate identity, death, long Road legacy and classified institutional use of his work remain withheld until separately approved historical spoiler windows."
        ]
      }
    ]
  }
};

export function getWikiDetail(slug: string) {
  return wikiDetails[slug];
}
