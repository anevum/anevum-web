import { useId } from "react";
import type { PublicObject } from "./publicObjects";
import { VisualArt } from "./ui";

function Stars({ id }: { id: string }) {
  return <rect width="1200" height="760" fill={`url(#${id}-stars)`} opacity=".7" />;
}

function SharedDefs({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={`${id}-space`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#030506" />
        <stop offset=".55" stopColor="#10171b" />
        <stop offset="1" stopColor="#050505" />
      </linearGradient>
      <radialGradient id={`${id}-blue`} cx="32%" cy="25%" r="75%">
        <stop offset="0" stopColor="#c8d5da" />
        <stop offset=".16" stopColor="#708b96" />
        <stop offset=".43" stopColor="#264550" />
        <stop offset=".72" stopColor="#0c1b22" />
        <stop offset="1" stopColor="#030506" />
      </radialGradient>
      <radialGradient id={`${id}-warm`} cx="31%" cy="22%" r="78%">
        <stop offset="0" stopColor="#d8ccb2" />
        <stop offset=".18" stopColor="#8d7757" />
        <stop offset=".5" stopColor="#403329" />
        <stop offset="1" stopColor="#050505" />
      </radialGradient>
      <linearGradient id={`${id}-link`} x1="0" x2="1">
        <stop offset="0" stopColor="#4da8ff" stopOpacity="0" />
        <stop offset=".5" stopColor="#4da8ff" stopOpacity=".82" />
        <stop offset="1" stopColor="#4da8ff" stopOpacity="0" />
      </linearGradient>
      <pattern id={`${id}-stars`} width="91" height="83" patternUnits="userSpaceOnUse">
        <circle cx="11" cy="18" r="1" fill="#eeeae1" fillOpacity=".28" />
        <circle cx="69" cy="49" r=".8" fill="#eeeae1" fillOpacity=".16" />
        <circle cx="36" cy="72" r=".55" fill="#4da8ff" fillOpacity=".2" />
      </pattern>
      <pattern id={`${id}-grid`} width="64" height="64" patternUnits="userSpaceOnUse">
        <path d="M64 0H0V64" fill="none" stroke="#c9d0d2" strokeOpacity=".08" />
      </pattern>
      <filter id={`${id}-soft`}><feGaussianBlur stdDeviation="18" /></filter>
    </defs>
  );
}

function Frame({ id }: { id: string }) {
  return <rect x="38" y="38" width="1124" height="684" fill="none" stroke="#f0ede5" strokeOpacity=".08" />;
}

function VeyraVisual({ id }: { id: string }) {
  return (
    <svg className="visual-art canon-visual" data-canon-visual="veyra" viewBox="0 0 1200 760" aria-hidden="true">
      <SharedDefs id={id} />
      <rect width="1200" height="760" fill={`url(#${id}-space)`} />
      <Stars id={id} />
      <circle cx="770" cy="360" r="315" fill={`url(#${id}-blue)`} />
      <ellipse cx="760" cy="330" rx="260" ry="84" fill="none" stroke="#edf4f4" strokeOpacity=".12" strokeWidth="22" transform="rotate(-11 760 330)" />
      <ellipse cx="785" cy="420" rx="235" ry="65" fill="none" stroke="#4da8ff" strokeOpacity=".1" strokeWidth="12" transform="rotate(7 785 420)" />
      <path d="M555 255C670 206 790 210 940 292" fill="none" stroke="#e9eeeb" strokeOpacity=".12" strokeWidth="7" strokeLinecap="round" />
      <path d="M575 496C712 450 831 474 1005 410" fill="none" stroke="#e9eeeb" strokeOpacity=".07" strokeWidth="4" strokeLinecap="round" />
      <circle cx="1027" cy="122" r="42" fill="#c2c6c4" fillOpacity=".58" />
      <circle cx="1027" cy="122" r="58" fill="none" stroke="#c2c6c4" strokeOpacity=".09" />
      <text x="78" y="620" fill="#a9a59e" fontSize="18" letterSpacing="5">RHEL SYSTEM / PHYSICAL ORIENTATION</text>
      <text x="78" y="660" fill="#f0ede5" fontFamily="Georgia, serif" fontSize="46">Veyra</text>
      <text x="78" y="690" fill="#767b7d" fontSize="14" letterSpacing="3">NO DEFINITIVE CONTINENT SILHOUETTES PUBLISHED</text>
      <Frame id={id} />
    </svg>
  );
}

function IoneVisual({ id }: { id: string }) {
  return (
    <svg className="visual-art canon-visual" data-canon-visual="ione" viewBox="0 0 1200 760" aria-hidden="true">
      <SharedDefs id={id} />
      <rect width="1200" height="760" fill={`url(#${id}-space)`} />
      <Stars id={id} />
      <circle cx="810" cy="355" r="258" fill="#8b8e8b" />
      <circle cx="810" cy="355" r="258" fill="url(#ioneShade)" opacity=".88" />
      <defs><radialGradient id="ioneShade" cx="30%" cy="23%" r="79%"><stop offset="0" stopColor="#d7d4ca" /><stop offset=".28" stopColor="#8b8d88" /><stop offset=".72" stopColor="#313534" /><stop offset="1" stopColor="#090a0a" /></radialGradient></defs>
      <g fill="none" stroke="#131515" strokeOpacity=".36">
        <ellipse cx="720" cy="285" rx="60" ry="33" strokeWidth="8" />
        <ellipse cx="890" cy="425" rx="88" ry="46" strokeWidth="11" />
        <ellipse cx="812" cy="180" rx="39" ry="20" strokeWidth="6" />
        <ellipse cx="700" cy="470" rx="36" ry="22" strokeWidth="5" />
      </g>
      <path d="M584 365C666 312 752 295 1015 266" fill="none" stroke="#d9d6ce" strokeOpacity=".12" strokeWidth="3" />
      <text x="76" y="617" fill="#a9a59e" fontSize="18" letterSpacing="5">VEYRA / LARGE TIDALLY LOCKED MOON</text>
      <text x="76" y="660" fill="#f0ede5" fontFamily="Georgia, serif" fontSize="46">Ione</text>
      <text x="76" y="691" fill="#767b7d" fontSize="14" letterSpacing="3">AIRLESS · ROCKY · PHYSICAL RECORD ONLY</text>
      <Frame id={id} />
    </svg>
  );
}

function PlanetVisual({ id, warm, title, system }: { id: string; warm?: boolean; title: string; system: string }) {
  return (
    <svg className="visual-art canon-visual" data-canon-visual={title.toLowerCase()} viewBox="0 0 1200 760" aria-hidden="true">
      <SharedDefs id={id} />
      <rect width="1200" height="760" fill={`url(#${id}-space)`} />
      <Stars id={id} />
      <circle cx="805" cy="345" r="304" fill={warm ? `url(#${id}-warm)` : `url(#${id}-blue)`} />
      <path d="M590 255C695 205 829 216 1015 322" fill="none" stroke="#f0ede5" strokeOpacity=".11" strokeWidth="18" strokeLinecap="round" />
      <path d="M565 410C680 378 824 444 1015 374" fill="none" stroke="#4da8ff" strokeOpacity=".12" strokeWidth="9" strokeLinecap="round" />
      <circle cx="1004" cy="130" r="26" fill="#c6c8c4" fillOpacity=".45" />
      <text x="76" y="620" fill="#9b9c99" fontSize="18" letterSpacing="5">{system}</text>
      <text x="76" y="663" fill="#f0ede5" fontFamily="Georgia, serif" fontSize="48">{title}</text>
      <text x="76" y="692" fill="#71777a" fontSize="14" letterSpacing="3">PUBLIC ORIENTATION / NO INVENTED CARTOGRAPHY</text>
      <Frame id={id} />
    </svg>
  );
}

function GreaterSereinVisual({ id }: { id: string }) {
  return (
    <svg className="visual-art canon-visual" data-canon-visual="greater-serein" viewBox="0 0 1200 760" aria-hidden="true">
      <SharedDefs id={id} />
      <rect width="1200" height="760" fill="#e9e6dc" />
      <rect x="44" y="44" width="1112" height="672" fill="#f3efe5" stroke="#171817" strokeWidth="2" />
      <path d="M855 70H1138V690H720C770 640 830 600 886 555C944 510 955 458 926 408C900 363 905 316 948 272C1000 216 1041 164 1025 104C1018 88 1009 77 1000 70Z" fill="#dce3e1" />
      <path d="M712 70C726 158 757 210 739 277C720 345 724 398 754 455C790 526 827 575 845 690" fill="none" stroke="#c3d4d6" strokeWidth="64" strokeLinecap="round" />
      <path d="M712 70C726 158 757 210 739 277C720 345 724 398 754 455C790 526 827 575 845 690" fill="none" stroke="#636a69" strokeWidth="2" />
      <g fill="#d5d0c4" stroke="#aaa59c" strokeWidth="1">
        <path d="M80 90H675L705 246L652 320L492 347L80 312Z" />
        <path d="M80 300L500 326L690 324L700 500L498 543L80 516Z" fill="#dfdbd1" />
        <path d="M80 506L500 526L738 606L770 690H80Z" fill="#d3cfc6" />
        <path d="M765 245L1000 252L1001 495L921 552L797 570L722 488Z" fill="#ddd8ce" />
        <path d="M922 530C987 504 1045 533 1128 585V666C1068 694 1006 676 950 635C918 610 907 570 922 530Z" fill="#b9b6ae" />
      </g>
      <g stroke="#f3efe5" strokeWidth="10" fill="none" strokeLinecap="round">
        <path d="M80 192C290 198 492 238 688 326C821 386 944 390 1114 352" />
        <path d="M330 75C342 200 330 330 342 455C354 560 390 620 400 690" />
        <path d="M80 448C260 420 471 450 686 520C819 564 960 580 1126 552" />
      </g>
      <path d="M80 234C286 250 466 307 610 392C744 472 874 529 1119 558" fill="none" stroke="#171817" strokeWidth="7" />
      <path d="M80 234C286 250 466 307 610 392C744 472 874 529 1119 558" fill="none" stroke="#f3efe5" strokeWidth="3" strokeDasharray="4 12" />
      <g fill="#202220" fontFamily="Arial, sans-serif" fontWeight="700" letterSpacing="3">
        <text x="100" y="122" fontSize="18">OLD MERIDIAN</text>
        <text x="100" y="365" fontSize="18">WESTBANK</text>
        <text x="100" y="566" fontSize="18">SOUTHBANK</text>
        <text x="790" y="288" fontSize="18">LOW HARROW</text>
        <text x="948" y="564" fontSize="17">CAPE SEREIN</text>
      </g>
      <text x="740" y="225" fill="#555953" fontFamily="Georgia, serif" fontStyle="italic" fontSize="21" transform="rotate(74 740 225)">Alder Channel</text>
      <text x="1018" y="159" fill="#555953" fontFamily="Georgia, serif" fontStyle="italic" fontSize="20">Serein Sea</text>
      <text x="78" y="676" fill="#3d3e3b" fontSize="12" letterSpacing="2">PUBLIC CIVIC ORIENTATION · DISTRICT RELATIONSHIPS · PROVISIONAL ROUTE DETAIL</text>
    </svg>
  );
}

function MervaVisual({ id }: { id: string }) {
  return (
    <svg className="visual-art canon-visual" data-canon-visual="merva" viewBox="0 0 1200 760" aria-hidden="true">
      <SharedDefs id={id} />
      <rect width="1200" height="760" fill={`url(#${id}-space)`} />
      <rect width="1200" height="760" fill={`url(#${id}-grid)`} />
      <path d="M0 620C190 540 390 610 592 565C790 520 960 542 1200 450V760H0Z" fill="#0a1012" />
      <path d="M-40 620C195 564 416 650 633 585C826 527 1005 530 1240 435" fill="none" stroke="#4da8ff" strokeOpacity=".35" strokeWidth="24" />
      <path d="M40 678C260 627 443 686 650 637C866 585 1015 595 1190 548" fill="none" stroke="#b79a5d" strokeOpacity=".13" strokeWidth="5" />
      <g fill="#121c20" stroke="#687980" strokeOpacity=".4">
        <rect x="115" y="430" width="68" height="210" />
        <rect x="205" y="358" width="96" height="282" />
        <rect x="330" y="470" width="76" height="170" />
        <rect x="444" y="285" width="116" height="355" />
        <rect x="592" y="408" width="83" height="232" />
        <rect x="710" y="233" width="124" height="407" />
        <rect x="875" y="372" width="92" height="268" />
        <rect x="1000" y="322" width="91" height="318" />
      </g>
      <path d="M100 565C280 521 423 540 576 493C735 444 870 450 1085 385" fill="none" stroke="#d8e1e4" strokeOpacity=".18" strokeWidth="5" />
      <g fill="#a9c8d7" fillOpacity=".45">{[160,260,360,460,560,660,760,860,960,1060].map((x) => <circle key={x} cx={x} cy={607 - (x % 200) / 4} r="4" />)}</g>
      <text x="72" y="118" fill="#9a9f9f" fontSize="17" letterSpacing="5">OVARA / ORDAN REPUBLIC / KESRA BASIN</text>
      <text x="72" y="170" fill="#f0ede5" fontFamily="Georgia, serif" fontSize="56">Merva</text>
      <text x="72" y="210" fill="#7c8384" fontSize="14" letterSpacing="3">WATER · TRANSIT · INDUSTRY · ORDINARY LIFE</text>
      <Frame id={id} />
    </svg>
  );
}

function SkygateVisual({ id, neral = false }: { id: string; neral?: boolean }) {
  return (
    <svg className="visual-art canon-visual" data-canon-visual={neral ? "neral-skygate" : "skygate"} viewBox="0 0 1200 760" aria-hidden="true">
      <SharedDefs id={id} />
      <rect width="1200" height="760" fill={`url(#${id}-space)`} />
      <Stars id={id} />
      <circle cx="805" cy="360" r="270" fill="none" stroke={neral ? "#7e7569" : "#81919a"} strokeOpacity=".4" strokeWidth="62" />
      <circle cx="805" cy="360" r="270" fill="none" stroke="#dce4e4" strokeOpacity=".25" strokeWidth="4" />
      <circle cx="805" cy="360" r="225" fill="none" stroke="#4da8ff" strokeOpacity=".16" strokeWidth="17" />
      <circle cx="805" cy="360" r="188" fill={neral ? `url(#${id}-warm)` : `url(#${id}-blue)`} />
      <g fill={neral ? "#c4a978" : "#b7d4df"} fillOpacity=".55">
        {Array.from({ length: 30 }).map((_, i) => { const a = i / 30 * Math.PI * 2; return <rect key={i} x={800 + Math.cos(a) * 268} y={355 + Math.sin(a) * 268} width="10" height="10" rx="2" transform={`rotate(${i * 12} ${805 + Math.cos(a) * 268} ${360 + Math.sin(a) * 268})`} />; })}
      </g>
      <g fill="none" stroke="#f0ede5" strokeOpacity=".13">
        <ellipse cx="805" cy="360" rx="315" ry="58" strokeWidth="2" />
        <ellipse cx="805" cy="360" rx="58" ry="315" strokeWidth="2" />
      </g>
      <path d="M450 360H1150" stroke={`url(#${id}-link)`} strokeWidth="3" />
      <text x="74" y="610" fill="#999e9f" fontSize="17" letterSpacing="5">INHABITED ORBITAL GATE-CITY</text>
      <text x="74" y="654" fill="#f0ede5" fontFamily="Georgia, serif" fontSize="48">{neral ? "Neral Skygate" : "Skygate"}</text>
      <text x="74" y="687" fill="#73797b" fontSize="14" letterSpacing="3">ROAD FRAME · HABITATION BELTS · CIVIC / UTILITY RING</text>
      <Frame id={id} />
    </svg>
  );
}

function OpenRoadVisual({ id }: { id: string }) {
  return (
    <svg className="visual-art canon-visual" data-canon-visual="open-road" viewBox="0 0 1200 760" aria-hidden="true">
      <SharedDefs id={id} />
      <rect width="1200" height="760" fill={`url(#${id}-space)`} />
      <Stars id={id} />
      <g transform="translate(-80 20) scale(.72)"><circle cx="640" cy="420" r="235" fill="none" stroke="#8ea1aa" strokeOpacity=".36" strokeWidth="56" /><circle cx="640" cy="420" r="173" fill={`url(#${id}-blue)`} /><circle cx="640" cy="420" r="235" fill="none" stroke="#4da8ff" strokeOpacity=".33" strokeWidth="2" strokeDasharray="8 14" /></g>
      <g transform="translate(580 35) scale(.72)"><circle cx="640" cy="420" r="235" fill="none" stroke="#887866" strokeOpacity=".4" strokeWidth="56" /><circle cx="640" cy="420" r="173" fill={`url(#${id}-warm)`} /><circle cx="640" cy="420" r="235" fill="none" stroke="#4da8ff" strokeOpacity=".33" strokeWidth="2" strokeDasharray="8 14" /></g>
      <path d="M385 340C526 245 690 245 833 340" fill="none" stroke="#4da8ff" strokeOpacity=".43" strokeWidth="2" />
      <path d="M385 425C526 520 690 520 833 425" fill="none" stroke="#4da8ff" strokeOpacity=".18" strokeWidth="2" />
      <circle cx="610" cy="382" r="8" fill="#4da8ff" />
      <text x="72" y="620" fill="#999e9f" fontSize="17" letterSpacing="5">PAIRED ENDPOINT INFRASTRUCTURE</text>
      <text x="72" y="662" fill="#f0ede5" fontFamily="Georgia, serif" fontSize="48">Open Road</text>
      <text x="72" y="692" fill="#73797b" fontSize="14" letterSpacing="3">TWO LOCAL GATES · ONE CERTIFIED RELATION</text>
      <Frame id={id} />
    </svg>
  );
}

function ContinuanceVisual({ id }: { id: string }) {
  return (
    <svg className="visual-art canon-visual" data-canon-visual="continuance" viewBox="0 0 1200 760" aria-hidden="true">
      <SharedDefs id={id} />
      <rect width="1200" height="760" fill="#081015" />
      <rect width="1200" height="760" fill={`url(#${id}-stars)`} opacity=".16" />
      <path d="M0 560C170 490 322 515 455 565C610 625 790 630 1200 535V760H0Z" fill="#0b0c0d" />
      <path d="M0 610C180 535 355 560 490 618C660 692 825 690 1200 595" fill="#171717" />
      <path d="M78 620C250 580 400 597 535 635" fill="none" stroke="#586f75" strokeOpacity=".7" strokeWidth="9" />
      <g fill="#12191c" stroke="#66767c" strokeOpacity=".55">
        <rect x="680" y="255" width="330" height="372" />
        <rect x="740" y="118" width="138" height="509" />
        <rect x="770" y="76" width="79" height="551" fill="#182226" />
        <rect x="612" y="430" width="156" height="197" />
        <rect x="930" y="382" width="142" height="245" />
      </g>
      <g stroke="#a8b2b4" strokeOpacity=".34"><path d="M625 478H739" /><path d="M878 344H1005" /><path d="M700 520H1080" /></g>
      <g fill="#d5c295" fillOpacity=".45">{[705,740,775,810,845,880,915,950,985,1020].map((x) => <rect key={x} x={x} y={x % 70 + 450} width="18" height="3" />)}</g>
      <path d="M1020 535C1080 510 1130 480 1200 455" fill="none" stroke="#4da8ff" strokeOpacity=".22" strokeWidth="12" />
      <text x="75" y="125" fill="#9ba3a4" fontSize="17" letterSpacing="5">CAPE SEREIN / PUBLIC INSTITUTION</text>
      <text x="75" y="177" fill="#f0ede5" fontFamily="Georgia, serif" fontSize="52">Continuance Institute</text>
      <text x="75" y="216" fill="#737a7c" fontSize="14" letterSpacing="3">BASALT · RESEARCH · SERVICE · MAINTENANCE</text>
      <Frame id={id} />
    </svg>
  );
}

function GrainitVisual({ id }: { id: string }) {
  const regions = [
    [330, 250, 95, 62], [520, 190, 112, 74], [728, 275, 104, 67], [452, 390, 124, 77], [670, 455, 116, 72], [880, 405, 88, 58]
  ];
  return (
    <svg className="visual-art canon-visual" data-canon-visual="grainit" viewBox="0 0 1200 760" aria-hidden="true">
      <SharedDefs id={id} />
      <rect width="1200" height="760" fill={`url(#${id}-space)`} />
      <rect width="1200" height="760" fill={`url(#${id}-grid)`} />
      <g fill="none" stroke="#d9e0e1" strokeOpacity=".42">
        {regions.map(([cx, cy, rx, ry], i) => <ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry} strokeWidth={i === 3 ? 3 : 1.5} />)}
      </g>
      <g stroke="#4da8ff" strokeOpacity=".42" fill="none" strokeWidth="2">
        <path d="M420 250C455 219 468 218 496 214" /><path d="M623 223C665 234 682 245 704 269" /><path d="M530 316C520 347 510 365 500 383" /><path d="M574 422C610 432 625 442 648 454" /><path d="M780 455C816 444 836 433 858 416" />
      </g>
      <g fill="#4da8ff">{regions.map(([cx,cy],i) => <circle key={i} cx={cx} cy={cy} r={i === 3 ? 6 : 3.5} opacity={i === 3 ? .9 : .48} />)}</g>
      <path d="M250 570C398 523 534 546 650 520C790 489 886 505 1008 460" fill="none" stroke="#b79a5d" strokeOpacity=".34" strokeWidth="2" />
      <text x="72" y="117" fill="#9aa0a1" fontSize="17" letterSpacing="5">FINITE-REGION RELATIONAL VISUALIZATION</text>
      <text x="72" y="168" fill="#f0ede5" fontFamily="Georgia, serif" fontSize="52">GRAINIT</text>
      <text x="72" y="207" fill="#73797b" fontSize="14" letterSpacing="3">BOUNDED REGIONS · CROSS-BOUNDARY RELATION · COVARIANCE</text>
      <text x="72" y="690" fill="#666d6e" fontSize="13" letterSpacing="2">NOT PARTICLES · NOT CUBES · NOT PORTAL GEOMETRY</text>
      <Frame id={id} />
    </svg>
  );
}

