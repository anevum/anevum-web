const paths: Record<string, string> = {
  home: "M3 11.5 12 4l9 7.5V21h-6v-6H9v6H3z",
  explore: "M4 4h6v6H4z M14 4h6v6h-6z M4 14h6v6H4z M14 14h6v6h-6z",
  people: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21a8 8 0 0 1 16 0",
  create: "M5 19 19 5 M9 5h10v10",
  community: "M4 5h16v11H9l-5 4z",
  library: "M5 4h14v16H5z M9 4v16",
  status: "M4 18V9 M10 18V5 M16 18v-7 M22 18V3",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z M16 16l5 5",
  menu: "M4 7h16 M4 12h16 M4 17h16",
  arrow: "M5 12h14 M14 7l5 5-5 5",
  star: "m12 3 2.5 5.4L20 9l-4 4 1 6-5-2.8L7 19l1-6-4-4 5.5-.6z",
  save: "M6 4h12v17l-6-4-6 4z"
};
export function Icon({ name, size = 18 }: { name: string; size?: number }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name] || paths.explore} /></svg>;
}
