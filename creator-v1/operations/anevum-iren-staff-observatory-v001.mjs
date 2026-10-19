const PAGE = "<!doctype html>\n<html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1,viewport-fit=cover\"><meta name=\"theme-color\" content=\"#07111f\"><title>IREN | Staff Observatory | ANEVUM</title><link rel=\"stylesheet\" href=\"/staff/observatory/styles.css\"><script src=\"/staff/observatory/app.js\" defer></script></head>\n<body><div class=\"frame\">\n  <aside class=\"rail\">\n    <div class=\"brand\"><span class=\"brand-mark\" aria-hidden=\"true\">&#9678;</span><div><div class=\"brand-kicker\">ANEVUM / IREN</div><div class=\"brand-name\">CONTINUANCE</div><div class=\"brand-sub\">INSTITUTE OPERATIONS</div></div></div>\n    <div class=\"rail-line\"></div><div class=\"rail-label\">WORKSPACES</div>\n    <nav class=\"navigation\" aria-label=\"Observatory workspaces\">\n      <button class=\"navitem active\" type=\"button\" data-tab=\"overview\" aria-current=\"page\"><span class=\"navglyph\">&#9673;</span>Engagement <span class=\"nav-arrow\">&#8599;</span></button>\n      <button class=\"navitem owner-only\" type=\"button\" data-tab=\"members\" hidden><span class=\"navglyph\">&#9671;</span>Members <span class=\"nav-arrow\">&#8599;</span></button>\n      <button class=\"navitem owner-only\" type=\"button\" data-tab=\"rewards\" hidden><span class=\"navglyph\">&#10023;</span>Rewards <span class=\"nav-arrow\">&#8599;</span></button>\n      <button class=\"navitem\" type=\"button\" data-tab=\"moderation\"><span class=\"navglyph\">&#10070;</span>Moderation <span class=\"nav-arrow\">&#8599;</span></button>\n    </nav>\n    <div class=\"rail-line\"></div><div class=\"rail-label\">DIRECT CONTROLS</div>\n    <a class=\"side-link\" href=\"/staff/command\">IREN Command (legacy) <span>&#8599;</span></a>\n    <a class=\"side-link\" href=\"/staff/projects\">Project reviews <span>&#8599;</span></a>\n    <a class=\"side-link\" href=\"https://dash.cloudflare.com/\" rel=\"noopener noreferrer\" target=\"_blank\">Cloudflare analytics <span>&#8599;</span></a>\n    <div class=\"rail-spacer\"></div>\n    <div class=\"rail-foot\"><span class=\"pulse-dot\"></span><span>IREN / VERIFIED STAFF</span></div>\n    <div class=\"rail-foot-sub\">BUILD 2026.10.19 / 001</div>\n  </aside>\n  <div class=\"content-shell\"><header class=\"top\"><div class=\"top-left\"><div class=\"mobile-brand\">IREN / OBSERVATORY</div><div class=\"crumb\">SYSTEM / STAFF OPERATIONS / <strong>OBSERVATORY</strong></div><div class=\"version\">ANEVUM ENGAGEMENT INTELLIGENCE</div></div><div class=\"top-actions\"><span class=\"badge\" id=\"role\">VERIFYING</span><span class=\"last-sync\" id=\"lastSync\">Connecting...</span><button id=\"refresh\" class=\"button\" type=\"button\">Refresh <span aria-hidden=\"true\">&#8635;</span></button></div></header>\n  <nav class=\"mobile-nav\" aria-label=\"Mobile workspaces\"><button class=\"mobile-tab active\" data-tab=\"overview\">Overview</button><button class=\"mobile-tab owner-only\" data-tab=\"members\" hidden>Members</button><button class=\"mobile-tab owner-only\" data-tab=\"rewards\" hidden>Rewards</button><button class=\"mobile-tab\" data-tab=\"moderation\">Moderation</button></nav>\n  <main class=\"main\" id=\"main\"><div class=\"alert\" id=\"alert\" role=\"alert\" hidden></div>\n    <section class=\"workspace active\" id=\"overview\" aria-labelledby=\"overview-title\"><div class=\"page-title\"><div><div class=\"overline\"><span class=\"gold-dot\"></span> LIVE OPERATIONS / 01</div><h1 id=\"overview-title\">Engagement <em>observatory.</em></h1><p>Registered members, platform participation, moderation demand, and XP test activity - from the active ANEVUM member database.</p></div><div class=\"data-state\"><span class=\"pulse-dot\"></span> DATABASE VERIFIED</div></div>\n      <div class=\"metrics\" id=\"metrics\"><div class=\"skeleton\">Connecting to IREN...</div></div>\n      <div class=\"two-col\"><article class=\"panel\"><div class=\"panel-head\"><div><div class=\"panel-overline\">BEHAVIOR / 7 DAYS</div><h2>Registration signal</h2></div><span class=\"quiet\">Verified account timeline</span></div><div class=\"chart\" id=\"signups\" aria-label=\"Registrations by day\"></div><div class=\"panel-rule\"></div><div class=\"panel-head\"><h2>Recorded community actions</h2><span class=\"quiet\">Not passive page visits</span></div><div class=\"signal-grid\" id=\"interactions\"></div></article><article class=\"panel\"><div class=\"panel-head\"><div><div class=\"panel-overline\">QUALITY / DIAGNOSTICS</div><h2>What these numbers mean</h2></div></div><p>XP button activity is test instrumentation. It is displayed separately and is not counted as organic participation.</p><div class=\"signal-stack\" id=\"xpSignal\"></div><div class=\"panel-rule\"></div><div class=\"panel-overline\">VISITOR TELEMETRY</div><div class=\"missing\"><span class=\"missing-icon\">&#9673;</span><div><strong>Unique visitors not yet connected</strong><p>Cloudflare Web Analytics is enabled, but no reliable browser visitor count is available inside this staff view. HTTP requests are not people.</p><a class=\"text-link\" target=\"_blank\" rel=\"noopener noreferrer\" href=\"https://dash.cloudflare.com/\">Inspect Cloudflare analytics &#8599;</a></div></div></article></div>\n    </section>\n    <section class=\"workspace\" id=\"members\" aria-labelledby=\"members-title\"><div class=\"page-title\"><div><div class=\"overline\"><span class=\"gold-dot\"></span> OWNER CLEARANCE / 02</div><h1 id=\"members-title\">Member <em>directory.</em></h1><p>Identify testers, inspect profile status, manage auras, and grant or revoke moderator access.</p></div><input id=\"memberSearch\" type=\"search\" class=\"search\" placeholder=\"Find name, handle, email...\" aria-label=\"Search members\"></div><div class=\"table-wrapper\"><table><thead><tr><th>Member</th><th>Registration</th><th>Known sessions</th><th>Test XP</th><th>Recognition / aura</th><th>Staff clearance</th></tr></thead><tbody id=\"memberRows\"><tr><td colspan=\"6\">Loading records...</td></tr></tbody></table></div><div class=\"member-pager\"><span id=\"memberPagerStatus\" aria-live=\"polite\">Loading member directory...</span><div class=\"pager-controls\"><button id=\"memberPrevious\" class=\"button\" type=\"button\" disabled>Previous</button><button id=\"memberNext\" class=\"button\" type=\"button\" disabled>Next</button></div></div><div class=\"hint\">Session update timestamps are authentication records, not dependable last-active times. Aura changes are version-checked and audited. Member deletion and XP resets are intentionally unavailable.</div><article class=\"panel audit-panel\"><div class=\"panel-head\"><div><div class=\"panel-overline\">CONTROLLED CHANGES</div><h2>Staff management audit</h2></div><span class=\"quiet\">Newest first</span></div><div id=\"auditLog\" class=\"signal-stack\"></div></article></section>\n    <section class=\"workspace\" id=\"rewards\" aria-labelledby=\"rewards-title\"><div class=\"page-title\"><div><div class=\"overline\"><span class=\"gold-dot\"></span> OWNER CLEARANCE / 03</div><h1 id=\"rewards-title\">Recognition <em>inventory.</em></h1><p>Inspect awarded badges, ribbons, medals, and cosmetic auras. Change auras from the member directory; award administration remains separate until catalog validation.</p></div></div><div class=\"two-col\"><article class=\"panel\"><div class=\"panel-head\"><h2>Awarded recognition</h2><span class=\"quiet\">Actual grants only</span></div><div class=\"signal-stack\" id=\"rewardList\"></div></article><article class=\"panel\"><div class=\"panel-head\"><h2>Aura distribution</h2><span class=\"quiet\">Saved member preferences</span></div><div class=\"signal-stack\" id=\"auraList\"></div><div class=\"hint\">Aura types reflect the current D1 schema. Founder/moderator overlays are not silently granted by changing this field.</div></article></div></section>\n    <section class=\"workspace\" id=\"moderation\" aria-labelledby=\"moderation-title\"><div class=\"page-title\"><div><div class=\"overline\"><span class=\"gold-dot\"></span> TRUST AND SAFETY / 04</div><h1 id=\"moderation-title\">Moderation <em>command.</em></h1><p>Review load, unresolved community reports, and direct links to existing approval tools.</p></div></div><div class=\"metrics metric-four\" id=\"modMetrics\"></div><div class=\"two-col\"><article class=\"panel\"><div class=\"panel-head\"><h2>Available actions</h2></div><p>Existing review and operations controls remain authoritative; this workspace brings their status into one place.</p><div class=\"action-links\"><a class=\"button primary\" href=\"/staff/projects\">Project reviews &#8599;</a><a class=\"button\" href=\"/staff/command\">IREN Command (legacy) &#8599;</a></div></article><article class=\"panel\"><div class=\"panel-head\"><h2>Permission boundaries</h2></div><p>Moderators see aggregate engagement and review queues. Only the owner can inspect member emails, view individual XP tests, edit auras, or modify staff clearance.</p><div class=\"hint\">No private message surveillance, uncontrolled XP awards, or bulk account deletion is provided.</div></article></div></section>\n  </main><footer class=\"foot\"><span>IREN / CONTINUANCE INSTITUTE</span><span>PROTECTED OPERATIONS - NO PUBLIC INDEXING</span></footer></div>\n</div></body></html>";
const STYLES = "\n:root{color-scheme:dark;--base:#070f1b;--raised:#111f30;--panel:#0d1c2c;--panel2:#14283d;--line:#283f55;--line2:#354c63;--text:#eef2f7;--muted:#97a9bd;--gold:#d4b785;--cyan:#9dc0db;--green:#9ecbb4}\n*{box-sizing:border-box}html,body{width:100%;height:100%;margin:0}body{background:var(--base);color:var(--text);font:14px/1.47 system-ui,-apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif}button,input{font:inherit}button{cursor:pointer}a{color:inherit;text-decoration:none}button:focus-visible,a:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid var(--gold);outline-offset:2px}[hidden]{display:none!important}\n.frame{height:100dvh;display:grid;grid-template-columns:244px minmax(0,1fr);overflow:hidden;background:radial-gradient(ellipse at 88% -25%,#1c3c5a66 0,transparent 57%),radial-gradient(ellipse at 12% 125%,#2637493b,transparent 45%),var(--base)}\n.frame:before{content:\"\";position:fixed;inset:0;pointer-events:none;opacity:.5;background-image:radial-gradient(#ffffff55 .5px,transparent .8px);background-size:39px 43px;mask-image:linear-gradient(to right,transparent,black)}\n.rail{z-index:1;display:flex;flex-direction:column;gap:0;border-right:1px solid #324259;background:linear-gradient(140deg,#101d2ee8,#091421fa);padding:26px 16px 18px;min-width:0}.brand{display:flex;align-items:center;gap:11px;margin-bottom:32px}.brand-mark{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;border:1px solid #a48b65;color:#edd4aa;background:radial-gradient(circle,#b7ab7f22,transparent 74%);font-size:28px;box-shadow:0 0 35px #b7ab7f17,inset 0 0 19px #d4b78520}.brand-kicker{font-size:9px;letter-spacing:.18em;color:var(--gold);font-weight:750}.brand-name{font:normal 16px Georgia,serif;letter-spacing:.065em}.brand-sub{font-size:8px;letter-spacing:.13em;color:var(--muted)}.rail-line,.panel-rule{border:0;border-top:1px solid #ffffff17;width:100%;margin:9px 0 18px}.rail-label{color:#7c90a7;font-size:9px;letter-spacing:.21em;margin:1px 10px 14px;font-weight:650}.navigation{display:flex;flex-direction:column;gap:5px;margin-bottom:17px}.navitem{width:100%;display:flex;align-items:center;text-align:left;gap:12px;background:transparent;border:1px solid transparent;border-radius:8px;color:#adbdce;padding:12px 10px;font-size:12px;letter-spacing:.02em}.navglyph{font-size:17px;color:#8ca3bc;width:24px;text-align:center}.nav-arrow{margin-left:auto;opacity:.4}.navitem.active{background:linear-gradient(100deg,#34455793,#202f4280);border-color:#7d6d5485;color:#ffefcf}.navitem.active .navglyph{color:var(--gold)}.navitem:hover{background:#26394b84;color:#fff}.side-link{color:#a5b7c9;font-size:11px;display:flex;justify-content:space-between;align-items:center;padding:12px 11px;border-bottom:1px solid #ffffff0c}.side-link span{color:var(--gold)}.side-link:hover{color:#fff}.rail-spacer{flex:1}.rail-foot{display:flex;align-items:center;gap:8px;font-size:10px;letter-spacing:.1em;color:#b5c6d6}.pulse-dot,.gold-dot{width:7px;height:7px;background:#8bcbb1;border-radius:50%;display:inline-block;box-shadow:0 0 12px #86c6ae91;flex:none}.gold-dot{background:#d8ba81;box-shadow:0 0 9px #d8ba818c}.rail-foot-sub{color:#7b92ab;margin:8px 0 0 15px;font-size:9px;letter-spacing:.1em}\n.content-shell{display:flex;flex-direction:column;min-width:0;min-height:0;position:relative}.top{display:flex;gap:12px;align-items:center;justify-content:space-between;min-height:85px;border-bottom:1px solid #ffffff1b;padding:13px clamp(18px,2.3vw,37px);background:#0b18259c;backdrop-filter:blur(18px)}.crumb{font-size:10px;letter-spacing:.16em;color:#8fa5ba}.crumb strong{color:var(--gold);font-weight:550}.version{font-size:11px;color:#d3e1eb;margin-top:7px;letter-spacing:.11em}.top-actions{display:flex;gap:12px;align-items:center}.badge{border-radius:999px;padding:6px 11px;background:#d5bc8520;border:1px solid #a68c6180;color:#f5ddb1;font-size:9px;letter-spacing:.11em}.last-sync{color:#92aabc;font-size:11px}.button{display:inline-flex;align-items:center;justify-content:center;gap:10px;padding:9px 13px;border:1px solid #496075;border-radius:8px;background:#13293c;color:#e2ebf4;white-space:nowrap;font-size:12px;min-height:37px}.button:hover{background:#20374d;border-color:#c4ab85}.button:disabled{opacity:.5;cursor:default}.button.primary{background:linear-gradient(115deg,#4c453b,#213448);border-color:#baa175;color:#ffebc9}.mobile-nav,.mobile-brand{display:none}.main{flex:1;min-height:0;overflow:auto;overscroll-behavior:contain;padding:clamp(18px,2.4vw,35px) clamp(18px,2.3vw,37px) 30px;scrollbar-color:#425d78 transparent;scrollbar-width:thin}.workspace{display:none;animation:enter .19s ease-out}.workspace.active{display:block}@keyframes enter{from{opacity:.6;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}.foot{display:flex;justify-content:space-between;gap:10px;color:#8093a9;padding:11px clamp(18px,2.3vw,37px);border-top:1px solid #ffffff18;font-size:9px;letter-spacing:.12em;background:#0a1420a6}\n.page-title{display:flex;align-items:end;justify-content:space-between;gap:20px;margin:0 0 22px}.page-title h1{font:normal clamp(28px,3.2vw,48px)/1.1 Georgia,\"Times New Roman\",serif;letter-spacing:-.025em;margin:9px 0 8px}.page-title h1 em{font-style:italic;color:#d5bd95}.page-title p{max-width:720px;color:#a8b9c9;line-height:1.55;margin:0;font-size:12px}.overline,.panel-overline{font-size:10px;letter-spacing:.19em;color:var(--gold);font-weight:600;display:flex;align-items:center;gap:9px}.data-state{font-size:10px;letter-spacing:.09em;color:#abd6c2;display:flex;align-items:center;gap:8px;white-space:nowrap;padding-bottom:5px}.metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.metric{min-height:124px;padding:17px 16px;border-radius:12px;border:1px solid #30465d;background:linear-gradient(145deg,#192c40e0,#0c1b2aee);position:relative;overflow:hidden}.metric:before{content:\"\";height:1px;position:absolute;top:0;left:15%;right:15%;background:linear-gradient(90deg,transparent,#d5b47b80,transparent)}.metric-label{font-size:10px;color:#9aaec1;letter-spacing:.09em;text-transform:uppercase}.metric-value{font-size:clamp(26px,2.55vw,40px);font-weight:300;font-variant-numeric:tabular-nums;line-height:1.5;color:#f4f6fa}.metric-explain{font-size:10px;color:#8fa7ba}.skeleton{color:var(--muted);padding:20px}\n.two-col{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(320px,.85fr);gap:12px;margin-top:12px}.panel{background:linear-gradient(150deg,#112337e0,#091827e8);border:1px solid #30465e;border-radius:12px;padding:18px;min-width:0}.panel-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:13px}.panel h2{font:normal 20px/1.25 Georgia,serif;margin:4px 0}.panel p{color:#a3b5c6;font-size:12px;line-height:1.65}.quiet{font-size:10px;color:#839bb1}.panel-rule{margin:21px 0 17px}.chart{min-height:133px;height:133px;display:flex;align-items:end;gap:6px;border-bottom:1px solid #51677a4d;padding-top:18px;position:relative;background:repeating-linear-gradient(to top,transparent 0,transparent 37px,#ffffff09 38px)}.chart-day{flex:1;min-width:0;display:flex;align-items:center;justify-content:end;flex-direction:column;height:100%}.chart-column{width:75%;min-height:3px;border:1px solid #c6ac8070;border-bottom:0;border-radius:4px 4px 0 0;background:linear-gradient(#c9b187,#416888);position:relative}.chart-label{font-size:10px;color:#9dafc0;text-align:center;margin:5px 0 -19px}.signal-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.signal-card{display:flex;justify-content:space-between;align-items:center;gap:8px;border:1px solid #ffffff1b;background:#ffffff04;border-radius:8px;padding:12px 11px}.signal-card .key{font-size:11px;color:#9db0c4}.signal-card .val{font-size:21px;font-weight:350;color:#e8f1f8;font-variant-numeric:tabular-nums}.signal-stack{display:flex;flex-direction:column;gap:0}.signal-row{display:flex;justify-content:space-between;align-items:center;gap:8px;border-bottom:1px solid #ffffff1c;padding:12px 1px}.signal-row span:first-child{font-size:12px;color:#b3c4d4}.signal-row strong{font-size:17px;font-weight:400;font-variant-numeric:tabular-nums}.signal-row small{font-size:10px;color:#859fb5;display:block;margin-top:2px}.missing{display:flex;gap:13px;padding:15px;border:1px solid #6b634a;background:#977e4020;border-radius:9px;margin-top:10px}.missing-icon{color:var(--gold);font-size:27px}.missing strong{font-size:12px;color:#f5ddad}.missing p{font-size:11px;margin:5px 0}.text-link{font-size:11px;color:#d8c39d;text-decoration:underline;text-underline-offset:3px}.text-link:hover{color:#fff}.alert{background:#3b2420;border:1px solid #ad7465;color:#ffe5d1;border-radius:9px;padding:10px 13px;margin-bottom:13px;font-size:12px}\n.search{background:#112439;border:1px solid #4f6379;color:#f1f5fa;border-radius:8px;padding:11px;min-width:260px}.search::placeholder{color:#8599af}.table-wrapper{border:1px solid #334b61;border-radius:12px;overflow:auto;background:#0b1a2ae0;scrollbar-width:thin}table{width:100%;border-collapse:collapse;min-width:1000px}td,th{text-align:left;border-bottom:1px solid #22384d;padding:13px 12px;vertical-align:middle;font-size:12px}th{font-size:10px;letter-spacing:.1em;color:#c2a57a;text-transform:uppercase;background:#182b3d;white-space:nowrap}td{color:#d5e2ed}td strong{font-weight:550}td small{display:block;color:#94a9bb;font-size:10px;margin-top:4px;max-width:300px;overflow-wrap:anywhere}tbody tr:hover{background:#172b3b80}.tag{display:block;color:#d1b98f;text-transform:uppercase;font-size:10px;letter-spacing:.08em;margin-bottom:8px}.tiny-action{border:1px solid #536a80;background:#172d43;color:#e2edf6;border-radius:6px;padding:7px 8px;font-size:10px;white-space:nowrap;cursor:pointer}.tiny-action:hover{border-color:var(--gold)}.tiny-action.danger{border-color:#8a685b;color:#f4cab3}.tiny-action:disabled{opacity:.5}.action-cell{display:flex;gap:6px;align-items:center;flex-wrap:wrap}.aura-select{background:#152c40;border:1px solid #4c647a;color:#e7f1f9;border-radius:6px;padding:7px;font-size:11px;width:116px}.hint{margin-top:13px;font-size:11px;color:#8fa3b6;line-height:1.5}.audit-panel{margin-top:13px}.action-links{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}.metric-four{margin-bottom:13px}.empty{color:#94a9bd;text-align:center;padding:23px;font-size:12px}.mini-gold{color:var(--gold);font-size:11px}.mobile-brand{font-size:12px;letter-spacing:.18em;color:var(--gold)}\n@media(max-width:1250px){.frame{grid-template-columns:211px minmax(0,1fr)}.two-col{grid-template-columns:1fr}.metrics{grid-template-columns:repeat(4,minmax(0,1fr))}}@media(max-width:970px){.frame{grid-template-columns:178px minmax(0,1fr)}.rail{padding:20px 10px}.brand-name{font-size:13px}.brand-sub{font-size:7px}.brand-mark{width:32px;height:32px;font-size:20px}.metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.metric{min-height:103px;padding:12px}.last-sync{display:none}.rail-label{font-size:8px}}@media(max-width:720px){.frame{display:flex;flex-direction:column}.rail{display:none}.mobile-brand{display:block}.crumb,.version{display:none}.top{padding:12px 13px;min-height:62px}.badge{padding:5px 7px}.button{min-height:34px;padding:7px 9px}.mobile-nav{display:flex;gap:0;background:#0f1e2f;border-bottom:1px solid #3b5066;padding:0 10px}.mobile-tab{flex:1;min-width:0;padding:11px 3px;border:0;border-bottom:2px solid transparent;background:transparent;color:#9bafc2;font-size:11px}.mobile-tab.active{border-bottom-color:var(--gold);color:#f3d9aa}.main{padding:18px 12px 24px}.page-title{flex-direction:column;align-items:start;gap:10px;margin-bottom:18px}.page-title h1{font-size:32px}.page-title p{font-size:11px}.data-state{font-size:9px}.metrics{gap:7px}.metric{padding:11px;min-height:102px}.metric-value{font-size:29px}.metric-label,.metric-explain{font-size:9px}.panel{padding:14px}.panel h2{font-size:19px}.two-col{gap:8px;margin-top:8px}.signal-grid{gap:7px}.signal-card{padding:10px}.signal-card .val{font-size:17px}.search{min-width:0;width:100%}.foot{font-size:8px;padding:10px 12px}.foot span:last-child{display:none}}@media(max-width:720px){.table-wrapper{background:transparent;border:0;border-radius:0;overflow:visible}table{min-width:0;display:block}thead{display:none}tbody{display:grid;gap:10px}tbody tr{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);padding:11px;gap:6px 8px;border:1px solid #354d64;background:#0e2032;border-radius:10px}tbody td{display:block;border:0;padding:5px 3px;min-width:0;font-size:11px}tbody td:first-child{grid-column:1 / -1;padding-bottom:11px;border-bottom:1px solid #ffffff1a;font-size:13px}tbody td:first-child small{font-size:11px}tbody td:nth-child(2):before{content:\"REGISTERED\"}tbody td:nth-child(3):before{content:\"AUTH SESSION\"}tbody td:nth-child(4):before{content:\"XP TEST\"}tbody td:nth-child(5):before{content:\"RECOGNITION AND AURA\"}tbody td:nth-child(6):before{content:\"STAFF ACCESS\"}tbody td:nth-child(n+2):before{display:block;color:#c6a97b;font-size:9px;letter-spacing:.1em;margin-bottom:5px}tbody td:nth-child(5),tbody td:nth-child(6){grid-column:1 / -1;border-top:1px solid #ffffff12;padding-top:10px}.aura-select{width:148px}.tiny-action{padding:9px 12px}}\n.member-pager{display:flex;gap:12px;justify-content:space-between;align-items:center;color:var(--muted);font-size:11px;margin-top:10px}.pager-controls{display:flex;gap:7px}.member-pager .button{padding:7px 10px;min-height:34px}\n@media(max-width:720px){.member-pager{align-items:flex-start;gap:10px}.pager-controls{flex:0 0 auto}.member-pager .button{padding:6px 8px;font-size:11px}}\n@media(prefers-reduced-motion:reduce){.workspace.active{animation:none}}\n";
const CLIENT = "(() => {\n'use strict';\nconst PREFIX = '/staff/observatory/api/';\nconst state = { role:'reviewer', tab:'overview', members:[], refreshing:false, memberPage:0, memberTotal:0, memberPageSize:50, memberQuery:'', memberReq:0 };\nconst byId = id => document.getElementById(id);\nconst esc = v => String(v == null ? '' : v).replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',\"'\":'&#39;'}[c]));\nconst number = v => Number(v || 0).toLocaleString('en-US');\nfunction localDate(s, withTime=false) {\n if (!s) return '-';\n const value = typeof s==='number'||/^\\d+$/.test(String(s)) ? Number(s)*1000 : s;\n const dt = new Date(value);\n if (!Number.isFinite(dt.getTime())) return '-';\n const opts = withTime ? {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'} : {month:'short',day:'numeric',year:'numeric'};\n return dt.toLocaleString('en-US',opts);\n}\nfunction notify(message) { const box=byId('alert');box.textContent=message||'';box.hidden=!message; }\nasync function read(path) {\n const result=await fetch(PREFIX+path,{method:'GET',headers:{accept:'application/json'},credentials:'same-origin',cache:'no-store'});\n const data=await result.json().catch(()=>({error:'The server returned an unexpected response'}));\n if (!result.ok) throw new Error(data.error||'Observatory request failed');\n return data;\n}\nfunction card(label,value,explanation) {\n return '<article class=\"metric\"><div class=\"metric-label\">'+esc(label)+'</div><div class=\"metric-value\">'+esc(number(value))+'</div><div class=\"metric-explain\">'+esc(explanation)+'</div></article>';\n}\nfunction signal(label,value) {return '<div class=\"signal-row\"><span>'+esc(label)+'</span><strong>'+esc(number(value))+'</strong></div>';}\nfunction renderOverview(data) {\n state.role=data.role==='owner'?'owner':'reviewer';\n byId('role').textContent=state.role==='owner'?'OWNER CLEARANCE':'MODERATOR';\n document.querySelectorAll('.owner-only').forEach(node=>node.hidden=state.role!=='owner');\n if (state.role!=='owner' && ['members','rewards'].includes(state.tab)) selectTab('overview');\n byId('lastSync').textContent='Synced '+localDate(data.checkedAt,true);\n const c=data.counts||{};\n const main=[\n  ['Registered members',c.members,'Saved platform accounts'],['Verified accounts',c.verified,'Confirmed email addresses'],\n  ['New registrations / 7d',c.new7d,'Actual member signups'],['Members with sessions',c.sessionMembers,'Known auth sessions, not visits'],\n  ['XP test participants',c.xpTesters,'Distinct accounts'],['XP test events',c.xpEvents,'Synthetic button activity'],\n  ['Published projects',c.publishedProjects,'Approved alpha submissions'],['Open moderation items',c.pendingTotal,'Unresolved queue signals']\n ];\n byId('metrics').innerHTML=main.map(item=>card(...item)).join('');\n const points=data.signups||[]; const max=Math.max(1,...points.map(x=>Number(x.n)||0));\n byId('signups').innerHTML=points.length ? points.map(x=>'<div class=\"chart-day\" title=\"'+esc(number(x.n))+' registrations\"><div class=\"chart-column\" data-height=\"'+Math.max(2,Math.round(Number(x.n||0)/max*100))+'\"></div><span class=\"chart-label\">'+esc(String(x.day||'').slice(5))+'</span></div>').join('') : '<div class=\"empty\">No new registrations in this period</div>';\n byId('signups').querySelectorAll('.chart-column').forEach(bar=>{ bar.style.height=bar.dataset.height+'%'; });\n const social=[['Forum threads',c.threads],['Forum replies',c.replies],['Member wall posts',c.wallPosts],['Project votes',c.projectVotes],['Project comments',c.projectComments],['Project saves',c.projectSaves],['Earned recognition',c.recognitions],['Published projects',c.publishedProjects]];\n byId('interactions').innerHTML=social.map(x=>'<div class=\"signal-card\"><span class=\"key\">'+esc(x[0])+'</span><span class=\"val\">'+esc(number(x[1]))+'</span></div>').join('');\n byId('xpSignal').innerHTML=signal('Test accounts',c.xpTesters)+signal('Recorded presses',c.xpEvents);\n byId('modMetrics').innerHTML=[\n   ['Pending projects',c.pendingProjects,'Awaiting approval'],['Pending forum items',c.pendingForum,'Threads and replies'],\n   ['Project reports',c.projectReports,'Unresolved reports'],['Forum reports',c.forumReports,'Unresolved reports']\n ].map(x=>card(...x)).join('');\n}\nfunction selectTab(name) {\n if (!['overview','members','rewards','moderation'].includes(name)) return;\n if (state.role!=='owner' && ['members','rewards'].includes(name)) return;\n state.tab=name;\n document.querySelectorAll('.workspace').forEach(node=>node.classList.toggle('active',node.id===name));\n document.querySelectorAll('[data-tab]').forEach(node=>{\n  const active=node.dataset.tab===name;\n  node.classList.toggle('active',active);\n  if (node.classList.contains('navitem')) {if (active)node.setAttribute('aria-current','page');else node.removeAttribute('aria-current');}\n });\n byId('main').scrollTop=0;\n}\nconst roles = ['none','aurora','eclipse','ember','nebula','transcosmic'];\nfunction renderMembers() {\n if (state.role!=='owner') return;\n const members=state.members;\n byId('memberRows').innerHTML=members.length ? members.map(m=>{\n  const role=m.role||'member';\n  const action=role==='owner'?'<span class=\"mini-gold\">Protected owner</span>':\n    role==='reviewer'?'<button class=\"tiny-action danger\" type=\"button\" data-action=\"revoke\" data-member=\"'+esc(m.id)+'\">Revoke moderator</button>':\n    '<button class=\"tiny-action\" type=\"button\" data-action=\"grant\" data-member=\"'+esc(m.id)+'\">Grant moderator</button>';\n  const options=roles.map(a=>'<option value=\"'+a+'\"'+(m.aura===a?' selected':'')+'>'+a+'</option>').join('');\n  return '<tr><td><strong>'+esc(m.displayName||m.name||'Member')+'</strong><small>'+(m.handle?'@'+esc(m.handle)+' / ':'')+esc(m.email||'')+'</small></td>'+ \n  '<td>'+esc(localDate(m.createdAt))+'</td><td>'+esc(localDate(m.lastSessionUpdate,true))+'<small>'+esc(number(m.sessionCount))+' saved session records</small></td>'+ \n  '<td><strong>'+esc(number(m.testXp))+'</strong><small>'+esc(number(m.testEvents))+' button events</small></td>'+ \n  '<td><small>'+esc(m.recognitions||'No recorded grants')+'</small><div class=\"action-cell\"><select class=\"aura-select\" data-aura-member=\"'+esc(m.id)+'\" aria-label=\"Aura for '+esc(m.displayName||m.name||'member')+'\">'+options+'</select><button class=\"tiny-action\" type=\"button\" data-action=\"aura\" data-member=\"'+esc(m.id)+'\">Save aura</button></div></td>'+ \n  '<td><span class=\"tag\">'+esc(role)+'</span>'+action+'</td></tr>';\n }).join('') : '<tr><td class=\"empty\" colspan=\"6\">No matching members</td></tr>';\n const begin=state.memberPage*state.memberPageSize;\n byId('memberPagerStatus').textContent=state.memberTotal>0 ?\n  'Showing '+number(begin+1)+'–'+number(begin+members.length)+' of '+number(state.memberTotal)+' matching members' : 'No matching members';\n byId('memberPrevious').disabled=state.memberPage<=0;\n byId('memberNext').disabled=begin+members.length>=state.memberTotal;\n}\nasync function loadMembers() {\n if(state.role!=='owner')return;\n const req=++state.memberReq;\n const path='members?page='+encodeURIComponent(state.memberPage)+'&q='+encodeURIComponent(state.memberQuery);\n const data=await read(path);\n if(req!==state.memberReq)return;\n state.members=data.members||[];\n state.memberPage=data.page||0;\n state.memberTotal=data.total||0;\n state.memberPageSize=data.pageSize||50;\n renderMembers();\n}\nfunction renderRewards(data) {\n const awards=data.awards||[];const auras=data.auras||[];\n byId('rewardList').innerHTML=awards.length?awards.map(x=>'<div class=\"signal-row\"><span>'+esc(x.kind)+' / <span class=\"mini-gold\">'+esc(x.id)+'</span></span><strong>'+esc(number(x.earned))+'</strong></div>').join(''):'<div class=\"empty\">No granted awards</div>';\n byId('auraList').innerHTML=auras.length?auras.map(x=>signal(x.aura,x.members)).join(''):'<div class=\"empty\">No saved aura preferences</div>';\n}\nfunction renderAudit(data) {\n const items=data.entries||[];\n byId('auditLog').innerHTML=items.length?items.map(x=>'<div class=\"signal-row\"><span>'+esc(x.action)+' <span class=\"mini-gold\">'+esc(x.target)+'</span><small>'+esc(localDate(x.createdAt,true))+'</small></span><span>'+esc(x.actor)+'</span></div>').join(''):'<div class=\"empty\">No staff role or aura changes recorded</div>';\n}\nasync function refresh() {\n if(state.refreshing)return;state.refreshing=true;notify('');\n const btn=byId('refresh');btn.disabled=true;btn.textContent='Syncing...';\n try {\n  const data=await read('overview');renderOverview(data);\n  if(state.role==='owner') {\n   const result=await Promise.allSettled([loadMembers(),read('rewards'),read('audit')]);\n   if(result[1].status==='fulfilled')renderRewards(result[1].value);\n   if(result[2].status==='fulfilled')renderAudit(result[2].value);\n   const failed=result.filter(r=>r.status==='rejected');\n   if(failed.length)notify('Some owner tools are unavailable. Check the management audit migration and current staff permissions.');\n  }\n }catch(e){notify(e.message||'Failed to load live observatory data');}\n finally{state.refreshing=false;btn.disabled=false;btn.innerHTML='Refresh <span aria-hidden=\"true\">&#8635;</span>';}\n}\nasync function sendAction(kind,id) {\n if(state.role!=='owner')return;\n const m=state.members.find(x=>x.id===id);if(!m)return;\n let payload,url,message;\n if(kind==='aura') {\n  const selector=[...document.querySelectorAll('select[data-aura-member]')].find(node=>node.dataset.auraMember===id);\n  if(!selector)return;\n  const aura=selector.value;\n  if(aura===m.aura){notify('That aura is already assigned.');return;}\n  message='Assign the '+aura+' aura to '+(m.displayName||m.name)+'?';\n  url=PREFIX+'aura'; payload={memberId:id,aura,revision:m.auraRevision};\n } else {\n  message=(kind==='grant'?'Grant moderator access to ':'Revoke moderator access from ')+(m.displayName||m.name)+'?';\n  url='/api/v1/member/staff-ops'; payload={kind:kind==='grant'?'staff-grant':'staff-revoke',memberId:id};\n }\n if(!window.confirm(message))return;\n notify('');\n try {\n  const result=await fetch(url,{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'content-type':'application/json','accept':'application/json'},body:JSON.stringify(payload)});\n  const body=await result.json().catch(()=>({}));\n  if(!result.ok)throw new Error(body.error||'Change refused by server');\n  await refresh();\n  notify('Updated '+(m.displayName||m.name)+'.');\n }catch(e){notify(e.message||'Change not applied');}\n}\ndocument.querySelectorAll('[data-tab]').forEach(el=>el.addEventListener('click',()=>selectTab(el.dataset.tab)));\nbyId('refresh').addEventListener('click',refresh);\nlet searchTimer;\nbyId('memberSearch').addEventListener('input',event=>{\n state.memberQuery=event.target.value.trim();state.memberPage=0;\n byId('memberPagerStatus').textContent='Searching members...';\n clearTimeout(searchTimer);\n searchTimer=setTimeout(()=>loadMembers().catch(e=>notify(e.message||'Member search unavailable')),250);\n});\nbyId('memberPrevious').addEventListener('click',()=>{\n if(state.memberPage<=0)return;state.memberPage--;\n loadMembers().catch(e=>notify(e.message||'Member page unavailable'));\n});\nbyId('memberNext').addEventListener('click',()=>{\n if((state.memberPage+1)*state.memberPageSize>=state.memberTotal)return;\n state.memberPage++;\n loadMembers().catch(e=>notify(e.message||'Member page unavailable'));\n});\ndocument.addEventListener('click',event=>{\n const action=event.target.closest('button[data-action]');\n if(action)sendAction(action.dataset.action,action.dataset.member);\n});\nrefresh();\n})();";