function IrenVisual({ id }: { id: string }) {
  const layers = ["PRIMARY EVIDENCE", "VALIDATED KNOWLEDGE", "ACTIVE MODELS", "LIVE STATE", "LOCAL KNOWLEDGE", "PERSONAL CONTEXT"];
  return (
    <svg className="visual-art canon-visual" data-canon-visual="iren" viewBox="0 0 1200 760" aria-hidden="true">
      <SharedDefs id={id} />
      <rect width="1200" height="760" fill={`url(#${id}-space)`} />
      <rect width="1200" height="760" fill={`url(#${id}-grid)`} />
      <g transform="translate(510 120)">
        {layers.map((layer,i) => <g key={layer} transform={`translate(${i * 17} ${i * 76})`}><rect width="520" height="58" fill="#0b1216" stroke={i === 0 ? "#4da8ff" : "#8c999e"} strokeOpacity={i === 0 ? .55 : .24} /><text x="20" y="36" fill={i === 0 ? "#b9dcfb" : "#a8afb1"} fontSize="14" letterSpacing="3">{layer}</text></g>)}
      </g>
      <g fill="none" stroke="#4da8ff" strokeOpacity=".23"><path d="M310 245C430 245 430 246 510 246" /><path d="M310 395C420 395 445 398 545 398" /><path d="M310 545C430 545 480 550 580 550" /></g>
      <g fill="#d9d8d1"><circle cx="278" cy="245" r="8" /><circle cx="278" cy="395" r="8" /><circle cx="278" cy="545" r="8" /></g>
      <text x="72" y="118" fill="#9ba1a2" fontSize="17" letterSpacing="5">PROVENANCE-AWARE INTELLIGENCE LAYER</text>
      <text x="72" y="169" fill="#f0ede5" fontFamily="Georgia, serif" fontSize="52">IREN</text>
      <text x="72" y="209" fill="#73797b" fontSize="14" letterSpacing="3">EVIDENCE RETAINED · UNCERTAINTY VISIBLE · AUTHORITY BOUNDED</text>
      <Frame id={id} />
    </svg>
  );
}

