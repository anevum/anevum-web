/** Bounded reads only. Callers must never wrap a write or replay a request. */
export class ReadDeadlineError extends Error {
  constructor() {
    super('The service did not respond within 15 seconds. Retry when your connection is ready.');
    this.name = 'ReadDeadlineError';
  }
}
export async function readWithDeadline(read, signal, milliseconds = 15000) {
  if (!Number.isSafeInteger(milliseconds) || milliseconds < 1 || milliseconds > 15000)
    throw new RangeError('Invalid read deadline');
  const controller = new AbortController();
  let rejectBoundary;
  const boundary = new Promise((_, reject) => { rejectBoundary = reject; });
  const cancel = () => {
    const reason = signal?.reason ?? new DOMException('Read cancelled', 'AbortError');
    controller.abort(reason);
    rejectBoundary(reason);
  };
  signal?.addEventListener('abort', cancel, { once: true });
  const timer = setTimeout(() => {
    const reason = new ReadDeadlineError();
    controller.abort(reason);
    rejectBoundary(reason);
  }, milliseconds);
  try {
    if (signal?.aborted) { cancel(); return await boundary; }
    // This settles even when a transport or response body ignores abort.
    return await Promise.race([boundary, Promise.resolve().then(() => read(controller.signal))]);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', cancel);
  }
}
