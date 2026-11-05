// Sheet definitions shared by the server-rendered sheet, the scorekeeper island and the PDF build.

export type CategoryRow = { id: string; label: string; hint?: string };

export type CategorySection = {
  id: string;
  label: string;
  rows: CategoryRow[];
  subtotal?: string;
  /** Kismet adds higher `tiers`; the best tier reached counts. */
  bonus?: { threshold: number; points: number; label: string; tiers?: { threshold: number; points: number }[] };
  total?: string;
};

export type CategoryConfig = {
  engine: 'category';
  sections: CategorySection[];
  grandTotal: string;
  teams?: boolean;
};

export type RoundsConfig = {
  engine: 'round-totals';
  rounds: number;
  roundLabels?: string[];
  target?: number;
  /** Phase 10: each round can be ticked as "phase made"; most phases wins, lowest points breaks ties. */
  phases?: number;
  /** Skyjo: reaching the target ends the game only once that round's scores are all in. */
  finishRound?: boolean;
  /** Columns are partnerships (Hand and Foot). */
  teams?: boolean;
  /** Hearts: every round's points add up to `total`. Shooting the moon gives `total` to everyone else
   * ('others') or takes it off the shooter ('self'). */
  roundPoints?: { total: number; moon?: MoonRule };
  /** Targets a table can choose instead of `target` (Euchre to 5, 7, 10 or 11). */
  targetOptions?: number[];
  /** Round counts a table can choose instead of `rounds` (Golf's 9 or 18 holes). */
  roundOptions?: number[];
  /** Canasta: the first meld must reach `points` once a column's total is at least `from` (lowest `from` first). */
  meldMinimums?: { from: number; points: number }[];
};

export type MoonRule = 'others' | 'self';

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

/** Trick-taking games: each round every column bids, then writes the tricks it won. */
export type BidConfig = {
  engine: 'bid-and-make';
  rounds: number;
  /** Cards dealt each round (Oh Hell's 7 down to 1 and back). */
  hands?: number[];
  /** Wizard: round n deals n cards and the game lasts deckSize ÷ players rounds. */
  deckSize?: number;
  /** Columns are partnerships (Spades). */
  teams?: boolean;
  /** Pinochle: each column writes its meld too, and only the side that won the bidding writes a bid.
   * The bidders score meld + tricks if that reaches the bid, or lose the bid; the others score meld + tricks. */
  meld?: boolean;
  /** Points in play each hand (Pinochle's 25 counters), checked like Oh Hell's cards. */
  trickPoints?: number;
  /** Points for making the bid exactly: base + perBid × bid. */
  made?: { base: number; perBid: number };
  /** Spades: taking more than the bid still makes it, and each extra trick is a bag. */
  overtricks?: { points: number; bags?: { every: number; penalty: number } };
  /** Points for missing: perBid × bid plus perOff × tricks off (both usually negative). */
  missed?: { perBid?: number; perOff?: number };
  /** Spades: a nil bid made or failed is worth ± this. */
  nil?: number;
  target?: number;
  targetOptions?: number[];
};

export type SheetConfig = CategoryConfig | RoundsConfig | TurnsConfig | TallyConfig | BidConfig;

export type WinCondition = 'highest' | 'lowest';

export type SheetGame = {
  slug: string;
  name: string;
  players: { min: number; max: number; default: number };
  winCondition: WinCondition;
  sheet: SheetConfig;
};

/** Scores keyed by row id → one value per player column (null = not yet written).
 * Phase ticks live under `phase:<rowId>` with 1 for "made". Bid rounds keep `bid:<rowId>` and
 * `took:<rowId>`, and `nil:<rowId>` with 1 for made and -1 for failed. */
export type Scores = Record<string, (number | null)[]>;

export type ComputedRow = { id: string; label: string; values: number[]; strong?: boolean };
export type SheetRow = { id: string; label: string; hint?: string; phase?: boolean; bid?: boolean };

