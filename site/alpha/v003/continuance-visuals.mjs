/* ANEVUM / Continuance Institute — V005 vector visual language.
 * All artwork is original source SVG, resolution independent, and purely decorative.
 * No external fonts, placeholder metrics, tracking, or privileges.
 */
export const CREST='<svg xmlns="http://www.w3.org/2000/svg" class="av-crest" viewBox="0 0 56 56" aria-hidden="true" focusable="false"><circle cx="28" cy="28" r="24" stroke="currentColor" fill="none" stroke-width=".7" opacity=".55"/><circle cx="28" cy="28" r="19" stroke="currentColor" fill="none" stroke-width=".6" opacity=".3"/><path d="M12 31c10-23 22-23 32 0M13 32c9 12 21 12 30 0M28 9v38M9 28h38" fill="none" stroke="currentColor" stroke-width="1" opacity=".8"/><circle cx="28" cy="28" r="4.6" stroke="currentColor" fill="none" stroke-width="1.3"/><circle cx="28" cy="28" r="1.5" fill="currentColor"/><circle cx="18" cy="15" r="1.5" fill="currentColor"/><circle cx="42" cy="39" r="1.5" fill="currentColor"/></svg>';
export const SIGIL='<svg xmlns="http://www.w3.org/2000/svg" class="av-sigil" viewBox="0 0 44 44" aria-hidden="true" focusable="false"><circle cx="22" cy="22" r="19" fill="none" stroke="currentColor" stroke-width=".8" opacity=".45"/><path d="M22 5v34M5 22h34M13 31c4-18 14-18 18 0" fill="none" stroke="currentColor" stroke-width="1.05"/><circle cx="22" cy="22" r="3.4" fill="none" stroke="currentColor"/><circle cx="22" cy="22" r="1.1" fill="currentColor"/></svg>';
export const ORBITAL_ART=String.raw`<div class="av-signal-diagram" aria-hidden="true">
<svg viewBox="0 0 730 430" xmlns="http://www.w3.org/2000/svg" focusable="false">
 <defs><radialGradient id="av-halo"><stop stop-color="#90e3e8" stop-opacity=".31"/><stop offset=".3" stop-color="#4da0b9" stop-opacity=".11"/><stop offset="1" stop-color="#0b1b38" stop-opacity="0"/></radialGradient><linearGradient id="av-trace"><stop stop-color="#7699b6" stop-opacity=".05"/><stop offset=".5" stop-color="#c0f2f6" stop-opacity=".9"/><stop offset="1" stop-color="#7196c8" stop-opacity=".08"/></linearGradient></defs>
 <g stroke="#7498c4" stroke-opacity=".14" fill="none" stroke-width=".65"><path d="M0 86H730M0 172H730M0 258H730M0 344H730M91 0V430M182 0V430M273 0V430M364 0V430M455 0V430M546 0V430M637 0V430"/></g>
 <circle cx="377" cy="209" r="212" fill="url(#av-halo)"/><circle cx="377" cy="209" r="176" fill="none" stroke="#a4bdd4" stroke-opacity=".34" stroke-width=".8" stroke-dasharray="2 8"/>
 <ellipse class="av-orbit av-orbit-a" cx="377" cy="209" rx="205" ry="107" transform="rotate(-26 377 209)" fill="none" stroke="url(#av-trace)" stroke-width="1.2"/>
 <ellipse class="av-orbit av-orbit-b" cx="377" cy="209" rx="157" ry="81" transform="rotate(59 377 209)" fill="none" stroke="#b8edee" stroke-opacity=".37" stroke-width=".9"/>
 <circle cx="377" cy="209" r="123" fill="none" stroke="#b1c5dd" stroke-opacity=".44" stroke-width="1"/>
 <circle cx="377" cy="209" r="100" fill="none" stroke="#b1c5dd" stroke-opacity=".25" stroke-width=".7"/>
 <circle cx="377" cy="209" r="65" fill="none" stroke="#c5ebee" stroke-opacity=".72" stroke-width="1.3"/>
 <circle class="av-pulse-ring" cx="377" cy="209" r="49" fill="none" stroke="#8fe8e7" stroke-opacity=".42" stroke-width="2"/>
 <path d="M377 149v120M317 209h120" fill="none" stroke="#a1c3d8" stroke-opacity=".36" stroke-width="1"/>
 <path d="M333 244l44-80 43 80z" fill="none" stroke="#bcf2f6" stroke-opacity=".7" stroke-width="1"/>
 <circle cx="377" cy="209" r="22" fill="none" stroke="#d0fcfa" stroke-width="1.4"/><circle cx="377" cy="209" r="5" fill="#d7ffff" opacity=".75"/><circle cx="377" cy="209" r="2.3" fill="#fff"/>
 <g fill="#bef7ff"><circle cx="228" cy="138" r="2"/><circle cx="530" cy="119" r="1.8"/><circle cx="463" cy="333" r="2.5"/><circle cx="594" cy="239" r="1.4"/><circle cx="262" cy="309" r="1.9"/></g>
 <g stroke="#a1c6d6" stroke-opacity=".4" stroke-width=".8" fill="none"><path d="M228 138l-91-42H65M463 333l88 38h129M530 119l87-58h68M262 309l-118 53H61"/></g>
 <g fill="#b8d4eb" font-family="monospace" font-size="10" letter-spacing="1.3"><text x="65" y="81">01 / CREATOR</text><text x="575" y="49">02 / PREVIEW</text><text x="546" y="388">03 / REVIEW</text><text x="52" y="378">BUILD / READY</text></g>
 <path d="M32 32v24M32 32h24M698 32v24M698 32h-24M32 398v-24M32 398h24M698 398v-24M698 398h-24" stroke="#96c2df" stroke-width=".7" stroke-opacity=".6" fill="none"/>
</svg><span class="av-art-corner">CONTINUANCE / UPLINK 001</span>
</div>`;

