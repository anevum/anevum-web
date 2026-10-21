import { useEffect, useState } from "react";
import {readWithDeadline} from '../../../shared/read-deadline.mjs';

export type Resource<T> =
  | { state: "loading"; data: null; error: null }
  | { state: "ready"; data: T; error: null }
  | { state: "error"; data: null; error: Error };

export function useResource<T>(loader: (signal: AbortSignal) => Promise<T>, deps: readonly unknown[] = []): Resource<T> {
  const [snapshot, setSnapshot] = useState<{deps:readonly unknown[];resource:Resource<T>}>(()=>({
    deps:[...deps],resource:{ state: "loading", data: null, error: null }
  }));

  useEffect(() => {
    const controller = new AbortController();
    const currentDeps=[...deps];
    const setResource=(resource:Resource<T>)=>setSnapshot({deps:currentDeps,resource});
    setResource({ state: "loading", data: null, error: null });
    readWithDeadline(loader, controller.signal)
      .then((data) => { if (!controller.signal.aborted) setResource({ state: "ready", data, error: null }); })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setResource({ state: "error", data: null, error: error instanceof Error ? error : new Error("unavailable") });
      });
    return () => controller.abort();
  // loader is intentionally keyed by explicit dependencies.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // Effects run after render. Hide old private data in the render that changes
  // identity or route dependencies, before the replacement effect can run.
  return snapshot.deps.length===deps.length&&snapshot.deps.every((value,index)=>Object.is(value,deps[index]))
    ?snapshot.resource:{state:'loading',data:null,error:null};
}
