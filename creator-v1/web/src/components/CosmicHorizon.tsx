/**
 * Decorative Transcosmic-inspired star chart.
 * This is an abstract visual environment, NOT fictional lore, a live network,
 * a project listing, or an astronomical data visualization.
 */
export function CosmicHorizon() {
  const stars: ReadonlyArray<readonly [number, number, number]> = [
    [82,56,1.6],[188,167,1.2],[300,79,1.6],[410,241,1.3],[526,91,1.3],
    [603,316,1.6],[674,134,1.9],[758,49,1.3],[814,249,2.2],[892,112,1.8],
    [983,317,1.6],[1022,66,2.5],[1093,174,1.4],[1156,332,1.9],[1224,105,1.5],
    [1240,458,1.7],[1066,446,1.1],[920,409,1.2],[736,419,1.7],[479,441,1.2],
    [267,370,1.5],[118,435,1.1],[1253,272,1.2],[1135,35,1.0]
  ];
  return <div className="cosmic-horizon" aria-hidden="true">
    <span className="cosmic-horizon__nebula"/>
    <span className="cosmic-horizon__afterglow"/>
    <svg className="cosmic-horizon__chart" viewBox="0 0 1280 520" preserveAspectRatio="xMidYMid slice" focusable="false">
      <g fill="none" strokeLinecap="round">
        <circle cx="975" cy="245" r="174" stroke="#8dc9fb" strokeOpacity=".23" strokeWidth="1.3"/>
        <circle cx="975" cy="245" r="219" stroke="#bad0ff" strokeOpacity=".12"/>
        <ellipse cx="977" cy="246" rx="372" ry="116" transform="rotate(-24 977 246)" stroke="#86ede5" strokeOpacity=".32" strokeWidth="2"/>
        <ellipse cx="977" cy="246" rx="307" ry="180" transform="rotate(18 977 246)" stroke="#b3adff" strokeOpacity=".19"/>
        <ellipse cx="977" cy="246" rx="242" ry="86" transform="rotate(49 977 246)" stroke="#e0ce98" strokeOpacity=".20" strokeDasharray="5 15"/>
        <path d="M570 162 674 134 814 249 892 112 1022 66 1093 174" stroke="#b3e9f8" strokeOpacity=".26"/>
        <path d="M603 316 736 419 920 409 983 317 1156 332 1240 458" stroke="#a4a5fb" strokeOpacity=".20"/>
        <path d="M1130 43v21m-10-10h21M772 327v16m-8-8h16" stroke="#91f8e8" strokeOpacity=".5" strokeWidth="1.4"/>
      </g>
      {stars.map(([x,y,r],i)=><circle key={i} cx={x} cy={y} r={r} fill={i%5===0?"#f0d6a8":i%3===0?"#83fff0":"#c8d8ff"} opacity={i%4===0?".89":".56"}/>)}
      <circle cx="975" cy="245" r="12" fill="#7de7e8" opacity=".13"/>
      <circle cx="975" cy="245" r="3.5" fill="#c6fffa" opacity=".83"/>
      <circle cx="1206" cy="119" r="4" fill="#edd2a4" opacity=".76"/>
    </svg>
    <span className="cosmic-horizon__horizon"/>
  </div>;
}
