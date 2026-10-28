import {useId} from "react";

/**
 * Hand-authored, deterministic SVG environment. This is art-direction UI,
 * NOT captured gameplay, a procedurally generated release screenshot or
 * approved cinematic video. No additional WebGL context, remote asset,
 * synthetic telemetry, animation loop, user tracking or download.
 */
export function SeveranceWorldSceneV138({className=""}:{className?:string}){
 const uid=useId().replace(/:/g,"");
 const sky="sev138-sky-"+uid,moon="sev138-moon-"+uid,atmo="sev138-atmo-"+uid,city="sev138-city-"+uid;
 return <svg className={"av138-world-scene "+className} viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
  <defs>
   <linearGradient id={sky} x1="0" y1="0" x2="0.15" y2="1"><stop stopColor="#03070c"/><stop offset=".35" stopColor="#1c2a33"/><stop offset=".68" stopColor="#263139"/><stop offset="1" stopColor="#080d13"/></linearGradient>
   <radialGradient id={moon} cx=".5" cy=".5" r=".5"><stop stopColor="#e0bfa0" stopOpacity=".42"/><stop offset=".52" stopColor="#7c706c" stopOpacity=".25"/><stop offset="1" stopColor="#1e2730" stopOpacity="0"/></radialGradient>
   <linearGradient id={atmo} x1="0" y1="0" x2=".9" y2="1"><stop stopColor="#a9afb1" stopOpacity="0"/><stop offset=".58" stopColor="#98a6aa" stopOpacity=".2"/><stop offset="1" stopColor="#070b11" stopOpacity=".9"/></linearGradient>
   <linearGradient id={city} x1="0" y1="0" x2=".9" y2="1"><stop stopColor="#34404a"/><stop offset=".32" stopColor="#141e26"/><stop offset="1" stopColor="#090d12"/></linearGradient>
  </defs>
  <rect width="1600" height="900" fill={"url(#"+sky+")"}/>
  <g opacity=".55" className="av138-clouds">
   <path d="M0 138Q143 83 245 119T483 103Q598 58 775 143T1130 100Q1307 28 1600 137V266Q1403 204 1279 252T966 224Q826 206 664 242T288 206Q122 180 0 253Z" fill="#111a22"/>
   <path d="M-38 260Q98 158 260 189T561 166Q745 124 896 217T1215 187Q1413 140 1643 217V323Q1480 249 1295 291T976 278Q795 254 599 290T232 276Q67 269-38 320Z" fill="#35424a" opacity=".8"/>
   <path d="M0 365Q132 312 299 327T577 316Q743 273 929 344T1304 321Q1473 280 1600 335V445H0Z" fill="#444b4c" opacity=".27"/>
  </g>
  <circle cx="1048" cy="234" r="277" fill={"url(#"+moon+")"}/>
  <circle cx="1048" cy="234" r="95" fill="#b0aba0" opacity=".21"/>
  <circle cx="1042" cy="230" r="92" fill="#0b151f"/>
  <path d="M1033 136A96 96 0 0 1 1139 227" stroke="#bd6a53" strokeWidth="4" fill="none" opacity=".8"/>
  <g opacity=".5" fill="#17232c">
   <path d="M0 427L66 341L116 390L187 318L266 414L354 332L465 437L560 353L637 409L735 324L879 421L996 358L1138 430L1264 335L1375 432L1492 365L1600 421V900H0Z"/>
  </g>
  <path d="M0 530L119 442L217 470L305 412L421 489L506 444L646 515L753 452L872 495L1002 430L1124 482L1279 412L1414 465L1533 433L1600 475V900H0Z" fill="#17242c" opacity=".9"/>
  <path d="M0 582L121 516L249 538L354 493L496 545L632 484L782 548L897 492L1014 562L1139 497L1250 542L1378 494L1514 535L1600 515V900H0Z" fill="#0d1821"/>
  <g className="av138-broken-arc" opacity=".9">
   <path d="M888 567A360 360 0 0 1 1380 88" stroke="#080e14" strokeWidth="62" fill="none"/>
   <path d="M885 557A352 352 0 0 1 1376 93" stroke="#45525a" strokeWidth="31" fill="none"/>
   <path d="M891 562A355 355 0 0 1 1377 95" stroke="#70818a" strokeWidth="3" fill="none" opacity=".54"/>
   <path d="M1378 89A355 355 0 0 1 1535 413" stroke="#070d12" strokeWidth="61" fill="none"/>
   <path d="M1379 91A350 350 0 0 1 1531 398" stroke="#2f3e47" strokeWidth="34" fill="none"/>
   <path d="M1266 104L1305 129M1447 140L1478 164M1502 236L1546 240M989 210L1021 255M893 396L935 418" stroke="#121c23" strokeWidth="10"/>
   <path d="M1239 108l32-22m168 52l23-26M904 392l-26 1" stroke="#ce695d" strokeWidth="4" opacity=".58"/>
  </g>
  <g className="av138-city-far" opacity=".8" fill={"url(#"+city+")"}>
   <path d="M648 535V452H712V392H767V489H811V441H863V537Z"/>
   <path d="M796 553V429H839V368H876V456H911V401H950V554Z"/>
   <path d="M1466 553V437H1500V402H1544V457H1600V562Z"/>
   <rect x="920" y="417" width="38" height="123"/><rect x="956" y="463" width="28" height="85"/>
  </g>
  <g className="av138-facility">
   <path d="M1029 635V423H1070V343H1147V397H1181V300H1267V405H1314V263H1482V605H1512V519H1600V722H1029Z" fill="#080d12" stroke="#42505a" strokeWidth="3"/>
   <path d="M1069 423V343H1147V396H1181V300H1267V404H1314V263H1482V607L1437 575V293H1362V544L1297 522V439H1235V352H1209V533L1148 511V459H1099V604Z" fill="#232f37" opacity=".6"/>
   <path d="M1064 405L1091 400V329L1110 308L1116 290L1123 330H1145L1151 405Z" fill="#101820"/>
   <path d="M1330 263V213H1355V188H1377V248M1433 264V208H1457V184L1466 171" fill="none" stroke="#3b4c57" strokeWidth="8"/>
   <path d="M1377 188V128M1459 185V97M1254 300V231M1141 341V276" stroke="#60707c" strokeWidth="4"/>
   <path d="M1371 129L1383 129M1452 101L1465 101M1248 233L1263 233" stroke="#d2a2a0" strokeWidth="3"/>
   <path d="M1184 371H1255M1339 324H1465M1339 388H1465M1339 453H1465M1189 453H1264" stroke="#344550" strokeWidth="9"/>
   <path d="M1092 507H1460M1121 544H1513M1051 601H1594" stroke="#4a5b64" strokeWidth="8" opacity=".6"/>
   <g fill="#a13b3a" className="av138-scene-beacons">
    <rect x="1355" y="314" width="5" height="14"/><rect x="1390" y="314" width="5" height="14"/><rect x="1427" y="314" width="5" height="14"/>
    <rect x="1355" y="377" width="5" height="15"/><rect x="1390" y="377" width="5" height="15"/><rect x="1427" y="377" width="5" height="15"/>
    <rect x="1220" y="432" width="8" height="17"/><rect x="1245" y="432" width="7" height="17"/>
    <circle cx="1459" cy="94" r="6"/><circle cx="1255" cy="228" r="5"/>
   </g>
   <path d="M1350 484V550H1479V484Z" fill="#111921"/>
   <circle cx="1416" cy="504" r="17" fill="none" stroke="#95a4a5" strokeWidth="3" opacity=".5"/>
   <path d="M1404 504H1429M1416 491V516" stroke="#95a4a5" strokeWidth="2" opacity=".5"/>
   <path d="M1043 626L1072 636L1201 617L1321 640L1463 608L1598 657" fill="none" stroke="#c0534b" strokeWidth="5" opacity=".52"/>
   <path d="M1034 591H1600" stroke="#151d23" strokeWidth="35"/>
  </g>
  <g className="av138-city-front" fill="#0a1118">
   <path d="M581 662V562H636V592H682V523H714V574H762V625H813V676Z"/>
   <path d="M954 671V581H1007V534H1047V607H1098V663Z"/>
   <path d="M1038 673V627H1133V593H1173V626H1308V675Z"/>
   <path d="M0 683V599H53V564H92V612H138V573H192V694Z"/>
  </g>
  <path d="M1021 549H1331V565H1010Z" fill="#20272c"/>
  <path d="M1069 562L1117 619H1137L1105 562M1266 562L1290 637H1308L1298 562" stroke="#151d22" strokeWidth="14"/>
  <g className="av138-weather">
   <path d="M0 611Q258 589 519 623T1070 618Q1337 586 1600 615V713Q1344 694 1104 708T545 693Q243 690 0 711Z" fill="#9da6a3" opacity=".075"/>
   <path d="M0 669Q359 651 626 681T1115 687Q1345 657 1600 677V743Q1310 713 1111 730T545 731Q203 713 0 730Z" fill="#a8abaa" opacity=".07"/>
   <path d="M0 733Q448 698 789 731T1600 727V803H0Z" fill="#c0c3bc" opacity=".05"/>
  </g>
  <path d="M0 900V756L86 722L147 739L208 701L284 740L352 709L437 753L532 711L644 762L714 708L817 749L885 709L984 750L1078 712L1212 758L1320 710L1432 744L1538 702L1600 737V900Z" fill="#090e13"/>
  <g fill="#080c10" stroke="#0c1217" strokeWidth="3">
   <path d="M52 748l34-151 31 151-32-22Z M68 698l-29-13 40-20-28-6 36-34 30 38-27 0 41 23-38 3 34 17-42 0Z"/>
   <path d="M154 737l39-198 39 197-39-26Z M191 546l-53 88 29-3-31 35 38-8-33 27 53-5 37 13-21-32 40 10-34-36 26-2Z"/>
   <path d="M354 741l43-169 44 177-43-28Z M392 594l-42 65 31-6-39 46 46-6-35 27 44-8 42 13-28-29 42 4-39-43 26 2Z"/>
   <path d="M535 736l42-178 44 186-43-23Z M569 584l-44 76 26-2-33 40 41-3-30 28 43-6 50 15-32-31 39 9-30-46 28 4Z"/>
   <path d="M1469 746l46-220 40 226-41-28Z M1514 547l-45 84 28-3-47 49 48-9-43 32 56-5 52 11-37-35 49 3-48-44 28 5Z"/>
   <path d="M1551 743l22-150 28 160-30-12Z M1572 605l-27 55 20-3-24 29 28-6-23 22 28-5 27 10-19-22 29 4-22-32 18 5Z"/>
  </g>
  <g className="av138-survivor" transform="translate(808 610)" fill="#07090c" stroke="#1d252b" strokeWidth="3">
   <ellipse cx="21" cy="173" rx="72" ry="16" fill="#020509" opacity=".65" stroke="none"/>
   <path d="M-21 30Q-30 14-12 1L21-11Q42-11 49 13L49 45L33 57L-18 53Z"/>
   <path d="M-20 48L-46 91L-37 120L-10 117L-1 78Z"/>
   <path d="M40 49L69 92L70 118L51 127L27 83Z"/>
   <path d="M-24 45L41 43L55 109L27 131L-25 122L-35 88Z"/>
   <path d="M-24 116L-29 172L-10 181L7 130M23 124L34 178L56 181L43 113" strokeWidth="16" strokeLinecap="round"/>
   <path d="M-33 53L-58 75L-55 110L-32 119L-16 69Z" fill="#14191d"/>
   <path d="M-28 62L-32 101M-16 55L-12 118M32 56L37 124" fill="none" stroke="#424747" strokeWidth="3" opacity=".75"/>
   <path d="M57 114L88 104L117 139" stroke="#080b0e" strokeWidth="6" fill="none"/>
   <path d="M74 108L108 90" stroke="#050609" strokeWidth="4"/>
  </g>
  <g opacity=".25">
   <path d="M0 900L106 812L253 862L435 793L580 864L710 794L829 854L1010 796L1119 863L1333 812L1465 861L1600 792V900Z" fill="#253037"/>
   <path d="M0 843L114 821L256 845L426 827L561 854L780 835L994 859L1237 837L1427 862L1600 831V900H0Z" fill="#0b1117"/>
  </g>
  <rect width="1600" height="900" fill={"url(#"+atmo+")"} opacity=".24"/>
 </svg>;
}