function D317Visual({ id }: { id: string }) {
  return (
    <svg className="visual-art canon-visual" data-canon-visual="d3-17" viewBox="0 0 1200 760" aria-hidden="true">
      <SharedDefs id={id} />
      <rect width="1200" height="760" fill="#080b0c" />
      <rect width="1200" height="760" fill={`url(#${id}-grid)`} />
      <g stroke="#76858b" strokeOpacity=".42" fill="#0e1417">
        <rect x="610" y="205" width="350" height="390" />
        <rect x="664" y="258" width="116" height="96" />
        <rect x="807" y="258" width="98" height="96" />
        <rect x="664" y="388" width="241" height="66" />
        <rect x="664" y="485" width="241" height="62" />
      </g>
      <path d="M230 560C310 480 385 455 470 478C528 494 548 465 610 395" fill="none" stroke="#c3a772" strokeOpacity=".62" strokeWidth="3" />
      <g fill="#c3a772">{[[230,560],[310,480],[385,455],[470,478],[610,395]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="5" />)}</g>
      <path d="M220 610H1000" stroke="#b44f4f" strokeOpacity=".25" strokeDasharray="9 12" />
      <text x="72" y="118" fill="#a5a09a" fontSize="17" letterSpacing="5">OLD MERIDIAN / ARCHIVE TEASER</text>
      <text x="72" y="170" fill="#f0ede5" fontFamily="Georgia, serif" fontSize="52">D3-17</text>
      <text x="72" y="210" fill="#777b7b" fontSize="14" letterSpacing="3">INSTRUMENTATION · CONTROL STATE · ACCIDENT RECORD</text>
      <text x="72" y="692" fill="#756f65" fontSize="13" letterSpacing="2">NO VISIBLE PORTAL · LATER MEANING SEALED</text>
      <Frame id={id} />
    </svg>
  );
}

