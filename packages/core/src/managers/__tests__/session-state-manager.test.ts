import { describe, expect, test } from 'bun:test';
import type { CustomEventData } from '@rodrigocoliveira/agno-types';
import { SessionStateManager } from '../session-state-manager';

describe('SessionStateManager', () => {
  test('starts empty', () => {
    const mgr = new SessionStateManager();
    expect(mgr.get()).toBeNull();
  });

  test('set() stores state and reports change', () => {
    const mgr = new SessionStateManager();
    expect(mgr.set({ counter: 1 })).toBe(true);
    expect(mgr.get()).toEqual({ counter: 1 });
  });

  test('set() with the same reference is a no-op', () => {
    const mgr = new SessionStateManager();
    const state = { counter: 1 };
    mgr.set(state);
    expect(mgr.set(state)).toBe(false);
  });

  test('set(null) clears', () => {
    const mgr = new SessionStateManager();
    mgr.set({ counter: 1 });
    expect(mgr.set(null)).toBe(true);
    expect(mgr.get()).toBeNull();
  });

  test('merge() shallow-merges into the current state', () => {
    const mgr = new SessionStateManager();
    mgr.set({ counter: 1, marker: 'a' });
    mgr.merge({ counter: 2 });
    expect(mgr.get()).toEqual({ counter: 2, marker: 'a' });
  });

  test('merge() on empty initializes', () => {
    const mgr = new SessionStateManager();
    mgr.merge({ counter: 1 });
    expect(mgr.get()).toEqual({ counter: 1 });
  });

  test('clear() returns true only when state existed', () => {
    const mgr = new SessionStateManager();
    expect(mgr.clear()).toBe(false);
    mgr.set({ a: 1 });
    expect(mgr.clear()).toBe(true);
    expect(mgr.get()).toBeNull();
  });

  test('epoch invalidation makes stale responses discardable', () => {
    const mgr = new SessionStateManager();
    const epochA = mgr.currentEpoch();
    expect(mgr.isEpochCurrent(epochA)).toBe(true);
    mgr.invalidate();
    expect(mgr.isEpochCurrent(epochA)).toBe(false);
    const epochB = mgr.currentEpoch();
    expect(mgr.isEpochCurrent(epochB)).toBe(true);
  });

  const baseEvent = (overrides: Partial<CustomEventData> = {}): CustomEventData => ({
    event: 'CustomEvent',
    created_at: 0,
    ...overrides,
  });

  test('extractFromCustomEvent returns session_state from payload by default', () => {
    const mgr = new SessionStateManager();
    const event = baseEvent({
      ...({ session_state: { counter: 3 } } as unknown as Partial<CustomEventData>),
    });
    expect(mgr.extractFromCustomEvent(event, undefined)).toEqual({ counter: 3 });
    expect(mgr.extractFromCustomEvent(event, true)).toEqual({ counter: 3 });
  });

  test('extractFromCustomEvent returns null when extractor is false', () => {
    const mgr = new SessionStateManager();
    const event = baseEvent({
      ...({ session_state: { counter: 3 } } as unknown as Partial<CustomEventData>),
    });
    expect(mgr.extractFromCustomEvent(event, false)).toBeNull();
  });

  test('extractFromCustomEvent returns null when payload lacks session_state', () => {
    const mgr = new SessionStateManager();
    const event = baseEvent({ ...({ greeting: 'hi' } as unknown as Partial<CustomEventData>) });
    expect(mgr.extractFromCustomEvent(event, true)).toBeNull();
  });

  test('extractFromCustomEvent delegates to a custom extractor function', () => {
    const mgr = new SessionStateManager();
    const event = baseEvent({
      ...({ custom_state_blob: { foo: 'bar' } } as unknown as Partial<CustomEventData>),
    });
    const extractor = (e: CustomEventData) => {
      const blob = (e as unknown as Record<string, unknown>).custom_state_blob;
      return blob as Record<string, unknown> | null;
    };
    expect(mgr.extractFromCustomEvent(event, extractor)).toEqual({ foo: 'bar' });
  });

  test('custom extractor returning null is respected', () => {
    const mgr = new SessionStateManager();
    const event = baseEvent({
      ...({ session_state: { counter: 3 } } as unknown as Partial<CustomEventData>),
    });
    expect(mgr.extractFromCustomEvent(event, () => null)).toBeNull();
  });
});