export const V005_CSS=String.raw`
:root{--av-ink:#edf6ff;--av-paper:#c2e9ed;--av-muted:#b7c8df;--av-line:rgba(157,199,237,.25);--gold:#c8eef1;--bg:#070e1c;--surface:#101c30;--surface2:#1a2a43;--line:#344d6c;--text:#edf6ff;--muted:#b7c8df}
html{scroll-behavior:smooth;scroll-padding-top:88px}
body{color:var(--av-ink);background:radial-gradient(ellipse 70% 70% at 88% -10%,rgba(67,121,177,.18),transparent 68%),linear-gradient(180deg,#071020,#070d1a 75%,#050a13);font-family:Inter,"SF Pro Text",ui-sans-serif,system-ui,sans-serif;isolation:isolate}
body:before{content:"";position:fixed;inset:0;pointer-events:none;z-index:-1;background-image:radial-gradient(circle at 20% 18%,#b6ddff 0 .7px,transparent 1px),radial-gradient(circle at 77% 41%,#b6ddff 0 .55px,transparent 1px),radial-gradient(circle at 46% 78%,#b6ddff 0 .7px,transparent 1px);background-size:289px 313px,367px 263px,401px 371px;opacity:.12}
::selection{background:#a3e8eb;color:#061426}
a{color:#caeaf5}
header{background:rgba(6,15,29,.92);border-color:rgba(148,193,231,.2);box-shadow:0 7px 36px #01081450}
.top{max-width:1300px;padding:12px clamp(14px,2.3vw,30px);gap:18px}
.brand{display:flex;align-items:center;gap:9px;letter-spacing:.13em;line-height:1.1}
.brand .brand-mark{width:41px;height:41px;display:grid;place-items:center;color:#bcebec;flex:none;filter:drop-shadow(0 0 9px #58b6cf38)}
.av-crest{width:100%;height:100%;display:block}
.brand-words{display:flex;flex-direction:column;gap:3px}.brand-words strong{font-weight:730;font-size:15px;letter-spacing:.18em}.brand small{font-size:9px;font-weight:530;letter-spacing:.125em;color:#a7bed8}
.top nav{gap:clamp(10px,2.1vw,27px);align-items:center}
.top nav a{position:relative;white-space:nowrap;color:#bdcadb;font-size:12px;font-weight:570;letter-spacing:.01em;transition:color .2s ease}
.top nav a:hover,.top nav a[aria-current=page]{color:#e4faff;text-decoration:none}
.top nav a[aria-current=page]:after{content:"";position:absolute;left:0;right:0;bottom:5px;height:1px;background:#a9e9ed}
.header-readout{display:flex;gap:8px;align-items:center;font:550 10px ui-monospace,monospace;letter-spacing:.08em;color:#b1cadc;text-transform:uppercase;border-left:1px solid #4f617c;padding-left:17px}
.header-readout i{width:5px;height:5px;border-radius:50%;background:#9ed9d1;box-shadow:0 0 12px #66d5c2}
main{width:min(1210px,calc(100% - 34px));padding-top:20px;min-width:0}
.ey{font:600 10px/1.5 ui-monospace,monospace;letter-spacing:.16em;color:#aee7eb}
h1,h2,h3{color:#eef6ff}
h1{font-family:Georgia,"Iowan Old Style",serif;font-weight:400;line-height:1.025;letter-spacing:-.04em;text-wrap:balance}
h2{font-family:Georgia,serif;font-weight:500;letter-spacing:-.025em}
h3{font-weight:650}
p,.lead{color:#b8c9df}
.lead{font-size:clamp(14px,1.5vw,17px);line-height:1.68;max-width:62ch}
.av-scene-lead{position:relative;isolation:isolate;overflow:hidden;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,.94fr);min-height:247px;border:1px solid #6684ab60;background:radial-gradient(ellipse at 75% 43%,#315b9038,transparent 52%),linear-gradient(110deg,#0c1b32,#091325);border-radius:18px;margin-bottom:18px;box-shadow:0 20px 65px #0003,inset 0 1px #edf8ff15}
.av-scene-lead:after{content:"";position:absolute;bottom:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent 3%,#78c7d5 45%,transparent 91%);opacity:.35}
.av-hero-copy{position:relative;z-index:1;padding:clamp(23px,3.8vw,48px);align-self:center}
.av-hero-copy h1{font-size:clamp(39px,4.45vw,66px);margin:14px 0 15px;max-width:650px}
.av-hero-copy h1 em{font-weight:400;font-style:italic;color:#c6eef0}
.av-hero-copy .lead{margin:0;max-width:480px}
.av-ey-line{display:flex;align-items:center;gap:11px}
.av-ey-line:before{content:"";height:1px;width:26px;background:#8ed6df}
.av-signal-diagram{position:relative;overflow:hidden;min-height:247px;display:grid;place-items:center}
.av-signal-diagram svg{width:110%;height:100%;min-width:300px;display:block}
.av-signal-diagram:after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,#0c1930 0%,transparent 19% 92%,#09132355)}
.av-art-corner{position:absolute;bottom:17px;right:22px;font:550 10px ui-monospace,monospace;letter-spacing:.1em;color:#a7bad5;z-index:1}
.av-orbit{transform-origin:377px 209px;animation:av-orbit-drift 36s linear infinite}.av-orbit-b{animation-direction:reverse;animation-duration:46s}
.av-pulse-ring{animation:av-pulse 4.8s ease-in-out infinite}
@keyframes av-orbit-drift{to{rotate:360deg}}@keyframes av-pulse{0%,100%{stroke-opacity:.2}50%{stroke-opacity:.7}}
.av-meta-strand{display:flex;gap:13px;align-items:center;flex-wrap:wrap;margin-top:16px}
.av-meta-strand span{font:530 10px/1.4 ui-monospace,monospace;letter-spacing:.08em;color:#aabed6}
.av-meta-strand span+span:before{content:"/";color:#6d839f;margin-right:13px}
.panel{position:relative;border:1px solid #92b6e13b;border-radius:17px;background:linear-gradient(135deg,#1d365257,#0d1b30 37%,#0b1728);box-shadow:inset 0 1px #d8f1ff12,0 18px 55px #0003}
.panel:before{content:"";position:absolute;top:0;left:23px;right:23px;height:1px;pointer-events:none;background:linear-gradient(90deg,transparent,#c4edff24,transparent)}
.panel.soft{background:linear-gradient(145deg,#111f35,#0d192b)}
.panel h2{font-size:clamp(23px,2.6vw,31px)}
.grid{gap:17px;grid-template-columns:minmax(0,1.32fr) minmax(275px,.76fr)}
.av-section-no{font:530 10px ui-monospace,monospace;letter-spacing:.09em;color:#9bb4cd;border:1px solid #4c6480;min-width:30px;height:30px;display:grid;place-items:center;border-radius:7px}
.av-block-hd{display:flex;align-items:center;justify-content:space-between;gap:11px;margin-bottom:9px}
.stepper{gap:7px;margin:15px 0 22px}
.stepper span{font:580 10px/1.5 ui-monospace,monospace;padding:7px 11px;letter-spacing:.02em;border-radius:5px}
.stepper .active{border-color:#95d5df;background:#163648;color:#e9feff}
.drop{position:relative;isolation:isolate;min-height:173px;border:1px solid #7bc8d79c;background:radial-gradient(ellipse at 50% 0%,#65afc727,transparent 68%),#0b1c32;border-radius:13px;overflow:hidden;box-shadow:inset 0 0 0 5px #0c1d3261}
.drop:before{content:"";position:absolute;inset:7px;border:1px dashed #89b8da52;border-radius:7px;pointer-events:none}
.drop:hover,.drop.drag,.drop:focus-within{background:radial-gradient(ellipse at 50% 0%,#7dd6d842,transparent 70%),#112942;border-color:#c7f5f5}
.drop strong{font-size:16px;letter-spacing:-.015em;color:#eaf8fd}
.drop .symbol{background:linear-gradient(145deg,#234e63,#153046);border:1px solid #5f8a9b;color:#dcffff;box-shadow:0 9px 25px #0004}
.file-check{color:#badadf;font:540 11px/1.5 ui-monospace,monospace;margin:11px 0 15px}
.field{border-color:#47617d;background:#0a1629;border-radius:9px;box-shadow:inset 0 1px #fff1;transition:border .18s ease,box-shadow .18s ease}
.field:hover{border-color:#7899bb}.field:focus{outline:none;border-color:#b3e7ea;box-shadow:0 0 0 3px #8de2e21f}
label{font-weight:650;color:#d2e3f3;font-size:12px}
.format-options{margin-bottom:7px}.format-option{background:linear-gradient(135deg,#142940,#102037);border-color:#38546d}.format-option strong{color:#e8f8ff}
.primary{background:#d0f0f1;color:#0c2130;border-color:#d0f0f1;box-shadow:0 7px 22px #05131c40}
.primary:hover{background:#f5ffff}
button,.button{transition:transform .16s cubic-bezier(.2,.77,.24,1),box-shadow .2s ease,background .2s ease,border-color .2s ease}
button:hover,.button:hover{border-color:#9aceda}button:active,.button:active{transform:translateY(1px)}
.notice{border-color:#88bee06b;background:linear-gradient(115deg,#14263c,#101d32);border-style:solid}.notice strong{color:#e7f3fd}
.help-quick article{background:#111f34;border-color:#324e6b}.help-quick article strong{font-family:Georgia,serif;font-size:17px;font-weight:450;color:#eaf7ff}
.project{position:relative;isolation:isolate;overflow:hidden;border-color:#37536e;background:#111e31;box-shadow:inset 0 1px #dff6ff10,0 16px 34px #0003;transition:transform .25s cubic-bezier(.2,.77,.24,1),border-color .2s ease,box-shadow .2s ease}
.project:hover{border-color:#7fb4cf;box-shadow:inset 0 1px #dff6ff15,0 23px 45px #0004}
.av-project-plate{margin:-19px -19px 15px;min-height:122px;background:radial-gradient(circle at 68% 55%,#5e94be30,transparent 46%),linear-gradient(130deg,#12253e,#0b1a2d);border-bottom:1px solid #82b3da47;position:relative;display:flex;justify-content:space-between;align-items:flex-start;padding:16px}
.av-project-plate:before{content:"";position:absolute;inset:12px;border:1px solid #a3d5f72b;border-radius:7px;pointer-events:none}
.av-project-plate:after{content:"";position:absolute;top:31px;left:50%;width:1px;height:70px;background:linear-gradient(transparent,#77a7bf,transparent);transform:rotate(31deg);opacity:.3}
.av-project-plate .av-sigil{width:83px;height:83px;color:#a8e6ed;opacity:.75;align-self:center;filter:drop-shadow(0 0 12px #5cb1c83b)}
.av-project-plate-label{font:550 9px/1.5 ui-monospace,monospace;color:#bad0e8;letter-spacing:.12em;text-transform:uppercase}
.av-project-index{font:500 10px ui-monospace,monospace;color:#c5d9e9;letter-spacing:.12em}
.project h3{font-family:Georgia,serif;font-size:25px;font-weight:450;letter-spacing:-.02em}
.project .chip{font-size:10px;letter-spacing:.055em;text-transform:none;border-radius:5px}
.av-project-meta{display:flex;flex-wrap:wrap;gap:10px;color:#a7bad0;font-size:11px}
.av-project-meta span+span:before{content:"·";margin-right:10px;color:#617a99}
.project .actions{margin-top:15px}
.av-guide-art{margin:19px 0;padding:15px;border:1px solid #97c1de3d;border-radius:11px;background:radial-gradient(circle at 90% 10%,#558bbd30,transparent 45%),#0b1a2e}
.av-guide-art .av-sigil{width:46px;height:46px;color:#c7f1f2}
.av-guide-art strong{display:block;font-family:Georgia,serif;font-size:21px;font-weight:450;line-height:1.2;color:#e6f4fc;margin:8px 0 6px}
.av-guide-art p{font-size:12px;line-height:1.5;margin-bottom:0}
.titlebar h2{font-size:clamp(23px,3vw,33px)}
.av-stage-toolbar{display:flex;justify-content:space-between;gap:12px;align-items:center;margin:18px 0 9px}
.av-stage-toolbar span{font:600 10px/1.5 ui-monospace,monospace;letter-spacing:.12em;color:#b8d4e9}
.viewport{background:#01060e;box-shadow:0 21px 60px #0007,inset 0 1px #def6ff17;border-color:#90bfe47a;margin:0;border-radius:12px}
.viewport:before{content:"";position:absolute;inset:0;pointer-events:none;z-index:1;box-shadow:inset 0 0 0 2px #010915a6}
.viewport iframe{height:clamp(390px,67vh,850px);background:#030814}
.player-head{padding:5px 0 14px;align-items:center}.player-head h1{font-size:clamp(32px,4vw,51px);margin:7px 0 10px}
.player-controls{margin-top:10px}.details{border-top-color:#34506d}.details p{max-width:75ch;line-height:1.7}
.av-detail-heading{display:flex;justify-content:space-between;align-items:center;gap:12px}
.empty-state{position:relative;min-height:186px;display:flex;align-items:center;gap:17px;flex-direction:row;border:1px solid #3d5673;padding:25px;background:linear-gradient(117deg,#121f35,#0e1a2b);overflow:hidden}
.empty-state .av-sigil{width:82px;height:82px;flex:none;color:#b1ddeb;opacity:.56}
.empty-state strong{font-family:Georgia,serif;font-size:24px;font-weight:450}
.empty-state span{font-size:13px;color:#bbcbde;max-width:55ch}
.foot{padding:30px 15px;background:#060e1b;border-top:1px solid #81add12e}
@media(min-width:801px){.project-grid{grid-template-columns:repeat(auto-fill,minmax(285px,1fr))}}
@media(max-width:800px){main{padding-top:17px}.header-readout{display:none!important}.top{flex-direction:row;align-items:center}.top nav{gap:12px;flex-wrap:nowrap}.top nav a{min-height:44px}.av-scene-lead{grid-template-columns:1fr;min-height:0}.av-hero-copy{padding:26px 23px 19px}.av-hero-copy h1{font-size:clamp(37px,6.5vw,55px);margin:10px 0 11px}.av-scene-lead .av-signal-diagram{position:absolute;right:-110px;top:-60px;width:380px;height:260px;opacity:.28;min-height:0;pointer-events:none}.av-art-corner{display:none}.av-scene-lead .lead{max-width:570px}.grid{grid-template-columns:1fr}.viewport iframe{height:64dvh;min-height:300px}}
@media(max-width:500px){.top{gap:5px}.brand{gap:4px;min-width:0}.brand .brand-mark{width:32px;height:32px}.brand-words strong{font-size:12px;letter-spacing:.125em}.brand small{font-size:7px;letter-spacing:.06em}.top nav{gap:6px}.top nav a{font-size:11px}main{width:calc(100% - 24px);padding-top:12px}.av-scene-lead{border-radius:14px;margin-bottom:12px}.av-hero-copy{padding:20px 18px 17px}.av-hero-copy h1{font-size:clamp(34px,9vw,43px)}.av-hero-copy .lead{font-size:13px;line-height:1.5;margin:7px 0 0}.av-meta-strand{margin-top:13px;gap:4px}.av-meta-strand span{font-size:9px}.av-meta-strand span+span:before{margin-right:5px}.av-scene-lead .av-signal-diagram{right:-161px;top:-58px;opacity:.2}.panel{padding:18px;border-radius:14px}.panel h2{font-size:25px}.stepper{margin:12px 0 17px}.stepper span{font-size:9px;padding:6px 7px}.drop{min-height:155px;padding:13px}.drop:before{inset:5px}.format-options{margin-bottom:8px}.format-option strong{font-size:12px}.format-option span{font-size:10px}.project h3{font-size:24px}.player-head h1{font-size:clamp(29px,8vw,40px)}.av-stage-toolbar{margin-top:9px}.av-stage-toolbar span{font-size:9px}.viewport iframe{height:63dvh;min-height:290px}.empty-state{padding:17px;gap:10px}.empty-state .av-sigil{width:55px;height:55px}.empty-state strong{font-size:19px}}
@media(max-width:360px){.brand .brand-mark{width:28px;height:28px}.brand-words strong{font-size:11px}.brand small{font-size:6.4px}.top nav{gap:5px}.top nav a{font-size:10px}.av-hero-copy h1{font-size:32px}.av-meta-strand span{font-size:8px}.format-options{grid-template-columns:1fr}}
@media(hover:hover) and (prefers-reduced-motion:no-preference){.project:hover{transform:translateY(-4px)}}

/* Release-bound creator art — true owner images only, never generated fallback thumbnails. */
.av-cover-field{margin:16px 0 19px}
.av-field-optional{font:550 10px ui-monospace,monospace;letter-spacing:.09em;color:#aabfd3}
.av-cover-select{display:grid;grid-template-columns: minmax(122px,.44fr) minmax(0,1fr);gap:15px;align-items:center;padding:12px;border:1px solid #435e7e;border-radius:12px;background:linear-gradient(145deg,#112139,#0b192c)}
.av-cover-preview{position:relative;aspect-ratio:16/9;min-height:82px;border:1px solid #456586;border-radius:8px;overflow:hidden;display:grid;place-items:center;background:radial-gradient(circle at 50% 40%,#39648666,transparent 55%),#0b1626}
.av-cover-preview .av-sigil{width:43%;height:auto;color:#a6ddea;opacity:.57}
.av-cover-preview.has-image .av-sigil{opacity:0}
.av-cover-preview img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
.av-cover-preview img[hidden]{display:none!important}
.av-cover-copy{min-width:0}
.av-cover-copy strong{font-size:13px;color:#edf8ff}
.av-cover-copy p{font-size:11px;line-height:1.5;margin:4px 0 9px}
.av-cover-input{display:block;max-width:100%;width:100%;padding:7px 0;color:#c7d8e7;font-size:12px}
.av-cover-input::file-selector-button{min-height:44px;background:#1e3b52;border:1px solid #749ab5;border-radius:8px;color:#f1faff;font:650 12px ui-sans-serif,system-ui;padding:9px 13px;margin-right:8px;cursor:pointer}
.av-cover-input::file-selector-button:hover{background:#294e69}
.av-cover-hint{font:510 10px/1.5 ui-monospace,monospace!important;color:#aec1d4!important;margin:5px 0 0!important}
.av-cover-hint.bad{color:#ffb9b9!important}
.av-project-plate.av-has-cover{background:#0b1526}
.av-project-plate .av-project-cover{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;z-index:1}
.av-project-plate.av-has-cover:after{content:"";position:absolute;inset:0;width:auto;height:auto;transform:none;opacity:1;z-index:2;background:linear-gradient(180deg,#050c1ec9,transparent 50%,#050c1ec4);pointer-events:none}
.av-project-plate.av-has-cover:before{z-index:3}
.av-project-plate.av-has-cover .av-project-plate-label,.av-project-plate.av-has-cover .av-project-index{position:relative;z-index:4;color:#edf8ff;text-shadow:0 2px 9px #000f}
.av-project-plate.av-has-cover .av-sigil{opacity:0}
.av-release-art{display:grid;grid-template-columns:minmax(0,160px) minmax(0,1fr);gap:13px;padding:12px;border:1px solid #324d6a;border-radius:10px;background:#0a1829;margin:14px 0}
.av-release-art img{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:6px;border:1px solid #496b86}
.av-release-art p{font-size:12px;margin:5px 0;color:#abc3d9;line-height:1.55}
@media(max-width:500px){.av-cover-select{grid-template-columns:1fr;gap:10px}.av-cover-preview{max-height:150px}.av-cover-copy p{margin:5px 0}.av-release-art{grid-template-columns:110px minmax(0,1fr)}}

@media(prefers-reduced-motion:reduce){.av-orbit,.av-pulse-ring{animation:none!important}*,*:before,*:after{scroll-behavior:auto!important}}
`;