function DeepThreeVisual({ id }: { id: string }) {
  return (
    <svg className="visual-art canon-visual" data-canon-visual="deep-three" viewBox="0 0 1200 760" aria-hidden="true">
      <SharedDefs id={id} />
      <rect width="1200" height="760" fill={`url(#${id}-space)`} />
      <Stars id={id} />
      <path d="M0 520C210 454 420 470 612 508C820 549 975 520 1200 446V760H0Z" fill="#363938" />
      <path d="M0 564C221 503 436 520 620 555C820 593 1000 562 1200 505" fill="#1b1d1d" />
      <g fill="#111719" stroke="#7d898d" strokeOpacity=".43">
        <rect x="650" y="394" width="288" height="135" />
        <rect x="716" y="330" width="111" height="64" />
        <path d="M690 529V650M760 529V650M830 529V650M900 529V650" />
      </g>
      <circle cx="1020" cy="140" r="95" fill="#83949c" fillOpacity=".24" />
      <text x="72" y="117" fill="#a3a5a1" fontSize="17" letterSpacing="5">IONE / LUNAR RESEARCH FACILITY</text>
      <text x="72" y="169" fill="#f0ede5" fontFamily="Georgia, serif" fontSize="52">Deep Three</text>
      <text x="72" y="209" fill="#747a7a" fontSize="14" letterSpacing="3">PUBLIC FACILITY RECORD · LOWER INSTALLATION SEALED</text>
      <Frame id={id} />
    </svg>
  );
}

