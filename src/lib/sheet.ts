// Sheet definitions shared by the server-rendered sheet, the scorekeeper island and the PDF build.

export type CategoryRow = { id: string; label: string; hint?: string };

export type CategorySection = {
  id: string;
  label: string;
  rows: CategoryRow[];
  subtotal?: string;
  bonus?: { threshold: number; points: number; label: string };
  total?: string;
};

export type CategoryConfig = {
  engine: 'category';
  sections: CategorySection[];
  grandTotal: string;
};

export type RoundsConfig = {
  engine: 'round-totals';
  rounds: number;
  roundLabels?: string[];
  target?: number;
  /** Phase 10: each round can be ticked as "phase made"; most phases wins, lowest points breaks ties. */
  phases?: number;
};

export type TurnsConfig = {
  engine: 'running-turns';
  turns: number;
  target: number;
  minimumToBoard?: number;
};

/** Bunco: counts per player instead of points, played in sets of numbered rounds. */
export type TallyConfig = {
  engine: 'tally';
  tallies: { id: string; label: string }[];
  sets: number;
  roundsPerSet: number;
};

export type SheetConfig = CategoryConfig | RoundsConfig | TurnsConfig | TallyConfig;

export type WinCondition = 'highest' | 'lowest';

export type SheetGame = {
  slug: string;
  name: string;
  players: { min: number; max: number; default: number };
  winCondition: WinCondition;
  sheet: SheetConfig;
};

/** Scores keyed by row id → one value per player column (null = not yet written).
 * Phase ticks live under `phase:<rowId>` with 1 for "made". */
export type Scores = Record<string, (number | null)[]>;

export type ComputedRow = { id: string; label: string; values: number[]; strong?: boolean };
export type SheetRow = { id: string; label: string; hint?: string; phase?: boolean };

export type SheetLayout = {
  groups: { id: string; label?: string; rows: SheetRow[]; computed: ComputedRow[] }[];
  totals: number[];
};

const sum = (xs: (number | null | undefined)[]) => xs.reduce<number>((a, b) => a + (b ?? 0), 0);
export const phaseKey = (rowId: string) => `phase:${rowId}`;

export function rowIds(config: SheetConfig): string[] {
  if (config.engine === 'category') return config.sections.flatMap((s) => s.rows.map((r) => r.id));
  if (config.engine === 'tally') return config.tallies.map((t) => t.id);
  const n = config.engine === 'round-totals' ? config.rounds : config.turns;
  return Array.from({ length: n }, (_, i) => `r${i + 1}`);
}

/** Bunco rounds for the printed tally card: "Set 1" → "Round 1: roll 1s" … */
export function tallyRounds(config: TallyConfig) {
  return Array.from({ length: config.sets }, (_, s) => ({
    set: s + 1,
    rounds: Array.from({ length: config.roundsPerSet }, (_, r) => ({ id: `s${s + 1}r${r + 1}`, label: `Round ${r + 1}: roll ${r + 1}s` })),
  }));
}

export function phasesMade(config: SheetConfig, scores: Scores, p: number): number {
  if (config.engine !== 'round-totals' || !config.phases) return 0;
  return rowIds(config).filter((id) => scores[phaseKey(id)]?.[p] === 1).length;
}

/** Works out every printed row, computed row and player total from the written scores. */
export function layoutSheet(config: SheetConfig, scores: Scores, playerCount: number): SheetLayout {
  const col = (id: string, p: number) => scores[id]?.[p] ?? null;
  const players = Array.from({ length: playerCount }, (_, p) => p);

  if (config.engine === 'category') {
    const sectionTotals = players.map(() => 0);
    const groups = config.sections.map((section) => {
      const computed: ComputedRow[] = [];
      const raw = players.map((p) => sum(section.rows.map((r) => col(r.id, p))));
      let final = raw;
      if (section.subtotal) computed.push({ id: `${section.id}-subtotal`, label: section.subtotal, values: raw });
      if (section.bonus) {
        const { threshold, points, label } = section.bonus;
        const bonus = raw.map((v) => (v >= threshold ? points : 0));
        computed.push({ id: `${section.id}-bonus`, label, values: bonus });
        final = raw.map((v, p) => v + bonus[p]);
      }
      if (section.total) computed.push({ id: `${section.id}-total`, label: section.total, values: final, strong: true });
      final.forEach((v, p) => (sectionTotals[p] += v));
      return { id: section.id, label: section.label, rows: section.rows, computed };
    });
    groups[groups.length - 1].computed.push({ id: 'grand-total', label: config.grandTotal, values: sectionTotals, strong: true });
    return { groups, totals: sectionTotals };
  }

  if (config.engine === 'tally') {
    // The tally's own totals (wins first) stand in for points; the printed card lays rounds out by set.
    const totals = players.map((p) => col(config.tallies[0].id, p) ?? 0);
    return {
      groups: tallyRounds(config).map((s) => ({ id: `set-${s.set}`, label: `Set ${s.set}`, rows: s.rounds, computed: [] })),
      totals,
    };
  }

  const ids = rowIds(config);
  const phased = config.engine === 'round-totals' && !!config.phases;
  const labels =
    config.engine === 'round-totals'
      ? ids.map((_, i) => config.roundLabels?.[i] ?? `Round ${i + 1}`)
      : ids.map((_, i) => `Turn ${i + 1}`);
  const totals = players.map((p) => sum(ids.map((id) => col(id, p))));
  const computed: ComputedRow[] = [];
  if (phased) computed.push({ id: 'phases-made', label: 'Phases made', values: players.map((p) => phasesMade(config, scores, p)) });
  computed.push({ id: 'grand-total', label: phased ? 'Points' : 'Total', values: totals, strong: true });
  return {
    groups: [{ id: 'rounds', rows: ids.map((id, i) => ({ id, label: labels[i], phase: phased })), computed }],
    totals,
  };
}

