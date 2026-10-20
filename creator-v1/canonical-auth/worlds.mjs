// Server-authoritative personal-world options. No arbitrary CSS, images, URLs or roles.
export const WORLD_THEMES=Object.freeze(["continuance","nocturne","verdant"]);
export const FOCUS_KEYS=Object.freeze([
  "games","apps","art","writing","music","research","learning","tools","community"
]);
const CONTROL=/[\u0000-\u001f\u007f]/;
export function normalizeWorldUpdate(value){
  if(!value||typeof value!=="object"||Array.isArray(value))return null;
  if(typeof value.headline!=="string"||value.headline.length>120||CONTROL.test(value.headline))return null;
  if(typeof value.worldTheme!=="string"||!WORLD_THEMES.includes(value.worldTheme))return null;
  if(!Array.isArray(value.focus)||value.focus.length>4||
     value.focus.some(x=>typeof x!=="string"||!FOCUS_KEYS.includes(x))||
     new Set(value.focus).size!==value.focus.length)return null;
  const headline=value.headline.trim().normalize("NFC");
  if(headline.length>120)return null;
  return {headline,worldTheme:value.worldTheme,focusJson:JSON.stringify(value.focus)};
}
export function worldFromRow(row){
  let focus=[];
  try{
    const items=JSON.parse(row?.focus_json??"[]");
    if(Array.isArray(items)&&items.length<=4&&
       items.every(x=>typeof x==="string"&&FOCUS_KEYS.includes(x))&&
       new Set(items).size===items.length)focus=items;
  }catch{/* Invalid stored preferences remain private and are not displayed. */}
  return {
    headline:typeof row?.headline==="string"&&row.headline.length<=120?row.headline:"",
    worldTheme:WORLD_THEMES.includes(row?.world_theme)?row.world_theme:"continuance",
    focus
  };
}