const ORIGIN = 'https://anevum.com';
const BASE = '/staff/observatory';
const AURAS = new Set(['none', 'aurora', 'eclipse', 'ember', 'nebula', 'transcosmic']);
const HEADERS = Object.freeze({
  'cache-control': 'private, no-store',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'x-robots-tag': 'noindex, nofollow, noarchive',
  'referrer-policy': 'no-referrer',
  'vary': 'Cookie',
});
const CSP = [
  "default-src 'none'", "script-src 'self'", "style-src 'self'",
  "connect-src 'self'", "img-src 'self' data:", "font-src 'self'",
  "base-uri 'none'", "frame-ancestors 'none'", "form-action 'none'",
  "object-src 'none'",
].join('; ');

function respond(body, status = 200, contentType = 'application/json; charset=utf-8', isPage = false) {
  const headers = { ...HEADERS, 'content-type': contentType };
  if (isPage) headers['content-security-policy'] = CSP;
  return new Response(body, { status, headers });
}
const json = (value, status = 200) => respond(JSON.stringify(value), status);
const error = (status, message) => json({ error: message }, status);

async function getStaff(request, env) {
  if (!env || !env.APEX_AUTH || !env.MEMBER_DB) return null;
  const cookie = request.headers.get('cookie');
  if (!cookie || cookie.length > 8192) return null;
  try {
    const identity = new Request(`${ORIGIN}/api/v1/member/auth/get-session`, {
      method: 'GET',
      headers: { cookie, accept: 'application/json' },
      redirect:"manual",
      cache: 'no-store',
    });
    const result = await env.APEX_AUTH.fetch(identity);
    if (!result.ok || !result.headers.get('content-type')?.includes('application/json')) return null;
    const { session, user } = await result.json();
    if (!session || !user || typeof user.id !== 'string' || user.id.length < 1 || user.id.length > 128 ||
        typeof session.id !== 'string' || session.id.length === 0 ||
        session.userId !== user.id || user.emailVerified !== true ||
        typeof session.expiresAt !== 'string' || !Number.isFinite(Date.parse(session.expiresAt)) ||
        Date.parse(session.expiresAt) <= Date.now()) return null;
    const grant = await env.MEMBER_DB.prepare(
      'SELECT g.role FROM staff_access_grants g JOIN "user" u ON u.id=g.member_id ' +
      'WHERE g.member_id=? AND g.revoked_at IS NULL AND u.emailVerified=1 LIMIT 1'
    ).bind(user.id).first();
    if (!grant || !['owner', 'reviewer'].includes(grant.role)) return null;
    return { id: user.id, role: grant.role };
  } catch {
    return null;
  }
}

