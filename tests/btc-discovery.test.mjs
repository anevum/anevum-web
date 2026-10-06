import { test } from 'node:test';
import assert from 'node:assert/strict';
import { btcDiscoveryView } from '../src/lib/btc-discovery.ts';

test('BTC discovery never derives activity from a healthy heartbeat', () => {
  assert.equal(btcDiscoveryView(null).activity, 'IDLE');
  assert.equal(btcDiscoveryView({state:'SEARCHING', current_stage:'DEVELOPMENT', running:false}).activity, 'IDLE');
  assert.equal(btcDiscoveryView({state:'SEARCHING', current_stage:'DEVELOPMENT', running:true}).activity, 'RUNNING');
});
test('BTC discovery exposes measured stages, stress, rejections and paper state', () => {
  const scenarios = {'HIGH:delay_2': {costs:{fee_bps:50,spread_bps:40,slippage_bps:20},delay_bars:2,
    metrics:{trade_count:10,independent_days:6,net_expectancy:-.01,profit_factor:.8,max_drawdown:.2}}};
  const view = btcDiscoveryView({state:'REJECTED',current_stage:'HOLDOUT',running:false,
    candidate:{candidate_id:'candidate-1',results:{HOLDOUT:{scenarios}},rejection_reasons:['HIGH:delay_2:trade_count']},
    paper_progress:{status:'ACCUMULATING_EVIDENCE',metrics:{trade_count:1,independent_days:1}}});
  assert.equal(view.candidateId,'candidate-1');
  assert.equal(view.metricsStage,'HOLDOUT');
  assert.deepEqual(view.scenarios,Object.entries(scenarios));
  assert.deepEqual(view.rejections,['HIGH:delay_2:trade_count']);
  assert.equal(view.paper.metrics.trade_count,1);
  assert.equal(view.verification,'NO_MATCHING_VERIFICATION');
  assert.equal(view.liveAuthority,false);
});
test('paper success only displays review eligibility and never grants live authority', () => {
  const view = btcDiscoveryView({state:'ELIGIBLE_FOR_REVIEW',current_stage:'ELIGIBLE_FOR_REVIEW',running:false,
    candidate:{candidate_id:'candidate-1',results:{VELUM_REPLAY:{verified:true}}}});
  assert.equal(view.promotion,'ELIGIBLE_FOR_REVIEW');
  assert.equal(view.verification,'VERIFIED');
  assert.equal(view.liveAuthority,false);
});
