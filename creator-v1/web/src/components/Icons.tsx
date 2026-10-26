/** Functional controls remain actual SVG/DOM, not bitmap sprites.
 * PARITY's icons are a coherent navigational instrument family.
 */
const parityPaths:Record<string,string>={
  home:"M3 11.5 12 4l9 7.5V21h-6v-6H9v6H3z M7 10h10",
  explore:"M12 2 16 8l6 4-6 4-4 6-4-6-6-4 6-4Z M12 8v8M8 12h8",
  people:"M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z M5 21v-2c0-3.8 3-6 7-6s7 2.2 7 6v2 M4 7V4h3m10 0h3v3M4 17v3h3m10 0h3v-3",
  create:"M12 2 21 7v10l-9 5-9-5V7z M3 7l9 5 9-5M12 12v10 M8 5l9 5",
  games:"M7 7h10c2 0 3.6 1.3 3.9 3.2l1 6.5c.4 2.5-2 4.1-4 2.2l-2.5-2.5H8.6l-2.5 2.5c-2 1.9-4.4.3-4-2.2l1-6.5C3.4 8.3 5 7 7 7z M6.5 12h5 M9 9.5v5 M16 11h.01 M18 13h.01",
  community:"M3 5h14v11H8l-5 4V5Z M8 9h6M8 12h4M19 9h2v8h-6",
  library:"M5 4h6v16H5z M13 4h6v16h-6z M7 7v9M15 9v7M3 21h18",
  status:"M2 14h4l3-7 4 11 3-8 2 4h4 M4 4h16M4 20h16",
  search:"M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z M17 17l5 5M11 6v2M7 11H5",
  menu:"M3 7h18 M7 12h14 M3 17h18",
  arrow:"M3 12h18 M14 5l7 7-7 7",
  star:"M12 2 15 9l7 3-7 3-3 7-3-7-7-3 7-3Z M12 8v8",
  save:"M5 3h14v19l-7-5-7 5Z M9 7h6",
  close:"M5 5l14 14M19 5 5 19"
};
const paths: Record<string, string> = {
  home: "M3 11.5 12 4l9 7.5V21h-6v-6H9v6H3z",
  explore: "M4 4h6v6H4z M14 4h6v6h-6z M4 14h6v6H4z M14 14h6v6h-6z",
  people: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21a8 8 0 0 1 16 0",
  create: "M5 19 19 5 M9 5h10v10",
  games: "M6 7h12l3 11-5-4H8l-5 4z M8 9v5 M5.5 11.5h5 M16 10h.01 M18 12h.01",
  community: "M4 5h16v11H9l-5 4z",
  library: "M5 4h14v16H5z M9 4v16",
  status: "M4 18V9 M10 18V5 M16 18v-7 M22 18V3",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z M16 16l5 5",
  menu: "M4 7h16 M4 12h16 M4 17h16",
  arrow: "M5 12h14 M14 7l5 5-5 5",
  star: "m12 3 2.5 5.4L20 9l-4 4 1 6-5-2.8L7 19l1-6-4-4 5.5-.6z",
  save: "M6 4h12v17l-6-4-6 4z",
  close: "M5 5l14 14 M19 5 5 19"
};
export function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const enhanced=import.meta.env.VITE_PARITY_V136_FULL==='true';
  const available=enhanced?parityPaths:paths;
  return <svg className={enhanced?'p136-system-icon':undefined} aria-hidden="true" viewBox="0 0 24 24"
    width={size} height={size} fill="none" stroke="currentColor"
    strokeWidth={enhanced?1.65:1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={available[name]||available.explore}/>
  </svg>;
}