async function overview(db, staff) {
  const [summary, registrations] = await Promise.all([
    db.prepare(`SELECT
      (SELECT COUNT(*) FROM "user") AS members,
      (SELECT COUNT(*) FROM "user" WHERE emailVerified=1) AS verified,
      (SELECT COUNT(*) FROM "user" WHERE julianday(createdAt)>=julianday('now','-7 days')) AS new7d,
      (SELECT COUNT(DISTINCT userId) FROM session) AS sessionMembers,
      (SELECT COUNT(*) FROM member_xp_events) AS xpEvents,
      (SELECT COUNT(DISTINCT user_id) FROM member_xp_events) AS xpTesters,
      (SELECT COUNT(*) FROM member_forum_threads) AS threads,
      (SELECT COUNT(*) FROM member_forum_replies) AS replies,
      (SELECT COUNT(*) FROM member_wall_posts) AS wallPosts,
      (SELECT COUNT(*) FROM anevum_alpha_project_votes) AS projectVotes,
      (SELECT COUNT(*) FROM anevum_alpha_project_comments) AS projectComments,
      (SELECT COUNT(*) FROM anevum_alpha_project_saves) AS projectSaves,
      (SELECT COUNT(*) FROM member_recognition_grants WHERE revoked_at IS NULL) AS recognitions,
      (SELECT COUNT(*) FROM anevum_alpha_projects WHERE status='published') AS publishedProjects,
      (SELECT COUNT(*) FROM anevum_alpha_projects WHERE status='pending_review') AS pendingProjects,
      (SELECT COUNT(*) FROM member_forum_threads WHERE status='pending_review')+
      (SELECT COUNT(*) FROM member_forum_replies WHERE status='pending_review') AS pendingForum,
      (SELECT COUNT(*) FROM anevum_alpha_project_reports WHERE status='pending') AS projectReports,
      (SELECT COUNT(*) FROM member_forum_reports WHERE resolved_at IS NULL) AS forumReports
    `).first(),
    db.prepare(`SELECT substr(createdAt,1,10) AS day, COUNT(*) AS n
      FROM "user" WHERE julianday(createdAt)>=julianday('now','-7 days')
      GROUP BY day ORDER BY day ASC LIMIT 8`).all(),
  ]);
  const counts = summary || {};
  counts.pendingTotal = (counts.pendingProjects || 0) + (counts.pendingForum || 0) +
    (counts.projectReports || 0) + (counts.forumReports || 0);
  return json({
    role: staff.role,
    counts,
    signups: registrations.results || [],
    checkedAt: new Date().toISOString(),
    visitors: { status: 'unavailable', reason: 'Browser visitor analytics not yet connected to IREN' },
  });
}

