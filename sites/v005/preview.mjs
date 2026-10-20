// Build a single-file V005 review page so file:// screenshots load their actual styles.
// Review-only, not a production Cloudflare asset.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
const root=dirname(new URL(import.meta.url).pathname);
const read=filename=>readFile(resolve(root,filename),"utf8");
let [html,css,js,immersive]=await Promise.all([read("site.html"),read("site.css"),read("site.js"),read("immersive-engine.js")]);
const cssLink='<link rel="stylesheet" href="/assets/sites-v005.css">';
const jsTag='<script src="/assets/sites-v005.js" defer></script>';
const immersiveTag='<script src="/assets/sites-v005-immersive.js" defer></script>';
if(!html.includes(cssLink)||!html.includes(jsTag))throw new Error("V005 inline-preview markers not found");
html=html.replace(cssLink,"<style>"+css+"</style>");
const preventSend="document.addEventListener('submit', e => { e.preventDefault(); e.stopImmediatePropagation(); const form=e.target; if(form && form.id==='site-inquiry'){ const note=document.createElement('p'); note.setAttribute('role','status'); note.style.color='#d4f5b7'; note.textContent='Interactive review only. This preview does not submit inquiries.'; form.append(note); } }, true);";
html=html.replace(immersiveTag,"<script>"+immersive+"</script>");
html=html.replace(jsTag,"<script>"+preventSend+js+"</script>");
html=html.replace('<link rel="manifest" href="/site.webmanifest">',"");
html=html.replace('<meta name="robots" content="index,follow">','<meta name="robots" content="noindex,nofollow">');
html=html.replace('</head>',"<style>body.v5 .preview-banner{position:fixed;right:12px;bottom:12px;z-index:999;background:#c9e8ad;color:#0c1a0b;font:600 10px system-ui;padding:10px 12px;box-shadow:0 0 28px #0008} @media(max-width:600px){body.v5 .preview-banner{right:8px;bottom:8px;padding:8px;font-size:9px}}</style></head>");
html=html.replace('<body class="v5">','<body class="v5"><div class="preview-banner">V005 DESIGN PREVIEW · NOT LIVE</div>');
const visualQa='<script>window.addEventListener("load",()=>{setTimeout(()=>{const c=document.querySelector("#hero-react-root canvas");window.__ANE_GPU_QA=c?"RENDERER_READY":"NO_WEBGL2";document.documentElement.setAttribute("data-gpu-test",window.__ANE_GPU_QA);},300);});</script>';
html=html.replace('</body>',visualQa+'</body>');

if(html.includes(cssLink)||html.includes(jsTag)||html.includes(immersiveTag))throw new Error("External CSS/JS were not embedded");
const dir=process.argv[2]||"/tmp/sites-v005";
await mkdir(dir,{recursive:true});
const file=resolve(dir,"interactive-preview.html");
await writeFile(file,html);
console.log("Created portable V005 interactive preview",file,html.length);
