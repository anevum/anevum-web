import type {CosmicScene} from "./CosmicIllustration";

/**
 * Site-owned AI illustration masters were retired from public presentation.
 * This is a native, semantic catalogue instrument, not a faux project cover.
 * Creator-uploaded artwork is still owned and displayed by project components.
 */
const fields:Record<CosmicScene,{index:string;name:string}>={
  hero:{index:"00",name:"CONTINUANCE"},
  portal:{index:"01",name:"DISCOVERY"},
  games:{index:"02",name:"GAMES"},
  tools:{index:"03",name:"APPLICATIONS"},
  automation:{index:"04",name:"AUTOMATION"},
  research:{index:"05",name:"RESEARCH"},
  creative:{index:"06",name:"CREATIVE"},
  learning:{index:"07",name:"LEARNING"},
  libraries:{index:"08",name:"LIBRARIES"},
  other:{index:"09",name:"MORE"}
};

/** Kept for older callers; retired raster artworks have no public URL. */
export function cinematicArtUrl(_scene:CosmicScene):string{return "";}

export function CosmicArtwork({scene="hero",className="",title}: {
  scene?:CosmicScene;priority?:boolean;className?:string;title?:string;seed?:string;
}) {
  const field=fields[scene];
  return <span className={"cw-artwork cw-artwork--"+scene+" av136-index-field "+className}
    data-presentation="native-index" data-sector={scene}
    role={title?"img":undefined} aria-label={title||undefined} aria-hidden={title?undefined:true}>

    <span className="av136-index-field__core">
      <span className="av136-index-field__number">{field.index}</span>
      <span className="av136-index-field__name">{field.name}</span>
    </span>

  </span>;
}