async function members(db, staff, url) {
  if (staff.role !== 'owner') return error(403, 'Owner clearance required');
  const allowed = new Set(['q', 'page']);
  const params = url.searchParams;
  if ([...params.keys()].some(k => !allowed.has(k) || params.getAll(k).length !== 1))
    return error(400, 'Unrecognized member search filters');
  const q = (params.get('q') || '').trim();
  const pageString = params.get('page') || '0';
  if (q.length > 64 || /[\x00-\x1f\x7f]/.test(q) ||
      !/^(0|[1-9][0-9]{0,3})$/.test(pageString) || Number(pageString) > 1000)
    return error(400, 'Invalid member search');
  const page = Number(pageString);
  const pageSize = 50;
  const from = `FROM "user" u LEFT JOIN member_creator_profiles p ON p.user_id=u.id`;
  const where = q ? `WHERE instr(lower(u.name),lower(?))>0 OR
    instr(lower(u.email),lower(?))>0 OR
    instr(lower(COALESCE(p.display_name,'')),lower(?))>0 OR
    instr(lower(COALESCE(p.handle,'')),lower(?))>0` : '';
  const filter = q ? [q,q,q,q] : [];
  const countQuery = db.prepare(`SELECT COUNT(*) AS total ${from} ${where}`);
  const totalResult = q ? await countQuery.bind(...filter).first() : await countQuery.first();
  const total = Number(totalResult?.total || 0);
  const resolvedPage = Math.min(page,Math.max(0,Math.ceil(total/pageSize)-1));
  const result = await db.prepare(`SELECT u.id,u.name,u.email,u.createdAt,u.emailVerified,
    COALESCE(p.display_name,'') AS displayName,COALESCE(p.handle,'') AS handle,
    COALESCE(g.role,'member') AS role,COALESCE(ap.aura,'none') AS aura,
    COALESCE(ap.revision,0) AS auraRevision,
    (SELECT MAX(s.updatedAt) FROM session s WHERE s.userId=u.id) AS lastSessionUpdate,
    (SELECT COUNT(*) FROM session s WHERE s.userId=u.id) AS sessionCount,
    COALESCE(x.testEvents,0) AS testEvents,COALESCE(x.testXp,0) AS testXp,
    COALESCE((SELECT GROUP_CONCAT(r.recognition_id,', ') FROM member_recognition_grants r
      WHERE r.user_id=u.id AND r.revoked_at IS NULL),'') AS recognitions
    FROM "user" u
    LEFT JOIN member_creator_profiles p ON p.user_id=u.id
    LEFT JOIN staff_access_grants g ON g.member_id=u.id AND g.revoked_at IS NULL
    LEFT JOIN member_recognition_preferences ap ON ap.user_id=u.id
    LEFT JOIN (SELECT user_id, COUNT(*) AS testEvents, SUM(amount) AS testXp
      FROM member_xp_events GROUP BY user_id) x ON x.user_id=u.id
    ${where} ORDER BY u.createdAt DESC, u.id DESC LIMIT ? OFFSET ?`)
    .bind(...filter,pageSize,resolvedPage*pageSize).all();
  return json({ members: result.results || [], total, page:resolvedPage, pageSize,
    hasNext: (page+1)*pageSize < total });
}

