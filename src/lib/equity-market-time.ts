const ET = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23"
});

const MARKET_OPEN_MINUTE = 9 * 60 + 30;
const MARKET_CLOSE_MINUTE = 16 * 60;
const SESSION_MINUTES = MARKET_CLOSE_MINUTE - MARKET_OPEN_MINUTE;
const COMPRESSED_SESSION_GAP_MINUTES = 10;
const TRANSIENT_SPIKE_MIN_DOLLARS = 1;
const TRANSIENT_SPIKE_MIN_RATIO = 0.08;
const TRANSIENT_SPIKE_MAX_NEIGHBOR_RATIO = 0.02;

type TimedPoint = {
  at: string;
  time: number;
};

type SessionParts = {
  dateKey: string;
  weekday: string;
  minuteOfDay: number;
};

type ProjectedEquityPoint = {
  equity: number;
  sessionDate: string;
};

function easternParts(time: number): SessionParts | null {
  if (!Number.isFinite(time)) return null;
  const parts = ET.formatToParts(new Date(time));
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value || "";
  const hour = Number(value("hour"));
  const minute = Number(value("minute"));
  const year = value("year");
  const month = value("month");
  const day = value("day");
  const weekday = value("weekday");
  if (!year || !month || !day || !weekday || !Number.isFinite(hour) || !Number.isFinite(minute)) {
    return null;
  }
  return {
    dateKey: `${year}-${month}-${day}`,
    weekday,
    minuteOfDay: hour * 60 + minute
  };
}

export function isRegularEquityMarketTime(time: number) {
  const parts = easternParts(time);
  if (!parts || parts.weekday === "Sat" || parts.weekday === "Sun") return false;
  return parts.minuteOfDay >= MARKET_OPEN_MINUTE && parts.minuteOfDay <= MARKET_CLOSE_MINUTE;
}

export function projectEquityMarketTimeline<T extends TimedPoint>(rows: T[]) {
  const active = rows
    .map((row) => ({ row, parts: easternParts(row.time) }))
    .filter((item): item is { row: T; parts: SessionParts } =>
      Boolean(
        item.parts
        && item.parts.weekday !== "Sat"
        && item.parts.weekday !== "Sun"
        && item.parts.minuteOfDay >= MARKET_OPEN_MINUTE
        && item.parts.minuteOfDay <= MARKET_CLOSE_MINUTE
      )
    )
    .sort((a, b) => a.row.time - b.row.time);

  const sessions: string[] = [];
  for (const item of active) {
    if (!sessions.includes(item.parts.dateKey)) sessions.push(item.parts.dateKey);
  }
  const sessionIndex = new Map(sessions.map((key, index) => [key, index]));

  return active.map(({ row, parts }) => {
    const index = sessionIndex.get(parts.dateKey) || 0;
    const minuteIntoSession = Math.max(
      0,
      Math.min(SESSION_MINUTES, parts.minuteOfDay - MARKET_OPEN_MINUTE)
    );
    const displayMinute =
      index * (SESSION_MINUTES + COMPRESSED_SESSION_GAP_MINUTES)
      + minuteIntoSession;
    return {
      ...row,
      sessionDate: parts.dateKey,
      displayTime: displayMinute * 60_000
    };
  });
}

export function suppressTransientEquitySpikes<T extends ProjectedEquityPoint>(rows: T[]) {
  if (rows.length < 3) {
    return { rows: [...rows], suppressedCount: 0 };
  }

  const keep = rows.map(() => true);
  let suppressedCount = 0;

  for (let index = 1; index < rows.length - 1; index += 1) {
    const previous = rows[index - 1];
    const current = rows[index];
    const next = rows[index + 1];

    if (
      previous.sessionDate !== current.sessionDate
      || current.sessionDate !== next.sessionDate
    ) {
      continue;
    }

    const scale = Math.max(
      Math.abs(previous.equity),
      Math.abs(current.equity),
      Math.abs(next.equity),
      1
    );
    const deviation = Math.min(
      Math.abs(current.equity - previous.equity),
      Math.abs(current.equity - next.equity)
    );
    const neighborGap = Math.abs(next.equity - previous.equity);

    if (
      deviation >= TRANSIENT_SPIKE_MIN_DOLLARS
      && deviation / scale >= TRANSIENT_SPIKE_MIN_RATIO
      && neighborGap / scale <= TRANSIENT_SPIKE_MAX_NEIGHBOR_RATIO
    ) {
      keep[index] = false;
      suppressedCount += 1;
    }
  }

  return {
    rows: rows.filter((_, index) => keep[index]),
    suppressedCount
  };
}

export const EQUITY_MARKET_DISPLAY = {
  openMinute: MARKET_OPEN_MINUTE,
  closeMinute: MARKET_CLOSE_MINUTE,
  sessionMinutes: SESSION_MINUTES,
  compressedSessionGapMinutes: COMPRESSED_SESSION_GAP_MINUTES
} as const;
