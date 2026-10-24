/**
 * ANEVUM NEXT / V135 shared presentation primitives.
 *
 * These components add no authorization, state, browser I/O, or fake data.
 * Their decorative styles are imported only by the VITE_NEXT_VISUAL_SYSTEM
 * review bundle. The official OrbitalMark remains the only brand mark.
 */
export type VisualEdgeTone = "cyan"|"violet"|"copper"|"mint";
export type VisualFileKind = "html"|"css"|"typescript"|"javascript"|"json"|"markdown"|"image"|"folder"|"unknown";

/** Accessible surface contents never depend on this pointer-transparent layer. */
export function VisualEdge({tone="cyan"}:{tone?:VisualEdgeTone}){
  if(import.meta.env.VITE_NEXT_VISUAL_SYSTEM!=="true")return null;
  return <span className={"av135-edge av135-edge--"+tone} aria-hidden="true"/>;
}

/** A small deterministic extension map; visual only, never inferred privileges. */
export function fileVisualKind(filename:string):VisualFileKind {
  if(filename.endsWith("/"))return "folder";
  const extension=filename.split(".").pop()?.toLowerCase()||"";
  if(extension==="html"||extension==="htm")return "html";
  if(extension==="css"||extension==="scss")return "css";
  if(extension==="ts"||extension==="tsx"||extension==="mts")return "typescript";
  if(extension==="js"||extension==="jsx"||extension==="mjs")return "javascript";
  if(extension==="json"||extension==="jsonc")return "json";
  if(extension==="md"||extension==="mdx")return "markdown";
  if(["svg","png","jpg","jpeg","webp","gif","avif"].includes(extension))return "image";
  return "unknown";
}
const fileMarks:Record<VisualFileKind,string>={
  html:"<>",css:"#",typescript:"TS",javascript:"JS",json:"{}",markdown:"MD",image:"IMG",folder:"DIR",unknown:"-"
};

/**
 * Vector-first IDE file glyph. Pixel-dense displays do not stretch a raster
 * source, and the surrounding tab/button owns the accessible file name.
 */
export function VisualFileGlyph({name}:{name:string}){
  const kind=fileVisualKind(name);
  return <span className={"av135-file-glyph av135-file-glyph--"+kind} aria-hidden="true">
    <svg viewBox="0 0 32 38" focusable="false" aria-hidden="true" strokeLinejoin="round">
      {kind==="folder"?
        <path d="M2.75 10.5h9l3.25 4h14.25V32H2.75Z" fill="currentColor" fillOpacity=".13" stroke="currentColor" strokeWidth="1.5"/>:
        <>
          <path d="M5 2.5h14l8 8.5v24.5H5Z" fill="currentColor" fillOpacity=".13" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M19 2.5V11h8" fill="none" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M8.5 15.5h15" fill="none" stroke="currentColor" strokeWidth=".75" opacity=".38"/>
        </>}
      <text x="16" y={kind==="folder"?"26":"27"} fontSize={fileMarks[kind].length>=3?"8":"10"}
        fontFamily="ui-monospace, SFMono-Regular, monospace" fontWeight="800"
        textAnchor="middle" fill="currentColor" stroke="none">{fileMarks[kind]}</text>
    </svg>
  </span>;
}