async function rewards(db, staff) {
  if (staff.role !== 'owner') return error(403, 'Owner clearance required');
  const [awards, auras] = await Promise.all([
    db.prepare(`SELECT kind, recognition_id AS id, COUNT(*) AS earned
      FROM member_recognition_grants WHERE revoked_at IS NULL
      GROUP BY kind,recognition_id ORDER BY earned DESC,kind,id LIMIT 60`).all(),
    db.prepare(`SELECT aura,COUNT(*) AS members FROM member_recognition_preferences
      GROUP BY aura ORDER BY members DESC,aura`).all(),
  ]);
  return json({ awards: awards.results || [], auras: auras.results || [] });
}

async function audits(db, staff) {
  if (staff.role !== 'owner') return error(403, 'Owner clearance required');
  const result = await db.prepare(`SELECT x.action,x.actor,x.target,x.createdAt FROM (
    SELECT a.action,COALESCE(actor.name,'STAFF') AS actor,
      COALESCE(target.name,'MEMBER') AS target,a.created_at AS createdAt
      FROM staff_access_audit a LEFT JOIN "user" actor ON actor.id=a.actor_id
      LEFT JOIN "user" target ON target.id=a.member_id
    UNION ALL
    SELECT b.action,COALESCE(actor.name,'STAFF'),
      COALESCE(target.name,'MEMBER'),b.created_at
      FROM anevum_staff_management_audit b LEFT JOIN "user" actor ON actor.id=b.actor_id
      LEFT JOIN "user" target ON target.id=b.member_id
  ) x ORDER BY createdAt DESC LIMIT 60`).all();
  return json({ entries: result.results || [] });
}