export type SeverancePlateKindV138="perimeter"|"containment"|"outpost"|"signal";

export function SeverancePlateArtV138({kind}:{kind:SeverancePlateKindV138}){
 const id=useId().replace(/:/g,""),grad="sev138-card-"+id;
 return <svg className={"av138-plate-art av138-plate-art--"+kind} viewBox="0 0 640 360" preserveAspectRatio="xMidYMid slice" role="img"
   aria-label={"Illustrative concept environment: "+({perimeter:"forest perimeter",containment:"containment facility",outpost:"survivor outpost",signal:"relay dish"}[kind])}>
  <defs><linearGradient id={grad} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#293942"/><stop offset=".55" stopColor="#17222b"/><stop offset="1" stopColor="#090e14"/></linearGradient></defs>
  <rect width="640" height="360" fill={"url(#"+grad+")"}/>
  {kind==="perimeter"&&<>
   <path d="M0 190L71 119L153 180L227 116L308 184L392 110L462 172L562 117L640 181V360H0Z" fill="#202c35"/>
   <path d="M0 234L81 183L139 215L219 156L293 222L383 164L447 226L546 179L640 227V360H0Z" fill="#101b24"/>
   <path d="M275 218V103H327V72H355V221Z" fill="#0b1117"/><rect x="311" y="111" width="7" height="8" fill="#a94841"/><path d="M336 73V38" stroke="#7c9094" strokeWidth="3"/>
   <path d="M0 360L110 263L230 299L322 231L415 286L529 249L640 315V360Z" fill="#090e13"/>
   {[40,104,165,475,531,607].map((x,i)=><g key={x} transform={"translate("+x+" "+(i%2?216:199)+")"} fill="#0a1015"><path d="M0 0L-23 86H22Z"/><path d="M0-44L-33 65H30Z"/><path d="M0-71L-22 14H24Z"/><rect x="-4" y="62" width="8" height="69"/></g>)}
   <path d="M262 360L320 258L384 360Z" fill="#283339" opacity=".52"/>
   <path d="M300 304l-8 13 12 7 10-2-2-19-9-5Z" fill="#050a0f"/>
  </>}
  {kind==="containment"&&<>
   <path d="M0 0L201 115V307L0 360ZM640 0L439 115V307L640 360Z" fill="#10171e" stroke="#56616a" strokeWidth="3"/>
   <path d="M0 0L202 118H437L640 0" fill="#1b2730" stroke="#4d5a61" strokeWidth="5"/>
   <path d="M0 360L202 270H437L640 360Z" fill="#101318" stroke="#5d5550" strokeWidth="3"/>
   <rect x="235" y="98" width="169" height="184" fill="#080d12" stroke="#4e5b62" strokeWidth="9"/>
   <rect x="256" y="130" width="127" height="138" fill="#1d1b1f"/><path d="M318 130V267" stroke="#6a5150" strokeWidth="3"/>
   <rect x="295" y="91" width="52" height="9" fill="#c45442"/><path d="M198 111L149 48M440 111L491 48" stroke="#62686b" strokeWidth="5"/>
   <path d="M280 266L300 211L311 179L330 160L349 192L365 266Z" fill="#06090d"/>
   <circle cx="322" cy="173" r="17" fill="#07090d"/><path d="M312 174l8 1M333 174l-8 1" stroke="#c65445" strokeWidth="2"/>
   <path d="M286 224l-29 44M357 223l34 40" stroke="#090b0e" strokeWidth="12"/>
   <path d="M0 0L199 115V360H0Z" fill="#72828a" opacity=".035"/>
  </>}
  {kind==="outpost"&&<>
   <path d="M0 208L77 164L169 211L244 159L320 224L413 150L517 222L601 166L640 208V360H0Z" fill="#17242b"/>
   <path d="M0 260L101 216L214 248L321 220L418 253L531 211L640 273V360H0Z" fill="#0a151d"/>
   <path d="M68 252H571V263H68ZM90 264V322M238 262V340M458 262V329M549 263V312" stroke="#33434a" strokeWidth="8"/>
   <path d="M230 292Q318 201 401 292Z" fill="#453528" opacity=".35"/>
   <path d="M301 306Q283 280 313 257Q327 274 334 291Q350 280 347 309Z" fill="#d06a40"/>
   <path d="M291 319Q309 296 314 275M325 319L320 276M338 317L336 285" fill="none" stroke="#e49b62" strokeWidth="4"/>
   {[177,422,498].map((x,i)=><g key={x} transform={"translate("+x+" "+(i===1?240:255)+")"} fill="#070b0e"><circle cx="0" cy="0" r="13"/><path d="M-13 13L-25 47L25 47L12 13Z"/><path d="M-12 23L-24 62M13 24L22 60" stroke="#090c10" strokeWidth="7"/></g>)}
   <path d="M0 324L97 299L209 333L328 312L429 328L540 306L640 335V360H0Z" fill="#050a10"/>
  </>}
  {kind==="signal"&&<>
   <path d="M0 244L108 181L228 229L327 167L422 234L534 186L640 239V360H0Z" fill="#142129"/>
   <path d="M319 302V137M260 301L319 148L385 302" stroke="#52616b" strokeWidth="11" fill="none"/>
   <path d="M187 83Q300 218 456 82L441 105Q321 231 210 111Z" fill="#485761" stroke="#92a0a0" strokeWidth="3"/>
   <path d="M189 84L462 79M317 153L320 48" stroke="#778c95" strokeWidth="6"/><path d="M304 59l31-18" stroke="#b54d4a" strokeWidth="5"/>
   <path d="M319 155L204 101M319 155L445 100" stroke="#0b131b" strokeWidth="5"/>
   <rect x="430" y="211" width="82" height="105" fill="#0b141b"/><path d="M451 211V162H470V213M479 213V183" stroke="#4b5f68" strokeWidth="7"/>
   <circle cx="452" cy="165" r="6" fill="#bc4f47"/>
   <path d="M0 331L116 283L203 323L314 294L423 329L510 280L640 330V360H0Z" fill="#060c12"/>
  </>}
  <path d="M0 354H640" stroke="#b74f45" strokeWidth="2" opacity=".6"/>
 </svg>;
}
