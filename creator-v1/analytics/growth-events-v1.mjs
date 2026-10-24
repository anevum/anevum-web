/**
 * ANEVUM / IREN Growth Intelligence — Event Contract V1 (not an active collector).
 *
 * This module defines an explicitly opt-in future event taxonomy, not collection.
 * No network I/O, no database writes, no XP rewards, no advertising identifiers.
 * Canonical actor attribution must be populated only by authenticated server code.
 * Posting by itself is not qualified engagement: moderation / abuse / relevance checks
 * must issue a separate community_contribution_qualified receipt.
 */
export const EVENT_SCHEMA_VERSION = 1;

const CLIENT = 'client';
const SERVER = 'server';
const EVENTS = {
  landing_view:                    {stage:'acquisition',authority:CLIENT,meaningful:false},
  campaign_link_opened:            {stage:'acquisition',authority:CLIENT,meaningful:false},
  signup_started:                  {stage:'acquisition',authority:CLIENT,meaningful:false},
  account_created:                 {stage:'acquisition',authority:SERVER,meaningful:false},
  email_verified:                  {stage:'activation',authority:SERVER,meaningful:false},
  project_viewed:                  {stage:'discovery',authority:CLIENT,meaningful:false},
  project_play_intent:             {stage:'discovery',authority:CLIENT,meaningful:false},
  project_play_completed_verified: {stage:'activation',authority:SERVER,meaningful:true},
  project_saved:                   {stage:'activation',authority:SERVER,meaningful:true},
  project_voted:                   {stage:'engagement',authority:SERVER,meaningful:false},
  community_reply_published:      {stage:'engagement',authority:SERVER,meaningful:false},
  community_post_published:       {stage:'engagement',authority:SERVER,meaningful:false},
  community_contribution_qualified:{stage:'engagement',authority:SERVER,meaningful:true},
  studio_opened:                   {stage:'creator',authority:CLIENT,meaningful:false},
  project_draft_saved:            {stage:'creator',authority:SERVER,meaningful:false},
  project_submitted:              {stage:'creator',authority:SERVER,meaningful:false},
  project_published:              {stage:'creator',authority:SERVER,meaningful:true},
  creator_achievement_issued:     {stage:'creator',authority:SERVER,meaningful:false},
  creator_referral_converted:     {stage:'acquisition',authority:SERVER,meaningful:false},
  experiment_exposure:            {stage:'experiment',authority:CLIENT,meaningful:false},
  experiment_goal_verified:       {stage:'experiment',authority:SERVER,meaningful:false},
  payment_settled:                {stage:'revenue',authority:SERVER,meaningful:false},
  payment_refunded:               {stage:'revenue',authority:SERVER,meaningful:false},
  moderation_report_created:      {stage:'safety',authority:SERVER,meaningful:false},
};
export const GROWTH_EVENTS = Object.freeze(Object.fromEntries(
  Object.entries(EVENTS).map(([name,detail])=>[name,Object.freeze({...detail})])
));

export const GROWTH_METRICS = Object.freeze({
  weeklyMeaningfulParticipants: Object.freeze({
    label:'Weekly Meaningful Participants',
    window:'rolling-7x24h',
    unit:'unique-verified-members',
    source:'server-confirmed-action-events',
    qualifyingEvents:Object.freeze(Object.entries(EVENTS).filter(([,x])=>x.meaningful).map(([name])=>name)),
    exclusions:Object.freeze(['test-accounts','unverified-identities','staff-probes','bot-traffic','duplicate-receipts','replayed-requests']),
    status:'not-instrumented',
  }),
  activatedMembers: Object.freeze({
    label:'Newly activated members',
    denominator:'verified-member-signup-cohort',
    numerator:'member-with-first-verified-meaningful-action',
    window:'declared-cohort-time-range',
    status:'not-instrumented',
  }),
  retainedD7: Object.freeze({
    label:'D7 meaningful retention',
    denominator:'activated-verifiable-cohort-on-UTC-day-0',
    numerator:'members-with-confirmed-meaningful-action-on-UTC-day-7',
    window:'calendar-day-cohorts',
    status:'not-instrumented',
  }),
});

