// Account-level future capability contracts. These are deliberately disabled.
// No member, including the operator, gains broker-write or payout authority here.
export const MEMBER_REWARDS_STATUS = Object.freeze({
  program: "not_launched",
  earningEnabled: false,
  payoutEnabled: false,
  availableBalanceCents: null,
  currency: "USD",
  history: Object.freeze([])
});

export const MEMBER_BROKERAGE_STATUS = Object.freeze({
  integration: "unavailable",
  connectionAvailable: false,
  accountConnected: false,
  paperTradingEnabled: false,
  liveTradingEnabled: false,
  depositsEnabled: false,
  withdrawalsEnabled: false,
  account: null
});

export function memberRewardsStatus() {
  return MEMBER_REWARDS_STATUS;
}

export function memberBrokerageStatus() {
  return MEMBER_BROKERAGE_STATUS;
}