export type SheetLayout = {
  groups: { id: string; label?: string; rows: SheetRow[]; computed: ComputedRow[] }[];
  totals: number[];
};

const sum = (xs: (number | null | undefined)[]) => xs.reduce<number>((a, b) => a + (b ?? 0), 0);
export const phaseKey = (rowId: string) => `phase:${rowId}`;
export const bidKey = (rowId: string) => `bid:${rowId}`;
export const tookKey = (rowId: string) => `took:${rowId}`;
export const nilKey = (rowId: string) => `nil:${rowId}`;
export const meldKey = (rowId: string) => `meld:${rowId}`;

/** Choices a table makes before it plays: the target, the number of rounds and Hearts' moon rule. */
export type GameOptions = { target?: number; rounds?: number; moon?: MoonRule };

/** The sheet as this table plays it. Choices the game doesn't offer are ignored. */
export function applyOptions(config: SheetConfig, o: GameOptions): SheetConfig {
  if (config.engine === 'bid-and-make') {
    return o.target && config.targetOptions?.includes(o.target) ? { ...config, target: o.target } : config;
  }
  if (config.engine !== 'round-totals') return config;
  const next = { ...config };
  if (o.target && config.targetOptions?.includes(o.target)) next.target = o.target;
  if (o.rounds && config.roundOptions?.includes(o.rounds)) next.rounds = o.rounds;
  if (o.moon && config.roundPoints?.moon) next.roundPoints = { ...config.roundPoints, moon: o.moon };
  return next;
}

/** What the scorekeeper offers to change, and what to call a round ("Holes" for Golf). */
export function optionChoices(config: SheetConfig) {
  const rounds = config.engine === 'round-totals' ? config : null;
  const targets = config.engine === 'round-totals' || config.engine === 'bid-and-make' ? config.targetOptions : undefined;
  const word = rounds?.roundLabels?.[0]?.split(' ')[0];
  return {
    targets,
    rounds: rounds?.roundOptions,
    roundsName: word && /^[A-Z][a-z]+$/.test(word) ? `${word}s` : 'Rounds',
    moon: !!rounds?.roundPoints?.moon,
  };
}

/** Whether each column is a partnership rather than one player (Spades, Hand and Foot). */
export const teamColumns = (config: SheetConfig) => (config.engine === 'category' || config.engine === 'round-totals' || config.engine === 'bid-and-make') && !!config.teams;

/** Rounds a bid game lasts with this many columns. */
export function bidRounds(config: BidConfig, playerCount: number): number {
  if (config.deckSize) return Math.min(config.rounds, Math.floor(config.deckSize / Math.max(1, playerCount)));
  return config.rounds;
}

/** Cards each player holds in round `r` (0-based), when the game fixes it. */
export function cardsIn(config: BidConfig, r: number): number | undefined {
  return config.hands?.[r] ?? (config.deckSize ? r + 1 : undefined);
}

/** One column's points for one round, or null until both the bid and the tricks are written. */
export function bidPoints(
  config: BidConfig,
  bid: number | null | undefined,
  took: number | null | undefined,
  nil?: number | null,
  meld?: number | null,
): number | null {
  if (config.meld) {
    if (took == null || meld == null) return null;
    if (bid == null) return meld + took;
    return meld + took >= bid ? meld + took : -bid;
  }
  if (bid == null || took == null) return null;
  const off = took - bid;
  let points =
    off === 0 || (off > 0 && config.overtricks)
      ? config.made!.base + config.made!.perBid * bid + (off > 0 ? off * config.overtricks!.points : 0)
      : (config.missed?.perBid ?? 0) * bid + (config.missed?.perOff ?? 0) * Math.abs(off);
  if (config.nil && nil) points += nil * config.nil;
  return points;
}

