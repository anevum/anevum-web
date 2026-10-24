import {useId} from 'react';
interface Props {
  className?: string;
  title?: string;
}

export function OrbitalMark({ className = "", title }: Props) {
  const labelled = Boolean(title);
  const uid=useId().replaceAll(':','');
  // V136 has an autonomous transcosmic institute mark: three orbital planes,
  // a shielded continuity core and one directional beacon. It is presentation
  // only and does not change identity, verification or ownership contracts.
  if(import.meta.env.VITE_PARITY_V136_FULL==='true')
    return <svg className={'p136-living-mark '+className} viewBox="0 0 512 512"
      role={labelled?'img':undefined} aria-label={title} aria-hidden={labelled?undefined:true} focusable="false">
      <defs>
        <linearGradient id={uid+'-orbit'} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#e4faff"/><stop offset=".26" stopColor="currentColor"/>
          <stop offset=".64" stopColor="#769bff"/><stop offset="1" stopColor="currentColor"/>
        </linearGradient>
      </defs>
      <g fill="none" stroke={'url(#'+uid+'-orbit)'} strokeLinecap="round">
        <ellipse cx="256" cy="256" rx="211" ry="89" transform="rotate(-32 256 256)" strokeWidth="25"/>
        <ellipse cx="256" cy="256" rx="180" ry="93" transform="rotate(52 256 256)" strokeWidth="13" strokeOpacity=".75"/>
        <ellipse cx="256" cy="256" rx="117" ry="113" strokeWidth="9" strokeOpacity=".55"/>
        <circle cx="256" cy="256" r="160" strokeWidth="3" strokeDasharray="12 21" opacity=".8"/>
      </g>
      <path d="m256 79 28 133 112 44-112 44-28 133-28-133-112-44 112-44Z"
        fill="currentColor" opacity=".91"/>
      <circle cx="256" cy="256" r="75" fill="#0b213c" stroke="currentColor" strokeWidth="16"/>
      <circle cx="256" cy="256" r="44" fill="#61dfff" stroke="#ebfaff" strokeWidth="9"/>
      <circle cx="256" cy="256" r="19" fill="#0c1834"/>
      <path d="M246 236v39l34-19Z" fill="#d4f9ff"/>
      <circle cx="403" cy="134" r="22" fill="currentColor" stroke="#dff8ff" strokeWidth="6"/>
      <circle cx="403" cy="134" r="7" fill="#0b1934"/>
    </svg>;

  return (
    <svg
      className={className}
      viewBox="0 0 512 512"
      role={labelled ? "img" : undefined}
      aria-hidden={labelled ? undefined : true}
      aria-label={labelled ? title : undefined}
      focusable="false"
    >
      <ellipse cx="256" cy="256" rx="188" ry="76" transform="rotate(-17 256 256)" fill="none" stroke="currentColor" strokeWidth="34" strokeLinecap="round" />
      <path d="M256 56 274 211 326 256 274 301 256 456 238 301 186 256 238 211Z" fill="currentColor" />
      <circle cx="256" cy="256" r="72" fill="currentColor" />
      <circle className="mark-core-cut" cx="269" cy="251" r="34" />
      <circle className="mark-core-cut" cx="239" cy="230" r="8" opacity=".82" />
      <circle cx="391" cy="132" r="20" fill="currentColor" />
    </svg>
  );
}
