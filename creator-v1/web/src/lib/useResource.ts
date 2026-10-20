import { useEffect, useState } from "react";

export type Resource<T> =
  | { state: "loading"; data: null; error: null }
  | { state: "ready"; data: T; error: null }
  | { state: "error"; data: null; error: Error };

export function useResource<T>(loader: (signal: AbortSignal) => Promise<T>, deps: readonly unknown[] = []): Resource<T> {
  const [resource, setResource] = useState<Resource<T>>({ state: "loading", data: null, error: null });

  useEffect(() => {
    const controller = new AbortController();
    setResource({ state: "loading", data: null, error: null });
    loader(controller.signal)
      .then((data) => { if (!controller.signal.aborted) setResource({ state: "ready", data, error: null }); })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setResource({ state: "error", data: null, error: error instanceof Error ? error : new Error("unavailable") });
      });
    return () => controller.abort();
  // loader is intentionally keyed by explicit dependencies.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return resource;
}