function PersonVisual({ id, title }: { id: string; title: string }) {
  return (
    <svg className="visual-art canon-visual" data-canon-visual="person" viewBox="0 0 1200 760" aria-hidden="true">
      <SharedDefs id={id} />
      <rect width="1200" height="760" fill={`url(#${id}-space)`} />
      <rect width="1200" height="760" fill={`url(#${id}-grid)`} opacity=".55" />
      <circle cx="800" cy="262" r="126" fill="#1c2529" stroke="#82949d" strokeOpacity=".3" />
      <path d="M535 695C548 493 641 412 800 412C959 412 1051 493 1066 695Z" fill="#10171a" stroke="#61727a" strokeOpacity=".34" />
      <circle cx="800" cy="262" r="198" fill="none" stroke="#4da8ff" strokeOpacity=".08" />
      <path d="M470 514H1110M800 65V675" stroke="#d8dedf" strokeOpacity=".06" />
      <text x="72" y="610" fill="#9aa0a0" fontSize="17" letterSpacing="5">PUBLIC PERSON RECORD</text>
      <text x="72" y="657" fill="#f0ede5" fontFamily="Georgia, serif" fontSize="48">{title}</text>
      <text x="72" y="691" fill="#727879" fontSize="14" letterSpacing="3">PORTRAIT ART NOT YET CANON-LOCKED</text>
      <Frame id={id} />
    </svg>
  );
}

