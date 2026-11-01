// Sheet definitions shared by the server-rendered sheet, the scorekeeper island and (later) the PDF build.

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
  roundNote?: string;
  target?: number;
};

export type TurnsConfig = {
  engine: 'running-turns';
  turns: number;
  target: number;
  minimumToBoard?: number;
};

export type SheetConfig = CategoryConfig | RoundsConfig | TurnsConfig;

export type WinCondition = 'highest' | 'lowest';

export type SheetGame = {
  slug: string;
  name: string;
  players: { min: number; max: number; default: number };
  winCondition: WinCondition;
  sheet: SheetConfig;
};

/** Scores keyed `${rowId}` → one value per player column (null = not yet written). */
export type Scores = Record<string, (number | null)[]>;

export type ComputedRow = { id: string; label: string; values: number[]; strong?: boolean };

export type SheetLayout = {
  groups: { id: string; label?: string; rows: { id: string; label: string; hint?: string }[]; computed: ComputedRow[] }[];
  totals: number[];
};

const sum = (xs: (number | null | undefined)[]) => xs.reduce<number>((a, b) => a + (b ?? 0), 0);

export function rowIds(config: SheetConfig): string[] {
  if (config.engine === 'category') return config.sections.flatMap((s) => s.rows.map((r) => r.id));
  const n = config.engine === 'round-totals' ? config.rounds : config.turns;
  return Array.from({ length: n }, (_, i) => `r${i + 1}`);
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

  const ids = rowIds(config);
  const labels =
    config.engine === 'round-totals'
      ? ids.map((_, i) => config.roundLabels?.[i] ?? `Round ${i + 1}`)
      : ids.map((_, i) => `Turn ${i + 1}`);
  const totals = players.map((p) => sum(ids.map((id) => col(id, p))));
  return {
    groups: [
      {
        id: 'rounds',
        rows: ids.map((id, i) => ({ id, label: labels[i] })),
        computed: [{ id: 'grand-total', label: 'Total', values: totals, strong: true }],
      },
    ],
    totals,
  };
}

/** Index of the leading player, or -1 while nobody has scored or players are tied. */
export function leaderOf(totals: number[], win: WinCondition, scores: Scores): number {
  const started = Object.values(scores).some((vals) => vals.some((v) => v !== null));
  if (!started || totals.length < 2) return -1;
  const best = win === 'highest' ? Math.max(...totals) : Math.min(...totals);
  const leaders = totals.flatMap((t, i) => (t === best ? [i] : []));
  return leaders.length === 1 ? leaders[0] : -1;
}

export function isComplete(config: SheetConfig, scores: Scores, playerCount: number, totals: number[]): boolean {
  if (config.engine === 'running-turns') return totals.some((t) => t >= config.target);
  if (config.engine === 'round-totals' && config.target !== undefined) return totals.some((t) => t >= config.target!);
  return rowIds(config).every((id) => Array.from({ length: playerCount }, (_, p) => scores[id]?.[p] ?? null).every((v) => v !== null));
}
