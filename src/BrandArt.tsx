import { useId } from "react";

export type BrandArtVariant = "horizon" | "signal" | "relations" | "archive" | "identity";

export function BrandArt({ variant = "horizon", className = "", label }: { variant?: BrandArtVariant; className?: string; label?: string }) {
  const id = useId().replace(/:/g, "");
  const relation = variant === "relations";
  const signal = variant === "signal";
  const archive = variant === "archive";
  const identity = variant === "identity";

  return (
    <svg className={`brand-art ${className}`} data-brand-art={variant} viewBox="0 0 1600 900" role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`${id}-space`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#020508" />
          <stop offset=".48" stopColor="#08141b" />
          <stop offset="1" stopColor="#020508" />
        </linearGradient>
        <radialGradient id={`${id}-world`} cx="34%" cy="23%" r="74%">
          <stop offset="0" stopColor="#b8d3df" />
          <stop offset=".1" stopColor="#5f8ea3" />
          <stop offset=".26" stopColor="#173848" />
          <stop offset=".62" stopColor="#081820" />
          <stop offset="1" stopColor="#010405" />
        </radialGradient>
        <radialGradient id={`${id}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#b9e4ff" stopOpacity=".6" />
          <stop offset=".18" stopColor="#57b9ff" stopOpacity=".2" />
          <stop offset="1" stopColor="#57b9ff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-haze`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8fd3ff" stopOpacity="0" />
          <stop offset=".5" stopColor="#d9effa" stopOpacity=".56" />
          <stop offset="1" stopColor="#8fd3ff" stopOpacity="0" />
        </linearGradient>
        <pattern id={`${id}-stars`} width="113" height="97" patternUnits="userSpaceOnUse">
          <circle cx="8" cy="12" r="1.3" fill="#eef7fb" fillOpacity=".64" />
          <circle cx="71" cy="31" r=".8" fill="#eef7fb" fillOpacity=".42" />
          <circle cx="41" cy="78" r="1" fill="#a8c8d7" fillOpacity=".4" />
          <circle cx="101" cy="84" r=".55" fill="#eef7fb" fillOpacity=".35" />
        </pattern>
        <filter id={`${id}-blur`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="22" /></filter>
        <filter id={`${id}-soft`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="7" /></filter>
      </defs>

      <rect width="1600" height="900" fill={`url(#${id}-space)`} />
      <rect width="1600" height="900" fill={`url(#${id}-stars)`} opacity=".55" />
      <ellipse cx="1240" cy="112" rx="590" ry="330" fill="#3a7da0" fillOpacity=".08" filter={`url(#${id}-blur)`} />

      {!archive ? (
        <g>
          <circle cx="1180" cy="320" r="390" fill={`url(#${id}-world)`} />
          <circle cx="1180" cy="320" r="402" fill="none" stroke="#b9e5f7" strokeOpacity=".13" strokeWidth="8" />
          <path d="M824 245 C930 205 1032 224 1118 270 C1200 313 1303 313 1510 226" fill="none" stroke="#eef8fb" strokeOpacity=".055" strokeWidth="42" strokeLinecap="round" />
          <path d="M875 420 C1030 365 1145 431 1288 396 C1390 371 1478 392 1560 432" fill="none" stroke="#9bdcff" strokeOpacity=".06" strokeWidth="22" strokeLinecap="round" />
          <circle cx="1480" cy="146" r="47" fill="#748996" fillOpacity=".3" />
          <circle cx="1480" cy="146" r="48" fill="none" stroke="#e7f3f7" strokeOpacity=".14" />
        </g>
      ) : null}

      {archive ? (
        <g opacity=".9">
          <circle cx="1210" cy="260" r="300" fill={`url(#${id}-world)`} opacity=".78" />
          <g fill="none" stroke="#9ac2d3" strokeOpacity=".14">
            {Array.from({ length: 9 }).map((_, index) => <rect key={index} x={735 + index * 58} y={230 + (index % 2) * 24} width="39" height={350 - index * 10} />)}
          </g>
          <path d="M700 610 H1450" stroke="#a9c6d2" strokeOpacity=".18" />
          <path d="M760 570 H1380M810 525H1320M860 480H1260" stroke="#8fd3ff" strokeOpacity=".07" />
        </g>
      ) : null}

      <path d="M0 742 C198 654 356 670 522 697 C730 732 904 637 1088 654 C1290 672 1425 608 1600 555 L1600 900 L0 900Z" fill="#020609" />
      <path d="M0 763 C221 696 390 714 563 738 C773 766 925 682 1112 700 C1306 720 1434 656 1600 612" fill="none" stroke="#8399a3" strokeOpacity=".1" strokeWidth="3" />
      <path d="M0 704 C225 627 417 649 625 674 C840 700 983 614 1190 633 C1360 648 1484 601 1600 560" fill="none" stroke="#8fd3ff" strokeOpacity=".08" strokeWidth="2" />

      {signal ? (
        <g fill="none">
          {Array.from({ length: 7 }).map((_, index) => (
            <path key={index} d={`M220 ${270 + index * 44} C470 ${170 + index * 34}, 710 ${400 + index * 15}, 1180 ${205 + index * 37}`} stroke={index === 3 ? "#9fddff" : "#b7cbd4"} strokeOpacity={index === 3 ? .36 : .08} strokeWidth={index === 3 ? 2 : 1} />
          ))}
          <circle cx="655" cy="430" r="72" stroke="#8fd3ff" strokeOpacity=".16" />
          <circle cx="655" cy="430" r="118" stroke="#8fd3ff" strokeOpacity=".08" />
          <circle cx="655" cy="430" r="8" fill="#bfe7fb" fillOpacity=".66" />
        </g>
      ) : null}

      {relation ? (
        <g fill="none" stroke="#9ad8f6">
          <circle cx="710" cy="430" r="205" strokeOpacity=".11" />
          <circle cx="710" cy="430" r="125" strokeOpacity=".16" />
          <circle cx="710" cy="430" r="42" strokeOpacity=".34" />
          {[0,1,2,3,4,5,6].map((index) => {
            const a = (index / 7) * Math.PI * 2 - .8;
            const x = 710 + Math.cos(a) * 205;
            const y = 430 + Math.sin(a) * 205;
            return <g key={index}><line x1="710" y1="430" x2={x} y2={y} strokeOpacity=".1" /><circle cx={x} cy={y} r={index % 2 ? 12 : 18} fill="#0e2c3b" strokeOpacity=".28" /></g>;
          })}
          <circle cx="710" cy="430" r="11" fill="#a8dcf5" fillOpacity=".55" />
        </g>
      ) : null}

      {identity ? (
        <g>
          <circle cx="650" cy="420" r="150" fill={`url(#${id}-glow)`} opacity=".5" />
          <circle cx="650" cy="420" r="96" fill="#07151d" stroke="#b9e9ff" strokeOpacity=".3" />
          <circle cx="650" cy="420" r="68" fill={`url(#${id}-world)`} />
          <circle cx="650" cy="420" r="112" fill="none" stroke="#8fd3ff" strokeOpacity=".12" strokeDasharray="3 10" />
          <path d="M488 420H812M650 258V582" stroke="#9fdcf9" strokeOpacity=".08" />
        </g>
      ) : null}

      <ellipse cx="1140" cy="650" rx="520" ry="36" fill={`url(#${id}-haze)`} opacity=".24" filter={`url(#${id}-soft)`} />
      <rect x="22" y="22" width="1556" height="856" fill="none" stroke="#ecf8fc" strokeOpacity=".025" />
    </svg>
  );
}