export function CanonVisual({ record, className = "" }: { record: PublicObject; className?: string }) {
  const id = useId().replace(/:/g, "");
  const wrap = (visual: JSX.Element) => <div className={`canon-visual-wrap ${className}`}>{visual}</div>;

  switch (record.slug) {
    case "veyra": return wrap(<VeyraVisual id={id} />);
    case "ione": return wrap(<IoneVisual id={id} />);
    case "ovara": return wrap(<PlanetVisual id={id} warm title="Ovara" system="HELOR SYSTEM / PUBLIC ORIENTATION" />);
    case "neral": return wrap(<PlanetVisual id={id} title="Neral" system="IRSEN SYSTEM / CONNECTED WORLD" />);
    case "greater-serein": return wrap(<GreaterSereinVisual id={id} />);
    case "merva": return wrap(<MervaVisual id={id} />);
    case "serein-skygate":
    case "skygate-megastructure": return wrap(<SkygateVisual id={id} />);
    case "neral-skygate": return wrap(<SkygateVisual id={id} neral />);
    case "open-road":
    case "connected-worlds": return wrap(<OpenRoadVisual id={id} />);
    case "continuance-institute": return wrap(<ContinuanceVisual id={id} />);
    case "grainit": return wrap(<GrainitVisual id={id} />);
    case "iren": return wrap(<IrenVisual id={id} />);
    case "d3-17": return wrap(<D317Visual id={id} />);
    case "deep-three": return wrap(<DeepThreeVisual id={id} />);
    case "nali-solan":
    case "rena-sol":
    case "lio-sol":
    case "talin-vel":
    case "elias-venn": return wrap(<PersonVisual id={id} title={record.title} />);
    default: return wrap(<VisualArt visualKey={record.visualKey} />);
  }
}
