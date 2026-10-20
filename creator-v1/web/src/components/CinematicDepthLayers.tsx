import {CinematicAtmosphere} from "./CinematicAtmosphere";
import {CinematicPortalFX} from "./CinematicPortalFX";

/**
 * V011 — original artwork *passes* for V009's established cinematic portal.
 *
 * Real HTML/React content remains above this decorative layer. The scene is
 * assembled from the already-committed alpha WebP haze/dust at desktop and
 * phone dimensions, an offscreen-suspended canvas emissive pass, and original
 * near-field architectural silhouettes. No composited screenshot, copied
 * user/project covers, fake avatars or fictional activity is used.
 *
 * A full newly commissioned environment painting is STILL REQUIRED for final
 * owner fidelity acceptance. This is a material depth pass, not that master.
 */
export function CinematicDepthLayers(){
  return <div className="av11-depth-layers" aria-hidden="true"
      data-environment-passes="haze,dust,emissive,foreground">
    <div className="av11-depth-atmosphere"><CinematicAtmosphere/></div>
    <span className="av11-depth-ambient" />
    <div className="av11-depth-emissive"><CinematicPortalFX/></div>
    <svg className="av11-depth-foreground" xmlns="http://www.w3.org/2000/svg"
         width="1600" height="640" viewBox="0 0 1600 640"
         preserveAspectRatio="xMidYMid slice" fill="none" focusable="false">
      <defs>
        <linearGradient id="av11-rock" x1="1" y1="0" x2=".1" y2=".92">
          <stop stopColor="#030a14" stopOpacity=".15"/>
          <stop offset=".27" stopColor="#050819" stopOpacity=".62"/>
          <stop offset=".78" stopColor="#060817" stopOpacity=".83"/>
          <stop offset="1" stopColor="#040813" stopOpacity=".88"/>
        </linearGradient>
        <linearGradient id="av11-metal" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#825e58" stopOpacity=".15"/>
          <stop offset=".45" stopColor="#e7ab84" stopOpacity=".51"/>
          <stop offset="1" stopColor="#7b6c95" stopOpacity=".12"/>
        </linearGradient>
        <radialGradient id="av11-fire" cx=".5" cy=".5" r=".5">
          <stop stopColor="#fff1b7" stopOpacity=".7"/>
          <stop offset=".19" stopColor="#f4b37a" stopOpacity=".31"/>
          <stop offset="1" stopColor="#e49f7b" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id="av11-floor" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#070b17" stopOpacity="0"/>
          <stop offset=".45" stopColor="#060a17" stopOpacity=".55"/>
          <stop offset="1" stopColor="#060817" stopOpacity=".96"/>
        </linearGradient>
      </defs>
      <g className="av11-near-rockwork">
        <path d="M1600 0H1569L1551 18L1539 9L1506 56L1521 93L1496 113L1510 181L1482 218L1501 271L1478 319L1518 368L1496 409L1546 451L1516 502L1600 541Z"
          fill="url(#av11-rock)"/>
        <path d="M1600 75L1567 127L1557 194L1588 215L1540 267L1560 316L1547 361"
          stroke="url(#av11-metal)" strokeWidth="2.7" opacity=".68"/>
        <path d="M1571 52L1522 92L1514 142L1554 157L1555 208" stroke="#917687" strokeWidth="1.5" opacity=".2"/>
        <path d="M0 470L48 451L74 471L111 459L134 489L117 528L155 550L197 573L218 610L0 640Z"
          fill="url(#av11-rock)" opacity=".86"/>
        <path d="M8 486L68 465L103 486L118 517" stroke="url(#av11-metal)" strokeWidth="1.8" opacity=".37"/>
      </g>
      <g className="av11-near-filigree">
        <path d="M1581 23C1557 74 1558 91 1575 125C1591 160 1581 182 1561 197"
          stroke="url(#av11-metal)" strokeWidth="1.6"/>
        <path d="M1580 98L1570 109L1581 123L1591 109Z" stroke="#d4a48c" opacity=".4"/>
        <path d="M1556 270L1548 287L1557 299L1566 287Z" stroke="#a78bab" opacity=".34"/>
        <circle cx="1579" cy="110" r="30" fill="url(#av11-fire)" opacity=".32"/>
        <circle cx="1555" cy="290" r="27" fill="url(#av11-fire)" opacity=".16"/>
      </g>
      <path d="M0 495Q160 470 315 505T660 545T1090 490T1600 480V640H0Z"
        fill="url(#av11-floor)" opacity=".74"/>
      <path d="M0 568Q200 555 490 594T1070 561T1600 568" stroke="#c6a2a2" strokeWidth=".7" opacity=".13"/>
    </svg>
  </div>;
}