async function readBoundedBody(request, maxBytes) {
  const reader = request.body?.getReader();
  if (!reader) return '';
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
    const merged = new Uint8Array(total);
    let cursor = 0;
    for (const chunk of chunks) { merged.set(chunk,cursor); cursor += chunk.byteLength; }
    return new TextDecoder('utf-8',{fatal:true}).decode(merged);
  } catch { return null; }
  finally { reader.releaseLock(); }
}

async function changeAura(request, db, staff) {
  if (staff.role !== 'owner') return error(403, 'Owner clearance required');
  if (request.headers.get('origin') !== ORIGIN ||
      ![null, 'same-origin', 'none'].includes(request.headers.get('sec-fetch-site')))
    return error(403, 'Same-origin request required');
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') || ''))
    return error(415, 'JSON required');
  const declaredSize = Number(request.headers.get('content-length') || '0');
  if (!Number.isSafeInteger(declaredSize) || declaredSize < 0 || declaredSize > 1400)
    return error(413, 'Request too large');
  const raw = await readBoundedBody(request, 1200);
  if (raw === null) return error(413, 'Request too large');
  let data;
  try { data = JSON.parse(raw); } catch { return error(400, 'Invalid JSON'); }
  if (!data || typeof data !== 'object' || Array.isArray(data) ||
      Object.keys(data).sort().join(',') !== 'aura,memberId,revision' ||
      typeof data.memberId !== 'string' || !data.memberId || data.memberId.length > 128 ||
      !AURAS.has(data.aura) || !Number.isInteger(data.revision) ||
      data.revision < 0 || data.revision > 100000)
    return error(400, 'Invalid aura change');

  const recent = await db.prepare(`SELECT COUNT(*) AS n FROM anevum_staff_management_audit
    WHERE actor_id=? AND created_at>=unixepoch('now')-3600`).bind(staff.id).first();
  if (Number(recent?.n || 0) >= 20) return error(429, 'Hourly management limit reached');
  const previous = await db.prepare(`SELECT u.id,COALESCE(p.aura,'none') AS aura,
    COALESCE(p.revision,0) AS revision,
    CASE WHEN p.user_id IS NULL THEN 0 ELSE 1 END AS hasPreferences
    FROM "user" u LEFT JOIN member_recognition_preferences p ON p.user_id=u.id
    WHERE u.id=?`).bind(data.memberId).first();
  if (!previous) return error(404, 'Unknown member');
  if (Number(previous.revision) !== data.revision) return error(409, 'Member changed. Refresh first');
  if (previous.aura === data.aura) return json({ ok: true, unchanged: true });

  const now = Math.floor(Date.now() / 1000);
  const change = previous.hasPreferences
    ? db.prepare(`UPDATE member_recognition_preferences SET aura=?,revision=revision+1
       WHERE user_id=? AND revision=? AND aura<>?`)
       .bind(data.aura,data.memberId,data.revision,data.aura)
    : db.prepare(`INSERT INTO member_recognition_preferences(user_id,aura,revision)
       SELECT ?,?,1 WHERE EXISTS(SELECT 1 FROM "user" WHERE id=?)`)
       .bind(data.memberId,data.aura,data.memberId);
  const record = db.prepare(`INSERT INTO anevum_staff_management_audit
    (id,actor_id,member_id,action,old_value,new_value,created_at)
    SELECT ?,?,?,'aura-set',?,?,? WHERE changes()=1`)
    .bind(crypto.randomUUID(),staff.id,data.memberId,previous.aura,data.aura,now);
  const outcome = await db.batch([change,record]);
  if (outcome[0]?.meta?.changes !== 1 || outcome[1]?.meta?.changes !== 1)
    return error(409, 'Aura change not applied');
  return json({ ok: true, aura: data.aura });
}