/** Only these intentionally coarse, nonidentifying client dimensions may leave a browser. */
const DIMENSIONS = Object.freeze({
  surface:new Set(['home','join','discover','community','profile','studio','player','creator','other']),
  device:new Set(['desktop','mobile','tablet','other']),
  campaignSource:/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/,
  campaignMedium:/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/,
  campaignName:/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/,
  campaignContent:/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/,
  contentCategory:new Set(['game','interactive','story','art','video','audio','other']),
});
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ROOT_KEYS=new Set(['schemaVersion','eventId','eventName','occurredAt','dimensions']);
const MAX_DIMENSIONS=7;
const MAX_CLOCK_SKEW_MS=24*60*60*1000;

function object(value){return !!value&&typeof value==='object'&&!Array.isArray(value);}
function fail(message){throw new TypeError('ANEVUM_GROWTH_EVENT_INVALID: '+message);}

/**
 * Schema-only preparation, never analytics collection. It intentionally rejects unknown
 * fields, including email, IP, profile identifiers, full URLs, raw referrers and message text.
 * Caller-supplied role, member IDs, production/test status and consent are not trustworthy;
 * a future authenticated ingest service must derive them server side.
 */
export function validateGrowthEvent(payload,{authority='client',now=Date.now()}={}){
  if(!object(payload))fail('object required');
  if(![CLIENT,SERVER].includes(authority))fail('invalid authority');
  if(!Number.isFinite(now))fail('invalid clock');
  for(const name of Object.keys(payload))if(!ROOT_KEYS.has(name))fail('unrecognized top-level field');
  if(payload.schemaVersion!==EVENT_SCHEMA_VERSION)fail('schema version mismatch');
  if(typeof payload.eventId!=='string'||!UUID.test(payload.eventId))fail('invalid event id');
  if(typeof payload.eventName!=='string'||!Object.hasOwn(GROWTH_EVENTS,payload.eventName))
    fail('unknown event');
  const definition=GROWTH_EVENTS[payload.eventName];
  if(definition.authority===SERVER&&authority!==SERVER)fail('server-confirmed action cannot be claimed by browser');
  if(typeof payload.occurredAt!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(payload.occurredAt))
    fail('timestamp must be UTC ISO with milliseconds');
  const stamp=Date.parse(payload.occurredAt);
  if(!Number.isFinite(stamp)||new Date(stamp).toISOString()!==payload.occurredAt||
     Math.abs(stamp-now)>MAX_CLOCK_SKEW_MS)fail('timestamp invalid or outside approved capture window');
  if(payload.dimensions!==undefined&&!object(payload.dimensions))fail('invalid dimensions');
  const entries=Object.entries(payload.dimensions||{});
  if(entries.length>MAX_DIMENSIONS)fail('dimension limit exceeded');
  const dimensionValues={};
  for(const [key,value] of entries){
    const rule=DIMENSIONS[key];
    if(!rule)fail('unsupported dimension');
    if(typeof value!=='string'||value.length<1||value.length>48)fail('invalid dimension value');
    if(rule instanceof Set?!rule.has(value):!rule.test(value))fail('dimension not allowed');
    dimensionValues[key]=value;
  }
  return Object.freeze({
    schemaVersion:EVENT_SCHEMA_VERSION,
    eventId:payload.eventId.toLowerCase(),
    eventName:payload.eventName,
    occurredAt:payload.occurredAt,
    dimensions:Object.freeze(dimensionValues),
  });
}

/** Definitions only: no implicit user IDs, event writes, telemetry, or reward issuance. */
export function eventIsMeaningful(name){
 return !!GROWTH_EVENTS[name]?.meaningful;
}
