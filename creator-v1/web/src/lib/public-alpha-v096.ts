/**
 * V096 guest alpha: a bounded, strictly local HTML/CSS scratchpad.
 * No account, storage, upload, server request, project ID, or executable JS.
 * Native V095 publishing/review remain separate and authoritative.
 */
export type AlphaSource={html:string;css:string};
export type AlphaTemplate={id:string;name:string;detail:string;source:AlphaSource};
export const ALPHA_MAX_HTML=18000;
export const ALPHA_MAX_CSS=18000;
export const ALPHA_DOCUMENT_CSP=[
 "default-src 'none'","script-src 'none'","style-src 'unsafe-inline'",
 "img-src data: blob:","font-src 'none'","media-src 'none'",
 "connect-src 'none'","frame-src 'none'","worker-src 'none'",
 "object-src 'none'","base-uri 'none'","form-action 'none'"
].join('; ');

export const alphaTemplates:readonly AlphaTemplate[]=[
 {id:'signal',name:'Signal landing',detail:'A cinematic home screen',source:{
  html:[
   '<main class="scene">',
   ' <p class="eyebrow">ANEVUM / CREATOR ALPHA</p>',
   ' <div class="orbital" aria-hidden="true"><span></span><span></span><span></span></div>',
   ' <p class="tag">A world of things people make.</p>',
   ' <h1>Make your next<br><em>impossible thing.</em></h1>',
   ' <p class="intro">Change this text. Adjust the colors. Make the screen yours.</p>',
   ' <a class="action" href="#preview">Your first signal &rarr;</a>',
   ' <p id="preview" class="foot">Designed in the anonymous playground.</p>',
   '</main>'
  ].join('\n'),
  css:[
   ':root{color-scheme:dark;font-family:system-ui,sans-serif;background:#070d1d;color:#e8f2ff;}',
   '*{box-sizing:border-box}body{margin:0;min-height:100vh;}',
   '.scene{position:relative;isolation:isolate;min-height:100vh;padding:clamp(28px,7vw,72px);display:flex;flex-direction:column;align-items:flex-start;justify-content:center;overflow:hidden;background:radial-gradient(ellipse at 70% 22%,#1e386980,transparent 45%),linear-gradient(125deg,#080e1e,#111c33 70%,#060d19);}',
   '.eyebrow{letter-spacing:.25em;color:#8fc5eb;font-size:11px;font-weight:750;}',
   '.orbital{position:absolute;z-index:-1;width:260px;height:260px;right:-90px;top:4%;border:1px solid #799de36b;border-radius:50%;box-shadow:0 0 100px #3c7afa24, inset 0 0 60px #7aa9ff12;transform:rotate(-22deg);}',
   '.orbital span{position:absolute;border:1px solid #9dd0ff70;border-radius:50%;inset:27px;transform:rotate(55deg) scaleX(.58);}',
   '.orbital span:nth-child(2){inset:50px;transform:rotate(-44deg) scaleX(.77)}',
   '.orbital span:nth-child(3){inset:103px;background:#b7dcff;box-shadow:0 0 30px #8aaef7}',
   '.tag{font-size:12px;color:#a6b9d3;margin:20px 0 4px;}',
   'h1{font-size:clamp(36px,8vw,72px);font-weight:520;letter-spacing:-.07em;line-height:1.06;margin:12px 0 22px;}',
   'h1 em{font-style:normal;color:#a1caff;}',
   '.intro{max-width:365px;color:#b7c5db;line-height:1.6;margin:0 0 30px;}',
   '.action{display:inline-block;background:#d9e8ff;color:#091a33;padding:14px 19px;text-decoration:none;font-size:13px;font-weight:800;border-radius:4px;}',
   '.action:hover,.action:focus-visible{background:#a2d3ff;}',
   '.foot{font-size:10px;color:#8eaac9;letter-spacing:.06em;margin-top:40px;}'
  ].join('\n')
 }},
 {id:'postcard',name:'Pocket card',detail:'A mobile-first social card',source:{
  html:[
   '<main class="postcard">',
   ' <div class="art"><span class="moon"></span><span class="star">✦</span></div>',
   ' <div class="body"><p class="label">CREATOR / 001</p>',
   ' <h1>My little universe</h1>',
   ' <p>This project started with a single idea. What will you make of it?</p>',
   ' <label class="check"><input type="checkbox"> Save this moment</label>',
   ' </div>',
   '</main>'
  ].join('\n'),
  css:[
   ':root{color-scheme:dark;font-family:system-ui,sans-serif;background:#0b1020;color:#e4f0ff;}*{box-sizing:border-box}',
   'body{margin:0;min-height:100vh;display:grid;place-items:center;padding:18px;background:radial-gradient(circle at top,#1a2c4c,#080e1d 74%)}',
   '.postcard{width:min(100%,360px);border:1px solid #647b9b60;border-radius:19px;overflow:hidden;background:#121c2f;box-shadow:0 20px 55px #0007}',
   '.art{height:210px;position:relative;overflow:hidden;background:radial-gradient(ellipse at 70% 20%,#5662b3 0,#29386d 35%,#0b1939 75%)}',
   '.moon{position:absolute;width:120px;height:120px;top:50px;left:calc(50% - 60px);border-radius:50%;background:linear-gradient(140deg,#cbeaff,#81a7e4);box-shadow:0 0 75px #b9cfff90}',
   '.star{position:absolute;right:35px;top:30px;font-size:38px;color:#f5e8bc}',
   '.body{padding:24px}.label{font-size:10px;letter-spacing:.22em;color:#9fc8fa}',
   'h1{font-size:26px;letter-spacing:-.035em;margin:8px 0}p{line-height:1.6;color:#c5d3e7}',
   '.check{display:flex;gap:10px;align-items:center;margin-top:25px;font-weight:700;font-size:13px}',
   '.check input{accent-color:#8ac5ff;width:20px;height:20px}'
  ].join('\n')
 }},
 {id:'blank',name:'Blank scene',detail:'Start with your own idea',source:{
  html:'<main>\n  <h1>Hello, creator.</h1>\n  <p>This canvas is yours.</p>\n</main>',
  css:':root{color-scheme:dark;font-family:system-ui,sans-serif;background:#090f1d;color:#e8f1ff}body{margin:0;padding:40px}h1{font-size:clamp(28px,8vw,56px)}p{color:#b9c9e2}'
 }}
];

export function validAlphaSource(value:unknown):value is AlphaSource{
 if(!value||typeof value!=='object')return false;
 const source=value as Partial<AlphaSource>;
 return typeof source.html==='string'&&source.html.length<=ALPHA_MAX_HTML&&
  typeof source.css==='string'&&source.css.length<=ALPHA_MAX_CSS;
}
/** CSP remains first in the document; inline scripts never execute even if
 * user HTML includes script tags or attempts to inject a new closing style. */
export function buildAlphaDocument(source:AlphaSource):string{
 if(!validAlphaSource(source))throw Error('Local preview exceeds its size limit.');
 const safeCss=source.css.replace(/<\/style/gi,'<\\/style');
 return [
  '<!doctype html><html lang="en"><head><meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width, initial-scale=1">',
  '<meta http-equiv="Content-Security-Policy" content="'+ALPHA_DOCUMENT_CSP+'">',
  '<meta name="referrer" content="no-referrer">',
  '<style>'+safeCss+'</style></head><body>',
  source.html,'</body></html>'
 ].join('');
}
