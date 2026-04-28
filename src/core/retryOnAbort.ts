/**
 * Retries a Supabase query on AbortError.
 *
 * The @supabase/supabase-js auth layer uses Web Locks + AbortController
 * for token-refresh coordination.  In older versions (and as a general
 * safety-net) the refresh can abort an in-flight request with
 * `AbortError: signal is aborted without reason`.  Wrapping public
 * queries with this helper ensures they are retried instead of silently
 * returning empty data.
 */
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 300;

function isAbortError(err: unknown): boolean {
  if (err instanceof DOMException && err.name === 'AbortError') return true;
  if (err instanceof Error && err.name === 'AbortError') return true;
  if (err instanceof Error && err.message?.includes('signal is aborted')) return true;
  return false;
}

export async function retryOnAbort<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (isAbortError(err) && attempt < MAX_RETRIES) {
        // Wait briefly before retrying to let auth settle
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}
