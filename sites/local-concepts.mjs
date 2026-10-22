// ANEVUM.WEB.BUILD.2026-10-21.001.SITES-LOCAL-CONCEPT-LIBRARY
// Three fictional, owner-only St. Cloud industry studies. Zero D1 or public routes.
export const LOCAL_CONCEPTS = [
  {
    "slug": "auto-detail",
    "category": "01 / AUTOMOTIVE",
    "brand": "NOCTURNE",
    "suffix": "AUTO DETAIL",
    "kind": "auto",
    "eyebrow": "A FICTIONAL DETAILING STUDIO / ST. CLOUD, FL",
    "headline": "Every finish has a story.",
    "summary": "A confident mobile-first presentation for a local detailing business: clear service pathways, trust-forward language, and an interactive finish explorer.",
    "action": "EXPLORE FINISHES",
    "sceneLabel": "MATERIAL STUDY / GLOSS 01",
    "section": "Precision, without the noise.",
    "sectionCopy": "An automotive site should answer the essentials immediately: what the shop handles, how to ask for a quote, and what the customer can expect.",
    "services": [
      [
        "Exterior renewal",
        "Wash, decontamination and visual finish inspection."
      ],
      [
        "Interior detail",
        "A focused service presentation for interior care."
      ],
      [
        "Surface protection",
        "An explanation-led approach to finishes and maintenance."
      ]
    ],
    "steps": [
      [
        "01",
        "Tell us about the vehicle"
      ],
      [
        "02",
        "Confirm a realistic scope"
      ],
      [
        "03",
        "Schedule with the shop"
      ]
    ],
    "choices": [
      [
        "GLOSS",
        "Layered gloss exploration"
      ],
      [
        "SATIN",
        "Soft light and subdued reflections"
      ],
      [
        "CERAMIC",
        "A finish-protection visual concept"
      ]
    ],
    "artLabel": "ILLUSTRATED VEHICLE STUDY · NOT CLIENT PHOTOGRAPHY"
  },
  {
    "slug": "pet-grooming",
    "category": "02 / PET CARE",
    "brand": "FERN & PAW",
    "suffix": "GROOMING STUDIO",
    "kind": "pet",
    "eyebrow": "A FICTIONAL PET-CARE STUDIO / ST. CLOUD, FL",
    "headline": "Gentle care, beautifully simple.",
    "summary": "A warmer, welcoming booking-led design study built around pet comfort, service clarity, and an accessible mobile experience.",
    "action": "EXPLORE CARE",
    "sceneLabel": "THE CARE STUDIO / 02",
    "section": "Put owners at ease.",
    "sectionCopy": "Pet owners need understandable care options and a straightforward way to ask questions before they book. The concept is designed for calm, not clutter.",
    "services": [
      [
        "Bath & brush",
        "A simple introduction to cleansing, brushing and coat care."
      ],
      [
        "Trim & tidy",
        "Describe coat styling without assuming breed-specific availability."
      ],
      [
        "Paw essentials",
        "Introduce nail, paw and finishing-care questions."
      ]
    ],
    "steps": [
      [
        "01",
        "Share pet and coat needs"
      ],
      [
        "02",
        "Confirm suitability with staff"
      ],
      [
        "03",
        "Agree a visit time"
      ]
    ],
    "choices": [
      [
        "WASH",
        "Bath and brush walkthrough"
      ],
      [
        "TRIM",
        "Coat-care consultation"
      ],
      [
        "PAWS",
        "Quick-care appointment concept"
      ]
    ],
    "artLabel": "ABSTRACT PET ILLUSTRATION · NOT A REAL ANIMAL OR FACILITY"
  },
  {
    "slug": "home-services",
    "category": "03 / HOME + LANDSCAPE",
    "brand": "FIELDLINE",
    "suffix": "HOME SERVICES",
    "kind": "field",
    "eyebrow": "A FICTIONAL HOME-SERVICE STUDIO / ST. CLOUD, FL",
    "headline": "Better spaces begin at home.",
    "summary": "A practical homeowner-first concept with project categories, an illustrated property scene, and a clear quotation journey.",
    "action": "EXPLORE SERVICES",
    "sceneLabel": "PROPERTY STUDY / 03",
    "section": "Practical work. Clear expectations.",
    "sectionCopy": "Home-service websites convert best when the service area, work types, and next step are immediately understandable, without making unsupported promises.",
    "services": [
      [
        "Lawn & grounds",
        "Seasonal grounds care as a clearly described service category."
      ],
      [
        "Landscape refresh",
        "Project consultations for beds, edges and planting plans."
      ],
      [
        "Property upkeep",
        "A flexible maintenance request path for the business to define."
      ]
    ],
    "steps": [
      [
        "01",
        "Describe the property"
      ],
      [
        "02",
        "Arrange a scope review"
      ],
      [
        "03",
        "Agree the work plan"
      ]
    ],
    "choices": [
      [
        "GROUNDS",
        "Lawn and grounds design study"
      ],
      [
        "LANDSCAPE",
        "Landscape refresh outline"
      ],
      [
        "UPKEEP",
        "Recurring service journey"
      ]
    ],
    "artLabel": "PROCEDURAL LANDSCAPE ART · NOT A CUSTOMER PROPERTY"
  }
];
const DESIGN_CSS="\n:root{color-scheme:dark;--bg:#090c13;--ink:#f0f2ef;--muted:#a6b0b6;--edge:rgba(232,244,241,.19);--accent:#dbb68c;--panel:#111b21}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;color:var(--ink);background:var(--bg);font:400 16px/1.55 system-ui,-apple-system,Segoe UI,sans-serif}body.auto{--bg:#0c0e12;--panel:#191b20;--accent:#e1ab7a;--ink:#f8f4ee;--muted:#bcb7b3}body.pet{--bg:#17221f;--panel:#223730;--accent:#f0c5a8;--ink:#fff8ed;--muted:#d8dfd0}body.field{--bg:#0e1d17;--panel:#1e3128;--accent:#c1dba5;--ink:#f3f4e5;--muted:#c3cfbe}a{color:inherit;text-decoration:none}button{font:inherit;cursor:pointer;color:inherit}a:focus-visible,button:focus-visible{outline:3px solid var(--accent);outline-offset:4px}.skip{position:absolute;top:-70px;left:12px;background:var(--accent);color:#101820;padding:12px;z-index:20}.skip:focus{top:12px}.proof{padding:11px clamp(18px,4vw,70px);display:flex;flex-wrap:wrap;gap:16px;justify-content:space-between;background:#0a1217;color:#f7dba4;font-size:11px;letter-spacing:.08em;border-bottom:1px solid #4a5050}.proof b{font-weight:700}.shell{width:min(1400px,calc(100% - 72px));margin:auto}.mast{display:flex;align-items:center;justify-content:space-between;gap:18px;min-height:91px;border-bottom:1px solid var(--edge)}.mark{font-size:22px;font-weight:800;letter-spacing:-.055em}.mark small{display:block;font:600 10px/1.5 ui-monospace,monospace;letter-spacing:.22em;color:var(--accent)}.nav{display:flex;align-items:center;gap:26px;font-size:13px}.nav a:hover{color:var(--accent)}.nav .ghost{border:1px solid var(--edge);padding:12px 16px}.hero{display:grid;grid-template-columns:1.01fr .99fr;min-height:640px;align-items:center;gap:38px;padding:72px 0 86px}.kicker,.section-number{font:600 11px/1.4 ui-monospace,monospace;letter-spacing:.19em;color:var(--accent)}.hero h1{font-size:clamp(56px,6.4vw,108px);line-height:.98;letter-spacing:-.085em;max-width:800px;margin:26px 0 26px}.hero p{max-width:580px;color:var(--muted);font-size:17px;line-height:1.8}.cta{display:inline-flex;align-items:center;gap:22px;background:var(--accent);color:#101820;font-size:12px;letter-spacing:.07em;font-weight:800;padding:16px 22px;margin-top:20px;transition:transform .2s}.cta:hover{transform:translateY(-3px)}.subnote{display:block;margin-top:16px;font-size:11px;color:var(--muted)}.scene{height:540px;position:relative;overflow:hidden;isolation:isolate;border:1px solid var(--edge);background:radial-gradient(circle at 57% 36%,#667d8b35,transparent 45%),linear-gradient(130deg,#202d32,#081018 74%);box-shadow:0 32px 100px #0006}.scene:after{content:\"\";position:absolute;inset:0;pointer-events:none;opacity:.3;background:repeating-linear-gradient(0deg,transparent 0 29px,#ffffff08 30px),repeating-linear-gradient(90deg,transparent 0 29px,#ffffff08 30px)}.scene-label{position:absolute;top:22px;left:24px;z-index:4;font:600 10px ui-monospace,monospace;color:#e9efec;letter-spacing:.18em}.scene-footer{position:absolute;bottom:20px;left:24px;z-index:4;font:500 10px ui-monospace,monospace;color:#eef1e5;letter-spacing:.07em}.scene .ring{position:absolute;left:50%;top:50%;width:80%;aspect-ratio:1;border:1px solid #c1dad068;border-radius:50%;transform:translate(-50%,-50%) rotateX(57deg) rotateZ(30deg);box-shadow:0 0 90px #abcab022,inset 0 0 80px #e9fff015;animation:orbit 24s linear infinite}.scene .ring.second{width:65%;border-color:#fff9e75c;animation-direction:reverse;animation-duration:19s}.scene .art{position:absolute;inset:18% 11% 16%;filter:drop-shadow(0 44px 35px #0009);transform:perspective(600px) rotateX(7deg);animation:float 9s ease-in-out infinite}.auto .scene{background:radial-gradient(circle at 54% 39%,#be876c64,transparent 43%),linear-gradient(148deg,#303139,#0d131a 73%)}.auto .art{inset:40% 5% 18%;height:130px;background:linear-gradient(165deg,#fbe5c98c,#8a453772 48%,#1f282f 65%),linear-gradient(90deg,#24272d,#14171b);border:1px solid #ffffff90;border-radius:55% 25% 13% 14%/75% 74% 21% 28%;box-shadow:inset 0 20px 30px #fff4de40,inset 0 -30px 16px #0c1720,0 20px 45px #000b}.auto .art:before,.auto .art:after{content:\"\";position:absolute;bottom:-28px;width:80px;height:80px;border-radius:50%;background:radial-gradient(circle,#aeb6bd 0 17%,#2c3138 18% 36%,#080c10 37% 64%,#7d8186 65% 68%,#0a0d10 69%);box-shadow:inset 0 0 14px #000}.auto .art:before{left:12%}.auto .art:after{right:10%}.pet .scene{background:radial-gradient(circle at 52% 48%,#fed6ba62,transparent 45%),linear-gradient(140deg,#778c75,#263e39 82%)}.pet .art{inset:23% 24% 13%;border-radius:48% 48% 38% 38%;background:radial-gradient(circle at 41% 33%,#fffdf0,#d0ab82 52%,#8b664d 87%);box-shadow:inset 20px 0 50px #fffbeb7a,inset -30px -35px 40px #4a493d82}.pet .art:before,.pet .art:after{content:\"\";position:absolute;top:-14%;width:38%;height:55%;border-radius:76% 20% 90% 24%;background:linear-gradient(110deg,#f5e0c5,#9d705c);z-index:-1}.pet .art:before{left:0;transform:rotate(-25deg)}.pet .art:after{right:0;transform:scaleX(-1) rotate(-25deg)}.field .scene{background:radial-gradient(circle at 50% 55%,#d6e9ba33,transparent 60%),linear-gradient(130deg,#3e674d,#11261b 78%)}.field .art{inset:32% 19% 18%;border-radius:16% 16% 10% 10%;background:linear-gradient(143deg,#d1ddbf 0 34%,#718c65 36% 46%,#314b3e 47% 70%,#1c372a 72%);clip-path:polygon(0 49%,50% 0,100% 49%,100% 100%,0 100%);box-shadow:0 60px 45px #000b}.field .art:before{content:\"\";position:absolute;left:39%;bottom:0;width:22%;height:54%;background:#213b2c;border:8px solid #f0dfbd}.section{padding:90px 0;border-top:1px solid var(--edge)}.section-head{display:flex;justify-content:space-between;gap:40px;align-items:end;margin-bottom:33px}.section h2{font-size:clamp(36px,4.5vw,65px);letter-spacing:-.069em;line-height:1.04;max-width:850px;margin:12px 0 0}.section-head p{max-width:360px;color:var(--muted);line-height:1.8}.service-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:15px}.service{background:linear-gradient(145deg,var(--panel),transparent);border:1px solid var(--edge);padding:29px;min-height:245px}.service span{font:600 11px ui-monospace,monospace;letter-spacing:.15em;color:var(--accent)}.service h3{font-size:24px;letter-spacing:-.05em;margin:35px 0 12px}.service p{font-size:14px;line-height:1.65;color:var(--muted);margin:0}.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;counter-reset:step}.step{padding:18px 0;border-top:2px solid var(--accent);font-size:15px;display:flex;gap:18px;align-items:start}.step b{font:700 13px ui-monospace,monospace;color:var(--accent)}.demo{display:grid;grid-template-columns:1fr 1fr;gap:35px;align-items:center}.demo p{color:var(--muted);max-width:590px}.controls{display:flex;flex-wrap:wrap;gap:10px;margin:24px 0}.option{border:1px solid var(--edge);background:var(--panel);padding:13px 18px;font:700 12px ui-monospace,monospace}.option[aria-pressed=\"true\"]{background:var(--accent);color:#101820}.output{border:1px solid var(--edge);padding:29px;min-height:210px;background:radial-gradient(circle at 88% 10%,#ffffff18,transparent 60%),var(--panel)}.output small{display:block;font:600 11px ui-monospace,monospace;color:var(--accent);letter-spacing:.18em}.output strong{display:block;font-size:31px;letter-spacing:-.055em;margin:15px 0}.output p{margin:0;color:var(--muted)}.ending{padding:65px 0;border-top:1px solid var(--edge);display:flex;justify-content:space-between;gap:20px;font:500 11px ui-monospace,monospace;color:var(--muted);letter-spacing:.09em}.ending a{color:var(--accent)}@keyframes float{50%{transform:perspective(600px) translateY(-13px) rotateX(4deg)}}@keyframes orbit{to{transform:translate(-50%,-50%) rotateX(57deg) rotateZ(390deg)}}@media(max-width:940px){.hero{grid-template-columns:1fr;padding-block:58px}.scene{height:490px}.section-head{display:block}.service-grid{grid-template-columns:1fr 1fr}.demo{grid-template-columns:1fr}}@media(max-width:620px){.shell{width:min(100% - 32px,1400px)}.mast{min-height:74px}.mark{font-size:19px}.nav a:not(.ghost){display:none}.nav .ghost{padding:10px;font-size:11px}.hero{padding-top:40px;gap:23px;min-height:0}.hero h1{font-size:clamp(47px,13vw,72px)}.hero p{font-size:15px}.scene{height:370px}.scene-label,.scene-footer{font-size:9px}.auto .art:before,.auto .art:after{width:47px;height:47px;bottom:-19px}.section{padding:62px 0}.service-grid{grid-template-columns:1fr}.service{min-height:170px}.service h3{margin-top:17px}.steps{grid-template-columns:1fr}.ending{display:block}.demo{gap:15px}}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.scene .ring,.scene .art{animation:none}.cta{transition:none}}\n";
export const LOCAL_CONCEPT_JS="\"use strict\";document.querySelectorAll(\"[data-choice]\").forEach(button=>{button.addEventListener(\"click\",()=>{const panel=button.closest(\"[data-demo]\");if(!panel)return;panel.querySelectorAll(\"[data-choice]\").forEach(x=>x.setAttribute(\"aria-pressed\",String(x===button)));const target=panel.querySelector(\"[data-selection]\");const blurb=panel.querySelector(\"[data-explanation]\");if(target)target.textContent=button.dataset.choice||\"Selected\";if(blurb)blurb.textContent=button.dataset.description||\"Preview only\";});});";
const esc=(v)=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const list=(xs,fn)=>xs.map(fn).join("");
const notice='<div class="proof"><span><b>ANEVUM / PRIVATE DESIGN STUDY</b> · FICTIONAL BUSINESS / NOT COMMISSIONED</span><span>NO REAL CONTACT, BOOKING OR TRANSACTION</span></div>';
const indexCss=':root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:#090e14;color:#f0f4eb;font:16px/1.6 system-ui,sans-serif}a{color:inherit;text-decoration:none}a:focus-visible{outline:2px solid #c4ecb6;outline-offset:4px}.frame{width:min(1150px,calc(100% - 38px));margin:auto}.mast{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:30px 0;border-bottom:1px solid #364747}.mast a{font-size:12px;color:#c4dbcd}.eyebrow{font:600 11px ui-monospace,monospace;letter-spacing:.2em;color:#bbd8c2}.hero{padding:85px 0 45px}.hero h1{font-size:clamp(44px,6vw,82px);letter-spacing:-.07em;line-height:1.05;margin:20px 0}.hero p{max-width:650px;color:#a8bbb6}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;padding-bottom:80px}.card{display:block;border:1px solid #34484b;background:linear-gradient(155deg,#1b2e30,#101a20);padding:22px;min-height:390px;transition:transform .2s}.card:nth-child(2){background:linear-gradient(155deg,#5f6960,#243e39)}.card:nth-child(3){background:linear-gradient(155deg,#304f36,#12241e)}.card:hover{transform:translateY(-4px)}.card small{font:600 11px ui-monospace,monospace;color:#c5e9d3}.thumb{height:175px;margin:20px 0;background:radial-gradient(circle at 50% 45%,#b5d1c780,transparent 50%),linear-gradient(130deg,#364f53,#0b181d);border:1px solid #ffffff24;display:grid;place-items:center;font-size:58px;font-weight:800;letter-spacing:-.09em;color:#ffffffb0}.card:nth-child(2) .thumb{background:radial-gradient(circle,#efc7ad 0,#5f7c6a 53%,#213e35 100%)}.card:nth-child(3) .thumb{background:repeating-radial-gradient(circle,#a8cd7c40 0 10px,#193e2940 12px 30px),#2b5735}.card h2{font-size:25px;letter-spacing:-.04em;margin:0}.card p{color:#c9d1cc;font-size:13px;min-height:62px}.card b{font:700 11px ui-monospace,monospace;color:#d5ebce;letter-spacing:.08em}@media(max-width:850px){.grid{grid-template-columns:1fr 1fr}}@media(max-width:600px){.grid{grid-template-columns:1fr}.hero{padding-top:54px}.card{min-height:0}.card p{min-height:0}.mast{align-items:start;flex-wrap:wrap}}@media(prefers-reduced-motion:reduce){.card{transition:none}}';
export function localConceptIndex(){return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>ANEVUM Sites / Private Concept Library</title><style>'+indexCss+'</style></head><body><div class="frame"><header class="mast"><strong>ANEVUM / SITES — OWNER LIBRARY</strong><a href="/">← RETURN TO WORKBENCH</a></header><main><section class="hero"><span class="eyebrow">LOCAL COMMERCE / EXPLORATION 001</span><h1>Three industries.<br>Three directions.</h1><p>Internal demonstration sites for independent businesses around St. Cloud. All names, brands, work samples and interactions are fictional. None represents a signed client, an endorsed business or a public site.</p></section><div class="grid">'+list(LOCAL_CONCEPTS,(x,i)=>'<a class="card" href="/concepts/'+encodeURIComponent(x.slug)+'"><small>'+esc(x.category)+'</small><div class="thumb" aria-hidden="true">'+['N','F','◈'][i]+'</div><h2>'+esc(x.brand)+' <span>'+esc(x.suffix)+'</span></h2><p>'+esc(x.summary)+'</p><b>OPEN OWNER PREVIEW ↗</b></a>')+'</div></main></div></body></html>';}
export function localConceptPage(slug){const x=LOCAL_CONCEPTS.find(a=>a.slug===slug);if(!x)return null;return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="robots" content="noindex,nofollow,noarchive"><title>'+esc(x.brand+' '+x.suffix)+' — Private ANEVUM Concept</title><meta name="description" content="Private fictional ANEVUM Sites industry study. Not a business website."><style>'+DESIGN_CSS+'</style></head><body class="'+esc(x.kind)+'"><a class="skip" href="#main">Skip to content</a>'+notice+'<div class="shell"><header class="mast"><a class="mark" href="/concepts">'+esc(x.brand)+'<small>'+esc(x.suffix)+'</small></a><nav class="nav" aria-label="Concept navigation"><a href="#services">Services</a><a href="#approach">Approach</a><a href="#demo">Interactive study</a><a class="ghost" href="/concepts">All studies ↗</a></nav></header><main id="main"><section class="hero"><div class="hero-copy"><div class="kicker">'+esc(x.eyebrow)+'</div><h1>'+esc(x.headline)+'</h1><p>'+esc(x.summary)+'</p><a class="cta" href="#services">'+esc(x.action)+' <span aria-hidden="true">↗</span></a><small class="subnote">Private, uncommissioned visual study. No customer information or business affiliation.</small></div><div class="scene" role="img" aria-label="'+esc(x.artLabel)+'"><div class="scene-label">'+esc(x.sceneLabel)+'</div><div class="ring"></div><div class="ring second"></div><div class="art"></div><div class="scene-footer">'+esc(x.artLabel)+'</div></div></section><section class="section" id="services"><div class="section-head"><div><span class="section-number">01 / SERVICES</span><h2>'+esc(x.section)+'</h2></div><p>'+esc(x.sectionCopy)+'</p></div><div class="service-grid">'+list(x.services,(s,i)=>'<article class="service"><span>0'+(i+1)+' / OFFERING</span><h3>'+esc(s[0])+'</h3><p>'+esc(s[1])+'</p></article>')+'</div></section><section class="section" id="approach"><div class="section-head"><div><span class="section-number">02 / THE EXPERIENCE</span><h2>A clear path from curiosity to conversation.</h2></div><p>This is a proposed customer journey, not a working scheduling or payment integration.</p></div><div class="steps">'+list(x.steps,s=>'<div class="step"><b>'+esc(s[0])+'</b><span>'+esc(s[1])+'</span></div>')+'</div></section><section class="section demo" id="demo"><div><span class="section-number">03 / INTERACTIVE STUDY</span><h2>Try the concept.</h2><p>These controls switch a local design explanation. They do not send a booking, request a quote, collect data, or change a real business account.</p><div class="controls" data-demo>'+list(x.choices,(c,i)=>'<button type="button" class="option" data-choice="'+esc(c[0])+'" data-description="'+esc(c[1])+'" aria-pressed="'+String(i===0)+'">'+esc(c[0])+'</button>')+'<div class="output" style="width:100%"><small>LOCAL DESIGN STATE / NO API</small><strong data-selection>'+esc(x.choices[0][0])+'</strong><p data-explanation>'+esc(x.choices[0][1])+'</p></div></div></div><div class="scene" role="img" aria-label="'+esc(x.artLabel)+'"><div class="scene-label">DESIGN REFERENCE / INTERACTIVE STATE</div><div class="ring"></div><div class="ring second"></div><div class="art"></div><div class="scene-footer">PLACEHOLDER ART — REPLACE WITH APPROVED CLIENT MEDIA</div></div></section></main><footer class="ending"><span>ANEVUM SITES · FICTIONAL LOCAL-BUSINESS CONCEPT · 2026</span><a href="/concepts">BACK TO OWNER LIBRARY ↗</a></footer></div><script src="/assets/local-concepts.js" defer></script></body></html>';}
