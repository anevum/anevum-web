import type { BtcDiscoveryProjection } from "./runtime-topology";

export function btcDiscoveryView(discovery?: BtcDiscoveryProjection | null) {
  const candidate = discovery?.candidate;
  const results = candidate?.results || {};
  const stage = ["HOLDOUT", "VALIDATION", "DEVELOPMENT"].find(key => results[key]?.scenarios);
  return {
    activity: discovery?.running === true ? "RUNNING" : "IDLE",
    candidateId: candidate?.candidate_id || "No candidate evaluated",
    stage: discovery?.current_stage || "NOT_STARTED",
    metricsStage: stage || null,
    scenarios: stage ? Object.entries(results[stage].scenarios || {}) : [],
    verification: results.VELUM_REPLAY?.verified === true ? "VERIFIED" : "NO_MATCHING_VERIFICATION",
    rejections: candidate?.rejection_reasons || discovery?.rejection_reasons || [],
    paper: discovery?.paper_progress || null,
    promotion: discovery?.state || "UNAVAILABLE",
    liveAuthority: false
  };
}
