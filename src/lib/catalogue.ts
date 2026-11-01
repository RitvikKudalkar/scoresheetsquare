// Phase 1 games from docs/functional-plan.md, so lists can show a game before its page is live.
export type Category = 'dice' | 'card' | 'tile' | 'board';
export type CatalogueEntry = {
  slug: string;
  name: string;
  category: Category;
  min: number;
  max: number;
  /** How the sheet keeps score, in plain words. */
  scoring: string;
};

export const catalogue: CatalogueEntry[] = [
  { slug: 'yahtzee-score-sheet', name: 'Yahtzee', category: 'dice', min: 1, max: 10, scoring: 'Score boxes' },
  { slug: 'farkle-score-sheet', name: 'Farkle', category: 'dice', min: 2, max: 8, scoring: 'Running total' },
  { slug: 'bunco-score-sheet', name: 'Bunco', category: 'dice', min: 4, max: 24, scoring: 'Tallies' },
  { slug: 'phase-10-score-sheet', name: 'Phase 10', category: 'card', min: 2, max: 6, scoring: 'Phases and points' },
  { slug: 'five-crowns-score-sheet', name: 'Five Crowns', category: 'card', min: 2, max: 7, scoring: 'Round totals' },
  { slug: 'hand-and-foot-score-sheet', name: 'Hand and Foot', category: 'card', min: 4, max: 6, scoring: 'Round totals' },
  { slug: 'skyjo-score-sheet', name: 'Skyjo', category: 'card', min: 2, max: 8, scoring: 'Round totals' },
  { slug: 'uno-score-sheet', name: 'Uno', category: 'card', min: 2, max: 10, scoring: 'Round totals' },
  { slug: 'mexican-train-score-sheet', name: 'Mexican Train', category: 'tile', min: 2, max: 8, scoring: 'Round totals' },
];

export const categoryNames: Record<Category, string> = {
  dice: 'Dice games',
  card: 'Card games',
  tile: 'Tile games',
  board: 'Board games',
};

/** Tile games are listed on the board games page (functional plan: "board and tile games"). */
export const categoryHref: Record<Category, string> = {
  dice: '/dice-games',
  card: '/card-games',
  tile: '/board-games',
  board: '/board-games',
};

export const playersLabel = (e: CatalogueEntry) => (e.min === e.max ? `${e.min} players` : `${e.min}–${e.max} players`);
