function numeric(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function money(value: unknown) {
  const n = numeric(value);
  return n === null
    ? "—"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(n);
}

export function signedMoney(value: unknown) {
  const n = numeric(value);
  return n === null ? "—" : (n > 0 ? "+" : "") + money(n);
}

export function percent(value: unknown, digits = 2) {
  const n = numeric(value);
  return n === null ? "—" : (n * 100).toFixed(digits) + "%";
}

export function dateTime(value: unknown) {
  if (!value) return "—";
  const d = new Date(String(value));
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString([], {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit"
      });
}

export function shortDate(value: unknown) {
  if (!value) return "—";
  const d = new Date(String(value));
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

export function clockTime(value: unknown) {
  if (!value) return "—";
  const d = new Date(String(value));
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" });
}