export default {
  async fetch(request, env) {
    let url;
    try { url = new URL(request.url); } catch { return error(404, 'Not found'); }
    if (url.origin !== ORIGIN || url.protocol !== 'https:' || url.username || url.password ||
        ![BASE,`${BASE}/`,`${BASE}/app.js`,`${BASE}/styles.css`,
          `${BASE}/api/overview`,`${BASE}/api/members`,`${BASE}/api/rewards`,
          `${BASE}/api/audit`,`${BASE}/api/aura`].includes(url.pathname))
      return error(404, 'Not found');
    if (url.search && !(request.method === 'GET' && url.pathname === `${BASE}/api/members`))
      return error(400, 'Unexpected query');
    if (!['GET', 'POST'].includes(request.method)) return error(405, 'Method not allowed');
    const staff = await getStaff(request, env);
    if (!staff) return error(401, 'Valid staff session required');
    if (request.method === 'GET') {
      if (url.pathname === BASE || url.pathname === `${BASE}/`)
        return respond(PAGE, 200, 'text/html; charset=utf-8', true);
      if (url.pathname === `${BASE}/app.js`)
        return respond(CLIENT, 200, 'application/javascript; charset=utf-8');
      if (url.pathname === `${BASE}/styles.css`)
        return respond(STYLES, 200, 'text/css; charset=utf-8');
      try {
        switch(url.pathname) {
          case `${BASE}/api/overview`: return await overview(env.MEMBER_DB, staff);
          case `${BASE}/api/members`: return await members(env.MEMBER_DB, staff, url);
          case `${BASE}/api/rewards`: return await rewards(env.MEMBER_DB, staff);
          case `${BASE}/api/audit`: return await audits(env.MEMBER_DB, staff);
          default: return error(405, 'Method not allowed');
        }
      } catch { return error(503, 'Observatory data unavailable'); }
    }
    if (url.pathname !== `${BASE}/api/aura`) return error(405, 'Method not allowed');
    try { return await changeAura(request, env.MEMBER_DB, staff); }
    catch { return error(503, 'Management action unavailable'); }
  },
};