const hasPlayed = (scores: Scores, p: number) => Object.values(scores).some((vals) => vals[p] != null);

/** Index of the leading player, or -1 until two players have scored, or while the lead is tied.
 * Players with nothing written yet are left out, so an empty column never "leads" a lowest-wins game. */
export function leaderOf(config: SheetConfig, totals: number[], win: WinCondition, scores: Scores): number {
  const playing = rankPlayers(config, totals, win, scores).filter((i) => hasPlayed(scores, i));
  if (playing.length < 2) return -1;
  const [a, b] = playing.map((i) => rankKey(config, totals, win, scores, i));
  return a[0] === b[0] && a[1] === b[1] ? -1 : playing[0];
}

// Phases made first (Phase 10), then points in the direction that wins.
const rankKey = (config: SheetConfig, totals: number[], win: WinCondition, scores: Scores, i: number) =>
  [-phasesMade(config, scores, i), win === 'highest' ? -totals[i] : totals[i]] as const;

/** Player indexes from first place to last. */
export function rankPlayers(config: SheetConfig, totals: number[], win: WinCondition, scores: Scores): number[] {
  return totals
    .map((_, i) => i)
    .sort((a, b) => {
      const [ka, kb] = [rankKey(config, totals, win, scores, a), rankKey(config, totals, win, scores, b)];
      return ka[0] - kb[0] || ka[1] - kb[1];
    });
}

/** Turns each player has written, counted from the top of their column. */
const turnsTaken = (ids: string[], scores: Scores, p: number) => ids.filter((id) => scores[id]?.[p] != null).length;

export function isComplete(config: SheetConfig, scores: Scores, playerCount: number, totals: number[]): boolean {
  const ids = rowIds(config);
  const players = Array.from({ length: playerCount }, (_, p) => p);
  if (config.engine === 'tally') return false;
  if (config.engine === 'running-turns') {
    // Someone passed the target and everyone has had the same number of turns: the final round is over.
    if (!totals.some((t) => t >= config.target)) return false;
    const counts = players.map((p) => turnsTaken(ids, scores, p));
    return counts.every((c) => c === counts[0]);
  }
  if (config.engine === 'round-totals' && config.phases) {
    // The game ends with the round in which someone made their last phase, once that round's points are all in.
    const finalRow = ids.find((_, r) => players.some((p) => ids.slice(0, r + 1).filter((id) => scores[phaseKey(id)]?.[p] === 1).length >= config.phases!));
    return !!finalRow && players.every((p) => scores[finalRow]?.[p] != null);
  }
  if (config.engine === 'round-totals' && config.target !== undefined) return totals.some((t) => t >= config.target!);
  return ids.every((id) => players.every((p) => scores[id]?.[p] != null));
}

/** Plain-language notes the sheet shows above the grid while a game is in play. */
export function notices(config: SheetConfig, scores: Scores, names: string[], totals: number[]): string[] {
  if (config.engine !== 'running-turns') return [];
  const out: string[] = [];
  const ids = rowIds(config);
  const leader = totals.findIndex((t) => t >= config.target);
  if (leader >= 0) out.push(`${names[leader]} passed ${config.target.toLocaleString('en-US')}. Everyone else gets one last turn.`);
  if (config.minimumToBoard) {
    names.forEach((name, p) => {
      const first = ids.map((id) => scores[id]?.[p]).find((v) => v != null && v !== 0);
      if (first != null && first < config.minimumToBoard!) {
        out.push(`${name} needs ${config.minimumToBoard!.toLocaleString('en-US')} in one turn to get on the board; that first score of ${first} would not count.`);
      }
    });
  }
  return out;
}