/** Spades: bags since the last penalty, and the points lost to every full set of them. */
function bagsOf(config: BidConfig, scores: Scores, ids: string[], p: number) {
  if (!config.overtricks?.bags) return { bags: 0, penalty: 0 };
  const bags = ids.reduce((n, id) => {
    const bid = scores[bidKey(id)]?.[p];
    const took = scores[tookKey(id)]?.[p];
    return bid != null && took != null && took > bid ? n + took - bid : n;
  }, 0);
  const { every, penalty } = config.overtricks.bags;
  return { bags: bags % every, penalty: Math.floor(bags / every) * penalty };
}

export function rowIds(config: SheetConfig): string[] {
  if (config.engine === 'category') return config.sections.flatMap((s) => s.rows.map((r) => r.id));
  if (config.engine === 'tally') return config.tallies.map((t) => t.id);
  const n = config.engine === 'running-turns' ? config.turns : config.rounds;
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

/** Works out every printed row, computed row and player total from the written scores.
 * `allRounds` keeps every row of a Wizard sheet, so a blank printed sheet suits any player count. */
export function layoutSheet(config: SheetConfig, scores: Scores, playerCount: number, allRounds = false): SheetLayout {
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
        const { threshold, points, label, tiers = [] } = section.bonus;
        const steps = [{ threshold, points }, ...tiers].sort((a, b) => b.threshold - a.threshold);
        const bonus = raw.map((v) => steps.find((t) => v >= t.threshold)?.points ?? 0);
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

  if (config.engine === 'bid-and-make') {
    const ids = rowIds(config).slice(0, allRounds ? undefined : bidRounds(config, playerCount));
    const cardsLabel = (n: number) => `${n} ${n === 1 ? 'card' : 'cards'}`;
    const rows = ids.map((id, i) => {
      const cards = cardsIn(config, i);
      return config.hands
        ? { id, label: cardsLabel(cards!), bid: true }
        : { id, label: `Round ${i + 1}`, hint: cards ? cardsLabel(cards) : undefined, bid: true };
    });
    const bags = players.map((p) => bagsOf(config, scores, ids, p));
    const totals = players.map(
      (p) => sum(ids.map((id) => bidPoints(config, col(bidKey(id), p), col(tookKey(id), p), col(nilKey(id), p), col(meldKey(id), p)))) - bags[p].penalty,
    );
    const computed: ComputedRow[] = [];
    if (config.overtricks?.bags) {
      const { every, penalty } = config.overtricks.bags;
      computed.push({ id: 'bags', label: `Bags (${every} = −${penalty})`, values: bags.map((b) => b.bags) });
    }
    computed.push({ id: 'grand-total', label: 'Total', values: totals, strong: true });
    return { groups: [{ id: 'rounds', rows, computed }], totals };
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

/** Index of the leading player, or -1 before anyone has scored, or while the lead is tied.
 * In a lowest-wins game a column with nothing written is left out, so it never "leads" on 0; in a
 * highest-wins game it stays in, because in Euchre or Uno a side that never scores has simply lost. */
export function leaderOf(config: SheetConfig, totals: number[], win: WinCondition, scores: Scores): number {
  const ranked = rankPlayers(config, totals, win, scores);
  if (!ranked.some((i) => hasPlayed(scores, i))) return -1;
  const playing = win === 'highest' ? ranked : ranked.filter((i) => hasPlayed(scores, i));
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
  if (config.engine === 'bid-and-make') {
    const played = ids.slice(0, bidRounds(config, playerCount));
    // A Pinochle hand has one bid between the sides; every other game has one bid per column.
    const written = (id: string) =>
      config.meld
        ? players.some((p) => scores[bidKey(id)]?.[p] != null) && players.every((p) => scores[meldKey(id)]?.[p] != null && scores[tookKey(id)]?.[p] != null)
        : players.every((p) => scores[bidKey(id)]?.[p] != null && scores[tookKey(id)]?.[p] != null);
    // Played to a target: over once someone reaches it and every round begun is written in.
    if (config.target !== undefined) {
      const begun = played.filter((id) => players.some((p) => scores[tookKey(id)]?.[p] != null));
      return totals.some((t) => t >= config.target!) && begun.every(written);
    }
    return played.every(written);
  }
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
  if (config.engine === 'round-totals' && config.target !== undefined) {
    if (!totals.some((t) => t >= config.target!)) return false;
    if (!config.finishRound) return true;
    const begun = ids.filter((id) => players.some((p) => scores[id]?.[p] != null));
    return begun.every((id) => players.every((p) => scores[id]?.[p] != null));
  }
  return ids.every((id) => players.every((p) => scores[id]?.[p] != null));
}

/** Plain-language notes the sheet shows above the grid while a game is in play. */
export function notices(config: SheetConfig, scores: Scores, names: string[], totals: number[]): string[] {
  if (config.engine === 'bid-and-make') return bidNotices(config, scores, names.length);
  if (config.engine === 'round-totals') return [...roundPointNotices(config, scores, names.length), ...meldNotices(config, scores, names, totals)];
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

/** A round whose tricks don't add up to the cards dealt has a slip in it. */
function bidNotices(config: BidConfig, scores: Scores, playerCount: number): string[] {
  return rowIds(config)
    .slice(0, bidRounds(config, playerCount))
    .flatMap((id, r) => {
      const out: string[] = [];
      const bids = Array.from({ length: playerCount }, (_, p) => scores[bidKey(id)]?.[p]).filter((b) => b != null);
      if (config.meld && bids.length > 1) out.push(`Round ${r + 1} has ${bids.length} bids; only the side that won the bidding writes one.`);
      const cards = cardsIn(config, r) ?? config.trickPoints;
      const took = Array.from({ length: playerCount }, (_, p) => scores[tookKey(id)]?.[p]);
      if (cards === undefined || took.some((t) => t == null)) return out;
      const total = took.reduce<number>((a, b) => a + (b ?? 0), 0);
      if (total !== cards) out.push(`Round ${r + 1}: the ${config.meld ? 'counters' : 'tricks'} add up to ${total}, but there were ${cards} to win.`);
      return out;
    });
}

/** Hearts: a written round that doesn't add up to the points in the deck has a slip in it. */
function roundPointNotices(config: RoundsConfig, scores: Scores, playerCount: number): string[] {
  if (!config.roundPoints) return [];
  const { total, moon } = config.roundPoints;
  // Shooting the moon: 26 to everyone else, or 26 off the shooter's own score.
  const moonSum = moon === 'others' ? total * (playerCount - 1) : moon === 'self' ? -total : undefined;
  const allowed = moonSum === undefined ? [total] : [total, moonSum];
  return rowIds(config).flatMap((id, r) => {
    const row = Array.from({ length: playerCount }, (_, p) => scores[id]?.[p]);
    if (row.some((v) => v == null)) return [];
    const sum = row.reduce<number>((a, b) => a + (b ?? 0), 0);
    if (allowed.includes(sum)) return [];
    const label = config.roundLabels?.[r] ?? `Round ${r + 1}`;
    return [`${label} adds up to ${sum}. Every round should add up to ${total}${moonSum === undefined ? '' : `, or ${String(moonSum).replace('-', '−')} when someone shoots the moon`}.`];
  });
}

/** Canasta: what each column's first meld must reach in the next hand, once the game has begun. */
function meldNotices(config: RoundsConfig, scores: Scores, names: string[], totals: number[]): string[] {
  const steps = config.meldMinimums;
  if (!steps || !rowIds(config).some((id) => scores[id]?.some((v) => v != null))) return [];
  const needs = names.map((name, p) => `${name} ${[...steps].reverse().find((s) => totals[p] >= s.from)?.points ?? steps[0].points}`);
  return [`First meld next hand: ${needs.join(', ')}.`];
}
