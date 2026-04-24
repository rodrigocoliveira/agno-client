import type { CustomEventData } from '@rodrigocoliveira/agno-types';

/**
 * Tracks in-flight session_state refreshes so that stale responses (from a
 * previously-selected session or a previous run) do not overwrite the cache
 * after the user has moved on.
 *
 * Uses an epoch counter instead of an AbortController because the underlying
 * fetch (SessionManager.getSessionById) doesn't currently accept a signal —
 * this is a cheaper way to get the same correctness guarantee without touching
 * the shared SessionManager API.
 */
export class SessionStateManager {
  private state: Record<string, unknown> | null = null;
  private epoch = 0;

  /** Current cached state. */
  get(): Record<string, unknown> | null {
    return this.state;
  }

  /**
   * Replace the cached state. Returns `true` if the value changed (shallow
   * reference compare) so the caller can decide whether to emit.
   */
  set(next: Record<string, unknown> | null | undefined): boolean {
    const value = next ?? null;
    if (value === this.state) return false;
    this.state = value;
    return true;
  }

  /** Shallow-merge a partial into the cached state. */
  merge(partial: Record<string, unknown>): boolean {
    const base = this.state ?? {};
    const next = { ...base, ...partial };
    this.state = next;
    return true;
  }

  /** Clear the cache. Used on session switch or clearMessages(). */
  clear(): boolean {
    if (this.state === null) return false;
    this.state = null;
    return true;
  }

  /**
   * Bump the epoch. Call this whenever the "owning context" changes —
   * session switch, clearMessages, or anything that makes older refresh
   * responses irrelevant. Returns the new epoch for the caller to remember.
   */
  invalidate(): number {
    this.epoch += 1;
    return this.epoch;
  }

  /** Snapshot the current epoch. Pair with `isEpochCurrent` after an async call. */
  currentEpoch(): number {
    return this.epoch;
  }

  /** Whether a previously-snapshot epoch is still the active one. */
  isEpochCurrent(snapshot: number): boolean {
    return this.epoch === snapshot;
  }

  /**
   * Apply the user's `extractSessionStateFromCustomEvent` setting to a
   * CustomEvent chunk. Returns the state payload to cache, or null if the
   * event should be ignored.
   */
  extractFromCustomEvent(
    event: CustomEventData,
    extractor:
      | boolean
      | ((event: CustomEventData) => Record<string, unknown> | null | undefined)
      | undefined
  ): Record<string, unknown> | null {
    if (extractor === false) return null;

    if (typeof extractor === 'function') {
      const result = extractor(event);
      return result ?? null;
    }

    // Default (extractor === true or undefined): pick up the `session_state`
    // field if present on the payload.
    const candidate = (event as unknown as Record<string, unknown>).session_state;
    if (candidate && typeof candidate === 'object') {
      return candidate as Record<string, unknown>;
    }
    return null;
  }
}
