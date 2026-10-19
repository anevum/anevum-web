/**
 * Continuance Entry / V052.
 * All geometry is resolution-independent SVG; no enlarged hero raster.
 * The atmosphere uses layered light, metallic edge gradients, cloud noise,
 * star parallax and physically suggested rim lighting.
 * Decorative only: the sign-in form remains real DOM and accessible.
 */
export function ContinuanceEntryArtwork(){
 return <svg className="av52-universe-art" viewBox="0 0 1000 1080" fill="none"
   xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"
   preserveAspectRatio="xMidYMid meet">
   <defs>
     <radialGradient id="av52-nebula" cx="0" cy="0" r="1" gradientTransform="translate(540 442) rotate(91) scale(600 590)" gradientUnits="userSpaceOnUse">
       <stop stopColor="#56314e"/><stop offset=".29" stopColor="#241f3e"/><stop offset=".7" stopColor="#0c1324"/><stop offset="1" stopColor="#070c18"/>
     </radialGradient>
     <radialGradient id="av52-violet-cloud" cx="0" cy="0" r="1" gradientTransform="translate(664 244) rotate(118) scale(424 314)" gradientUnits="userSpaceOnUse">
       <stop stopColor="#985ea4" stopOpacity=".46"/><stop offset=".48" stopColor="#583774" stopOpacity=".2"/><stop offset="1" stopColor="#281a42" stopOpacity="0"/>
     </radialGradient>
     <radialGradient id="av52-coral-cloud" cx="0" cy="0" r="1" gradientTransform="translate(303 697) rotate(62) scale(410 388)" gradientUnits="userSpaceOnUse">
       <stop stopColor="#e78069" stopOpacity=".29"/><stop offset=".42" stopColor="#a4496d" stopOpacity=".14"/><stop offset="1" stopColor="#a4496d" stopOpacity="0"/>
     </radialGradient>
     <radialGradient id="av52-halo" cx="0" cy="0" r="1" gradientTransform="translate(500 525) rotate(90) scale(390 390)" gradientUnits="userSpaceOnUse">
       <stop offset=".45" stopColor="#ffaa88" stopOpacity="0"/><stop offset=".66" stopColor="#ec8d9f" stopOpacity=".11"/><stop offset=".8" stopColor="#b778df" stopOpacity=".055"/><stop offset="1" stopColor="#9658c4" stopOpacity="0"/>
     </radialGradient>
     <radialGradient id="av52-world" cx="0" cy="0" r="1" gradientTransform="translate(394 368) rotate(57) scale(404 368)" gradientUnits="userSpaceOnUse">
       <stop stopColor="#fff2cd"/><stop offset=".11" stopColor="#ffd4b3"/><stop offset=".29" stopColor="#db9c9d"/><stop offset=".53" stopColor="#82446c"/><stop offset=".77" stopColor="#362e59"/><stop offset=".94" stopColor="#171c32"/><stop offset="1" stopColor="#101729"/>
     </radialGradient>
     <linearGradient id="av52-world-rim" x1="350" y1="248" x2="693" y2="758" gradientUnits="userSpaceOnUse">
       <stop stopColor="#ffe1c4" stopOpacity=".92"/><stop offset=".19" stopColor="#ffdcb2" stopOpacity=".36"/><stop offset=".48" stopColor="#ac80c2" stopOpacity=".04"/><stop offset=".75" stopColor="#d079ad" stopOpacity=".16"/><stop offset="1" stopColor="#8b63ae" stopOpacity=".76"/>
     </linearGradient>
     <linearGradient id="av52-band" x1="140" y1="680" x2="818" y2="320" gradientUnits="userSpaceOnUse">
       <stop stopColor="#8a5f9f" stopOpacity="0"/><stop offset=".15" stopColor="#b27db6" stopOpacity=".26"/><stop offset=".35" stopColor="#ffbca3" stopOpacity=".94"/><stop offset=".51" stopColor="#fff1cf"/><stop offset=".7" stopColor="#dda1b3" stopOpacity=".72"/><stop offset=".87" stopColor="#a277cc" stopOpacity=".22"/><stop offset="1" stopColor="#734f8f" stopOpacity="0"/>
     </linearGradient>
     <linearGradient id="av52-band-dark" x1="170" y1="820" x2="865" y2="197" gradientUnits="userSpaceOnUse">
       <stop stopColor="#392d52" stopOpacity="0"/><stop offset=".26" stopColor="#c984af" stopOpacity=".52"/><stop offset=".53" stopColor="#ffdfc3" stopOpacity=".85"/><stop offset=".71" stopColor="#ce91e4" stopOpacity=".48"/><stop offset="1" stopColor="#392d52" stopOpacity="0"/>
     </linearGradient>
     <linearGradient id="av52-rail" x1="185" y1="214" x2="853" y2="833" gradientUnits="userSpaceOnUse">
       <stop stopColor="#f5c9c7" stopOpacity=".04"/><stop offset=".23" stopColor="#a97abb" stopOpacity=".35"/><stop offset=".52" stopColor="#ffd8b9" stopOpacity=".78"/><stop offset=".8" stopColor="#a369aa" stopOpacity=".4"/><stop offset="1" stopColor="#edb9bb" stopOpacity=".09"/>
     </linearGradient>
     <radialGradient id="av52-moon" cx="0" cy="0" r="1" gradientTransform="translate(710 221) rotate(50) scale(83)">
       <stop stopColor="#fff4df"/><stop offset=".31" stopColor="#cda7e5"/><stop offset=".68" stopColor="#835793"/><stop offset="1" stopColor="#292345"/>
     </radialGradient>
     <filter id="av52-soft-glow" x="-75%" y="-75%" width="250%" height="250%">
       <feGaussianBlur stdDeviation="23"/>
     </filter>
     <filter id="av52-small-glow" x="-150%" y="-150%" width="400%" height="400%">
       <feGaussianBlur stdDeviation="5"/>
     </filter>
     <filter id="av52-grain" x="0%" y="0%" width="100%" height="100%">
       <feTurbulence type="fractalNoise" baseFrequency=".022 .034" numOctaves="3" seed="13" stitchTiles="stitch" result="cloud"/>
       <feColorMatrix type="saturate" values="0"/>
       <feComponentTransfer><feFuncA type="linear" slope=".16"/></feComponentTransfer>
     </filter>
     <clipPath id="av52-planet-clip"><circle cx="509" cy="514" r="218"/></clipPath>
     <radialGradient id="av52-star" cx="0" cy="0" r="1" gradientTransform="translate(.5 .5) scale(.5)">
       <stop stopColor="#fff4e8"/><stop offset="1" stopColor="#ffc4c8" stopOpacity="0"/>
     </radialGradient>
   </defs>
   <rect width="1000" height="1080" fill="url(#av52-nebula)"/>
   <rect width="1000" height="1080" fill="url(#av52-violet-cloud)"/>
   <rect width="1000" height="1080" fill="url(#av52-coral-cloud)"/>
   <path d="M-40 838C182 600 302 584 491 468c217-133 363-314 609-314" stroke="#b17dbb" strokeWidth="124" opacity=".07" filter="url(#av52-soft-glow)"/>
   <path d="M-115 1019C190 721 251 786 487 550c210-212 324-326 640-401" stroke="#ffb3a7" strokeWidth="70" opacity=".075" filter="url(#av52-soft-glow)"/>
   <g className="av52-space-stars">
     <g fill="#fcdfd4">
       <circle cx="110" cy="133" r="1.8"/><circle cx="248" cy="93" r="1.2"/><circle cx="350" cy="172" r="1.7"/>
       <circle cx="427" cy="69" r="1.3"/><circle cx="589" cy="108" r="1.5"/><circle cx="859" cy="100" r="1.6"/>
       <circle cx="921" cy="263" r="1.3"/><circle cx="795" cy="391" r="1.9"/><circle cx="120" cy="479" r="1.5"/>
       <circle cx="187" cy="621" r="1.3"/><circle cx="892" cy="636" r="1.5"/><circle cx="90" cy="768" r="1.5"/>
       <circle cx="264" cy="920" r="1.5"/><circle cx="756" cy="947" r="1.1"/><circle cx="903" cy="999" r="1.9"/>
       <circle cx="612" cy="892" r="1.2"/><circle cx="64" cy="337" r="1.1"/><circle cx="694" cy="39" r="1"/>
       <circle cx="971" cy="483" r="1.1"/><circle cx="310" cy="1022" r="1.2"/><circle cx="840" cy="779" r="1"/>
     </g>
     <g fill="#af94d8" opacity=".65">
       <circle cx="274" cy="260" r="1.4"/><circle cx="669" cy="133" r="1.2"/><circle cx="911" cy="538" r="1.3"/>
       <circle cx="216" cy="713" r="1.2"/><circle cx="742" cy="847" r="1.5"/><circle cx="380" cy="882" r="1.2"/>
       <circle cx="960" cy="779" r="1"/><circle cx="62" cy="949" r="1.4"/><circle cx="774" cy="54" r="1.1"/>
       <circle cx="504" cy="991" r="1.5"/><circle cx="930" cy="142" r="1.1"/>
     </g>
     <g className="av52-flicker">
       <path d="M122 295v20m-10-10h20" stroke="#ffe2c7" strokeWidth="1.4"/>
       <path d="M821 723v25m-12.5-12.5h25" stroke="#ffd7e0" strokeWidth="1.2"/>
       <path d="M771 173v13m-6.5-6.5h13" stroke="#c7b1ff" strokeWidth="1"/>
     </g>
   </g>
   <g opacity=".34" stroke="#e3afd9" strokeWidth=".6">
     <circle cx="509" cy="514" r="307" strokeDasharray="2 18"/>
     <circle cx="509" cy="514" r="378" strokeDasharray="1 25"/>
     <path d="M509 96v40m0 760v39M90 514h44m746 0h40"/>
   </g>
   <circle cx="509" cy="514" r="394" fill="url(#av52-halo)" className="av52-pulse-halo"/>
   <circle cx="509" cy="514" r="238" fill="#ea8496" opacity=".16" filter="url(#av52-soft-glow)"/>
   <g className="av52-orbit-outer">
     <ellipse cx="509" cy="514" rx="384" ry="164" transform="rotate(-26 509 514)" stroke="url(#av52-rail)" strokeWidth="2.5" opacity=".65"/>
     <ellipse cx="509" cy="514" rx="404" ry="186" transform="rotate(32 509 514)" stroke="#b68dcd" strokeWidth="1.3" opacity=".24" strokeDasharray="4 17"/>
     <ellipse cx="509" cy="514" rx="341" ry="100" transform="rotate(-26 509 514)" stroke="url(#av52-band-dark)" strokeWidth="22" opacity=".12"/>
   </g>
   <path d="M149 651C254 775 721 597 888 347" stroke="url(#av52-band)" strokeWidth="21" strokeLinecap="round" opacity=".28" filter="url(#av52-small-glow)"/>
   <path d="M149 651C254 775 721 597 888 347" stroke="url(#av52-band)" strokeWidth="8" strokeLinecap="round" opacity=".67"/>
   <circle cx="509" cy="514" r="218" fill="url(#av52-world)"/>
   <g clipPath="url(#av52-planet-clip)">
     <rect x="282" y="293" width="455" height="452" fill="#e3a6b8" filter="url(#av52-grain)"/>
     <path d="M269 484c92-156 196-124 256-64s143 34 234-48" stroke="#ffe0bf" strokeWidth="70" opacity=".12" filter="url(#av52-soft-glow)"/>
     <path d="M250 602c126-102 197-79 267-13 71 67 136 85 255-7" stroke="#f1baca" strokeWidth="80" opacity=".15" filter="url(#av52-soft-glow)"/>
     <path d="M280 489c122-95 224-82 316-18 77 53 128 32 169 4M245 641c102-106 237-118 329-58s168 47 214 22" stroke="#fff2d1" strokeWidth="2" opacity=".12"/>
     <path d="M296 673c148-111 268-5 339-25 71-20 132-57 153-82" stroke="#a86a9e" strokeWidth="24" opacity=".2"/>
   </g>
   <circle cx="509" cy="514" r="217" stroke="url(#av52-world-rim)" strokeWidth="2.3"/>
   <path d="M344 366a218 218 0 0 1 323-17" stroke="#fff4dd" opacity=".48" strokeLinecap="round" strokeWidth="3"/>
   <path d="M328 383a219 219 0 0 1 275-78" stroke="#ffe4d3" opacity=".13" strokeWidth="12" filter="url(#av52-small-glow)"/>
   <g className="av52-orbit-foreground">
     <path d="M147 654c125 143 552-12 744-306" stroke="url(#av52-band)" strokeWidth="18" strokeLinecap="round" opacity=".19" filter="url(#av52-small-glow)"/>
     <path d="M143 657C250 755 693 646 895 341" stroke="url(#av52-band)" strokeWidth="8" strokeLinecap="round"/>
     <path d="M126 669C244 788 714 632 899 354" stroke="#ffe2cb" strokeOpacity=".48" strokeWidth="1.9" strokeLinecap="round"/>
     <path d="M169 658C306 720 741 544 870 375" stroke="#fff2db" strokeWidth="1" opacity=".27"/>
   </g>
   <g className="av52-satellite">
     <circle cx="754" cy="219" r="74" fill="#c69fd3" opacity=".08" filter="url(#av52-soft-glow)"/>
     <circle cx="754" cy="219" r="47" fill="url(#av52-moon)" stroke="#eac4ee" strokeOpacity=".65" strokeWidth="1.7"/>
     <ellipse cx="754" cy="219" rx="73" ry="14" transform="rotate(-29 754 219)" stroke="url(#av52-band)" strokeWidth="4.5" opacity=".78"/>
     <circle cx="741" cy="205" r="8" fill="#fff2df" opacity=".3" filter="url(#av52-small-glow)"/>
   </g>
   <g className="av52-signal-points">
     <circle cx="182" cy="695" r="4" fill="#ffd7bd"/><circle cx="182" cy="695" r="11" stroke="#ffd7bd" strokeOpacity=".35"/>
     <circle cx="810" cy="375" r="3.5" fill="#efbef3"/><circle cx="810" cy="375" r="11" stroke="#efbef3" strokeOpacity=".25"/>
     <path d="M182 695l-76 47h-42M810 375l42-72h49" stroke="#dbabd7" strokeOpacity=".55" strokeWidth="1"/>
   </g>
   <path d="M74 865h232M74 876h132M755 892h169M805 903h119" stroke="#cab1d2" strokeOpacity=".3" strokeWidth="1"/>
   <rect x=".5" y=".5" width="999" height="1079" stroke="#a583b3" strokeOpacity=".13"/>
 </svg>;
}
