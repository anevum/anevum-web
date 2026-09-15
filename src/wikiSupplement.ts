import type { WikiSection } from "./wikiDetails";

/**
 * Additional publication-safe article depth reconciled against the live
 * Transcosmic Canon Wiki and Website Publishing Queue on 2026-09-14.
 * These sections deliberately stop at each record's current public boundary.
 */
export const wikiSupplement: Record<string, WikiSection[]> = {
  merva: [
    {
      title: "Scale and civic role",
      body: [
        "Merva has a working population of roughly 7.8 million. It is the Kesra Basin's largest city, a major university and engineering center, a manufacturing and logistics hub, and the administrative seat of important basin technical institutions.",
        "Its public identity is shaped partly by competence in public works and by continuous argument over how water should be modeled, allocated and maintained."
      ]
    },
    {
      title: "Visual canon",
      body: [
        "Merva should read as warm, layered and functional rather than as a generic futuristic water city. Stone, concrete and ceramic coexist with shade structures, water-supported trees, engineered water paths and older alignments beneath newer systems.",
        "Season matters visually: dust and hard light before rain can give way quickly to cooler air, changed street smell and intense brightness after the first real rains."
      ]
    }
  ],

  "nali-solan": [
    {
      title: "Character lens",
      body: [
        "Nali's governing instinct is that responsibility should follow what a person can actually know, verify and stand behind. She is wary of prestige being mistaken for evidence and of abstract certainty that ignores the physical chain beneath a measurement.",
        "Her attention naturally moves toward traceability, wear, seals, connectors, contamination paths, instrument history, workarounds and the consequence of signing her name to a result."
      ]
    },
    {
      title: "Connected canon",
      body: [
        "Nali's opening-state record is grounded in the current REPLY manuscript authority and the dedicated public character record. Merva, Ordan and the wider Ovaran metrology system remain separate encyclopedia subjects rather than being collapsed into her biography."
      ]
    }
  ],

  neral: [
    {
      title: "Knowledge boundary",
      body: [
        "The REPLY-era setting can acknowledge that the Veyra–Neral relationship has deep history without making the public Neral article an explanation of the entire founding sequence.",
        "Founding-era records, Jon Zero / Elias material and the precise First Road sequence remain outside this current public orientation until separately reconciled and released."
      ]
    }
  ],

  ovara: [
    {
      title: "Civilizational scale",
      body: [
        "Ovaran civilization is modern on its own historical terms. Advanced medicine, engineering, manufacturing, global scientific networks, complex public institutions and large cities all predate contact with the mature Veyra–Neral network.",
        "The Kesra Basin, Ordan Republic and Merva are the opening lens of REPLY, not stand-ins for the entire planet."
      ]
    },
    {
      title: "Water is not one planetary culture",
      body: [
        "Water carries different practical and symbolic meanings across Ovara. Kesra cultures often emphasize responsibility and continuity around scarcity, while maritime and monsoon regions may encounter water through storm, travel, excess and landscape; lake regions can experience it as ordinary abundance.",
        "Ovara should never be flattened into a single 'water world' culture, just as one state, profession, language community or generation should never be treated as speaking for every Ovaran."
      ]
    }
  ],

  "rena-sol": [
    {
      title: "Character lens",
      body: [
        "Rena notices whose estimate moved after a senior person spoke, whether supposedly independent evidence remains independent, the difference between what a system measured and what people inferred from it, and when confidence is outrunning accuracy.",
        "She is not a therapist assigned to diagnose everyone around her and cannot read minds. Better measurement can improve judgment without granting authority over another person's interior life."
      ]
    },
    {
      title: "Professional history",
      body: [
        "An important early-career failure shaped Rena's later discipline. She learned that individual error and system-shaped error can be confused when workload, authority and information routing are measured badly.",
        "The lesson did not erase the consequences of the original mistake; it became a reason to treat blame, hierarchy and confidence with greater rigor."
      ]
    }
  ],

  "talin-vel": [
    {
      title: "Home and ordinary life",
      body: [
        "Talin lives in a compact Alder Ward apartment and is financially stable by current-era standards. She still thinks about housing, professional advancement, desirable districts, hobbies and whether better status is worth worse hours.",
        "She collects obsolete transit tokens and small decommissioned hardware, repairs old mechanical objects for fun, plays casual court sports and prefers crowded food halls to formal restaurants. Her life is intended to feel lived-in rather than like a technician waiting for the plot."
      ]
    },
    {
      title: "Knowledge boundaries",
      body: [
        "Talin understands mature Road systems from inside their maintenance and measurement culture. Fluency with a reliable system is not the same as understanding every historical cost that created it, every society outside it or every value judgment that should follow from technical capability."
      ]
    }
  ],

  "lio-sol": [
    {
      title: "Knowledge boundaries",
      body: [
        "Lio is knowledgeable about horticultural restoration, public living systems and ordinary mature-network life. They are not a Continuance executive, contact physicist or political authority.",
        "Their significance comes partly from experiencing the civilization outside the institutions managing extraordinary events: public transit, gardens, maintenance, relationships, privacy choices and the question of how to use a long adult life."
      ]
    }
  ],

  veyra: [
    {
      title: "Planetary parameters",
      body: ["The current public physical record fixes several orientation-scale values without publishing a definitive planetary map."],
      items: [
        "Classification — habitable rocky planet.",
        "Radius — approximately 6,510 km.",
        "Surface gravity — 1.00 Vg by definition.",
        "Day — 24 standard hours.",
        "Orbital year — 365.242 mean solar days.",
        "Axial tilt — approximately 22.6°.",
        "Ocean coverage — approximately 68%.",
        "Major moon — Ione.",
        "Magnetic field — strong and globally protective.",
        "Plate tectonics — active."
      ]
    },
    {
      title: "Humanity and built-world rule",
      body: [
        "Humanity evolved naturally and locally from earlier Veyran life. Familiar translated biological terms do not imply Earth ancestry or identity.",
        "Veyran built environments should therefore remain recognizably human in function while visibly responding to Veyra's own climate zones, gravity, geology, coastlines, resources, historical development and maintenance culture rather than looking like present-day Earth with futuristic labels added."
      ]
    }
  ],

  "greater-serein": [
    {
      title: "Environmental design logic",
      body: [
        "Greater Serein is one coherent coastal civilization shaped by rain, marsh, basalt, channels, wind, salt, flood control, transport history, wealth differences and maintenance culture. Shared Veyran technology appears differently from district to district because the physical problems differ.",
        "Low Harrow is especially rain-heavy and flood-shaped; Cape Serein is defined by wind, salt, basalt and marsh engineering; Old Meridian sits on older stable inland ground; Westbank's elevated terraces and institutional fabric answer a different set of constraints."
      ]
    },
    {
      title: "Current visual authority",
      body: [
        "Greater Serein uses a layered visual authority stack rather than one image claiming to define the entire metropolis. The civic navigation map governs district geography, while approved environmental and district references govern the Alder Channel and marsh causeway, Low Harrow street conditions and the Continuance / Cape exterior.",
        "No definitive Greater Serein skyline is locked. New wide city views must reconcile the approved geography and district references rather than inventing a new layout and presenting it as canon."
      ]
    }
  ]
};

export function getWikiSections(slug: string, base: WikiSection[] = []) {
  const additions = wikiSupplement[slug] || [];
  return [...base, ...additions];
}
