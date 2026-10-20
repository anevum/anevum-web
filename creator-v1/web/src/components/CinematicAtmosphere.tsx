/**
 * Original high-resolution environment passes, not flattened UI screenshots.
 * Both mobile and desktop are independent crops/compositions and never upscale.
 * The main world painting remains available without these optional effects.
 */
const dir = import.meta.env.BASE_URL + "assets/cinematic-v2/atmosphere/";

export function CinematicAtmosphere(){
  return <div className="cinema-atmosphere" aria-hidden="true">
    <picture className="cinema-atmosphere-layer cinema-atmosphere-haze">
      <source media="(max-width:640px)" srcSet={dir+"orbital-haze-mobile.webp"} type="image/webp"/>
      <img src={dir+"orbital-haze-desktop.webp"} alt="" loading="eager" fetchPriority="low" decoding="async" draggable={false}/>
    </picture>
    <picture className="cinema-atmosphere-layer cinema-atmosphere-dust">
      <source media="(max-width:640px)" srcSet={dir+"orbital-dust-mobile.webp"} type="image/webp"/>
      <img src={dir+"orbital-dust-desktop.webp"} alt="" loading="lazy" decoding="async" draggable={false}/>
    </picture>
  </div>;
}
