/* Porchlight V003 review client. No browser-supplied roles, GPS, persistent secrets or external SDKs. */
const $ = id => document.getElementById(id);
const EVENT = (() => {
  const value = new URL(location.href).searchParams.get('event') || 'halloween-2026';
  return /^[a-z0-9]{2,40}(?:-[a-z0-9]{1,40})*$/.test(value) ? value : 'halloween-2026';
})();
const app = {authenticated:false,role:null,ready:false,consentVersion:null};
const API = '/v1';
const safeEndpoint = pathname => pathname.startsWith(`${API}/`) ? pathname : null;
const node = (tag, text, className) => {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text != null) el.textContent = String(text);
  return el;
};
function notice(id, message, kind='') {
  const el = $(id);
  el.textContent = message;
  el.className = (el.classList.contains('form-result') ? 'form-result' : 'state-line') + (kind ? ` ${kind}` : '');
}
async function api(path, {method='GET', body}={}) {
  if (!safeEndpoint(path)) throw new Error('invalid_endpoint');
  let response;
  try {
    response = await fetch(path, {
      method, credentials:'same-origin', cache:'no-store', redirect:'error',
      headers:{Accept:'application/json', ...(body !== undefined ? {'Content-Type':'application/json'} : {})},
      ...(body !== undefined ? {body:JSON.stringify(body)} : {}),
    });
  } catch {throw new Error('connection_unavailable');}
  if (!(response.headers.get('content-type')||'').includes('application/json')) throw new Error('invalid_service_response');
  const value = await response.json().catch(()=>{throw new Error('invalid_service_response');});
  if (!response.ok) throw new Error(value.error || 'request_failed');
  return value;
}
const friendly = error => {
  const code = String(error?.message || error);
  const messages = {
    sign_in_required:'A verified adult session is required. Registration is not enabled in this source-only review.',
    identity_unavailable:'The identity provider is unavailable.',
    not_configured:'This isolated API is not connected. No real data or enrollment is enabled.',
    connection_unavailable:'The isolated review service is not available. No personal information has been submitted.',
    origin_denied:'This request needs an approved same-origin session.',
    invalid_service_response:'The server returned an unexpected response. No action was confirmed.',
    organizer_permission_denied:'This account does not have organizer permission for this event.',
    event_unavailable:'This event cannot accept new household applications.',
    active_submission_exists:'You already have an active submission for this event.',
    invalid_text:'Check the house name or private address for invalid characters.',
    block_not_available:'The selected general area is not currently approved.',
    consent_required:'Confirm adult eligibility, household authority and consent.',
    stale_or_unavailable:'The listing has changed. Reload the queue before acting.',
    property_verification_required:'Confirm direct or in-person verification before approval.',
    try_later:'Submissions are temporarily limited. Try again later.',
    service_unavailable:'The service is unavailable. The requested change has not been confirmed.'
  };
  return messages[code] || 'The request could not be completed. Refresh the current state before retrying.';
};
async function loadDirectory() {
  try {
    const data = await api(`${API}/events/${EVENT}/pins`);
    $('pin-count').textContent = `${data.pins.length} ${data.pins.length === 1 ? 'home' : 'homes'}`;
    const list = $('pin-list');list.replaceChildren();
    if (data.status !== 'active') {notice('directory-state','The public event directory is inactive or closed.','');return;}
    notice('directory-state',data.pins.length ? 'Only organizer-approved voluntary listings are shown.' : 'No homes are currently published.','good');
    for (const pin of data.pins) {
      const item = node('li');item.append(node('strong',pin.label));
      item.append(node('small',`${pin.mode === 'exact' ? 'Explicit exact-location listing' : 'General area'}: ${pin.place}`));
      item.append(node('small',(pin.offerings || []).join(' / ')));
      list.append(item);
    }
  } catch(error) {
    $('pin-count').textContent = 'Unavailable';$('pin-list').replaceChildren();
    notice('directory-state',friendly(error),'error');
  }
}
async function loadBlocks() {
  const select = $('host-block'); select.replaceChildren(node('option','Not accepting applications'));
  select.disabled = true;app.ready=false;app.consentVersion=null;
  try {
    const data = await api(`${API}/events/${EVENT}/blocks`);
    if (data.status !== 'active' || !Array.isArray(data.blocks) || !data.blocks.length) {syncSubmit();return;}
    select.replaceChildren(node('option','Select an approved general area'));
    select.firstChild.value='';
    for (const block of data.blocks) {
      const opt = node('option',block.label);opt.value = block.code;select.append(opt);
    }
    select.disabled = false;app.ready=true;app.consentVersion=data.consentVersion;
  } catch { /* UI fails closed and never invents available blocks. */ }
  syncSubmit();
}
function syncSubmit() {
  $('submit-host').disabled = !(app.authenticated && app.ready);
  $('refresh-queue').disabled = !['manager','reviewer'].includes(app.role);
  $('pause-form').hidden = app.role !== 'manager';
}
async function loadSession() {
  app.authenticated=false;app.role=null;syncSubmit();
  try {
    const data = await api(`${API}/session?event=${encodeURIComponent(EVENT)}`);
    app.authenticated = data.authenticated === true;
    app.role = ['manager','reviewer'].includes(data.role) ? data.role : null;
    notice('session-state',app.authenticated ? `A verified adult session was accepted.${app.role ? ` Event organizer role: ${app.role}.` : ' Household participant permissions only.'}` : 'No active verified session.',app.authenticated?'good':'');
    notice('organizer-state',app.role ? `Authorized ${app.role} account. This event's review queue is private.` : 'Only independently authorized organizers can review private addresses.',app.role?'good':'');
  } catch(error) {
    notice('session-state',friendly(error),'error');
    notice('organizer-state','Organizer tools are unavailable without independent authorization.');
  }
  syncSubmit();
  if (app.authenticated) await loadMine();
  else {notice('my-state','Sign in with a verified adult account to view submissions.');$('my-list').replaceChildren();}
  if (app.role) await loadQueue();
  else $('review-queue').replaceChildren();
}
async function loadMine() {
  if (!app.authenticated) {notice('my-state','Verified adult sign-in is required.');return;}
  try {
    const data = await api(`${API}/host/submissions`);
    const root=$('my-list');root.replaceChildren();
    notice('my-state',data.submissions.length ? 'Only submissions owned by this account are listed.' : 'No applications are associated with this account.','good');
    for (const item of data.submissions) {
      const card=node('article',null,'entry-card');card.append(node('h3',`Status: ${item.status}`));
      card.append(node('p',`Event: ${item.event} / display preference: ${item.mode}`));
      if (!['withdrawn','rejected','removed'].includes(item.status)) {
        const button=node('button','Withdraw my listing','danger-button');button.type='button';
        button.addEventListener('click',async()=>{
          if (!confirm('Withdraw participation now? The public listing will be removed on the next request.')) return;
          button.disabled=true;
          try {
            await api(`${API}/host/submissions/${encodeURIComponent(item.id)}/withdraw`,{method:'POST',body:{}});
            await Promise.all([loadMine(),loadDirectory()]);
            notice('my-state','Your participation was withdrawn.','good');
          } catch(error) {button.disabled=false;notice('my-state',friendly(error),'error');}
        });card.append(button);
      }
      root.append(card);
    }
  } catch(error) {notice('my-state',friendly(error),'error');$('my-list').replaceChildren();}
}
function moderationCard(item) {
  const card=node('article',null,'entry-card');
  card.append(node('h3',item.label));
  card.append(node('p',`Status: ${item.status} / revision ${item.revision} / display mode: ${item.mode}`));
  card.append(node('p',`PRIVATE organizer-only address: ${item.privateAddress}`));
  card.append(node('p',`Approved general area: ${item.blockLabel}`));
  card.append(node('p',`Offerings: ${item.offerings.join(', ')}`));
  if (item.status !== 'pending' && item.status !== 'approved') return card;
  const form=node('form');
  const reasonLabel=node('label','Private moderation reason (12-250 characters)');
  const reason=node('textarea');reason.required=true;reason.minLength=12;reason.maxLength=250;reason.rows=2;
  reasonLabel.append(reason);form.append(reasonLabel);
  const feedback=node('p','', 'form-result');feedback.setAttribute('role','status');
  const act=async(action,extra={})=>{
    if (action === 'approve' ? !form.reportValidity() : reason.value.trim().length < 12) return;
    if(!confirm(`${action === 'approve' ? 'Approve for publication' : action === 'reject' ? 'Reject' : 'Unpublish'} this home?`))return;
    const payload={expectedRevision:item.revision,reason:reason.value.trim(),...extra};
    try {
      await api(`${API}/organizer/submissions/${encodeURIComponent(item.id)}/${action}`,{method:'POST',body:payload});
      await Promise.all([loadQueue(),loadDirectory()]);
    } catch(error) {feedback.textContent=friendly(error);feedback.className='form-result error';}
  };
  if (item.status === 'pending') {
    const verifyLabel=node('label','I independently confirmed the applicant controls this household','choice');
    const verify=node('input');verify.type='checkbox';verify.required=true;verifyLabel.prepend(verify);form.append(verifyLabel);
    const methodLabel=node('label','Confirmation method');const method=node('select');
    for (const [value,label] of [['','Select method'],['direct-confirmation','Direct confirmation'],['in-person','In person']]) {
      const option=node('option',label);option.value=value;method.append(option);
    }
    method.required=true;methodLabel.append(method);form.append(methodLabel);
    const approve=node('button','Approve host','primary-button');approve.type='submit';
    form.addEventListener('submit',event=>{event.preventDefault();act('approve',{verifiedPropertyAuthority:verify.checked,verificationMethod:method.value});});
    form.append(approve);
    const reject=node('button','Reject','secondary-button');reject.type='button';
    reject.addEventListener('click',()=>{if(!reason.value.trim() || reason.value.trim().length<12){feedback.textContent='Add a private moderation reason first.';return;}act('reject');});
    form.append(reject);
  } else {
    const remove=node('button','Remove listing','danger-button');remove.type='button';remove.addEventListener('click',()=>act('remove'));
    form.append(remove);
  }
  form.append(feedback);card.append(form);return card;
}
async function loadQueue() {
  if (!app.role) return;
  try {
    const data = await api(`${API}/organizer/events/${EVENT}/submissions`);
    notice('organizer-state',`Review queue updated: ${data.submissions.length} submissions. Never share private household addresses outside authorized review.`, 'good');
    const root=$('review-queue');root.replaceChildren();
    for (const item of data.submissions) root.append(moderationCard(item));
  } catch(error) {notice('organizer-state',friendly(error),'error');$('review-queue').replaceChildren();}
}
$('host-form').addEventListener('submit',async event=>{
  event.preventDefault();const form=event.currentTarget;
  if(!app.authenticated||!app.ready) return notice('host-result','Verified adult access and an open event are required.','error');
  if(!form.reportValidity()) return;
  const offerings=Array.from(form.querySelectorAll('input[name="offering"]:checked')).map(item=>item.value);
  if(!offerings.length)return notice('host-result','Select at least one offering.','error');
  const body={label:$('host-label').value.trim(),privateAddress:$('host-address').value.trim(),blockCode:$('host-block').value,
    displayMode:'block',tags:offerings,consentVersion:app.consentVersion,
    consentConfirmed:$('host-consent').checked,adultAttested:$('host-adult').checked,authorizedResidentAttested:$('host-authority').checked};
  const button=$('submit-host');button.disabled=true;
  try {
    const result=await api(`${API}/events/${EVENT}/submissions`,{method:'POST',body});
    form.reset();notice('host-result',`Submitted: ${result.submission.status}. Your home is not public until independent review.`, 'good');
    await loadMine();
  } catch(error){notice('host-result',friendly(error),'error');}
  finally {syncSubmit();}
});
$('pause-form').addEventListener('submit',async event=>{
  event.preventDefault();if(app.role!=='manager'||!event.currentTarget.reportValidity())return;
  if(!confirm('Pause the event now and hide every public listing?'))return;
  try {
    const result=await api(`${API}/organizer/events/${EVENT}/pause`,{method:'POST',body:{reason:$('pause-reason').value.trim()}});
    notice('pause-result',`Event status: ${result.status}. All listings have been depublished.`, 'good');
    await Promise.all([loadBlocks(),loadDirectory(),loadQueue()]);
  }catch(error){notice('pause-result',friendly(error),'error');}
});
$('refresh-directory').addEventListener('click',loadDirectory);
$('refresh-mine').addEventListener('click',loadMine);
$('refresh-queue').addEventListener('click',loadQueue);
await Promise.all([loadDirectory(),loadBlocks(),loadSession()]);
// Open-page public listings must not remain indefinitely stale after another host withdraws.
window.setInterval(() => {if (!document.hidden) void loadDirectory();}, 15000);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) void Promise.all([loadDirectory(), app.authenticated ? loadMine() : Promise.resolve()]);
});
