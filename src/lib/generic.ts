// The blank score sheet (/printable-score-sheet): a round-totals sheet built from the visitor's settings.
import type { SheetGame, WinCondition } from './sheet.ts';

export type GenericSettings = { title: string; players: number; rounds: number; win: WinCondition };

export const GENERIC_DEFAULTS: GenericSettings = { title: '', players: 4, rounds: 12, win: 'highest' };
export const GENERIC_EVENT = 'sss:generic-settings';
export const GENERIC_LIMITS = { players: [2, 8], rounds: [5, 20] } as const;
const SETTINGS_KEY = 'sss:generic-settings';

export function genericGame(s: GenericSettings): SheetGame {
  return {
    // Rounds and win rule are part of the slug so a saved game only resumes onto a sheet of the same shape.
    slug: `printable-score-sheet-${s.rounds}-${s.win}`,
    name: s.title.trim() || 'Score sheet',
    players: { min: GENERIC_LIMITS.players[0], max: GENERIC_LIMITS.players[1], default: s.players },
    winCondition: s.win,
    sheet: { engine: 'round-totals', rounds: s.rounds },
  };
}

export function loadSettings(): GenericSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...GENERIC_DEFAULTS, ...(JSON.parse(raw) as Partial<GenericSettings>) } : GENERIC_DEFAULTS;
  } catch {
    return GENERIC_DEFAULTS;
  }
}

export function publishSettings(s: GenericSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {
    /* settings just won't be remembered */
  }
  window.dispatchEvent(new CustomEvent<GenericSettings>(GENERIC_EVENT, { detail: s }));
}
