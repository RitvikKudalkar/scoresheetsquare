// Pieces shared by the points sheet and the Bunco tally sheet.
import { useEffect, useRef, useState } from 'react';

export function PencilCircle() {
  return (
    <svg className="pencil-circle" viewBox="0 0 104 52" preserveAspectRatio="none" aria-hidden="true">
      <path pathLength={1} d="M10 31C5 14 36 4 68 6c28 2 33 26 10 36-24 10-63 8-70-8C3 22 22 10 38 9" />
    </svg>
  );
}

/** Keeps the screen awake while switched on; re-acquires the lock when the tab comes back. */
export function useWakeLock() {
  const [on, setOn] = useState(false);
  const lock = useRef<WakeLockSentinel | null>(null);
  useEffect(() => {
    if (!on || !('wakeLock' in navigator)) return;
    let cancelled = false;
    const request = () =>
      navigator.wakeLock
        .request('screen')
        .then((l) => {
          if (cancelled) l.release();
          else lock.current = l;
        })
        .catch(() => setOn(false));
    request();
    const again = () => document.visibilityState === 'visible' && request();
    document.addEventListener('visibilitychange', again);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', again);
      lock.current?.release();
      lock.current = null;
    };
  }, [on]);
  return [on, setOn] as const;
}

type SavedState<T> = { data: T; players: number; savedAt: number };

/**
 * One saved game per game type in localStorage. On load it offers the saved game instead of
 * restoring it silently; while that offer is open nothing is overwritten.
 */
export function useSaved<T extends { players: string[] }>(
  enabled: boolean,
  slug: string,
  state: T,
  /** Nothing is saved until the game has its first score. */
  started: boolean,
  restore: (data: T) => void,
) {
  const key = `sss:game:${slug}`;
  const [pending, setPending] = useState<SavedState<T> | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as SavedState<T> | (T & { savedAt: number });
        // Saves from the first release stored the state at the top level.
        setPending('data' in parsed ? parsed : { data: parsed as T, players: (parsed as T).players.length, savedAt: parsed.savedAt });
      }
    } catch {
      /* storage unavailable: play without saving */
    }
    setChecked(true);
  }, [enabled, key]);

  useEffect(() => {
    if (!enabled || !checked || pending || !started) return;
    try {
      localStorage.setItem(key, JSON.stringify({ data: state, players: state.players.length, savedAt: Date.now() } satisfies SavedState<T>));
    } catch {
      /* storage full or blocked */
    }
  }, [enabled, checked, pending, started, key, state]);

  const resume = pending
    ? {
        when: new Date(pending.savedAt).toLocaleDateString(undefined, { weekday: 'long', hour: 'numeric', minute: '2-digit' }),
        players: pending.players,
      }
    : null;

  return {
    resume,
    takeResume: () => {
      if (pending) restore(pending.data);
      setPending(null);
    },
    dropResume: () => setPending(null),
    clearSaved: () => {
      try {
        localStorage.removeItem(key);
      } catch {
        /* nothing saved */
      }
    },
  };
}
