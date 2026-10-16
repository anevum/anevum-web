// Continuance Cadets — household-local, parent-approved progress. Not ANEVUM XP.
export const SCHEMA = 'anevum.lab.continuance-cadets.v1';
export const COLORS = ['violet', 'teal', 'coral', 'gold', 'glacier', 'mint'];
export const HELMETS = ['orbital', 'scout', 'navigator'];
export const COMPANIONS = ['comet', 'satellite', 'drone'];
export const DEFAULT_MISSIONS = [
  { id: 'launch', title: 'Morning launch', detail: 'Get ready for the day and gather your gear.', cadence: 'daily', kind: 'home', points: 10, active: true },
  { id: 'kindness', title: 'Kindness signal', detail: 'Practice respectful, helpful choices at school.', cadence: 'daily', kind: 'school', points: 15, active: true },
  { id: 'effort', title: 'Give it your best', detail: 'Bring attention and effort to today’s learning.', cadence: 'daily', kind: 'school', points: 15, active: true },
  { id: 'crew', title: 'Crew contribution', detail: 'Help with a home task agreed on with a parent.', cadence: 'daily', kind: 'home', points: 10, active: true },
  { id: 'landing', title: 'Evening landing', detail: 'Get ready for tomorrow and follow the evening routine.', cadence: 'daily', kind: 'home', points: 10, active: true },
  { id: 'homework', title: 'Weekly homework', detail: 'Finish the week’s assignments, with help when needed.', cadence: 'weekly', kind: 'school', points: 45, active: true },
  { id: 'reading', title: 'Reading expedition', detail: 'Meet a reading goal chosen together this week.', cadence: 'weekly', kind: 'explore', points: 25, active: true },
  { id: 'base', title: 'Base station reset', detail: 'Help reset your room or a shared family space.', cadence: 'weekly', kind: 'home', points: 25, active: true }
];
export const REWARDS = [
  { id: 'tablet', title: 'Tablet time · 30 min', detail: 'One parent-approved session on the weekend.', window: 'weekend', icon: '▤' },
  { id: 'friday', title: 'Fun Friday transmission', detail: 'A surprise experience chosen by the family.', window: 'friday', icon: '✦' },
  { id: 'aurora', title: 'Aurora field', detail: 'Unlock an animated energy ring for your explorer.', window: 'anytime', icon: '◎' }
];
export function dayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function weekKey(date = new Date()) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return dayKey(d);
}
export function cycleKey(mission, date = new Date()) {
  return mission.cadence === 'weekly' ? `w:${weekKey(date)}` : `d:${dayKey(date)}`;
}
export function initialState() {
  return {
    schema: SCHEMA,
    crew: [
      { id: 'c1', name: 'Explorer 01', palette: 'violet', helmet: 'orbital', companion: 'comet', aura: false },
      { id: 'c2', name: 'Explorer 02', palette: 'teal', helmet: 'scout', companion: 'satellite', aura: false }
    ],
    missions: DEFAULT_MISSIONS.map(m => ({ ...m })),
    requests: [],
    transactions: [],
    settings: { tablet: 100, friday: 80, aurora: 65, tabletCap: 4 }
  };
}
function fail(message) { throw new Error(message); }
function validKid(state, kidId) {
  if (!state.crew.some(c => c.id === kidId)) fail('Explorer not found.');
}
export function nextId() { return 'r_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 12); }
export function wallet(state, kidId) {
  return state.transactions.filter(t => t.kidId === kidId).reduce((a, b) => a + b.delta, 0);
}
export function experience(state, kidId) {
  return state.transactions.filter(t => t.kidId === kidId && t.kind === 'mission').reduce((a, b) => a + b.delta, 0);
}
export function level(state, kidId) { return Math.floor(experience(state, kidId) / 100) + 1; }
export function completedThisWeek(state, kidId, date = new Date()) {
  const monday = weekKey(date);
  const today = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const sunday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + (6 - ((today.getDay() + 6) % 7)));
  return state.requests.filter(r => {
    if (r.type !== 'mission' || r.kidId !== kidId || r.status !== 'approved') return false;
    if (r.cycle === `w:${monday}`) return true;
    return r.cycle?.startsWith('d:') && r.cycle.slice(2) >= monday && r.cycle.slice(2) <= dayKey(sunday);
  }).length;
}
export function missionStatus(state, kidId, mission, date = new Date()) {
  const key = cycleKey(mission, date);
  return [...state.requests].reverse().find(r => r.type === 'mission' && r.kidId === kidId && r.itemId === mission.id && r.cycle === key && r.status !== 'declined')?.status || 'open';
}
export function hasAura(state, kidId) { return state.transactions.some(t => t.kind === 'aurora' && t.kidId === kidId); }
export function requestMission(state, kidId, missionId, date = new Date(), id = nextId()) {
  validKid(state, kidId);
  const m = state.missions.find(m => m.id === missionId && m.active);
  if (!m) fail('Mission is not available.');
  if (missionStatus(state, kidId, m, date) !== 'open') fail('Mission is already logged for this day or week.');
  if (state.requests.length >= 3000) fail('Export and reset the history before continuing.');
  if (state.requests.some(r => r.id === id)) fail('Duplicate request.');
  return { ...state, requests: [...state.requests, { id, type: 'mission', kidId, itemId: m.id, cycle: cycleKey(m, date), amount: m.points, status: 'pending', createdAt: date.toISOString(), approvedAt: null }] };
}
export function requestReward(state, kidId, rewardId, date = new Date(), id = nextId()) {
  validKid(state, kidId);
  if (!REWARDS.some(r => r.id === rewardId)) fail('Reward not found.');
  if (rewardId === 'aurora' && hasAura(state, kidId)) fail('Aurora field has already been unlocked.');
  if (state.requests.some(r => r.type === 'reward' && r.kidId === kidId && r.itemId === rewardId && r.status === 'pending')) fail('That reward is already awaiting parent approval.');
  if (state.requests.length >= 3000) fail('Export and reset the history before continuing.');
  if (state.requests.some(r => r.id === id)) fail('Duplicate request.');
  const cost = state.settings[rewardId];
  if (wallet(state, kidId) < cost) fail('Not enough Stardust yet.');
  return { ...state, requests: [...state.requests, { id, type: 'reward', kidId, itemId: rewardId, cycle: `w:${weekKey(date)}`, amount: cost, status: 'pending', createdAt: date.toISOString(), approvedAt: null }] };
}
export function approve(state, requestId, date = new Date()) {
  const r = state.requests.find(r => r.id === requestId && r.status === 'pending');
  if (!r) fail('Request no longer pending.');
  if (state.transactions.some(t => t.requestId === r.id)) fail('Already applied.');
  let kind, delta, label;
  if (r.type === 'mission') {
    const mission = state.missions.find(m => m.id === r.itemId);
    if (!mission) fail('Original mission unavailable.');
    kind = 'mission'; delta = r.amount; label = mission.title;
  } else {
    const reward = REWARDS.find(x => x.id === r.itemId);
    if (!reward) fail('Reward unavailable.');
    if (reward.window === 'friday' && date.getDay() !== 5) fail('Fun Friday can be redeemed on Friday.');
    if (reward.window === 'weekend' && ![0, 6].includes(date.getDay())) fail('Tablet time can be redeemed on a weekend.');
    if (reward.id === 'aurora' && hasAura(state, r.kidId)) fail('Aurora field is already unlocked.');
    if (wallet(state, r.kidId) < r.amount) fail('Not enough Stardust remaining.');
    if (reward.id === 'tablet') {
      const count = state.transactions.filter(t => t.kidId === r.kidId && t.kind === 'tablet' && weekKey(new Date(t.at)) === weekKey(date)).length;
      if (count >= state.settings.tabletCap) fail('Weekly tablet time limit reached.');
    }
    kind = reward.id; delta = -r.amount; label = reward.title;
  }
  return {
    ...state,
    requests: state.requests.map(x => x.id === r.id ? { ...x, status: 'approved', approvedAt: date.toISOString() } : x),
    transactions: [...state.transactions, { requestId: r.id, kidId: r.kidId, kind, label, delta, at: date.toISOString() }]
  };
}
export function decline(state, id) {
  if (!state.requests.some(r => r.id === id && r.status === 'pending')) fail('Request already handled.');
  return { ...state, requests: state.requests.map(r => r.id === id ? { ...r, status: 'declined' } : r) };
}
export function changeAppearance(state, kidId, patch) {
  validKid(state, kidId);
  const kid = state.crew.find(c => c.id === kidId);
  const next = { ...kid };
  if ('name' in patch) {
    const name = String(patch.name).trim();
    if (!name || name.length > 30) fail('Explorer name must be 1–30 characters.');
    next.name = name;
  }
  if ('palette' in patch) { if (!COLORS.includes(patch.palette)) fail('Unknown suit color.'); next.palette = patch.palette; }
  if ('helmet' in patch) { if (!HELMETS.includes(patch.helmet)) fail('Unknown helmet.'); next.helmet = patch.helmet; }
  if ('companion' in patch) { if (!COMPANIONS.includes(patch.companion)) fail('Unknown companion.'); next.companion = patch.companion; }
  if ('aura' in patch) { if (patch.aura && !hasAura(state, kidId)) fail('Unlock the Aurora field first.'); next.aura = !!patch.aura; }
  return { ...state, crew: state.crew.map(c => c.id === kidId ? next : c) };
}
export function addMission(state, payload, id = 'custom-' + Date.now()) {
  if (state.missions.length >= 24) fail('Limit of 24 missions reached.');
  const title = String(payload.title || '').trim();
  const amount = Number(payload.points);
  if (!title || title.length > 75) fail('Mission title must be 1–75 characters.');
  if (!['daily', 'weekly'].includes(payload.cadence)) fail('Choose daily or weekly.');
  if (!['home', 'school', 'explore'].includes(payload.kind)) fail('Unknown mission category.');
  if (!Number.isInteger(amount) || amount < 1 || amount > 50) fail('Choose 1–50 Stardust per mission.');
  if (!/^custom-[a-z0-9-]{1,50}$/.test(id) || state.missions.some(m => m.id === id)) fail('Duplicate mission identifier.');
  const mission = { id, title, detail: 'A family-defined objective.', cadence: payload.cadence, kind: payload.kind, points: amount, active: true };
  return { ...state, missions: [...state.missions, mission] };
}
export function setMissionActive(state, id, active) {
  if (!state.missions.some(m => m.id === id)) fail('Mission not found.');
  return { ...state, missions: state.missions.map(m => m.id === id ? { ...m, active: !!active } : m) };
}
export function setSettings(state, values) {
  const next = {};
  for (const key of ['tablet', 'friday', 'aurora', 'tabletCap']) {
    const n = Number(values[key]);
    if (!Number.isInteger(n) || n < (key === 'tabletCap' ? 1 : 0) || n > (key === 'tabletCap' ? 8 : 1000)) fail('Reward settings outside allowed range.');
    next[key] = n;
  }
  return { ...state, settings: next };
}
export function validateBackup(raw) {
  if (!raw || raw.schema !== SCHEMA || !Array.isArray(raw.crew) || raw.crew.length !== 2 || !Array.isArray(raw.missions) || raw.missions.length > 24 || !Array.isArray(raw.requests) || raw.requests.length > 3000 || !Array.isArray(raw.transactions) || raw.transactions.length > 3000) fail('Unsupported or malformed Cadets backup.');
  let state = initialState();
  const ids = raw.crew.map(c => c.id);
  if (new Set(ids).size !== 2 || !ids.includes('c1') || !ids.includes('c2')) fail('Invalid explorer entries.');
  state.crew = raw.crew.map(c => {
    if (!c || !COLORS.includes(c.palette) || !HELMETS.includes(c.helmet) || !COMPANIONS.includes(c.companion) || typeof c.aura !== 'boolean') fail('Invalid character data.');
    const name = String(c.name || '').trim();
    if (!name || name.length > 30) fail('Invalid explorer name.');
    return { id: c.id, name, palette: c.palette, helmet: c.helmet, companion: c.companion, aura: c.aura };
  });
  state.missions = raw.missions.map(m => {
    if (!m || !/^[a-z0-9-]{1,65}$/.test(m.id) || typeof m.title !== 'string' || !m.title.trim() || m.title.length > 75 || typeof m.detail !== 'string' || m.detail.length > 180 || !['daily','weekly'].includes(m.cadence) || !['home','school','explore'].includes(m.kind) || !Number.isInteger(m.points) || m.points < 1 || m.points > 50 || typeof m.active !== 'boolean') fail('Invalid mission in backup.');
    return { id: m.id, title: m.title, detail: m.detail, cadence: m.cadence, kind: m.kind, points: m.points, active: m.active };
  });
  if (new Set(state.missions.map(m => m.id)).size !== state.missions.length) fail('Duplicate mission ids.');
  const rids = new Set(), approvedCycles = new Set();
  state.requests = raw.requests.map(r => {
    if (!r || typeof r.id !== 'string' || r.id.length > 80 || !r.id || rids.has(r.id) || !['mission','reward'].includes(r.type) || !['c1','c2'].includes(r.kidId) || !['pending','approved','declined'].includes(r.status) || typeof r.itemId !== 'string' || !/^([dw]):\d{4}-\d{2}-\d{2}$/.test(r.cycle) || !Number.isInteger(r.amount) || r.amount < 0 || r.amount > 1000 || !Number.isFinite(Date.parse(r.createdAt)) || (r.status === 'approved' && !Number.isFinite(Date.parse(r.approvedAt)))) fail('Invalid request history.');
    if (r.type === 'mission') { const mission = state.missions.find(m => m.id === r.itemId); if (!mission || r.amount < 1 || r.amount > 50) fail('Mission request refers to missing mission.'); }
    else if (!REWARDS.some(v => v.id === r.itemId)) fail('Reward request refers to missing reward.');
    if (r.type === 'mission' && r.status === 'approved') {
      const unique = r.kidId + ':' + r.itemId + ':' + r.cycle;
      if (approvedCycles.has(unique)) fail('Duplicate approved mission for one cycle.');
      approvedCycles.add(unique);
    }
    rids.add(r.id);
    return { id: r.id, type: r.type, kidId: r.kidId, itemId: r.itemId, cycle: r.cycle, amount: r.amount, status: r.status, createdAt: r.createdAt, approvedAt: r.status === 'approved' ? r.approvedAt : null };
  });
  const ts = new Set(), running = { c1: 0, c2: 0 };
  state.transactions = raw.transactions.map(t => {
    if (!t || !rids.has(t.requestId) || ts.has(t.requestId) || !['c1','c2'].includes(t.kidId) || !['mission','tablet','friday','aurora'].includes(t.kind) || typeof t.label !== 'string' || t.label.length > 85 || !Number.isInteger(t.delta) || Math.abs(t.delta) > 1000 || !Number.isFinite(Date.parse(t.at))) fail('Invalid transaction history.');
    const req = state.requests.find(r => r.id === t.requestId);
    if (req.status !== 'approved' || req.kidId !== t.kidId || (req.type === 'mission' && (t.kind !== 'mission' || t.delta !== req.amount)) || (req.type === 'reward' && (t.kind !== req.itemId || t.delta !== -req.amount))) fail('Request and Stardust ledger do not match.');
    running[t.kidId] += t.delta;
    if (running[t.kidId] < 0) fail('Negative balance in event history.');
    if (t.kind === 'tablet' && ![0,6].includes(new Date(t.at).getDay())) fail('Tablet redemption outside weekend.');
    if (t.kind === 'friday' && new Date(t.at).getDay() !== 5) fail('Fun Friday redemption outside Friday.');
    ts.add(t.requestId);
    return { requestId: t.requestId, kidId: t.kidId, kind: t.kind, label: t.label, delta: t.delta, at: t.at };
  });
  if (state.requests.some(r => r.status === 'approved' && !ts.has(r.id))) fail('Missing approved transaction.');
  state = setSettings(state, raw.settings || {});
  for (const c of state.crew) {
    if (wallet(state, c.id) < 0) fail('Negative Stardust balance.');
    if (c.aura && !hasAura(state, c.id)) fail('Unearned aura in backup.');
  }
  return state;
}
