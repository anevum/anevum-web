/** Continuance Institute — design-only identity registry.
 * Names and assets are provisional. Not a source of authorization,
 * achievement issuance, real bot accounts or publication state.
 */
export type InstituteVisualState = {
  readonly id: string;
  readonly label: string;
  readonly meaning: string;
};

export type InstituteEntity = {
  readonly id: "observation-node-001" | "regulation-node-002";
  readonly name: string;
  readonly designation: string;
  readonly function: string;
  readonly description: string;
  readonly note: string;
  readonly insignia: string;
  readonly accent: "ivory" | "crimson";
  readonly visualStates: readonly InstituteVisualState[];
  readonly presentationOnly: true;
};

export const INSTITUTE_ENTITIES: readonly InstituteEntity[] = [
  {
    id: "observation-node-001",
    name: "Vesper",
    designation: "OBSERVATION NODE 001",
    function: "Discovery / Recognition / Preservation",
    description: "An aperture that watches for unusual creative signals. It recognizes exceptional work and preserves meaningful contributions within the proposed Continuance Archive.",
    note: "Nomination and archive concepts only. No real featured selections, records or awards have been issued.",
    insignia: "observation-node-001.svg",
    accent: "ivory",
    visualStates: [
      { id: "idle", label: "Dormant", meaning: "Slow orbital movement; the network is quiet." },
      { id: "observation", label: "Observing", meaning: "Rings converge on a candidate signal; no selection is implied." },
      { id: "ceremony", label: "Recognition", meaning: "Ceremonial manifestation for a future verified recognition event." }
    ],
    presentationOnly: true
  },
  {
    id: "regulation-node-002",
    name: "Sable",
    designation: "REGULATION NODE 002",
    function: "Safety / Triage / Review notices",
    description: "A fractured obsidian intelligence that assembles signals for review. Its visual intensity reflects processing activity, never the guilt or risk level of a member.",
    note: "The existing staff-reviewed forum workflow retains all enforcement authority. This entity cannot hide, reject or publish content.",
    insignia: "regulation-node-002.svg",
    accent: "crimson",
    visualStates: [
      { id: "idle", label: "Quiet", meaning: "Monitoring is represented symbolically; no live background bot is connected." },
      { id: "triage", label: "Triage", meaning: "A synthetic report is assembled for illustration, without a verdict." },
      { id: "escalation", label: "Escalation", meaning: "A simulated referral to an authorized human reviewer." }
    ],
    presentationOnly: true
  }
] as const;

export function getInstituteEntity(id: InstituteEntity["id"]) {
  return INSTITUTE_ENTITIES.find(entity => entity.id === id);
}
