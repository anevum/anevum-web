import { useEffect, useState } from "react";

type Availability = "checking" | "available" | "unavailable";

let cached: Availability | undefined;

export function useMemberAvailability(): Availability {
  const [availability, setAvailability] = useState<Availability>(cached || "checking");
  useEffect(() => {
    if (cached) return;
    let alive = true;
    fetch("/api/member/availability", { cache: "no-store" })
      .then(async (response) => response.ok ? response.json() : null)
      .then((value: { available?: boolean } | null) => {
        cached = value?.available ? "available" : "unavailable";
        if (alive) setAvailability(cached);
      })
      .catch(() => { cached = "unavailable"; if (alive) setAvailability(cached); });
    return () => { alive = false; };
  }, []);
  return availability;
}
