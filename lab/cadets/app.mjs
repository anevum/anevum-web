import { COLORS, HELMETS, COMPANIONS, DEFAULT_MISSIONS, REWARDS, initialState, validateBackup, wallet, experience, level, completedThisWeek, missionStatus, hasAura, requestMission, requestReward, approve, decline, changeAppearance, addMission, setMissionActive, setSettings, dayKey } from './rules.mjs';

// Only the Cloudflare Access owner can open the Lab. This local PIN is a secondary
// on-device family convenience control, not a replacement for identity security.
const SAVE_KEY = 'anevum.lab.continuance-cadets.save.v1';
const PIN_KEY = 'anevum.lab.continuance-cadets.parent-pin.v1';
const SWATCHES = {
  violet: ['#826be2','#b7a3ff','#e0d0ff'],teal: ['#30a7a7','#7beddb','#d2fff0'],
  coral: ['#cf6e74','#f4ac9b','#ffe4c9'],gold: ['#c69444','#f3d28e','#ffedbd'],
  glacier: ['#609bcf','#a1e3ff','#e0f6ff'],mint: ['#679e76','#a2efac','#e6ffce']
};
const $ = id => document.getElementById(id);
const escapeText = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let state = initialState(), activeKid = 'c1', currentView = 'missions', parentOpen = false, pinRecord = null, blockedSave = false, toastTimer = null;
function notify(message, isError = false) {
  const toast = $('toast'); if (!toast) return;
  toast.textContent = message; toast.classList.toggle('error', isError); toast.hidden = false;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {toast.hidden = true;}, 4200);
}
function safely(action) { try { action(); } catch (error) { notify(error?.message || 'Action could not be completed.', true); } }
function load() {
  try {
    pinRecord = JSON.parse(localStorage.getItem(PIN_KEY) || 'null');
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) state = validateBackup(JSON.parse(raw));
  } catch (error) {
    blockedSave = true;
    notify('Saved data needs attention. Export or restore a known backup before making changes.', true);
  }
}
function save(next) {
  if (blockedSave) throw new Error('Local save is locked because the existing data could not be read.');
  // Fail before state mutation, so a storage error never looks like a saved approval.
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(next)); }
  catch { throw new Error('Device storage failed. Check browser settings or available space.'); }
  state = next; render();
}
function update(fn, message = '') { safely(() => { const next = fn(state); save(next); if (message) notify(message); }); }
function selected() { return state.crew.find(c => c.id === activeKid) || state.crew[0]; }
function setView(view) {
  if (!['missions','rewards','wardrobe','parent'].includes(view)) return;
  currentView = view;
  document.querySelectorAll('.nav-item').forEach(b => {b.classList.toggle('active', b.dataset.view === view);b.setAttribute('aria-current',b.dataset.view === view ? 'page' : 'false');});
  for (const id of ['missions','rewards','wardrobe','parent']) { const node = $(id + 'View');node.hidden = view !== id;node.classList.toggle('is-visible', view === id); }
  const headings = {
    missions: ['YOUR OBJECTIVES / LIVE CYCLE','Mission deck','Choose a mission when it is done. A parent confirms it before Stardust is earned.'],
    rewards: ['REAL-WORLD AND VIRTUAL UNLOCKS','Reward vault','Exchange earned Stardust for parent-approved experiences and character effects.'],
    wardrobe: ['PERSONAL CREATOR STATION','Character lab','Choose your suit, helmet, and companion. Your explorer grows with you.'],
    parent: ['ADULT REVIEW / LOCAL DEVICE','Parent command','Approve submissions, choose rewards, and tune family missions.']
  };
  const [eyebrow, title, description] = headings[view];
  $('sectionOverline').textContent = eyebrow; $('sectionHeading').textContent = title; $('sectionSubhead').textContent = description;
  if (view === 'parent') showParent();
}
function paletteStyle(kid) { const [suit, glow, bright] = SWATCHES[kid.palette] || SWATCHES.violet; return `--suit:${suit};--glow:${glow};--second:${bright}`; }
function avatarSvg(kid, tiny = false) {
  const faceBand = kid.helmet === 'scout' ? `<path d="M92 70h85l-8-15H100Z" fill="#bacad4" stroke="#27324b" stroke-width="4"/>` : kid.helmet === 'navigator' ? `<path d="M130 33l-15 34h30Z" fill="#dfc08a" stroke="#394660" stroke-width="3"/><circle cx="130" cy="35" r="6" class="emissive"/>` : `<path d="M97 58l-7-18m73 18 8-18" stroke="#f5deb6" stroke-width="7" stroke-linecap="round"/><circle cx="88" cy="38" r="6" class="emissive"/><circle cx="173" cy="38" r="6" class="emissive"/>`;
  return `<svg class="avatar-figure" style="${paletteStyle(kid)}" viewBox="0 0 260 282" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Customizable explorer character">
   <ellipse cx="130" cy="270" rx="73" ry="9" fill="#000a"/>
   <g stroke="#18263b" stroke-width="5" stroke-linejoin="round">
     <path d="M99 181l-13 65 27 8 24-66Z" class="suit-primary"/><path d="M157 182l20 67-27 8-27-67Z" class="suit-primary"/>
     <path d="M86 243l27 7 5 15-35-2Z" fill="#dee5ec"/><path d="M153 249l25-8 8 21-35 2Z" fill="#dee5ec"/>
     <path d="M91 129l-24 5-25 64 24 13 41-56Z" class="suit-primary"/><path d="M169 129l24 5 25 64-24 13-41-56Z" class="suit-primary"/>
     <path d="M38 193l28 15-12 27-28-15Z" class="suit-bright"/><path d="M222 193l-28 15 12 27 28-15Z" class="suit-bright"/>
     <path d="M93 122h74l25 59-18 33H86l-19-33Z" class="suit-primary"/><path d="M110 135h40l11 24-12 21h-38l-12-21Z" fill="#e1e8ef" stroke="#243248"/>
     <path d="M114 141h33l8 18-9 14h-32l-8-14Z" fill="#1b3055" stroke="none"/>
     <path d="M84 188h92" stroke="#e3dacf" stroke-width="4"/><path d="M105 194h50v15h-50Z" fill="#1c2e46" stroke="#a8b7ca" stroke-width="3"/>
     <rect x="73" y="124" width="23" height="24" rx="7" class="suit-bright"/><rect x="164" y="124" width="23" height="24" rx="7" class="suit-bright"/>
     <circle cx="130" cy="96" r="64" fill="#c8d4df" stroke="#263650" stroke-width="8"/>
     <path d="M85 86q45-38 90 0v28q-45 31-90 0Z" fill="#101e38" stroke="#2e456c" stroke-width="5"/>
     <path d="M89 87q40-30 82-1" fill="none" stroke="#9acfed" stroke-width="6" opacity=".8"/>
     <path d="M95 100q37 25 70 1" fill="none" stroke="#496d97" stroke-width="4" opacity=".7"/>
     <path d="M93 131q37 21 74 0" stroke="#9eaebd" stroke-width="8" fill="none"/>
   </g>
   <g>${faceBand}</g>
   <path d="M123 149h14v11h-14Z" class="emissive"/><circle cx="104" cy="201" r="3" class="emissive"/><circle cx="155" cy="201" r="3" class="emissive"/>
  </svg>`;
}
function renderCrew() {
  $('crewSwitch').innerHTML = state.crew.map(kid => `<button type="button" data-kid="${kid.id}" class="crew-chip ${kid.id === activeKid ? 'selected' : ''}" aria-pressed="${kid.id === activeKid}"><span class="chip-mark" style="${paletteStyle(kid)}">${avatarSvg(kid,true)}</span><span class="chip-copy"><strong>${escapeText(kid.name)}</strong><small>RANK ${String(level(state,kid.id)).padStart(2,'0')} · ${wallet(state,kid.id)} ✦</small></span><span class="chip-chevron">›</span></button>`).join('');
}
function renderWorld() {
  const kid = selected(), xp = experience(state, activeKid), progress = xp % 100;
  document.body.dataset.palette = kid.palette;
  $('worldHeading').innerHTML = 'Welcome back,<br><em>' + escapeText(kid.name) + '.</em>';
  $('worldText').textContent = 'Your next mission is waiting. Build your world one helpful choice at a time.';
  $('balanceText').textContent = wallet(state,activeKid);
  $('levelText').textContent = String(level(state,activeKid)).padStart(2, '0');
  $('xpText').textContent = xp;
  $('xpProgress').textContent = `${progress} / 100 XP`;
  $('xpFill').style.width = `${progress}%`;
  $('weekDone').textContent = completedThisWeek(state,activeKid);
  $('dayLabel').textContent = new Intl.DateTimeFormat(undefined,{weekday:'long',month:'short',day:'numeric'}).format(new Date()).toUpperCase();
  $('avatarStage').classList.toggle('has-aura', kid.aura);
  const companionText = {comet:'✦',satellite:'⬡',drone:'⊕'}[kid.companion];
  $('avatarStage').innerHTML = avatarSvg(kid) + `<div class="companion-orbit" aria-hidden="true">${companionText}</div>`;
  const pendingCount = state.requests.filter(r => r.kidId===activeKid && r.status==='pending').length;
  $('heroEvent').textContent = pendingCount ? `${pendingCount} signal${pendingCount === 1 ? '' : 's'} awaiting parent review.` : 'Every helpful action moves your orbit forward.';
}
function missionCard(mission) {
  const status = missionStatus(state,activeKid,mission); const icons = {home:'⌂',school:'✧',explore:'⌁'};
  const message = status==='pending' ? 'AWAITING' : status==='approved' ? 'CLEARED' : 'COMPLETE';
  return `<article class="mission-card status-${status}"><span class="mission-icon" aria-hidden="true">${icons[mission.kind]}</span><div class="mission-copy"><strong>${escapeText(mission.title)}</strong><p>${escapeText(mission.detail)}</p><small>+${mission.points} STARDUST & XP · ${mission.kind.toUpperCase()}</small></div><button type="button" class="mission-action ${status}" data-mission="${escapeText(mission.id)}" ${status==='open'?'':'disabled'} aria-label="${escapeText(mission.title)}: ${message}">${message}</button></article>`;
}
function renderMissions() {
  const daily = state.missions.filter(m=>m.active&&m.cadence==='daily'), weekly=state.missions.filter(m=>m.active&&m.cadence==='weekly');
  $('dailyMissions').innerHTML = daily.map(missionCard).join('') || '<p class="approval-empty">Daily missions are paused by the parent.</p>';
  $('weeklyMissions').innerHTML = weekly.map(missionCard).join('') || '<p class="approval-empty">Weekly missions are paused by the parent.</p>';
  $('todayCount').textContent = `${daily.length} ACTIVE`;$('weeklyCount').textContent = `${weekly.length} ACTIVE`;
}
function renderRewards() {
  $('rewardsGrid').innerHTML = REWARDS.map(reward => {
    const price = state.settings[reward.id], pending = state.requests.some(r=>r.kidId===activeKid && r.type==='reward'&&r.itemId===reward.id&&r.status==='pending');
    const unlocked = reward.id==='aurora'&&hasAura(state,activeKid);
    const affordable=wallet(state,activeKid)>=price;
    const label = unlocked ? 'UNLOCKED' : pending ? 'PENDING' : affordable ? 'REQUEST' : 'SAVE UP';
    return `<article class="reward-card"><div class="reward-art" aria-hidden="true">${reward.icon}</div><h3>${escapeText(reward.title)}</h3><p>${escapeText(reward.detail)}</p><div class="reward-bottom"><span class="reward-price">${price}<small>✦ STARDUST</small></span><button type="button" data-reward="${reward.id}" ${unlocked||pending||!affordable?'disabled':''}>${label}</button></div></article>`;
  }).join('');
}
function renderWardrobe() {
  const kid = selected();
  $('paletteOptions').innerHTML = COLORS.map(name=>`<button type="button" class="choice-button swatch ${kid.palette===name?'selected':''}" title="${name}" aria-label="${name} suit" aria-pressed="${kid.palette===name}" data-palette="${name}"><span style="background:${SWATCHES[name][0]}"></span></button>`).join('');
  $('helmetOptions').innerHTML = HELMETS.map(name=>`<button type="button" class="choice-button text-button ${kid.helmet===name?'selected':''}" data-helmet="${name}" aria-pressed="${kid.helmet===name}">${name.toUpperCase()}</button>`).join('');
  $('companionOptions').innerHTML = COMPANIONS.map(name=>`<button type="button" class="choice-button text-button ${kid.companion===name?'selected':''}" data-companion="${name}" aria-pressed="${kid.companion===name}">${name.toUpperCase()}</button>`).join('');
  const unlocked=hasAura(state,activeKid);
  $('auraOptions').innerHTML = unlocked ? `<button type="button" data-toggle-aura="true">${kid.aura?'DISABLE':'ACTIVATE'} AURORA FIELD</button><p>You earned this effect. Switch it on or off anytime.</p>` : `<p>RESEARCH LOCKED · Unlock the Aurora field in the Reward Vault for ${state.settings.aurora} Stardust.</p>`;
}
function pendingLine(r) {
  const kid=state.crew.find(c=>c.id===r.kidId); const mission=state.missions.find(m=>m.id===r.itemId); const reward=REWARDS.find(x=>x.id===r.itemId);
  const itemName = r.type==='mission'? mission?.title : reward?.title;
  const day = r.type==='reward' && reward?.window!=='anytime' ? ` · ${reward.window==='friday'?'FRIDAY ONLY':'WEEKEND ONLY'}` : '';
  return `<div class="approval-row"><span class="approval-title"><strong>${escapeText(kid?.name||'Explorer')} · ${escapeText(itemName||'Unknown')}</strong><small>${r.type==='mission'?'MISSION +':'REWARD −'}${r.amount} STARDUST${day}</small></span><button type="button" data-approve="${escapeText(r.id)}">APPROVE</button><button type="button" data-decline="${escapeText(r.id)}" class="decline">DECLINE</button></div>`;
}
function renderParent() {
  showParent();
  if (!parentOpen) return;
  $('approvalQueue').innerHTML = state.requests.filter(r=>r.status==='pending').map(pendingLine).join('')||'<div class="approval-empty">All caught up. New mission and reward requests will appear here.</div>';
  $('nameOne').value = state.crew[0].name;$('nameTwo').value=state.crew[1].name;
  $('costTablet').value=state.settings.tablet;$('costFriday').value=state.settings.friday;$('costAurora').value=state.settings.aurora;$('capTablet').value=state.settings.tabletCap;
  $('missionEditor').innerHTML = state.missions.map(m=>`<label class="mission-toggle"><span><strong>${escapeText(m.title)}</strong><small>${m.cadence.toUpperCase()} · +${m.points} ✦</small></span><input type="checkbox" data-mission-toggle="${escapeText(m.id)}" ${m.active?'checked':''} aria-label="Enable ${escapeText(m.title)}"></label>`).join('');
}
function render() { renderCrew(); renderWorld(); renderMissions(); renderRewards(); renderWardrobe(); if (currentView==='parent') renderParent(); }
function celebrate(message) {
  const root=$('celebration');root.textContent='';
  const colors=['#f0d7a4','#9af1eb','#b2a9ff','#ffc3b1'];
  for(let i=0;i<18;i++) {let p=document.createElement('span');p.className='particle';p.style.background=colors[i%colors.length];let angle=i*2*Math.PI/18, radius=70+(i%4)*23;p.style.setProperty('--x',Math.round(Math.cos(angle)*radius)+'px');p.style.setProperty('--y',Math.round(Math.sin(angle)*radius)+'px');root.appendChild(p);}
  notify(message);
  setTimeout(()=>{root.textContent='';},1450);
}
function showParent() {
  $('parentGate').hidden=parentOpen;$('parentControls').hidden=!parentOpen;
  $('gateHeading').textContent=pinRecord?'Unlock parent command':'Create parent passcode';
  $('gateCopy').textContent=pinRecord?'Enter the parent passcode set on this device to approve missions and real-world rewards.':'Choose a 6–12 digit code. This locks the adult controls on this device; it does not create a secure child account.';
  $('pinButton').textContent=pinRecord?'UNLOCK COMMAND':'SET PARENT CODE';
}
function saltBytes() {const a = new Uint8Array(16);crypto.getRandomValues(a);return [...a];}
async function derivePin(pin, salt) {
  if(!globalThis.crypto?.subtle)throw new Error('Parent controls require a secure browser connection.');
  const base=await crypto.subtle.importKey('raw',new TextEncoder().encode(pin),'PBKDF2',false,['deriveBits']);
  const key=await crypto.subtle.deriveBits({name:'PBKDF2',salt:new Uint8Array(salt),iterations:180000,hash:'SHA-256'},base,256);
  return [...new Uint8Array(key)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
async function parentLogin(pin) {
  if(!/^\d{6,12}$/.test(pin))throw new Error('Use a 6–12 digit parent passcode.');
  if(!pinRecord) {
    const salt=saltBytes(); const hash=await derivePin(pin,salt);
    const entry={v:1,salt,hash};
    try{localStorage.setItem(PIN_KEY,JSON.stringify(entry));}catch{throw new Error('Could not store parent passcode.');}
    pinRecord=entry; parentOpen=true;notify('Parent passcode set for this device.');
  } else {
    if(pinRecord.v!==1||!Array.isArray(pinRecord.salt)||typeof pinRecord.hash!=='string')throw new Error('Saved parent code record is damaged.');
    const attempt=await derivePin(pin,pinRecord.salt);
    if(attempt!==pinRecord.hash)throw new Error('Incorrect parent passcode.');
    parentOpen=true;notify('Parent command unlocked.');
  }
  $('pinInput').value='';renderParent();
}
function exportBackup() {
  if(!parentOpen)throw new Error('Parent controls must be unlocked.');
  const file=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),href=URL.createObjectURL(file),a=document.createElement('a');
  a.href=href;a.download=`continuance-cadets-${dayKey()}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(href),2000);
  notify('Backup prepared. Keep the file in a safe place.');
}
async function importBackup(file) {
  if(!parentOpen)throw new Error('Parent controls must be unlocked.');
  if(!file||file.size>1024*1024)throw new Error('Use a Cadets JSON backup smaller than 1 MiB.');
  const parsed=validateBackup(JSON.parse(await file.text()));
  if(!confirm('Replace the current local Cadets game save with this backup?'))return;
  if(blockedSave) {localStorage.setItem(SAVE_KEY,JSON.stringify(parsed));blockedSave=false;state=parsed;render();}
  else save(parsed);
  notify('Backup imported. The parent passcode has not changed.');
}
function bind() {
  $('crewSwitch').addEventListener('click',e=>{const button=e.target.closest('[data-kid]');if(!button)return;activeKid=button.dataset.kid;render();});
  document.querySelectorAll('.nav-item').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
  $('dailyMissions').addEventListener('click',missionClicked);$('weeklyMissions').addEventListener('click',missionClicked);
  function missionClicked(e){const btn=e.target.closest('[data-mission]');if(!btn)return;const mission=state.missions.find(x=>x.id===btn.dataset.mission);update(s=>requestMission(s,activeKid,btn.dataset.mission),`${mission?.title||'Mission'} sent to parent command.`);}
  $('rewardsGrid').addEventListener('click',e=>{const b=e.target.closest('[data-reward]');if(!b)return;update(s=>requestReward(s,activeKid,b.dataset.reward),'Reward request sent to parent command.');});
  for(const [id,field] of [['paletteOptions','palette'],['helmetOptions','helmet'],['companionOptions','companion']]) $(id).addEventListener('click',e=>{const btn=e.target.closest(`[data-${field}]`);if(!btn)return;update(s=>changeAppearance(s,activeKid,{[field]:btn.dataset[field]}));});
  $('auraOptions').addEventListener('click',e=>{if(!e.target.closest('[data-toggle-aura]'))return;update(s=>changeAppearance(s,activeKid,{aura:!selected().aura}),'Aurora field updated.');});
  $('pinForm').addEventListener('submit',async e=>{e.preventDefault();const btn=$('pinButton');btn.disabled=true;try{await parentLogin($('pinInput').value);}catch(error){notify(error?.message||'Could not unlock.',true);}finally{btn.disabled=false;}});
  $('lockParent').addEventListener('click',()=>{parentOpen=false;renderParent();notify('Parent command locked.');});
  $('approvalQueue').addEventListener('click',e=>{
    const yes=e.target.closest('[data-approve]'),no=e.target.closest('[data-decline]');if(!parentOpen||(!yes&&!no))return;
    const id=(yes||no).dataset[yes?'approve':'decline'],r=state.requests.find(x=>x.id===id),oldXp=r?experience(state,r.kidId):0;
    if(yes)update(s=>approve(s,id),r?.type==='mission'?'Mission approved. Stardust awarded.':'Reward redeemed with parent approval.');
    else update(s=>decline(s,id),'Request closed without changing Stardust.');
    if(yes&&r&&r.type==='mission'&&Math.floor(experience(state,r.kidId)/100)>Math.floor(oldXp/100))celebrate('New Cadet level reached. Transmission complete.');
    else if(yes&&r&&r.type==='reward'&&r.itemId==='aurora'&&hasAura(state,r.kidId))celebrate('Aurora field unlocked. Visit the Character Lab.');
  });
  $('saveNames').addEventListener('click',()=>{if(!parentOpen)return;update(s=>changeAppearance(changeAppearance(s,'c1',{name:$('nameOne').value}),'c2',{name:$('nameTwo').value}),'Explorer callsigns saved.');});
  $('priceForm').addEventListener('submit',e=>{e.preventDefault();if(!parentOpen)return;update(s=>setSettings(s,{tablet:$('costTablet').value,friday:$('costFriday').value,aurora:$('costAurora').value,tabletCap:$('capTablet').value}),'Reward rules saved for new requests.');});
  $('missionEditor').addEventListener('change',e=>{const inp=e.target.closest('[data-mission-toggle]');if(!inp||!parentOpen)return;update(s=>setMissionActive(s,inp.dataset.missionToggle,inp.checked),'Mission availability updated.');});
  $('addMissionForm').addEventListener('submit',e=>{e.preventDefault();if(!parentOpen)return;update(s=>addMission(s,{title:$('newTitle').value,cadence:$('newCadence').value,kind:$('newKind').value,points:$('newPoints').value},'custom-'+Date.now()+'-'+Math.random().toString(36).slice(2,6)),'New family mission added.');$('newTitle').value='';});
  $('exportSave').addEventListener('click',()=>safely(exportBackup));
  $('importSave').addEventListener('change',async e=>{try{await importBackup(e.target.files?.[0]);}catch(err){notify(err?.message||'Backup not accepted.',true);}finally{e.target.value='';}});
  $('resetSave').addEventListener('click',()=>{if(!parentOpen)return;safely(()=>{if($('resetConfirm').value!=='RESET')throw Error('Type RESET exactly to clear local game progress.');if(!confirm('Permanently replace both explorers, missions, and reward history with an empty game?'))return;
    localStorage.setItem(SAVE_KEY,JSON.stringify(initialState()));blockedSave=false;state=initialState();activeKid='c1';$('resetConfirm').value='';render();notify('Game save reset. The parent code was preserved.');});});
}
load(); bind(); render();setView('missions');
if(blockedSave)notify('Existing device save could not be verified. Local changes are blocked until an imported backup replaces it.',true);