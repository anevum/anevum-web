import type {Category} from "../lib/api";

/**
 * Original ANEVUM category artifacts.
 * Never presented as artwork uploaded by an individual creator.
 */
export function CategoryArtifact({category}:{category:Category}){
  return <svg className={"portal-artifact portal-artifact--"+category} viewBox="0 0 120 120" fill="none" aria-hidden="true" focusable="false">
    <circle className="artifact-orbit artifact-orbit-back" cx="60" cy="60" r="49" stroke="currentColor" strokeWidth="1.6" strokeDasharray="5 7"/>
    <path className="artifact-orbit" d="M11 78Q59 8 110 49" stroke="currentColor" strokeWidth="2"/>
    <circle className="artifact-satellite" cx="102" cy="48" r="5" fill="currentColor"/>
    <g stroke="currentColor" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round">
      {category==="games"&&<>
        <path d="M32 22h56l7 73H25l7-73Z" fill="var(--artifact-face,#2d1f2c)"/>
        <path d="M39 31h42v31H39z" fill="#141019"/>
        <path d="M44 55 55 43l7 7 12-12" strokeWidth="2.5"/>
        <path d="M35 71h50M48 80v13M41 86h14M69 85h11M75 80v10" strokeWidth="3"/>
        <circle cx="48" cy="76" r="3" fill="currentColor"/>
      </>}
      {category==="tools"&&<>
        <rect x="22" y="29" width="76" height="62" rx="5" fill="var(--artifact-face,#2d1f2c)"/>
        <path d="M22 42h76M30 35h2M40 35h2M50 35h2" strokeWidth="2.5"/>
        <path d="M38 54 29 63l9 9M82 54l9 9-9 9M66 53 54 77"/>
        <path d="M49 84h22" strokeWidth="2"/>
      </>}
      {category==="creative"&&<>
        <path d="M30 79 71 31l17 13-41 47-20 4 3-16Z" fill="var(--artifact-face,#2d1f2c)"/>
        <path d="m62 42 18 14M33 80l13 11M76 20v-9M93 29l8-8M97 49h12M25 37l-10-4" strokeWidth="2.7"/>
        <path d="m18 66 7-3 3-7 3 7 7 3-7 3-3 7-3-7-7-3Z" fill="currentColor" strokeWidth="1.4"/>
      </>}
      {category==="libraries"&&<>
        <path d="M38 29H24v62h14M82 29h14v62H82" strokeWidth="5"/>
        <path d="m54 38-17 22 17 22M66 38l17 22-17 22"/>
        <path d="m64 29-8 62" strokeWidth="2.7"/>
      </>}
      {category==="automation"&&<>
        <rect x="23" y="27" width="28" height="22" rx="4" fill="var(--artifact-face,#2d1f2c)"/>
        <rect x="69" y="71" width="28" height="22" rx="4" fill="var(--artifact-face,#2d1f2c)"/>
        <path d="M51 38h17q9 0 9 9v10M69 50l8 9 8-9M69 82H52q-9 0-9-9V60M51 69l-8-9-8 9"/>
        <circle cx="37" cy="38" r="3" fill="currentColor"/><circle cx="83" cy="82" r="3" fill="currentColor"/>
      </>}
      {category==="research"&&<>
        <circle cx="60" cy="61" r="9" fill="var(--artifact-face,#2d1f2c)"/>
        <ellipse cx="60" cy="61" rx="38" ry="15" transform="rotate(-33 60 61)"/>
        <ellipse cx="60" cy="61" rx="38" ry="15" transform="rotate(33 60 61)"/>
        <path d="m89 20 5 8 9 2-9 3-5 8-2-8-8-3 8-2 2-8Z" fill="currentColor" strokeWidth="1"/>
      </>}
      {category==="learning"&&<>
        <path d="M17 35q22-10 43 4 21-14 43-4v57q-22-10-43 4-21-14-43-4V35Z" fill="var(--artifact-face,#2d1f2c)"/>
        <path d="M60 39v57M28 49q10-3 22 3M28 61q10-3 22 3M70 52q10-6 22-3M70 64q10-6 22-3" strokeWidth="2.6"/>
        <path d="m58 17 4 8 8 3-8 3-4 8-3-8-8-3 8-3 3-8Z" fill="currentColor" strokeWidth="1"/>
      </>}
      {category==="other"&&<>
        <path d="M33 100V45q0-27 27-27t27 27v55H33Z" fill="var(--artifact-face,#2d1f2c)"/>
        <path d="M44 98V45q0-16 16-16t16 16v53M59 48v36" strokeWidth="2.7"/>
        <path d="m60 47 8 16-8 16-8-16 8-16Z" fill="currentColor" strokeWidth="1"/>
        <circle cx="89" cy="82" r="4" fill="currentColor"/>
      </>}
    </g>
  </svg>;
}
