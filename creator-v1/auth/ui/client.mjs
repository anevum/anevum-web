const root='/api/v1/member';
const $=id=>document.getElementById(id);
const status=$('status');
let email='';
function show(id){for(const el of ['email-form','code-form','profile-form','disabled'])$(el).hidden=el!==id;}
function notice(text,error=false){status.textContent=text;status.className='status'+(error?' error':'');}
async function call(path,method='GET',payload){const r=await fetch(root+path,{method,credentials:'same-origin',headers:{'content-type':'application/json'},body:payload?JSON.stringify(payload):undefined});let result;try{result=await r.json()}catch{throw Error('Unexpected service response')}if(!r.ok)throw Error(result.error||'Request failed');return result;}
async function load(){try{const health=await call('/health');try{const me=await call('/me');show('profile-form');$('welcome').textContent='Signed in as '+me.member.email;$('handle').value=me.member.handle||'';$('display').value=me.member.displayName||'';$('bio').value=me.member.bio||'';notice('Your account is ready.');return;}catch{}
if(!health.signupEnabled){show('disabled');notice('Creator sign-in is in private testing. Please check back as access expands.');return;}show('email-form');notice('Use your email to sign in or join ANEVUM.');}
catch{show('disabled');notice('Member service unavailable. Please try again later.',true);}}
$('email-form').addEventListener('submit',async event=>{event.preventDefault();const btn=$('send-button');btn.disabled=true;email=$('email').value.trim().toLowerCase();const token=window.turnstile?.getResponse()||'';try{await call('/start','POST',{email,turnstileToken:token});show('code-form');notice('If eligible, a code is on its way. Check your inbox.');}catch(e){notice(e.message,true);window.turnstile?.reset();}finally{btn.disabled=false;}});
$('code-form').addEventListener('submit',async event=>{event.preventDefault();const code=$('code').value.trim();try{await call('/verify','POST',{email,code});await load();}catch(e){notice(e.message,true);}});
$('restart').addEventListener('click',()=>{show('email-form');notice('Enter your email to get a new code.');window.turnstile?.reset();});
$('profile-form').addEventListener('submit',async event=>{event.preventDefault();const data={handle:$('handle').value.trim(),displayName:$('display').value.trim(),bio:$('bio').value.trim()};try{await call('/profile','POST',data);notice('Profile saved. Welcome to ANEVUM.');status.classList.add('success');}catch(e){notice(e.message,true);}});
$('signout').addEventListener('click',async()=>{try{await call('/sign-out','POST',{});await load();}catch(e){notice(e.message,true);}});
load();