/**
 * Series One inventory metadata. Names and level order mirror the existing
 * authoritative server definition in auth/community.mjs. The art status is
 * presentation-only; it never grants XP or confirms a member has earned one.
 *
 * No generated placeholders masquerade as finished artwork. The first four
 * concept studies are the ONLY emblems with distinct reviewed geometry so far.
 */
export type SeriesOneArtifact = Readonly<{
  level: number;
  name: string;
  artStatus: "illustrated-study" | "illustration-pending";
}>;

export const seriesOneArtifacts: readonly SeriesOneArtifact[] = Object.freeze([
  Object.freeze({ level: 1, name: "Foundry Spark", artStatus: "illustrated-study" as const }),
  Object.freeze({ level: 2, name: "Copper Key", artStatus: "illustrated-study" as const }),
  Object.freeze({ level: 3, name: "Blackglass Seed", artStatus: "illustration-pending" as const }),
  Object.freeze({ level: 4, name: "Ivory Compass", artStatus: "illustration-pending" as const }),
  Object.freeze({ level: 5, name: "Iron Moth", artStatus: "illustration-pending" as const }),
  Object.freeze({ level: 6, name: "Brass Dial", artStatus: "illustration-pending" as const }),
  Object.freeze({ level: 7, name: "Quartz Spool", artStatus: "illustration-pending" as const }),
  Object.freeze({ level: 8, name: "Ember Lantern", artStatus: "illustration-pending" as const }),
  Object.freeze({ level: 9, name: "Prism Mask", artStatus: "illustration-pending" as const }),
  Object.freeze({ level: 10, name: "Cobalt Coil", artStatus: "illustration-pending" as const }),
  Object.freeze({ level: 11, name: "Silver Needle", artStatus: "illustration-pending" as const }),
  Object.freeze({ level: 12, name: "Aether Bell", artStatus: "illustration-pending" as const }),
  Object.freeze({ level: 13, name: "Obsidian Feather", artStatus: "illustration-pending" as const }),
  Object.freeze({ level: 14, name: "Sunken Astrolabe", artStatus: "illustration-pending" as const }),
  Object.freeze({ level: 15, name: "Clockwork Finch", artStatus: "illustration-pending" as const }),
  Object.freeze({ level: 16, name: "Glass Meridian", artStatus: "illustration-pending" as const }),
  Object.freeze({ level: 17, name: "Furnace Rose", artStatus: "illustration-pending" as const }),
  Object.freeze({ level: 18, name: "Amber Tuning Fork", artStatus: "illustration-pending" as const }),
  Object.freeze({ level: 19, name: "Marble Eye", artStatus: "illustration-pending" as const }),
  Object.freeze({ level: 20, name: "Paper Engine", artStatus: "illustration-pending" as const }),
  Object.freeze({ level: 21, name: "Ceramic Ghost", artStatus: "illustration-pending" as const }),
  Object.freeze({ level: 22, name: "Mercury Hourglass", artStatus: "illustration-pending" as const }),
  Object.freeze({ level: 23, name: "Saffron Beacon", artStatus: "illustration-pending" as const }),
  Object.freeze({ level: 24, name: "Gilded Gear", artStatus: "illustration-pending" as const }),
  Object.freeze({ level: 25, name: "Basalt Crown", artStatus: "illustration-pending" as const }),
  Object.freeze({ level: 26, name: "Lunar Caliper", artStatus: "illustration-pending" as const }),
  Object.freeze({ level: 27, name: "Magnetic Rose", artStatus: "illustration-pending" as const }),
  Object.freeze({ level: 28, name: "Aurora Cartridge", artStatus: "illustration-pending" as const }),
  Object.freeze({ level: 29, name: "Bronze Orrery", artStatus: "illustration-pending" as const }),
  Object.freeze({ level: 30, name: "Midnight Atlas", artStatus: "illustrated-study" as const }),
  Object.freeze({ level: 31, name: "Jade Relay", artStatus: "illustration-pending" as const }),
  Object.freeze({ level: 32, name: "Tidal Key", artStatus: "illustration-pending" as const }),
  Object.freeze({ level: 33, name: "Hollow Star", artStatus: "illustration-pending" as const }),
  Object.freeze({ level: 34, name: "Crystal Loom", artStatus: "illustration-pending" as const }),
  Object.freeze({ level: 35, name: "Auric Beetle", artStatus: "illustration-pending" as const }),
  Object.freeze({ level: 36, name: "Sundial Heart", artStatus: "illustration-pending" as const }),
  Object.freeze({ level: 37, name: "Sable Pendant", artStatus: "illustration-pending" as const }),
  Object.freeze({ level: 38, name: "Velvet Catalyst", artStatus: "illustration-pending" as const }),
  Object.freeze({ level: 39, name: "Amber Gyroscope", artStatus: "illustration-pending" as const }),
  Object.freeze({ level: 40, name: "Echo Prism", artStatus: "illustration-pending" as const }),
  Object.freeze({ level: 41, name: "Forged Telescope", artStatus: "illustration-pending" as const }),
  Object.freeze({ level: 42, name: "Arc Lantern", artStatus: "illustration-pending" as const }),
  Object.freeze({ level: 43, name: "Ivory Sextant", artStatus: "illustration-pending" as const }),
  Object.freeze({ level: 44, name: "Molten Cipher", artStatus: "illustration-pending" as const }),
  Object.freeze({ level: 45, name: "Silver Harp", artStatus: "illustration-pending" as const }),
  Object.freeze({ level: 46, name: "Cobalt Furnace", artStatus: "illustration-pending" as const }),
  Object.freeze({ level: 47, name: "Night Compass", artStatus: "illustration-pending" as const }),
  Object.freeze({ level: 48, name: "Dawn Engine", artStatus: "illustration-pending" as const }),
  Object.freeze({ level: 49, name: "Glass Cathedral", artStatus: "illustration-pending" as const }),
  Object.freeze({ level: 50, name: "Radiant Crucible", artStatus: "illustration-pending" as const }),
  Object.freeze({ level: 51, name: "Solar Orrery", artStatus: "illustration-pending" as const }),
  Object.freeze({ level: 52, name: "Gravity Spindle", artStatus: "illustration-pending" as const }),
  Object.freeze({ level: 53, name: "Quantum Leaf", artStatus: "illustration-pending" as const }),
  Object.freeze({ level: 54, name: "Iron Comet", artStatus: "illustration-pending" as const }),
  Object.freeze({ level: 55, name: "Aether Vessel", artStatus: "illustration-pending" as const }),
  Object.freeze({ level: 56, name: "Obsidian Crown", artStatus: "illustration-pending" as const }),
  Object.freeze({ level: 57, name: "Aurora Monolith", artStatus: "illustration-pending" as const }),
  Object.freeze({ level: 58, name: "Starforge Dial", artStatus: "illustration-pending" as const }),
  Object.freeze({ level: 59, name: "Celestial Engine", artStatus: "illustration-pending" as const }),
  Object.freeze({ level: 60, name: "The First Light", artStatus: "illustrated-study" as const })
]);

export function seriesOneArtifactAt(level: number): SeriesOneArtifact | null {
  return Number.isSafeInteger(level) && level >= 1 && level <= seriesOneArtifacts.length
    ? seriesOneArtifacts[level - 1] : null;
}

export function serverConfirmedArtifact(level: number, artifact: string | null | undefined): SeriesOneArtifact | null {
  const item = seriesOneArtifactAt(level);
  return item && artifact === item.name ? item : null;
}
