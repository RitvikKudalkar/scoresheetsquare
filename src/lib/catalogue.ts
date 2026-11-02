// Phase 1 and 2 games from docs/functional-plan.md, so lists can show a game before its page is live.
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
  { slug: 'hand-and-foot-score-sheet', name: 'Hand and Foot', category: 'card', min: 4, max: 6, scoring: 'Books and cards' },
  { slug: 'skyjo-score-sheet', name: 'Skyjo', category: 'card', min: 2, max: 8, scoring: 'Round totals' },
  { slug: 'uno-score-sheet', name: 'Uno', category: 'card', min: 2, max: 10, scoring: 'Round totals' },
  { slug: 'mexican-train-score-sheet', name: 'Mexican Train', category: 'tile', min: 2, max: 8, scoring: 'Round totals' },
  // Phase 2
  { slug: 'triple-yahtzee-score-sheet', name: 'Triple Yahtzee', category: 'dice', min: 1, max: 6, scoring: 'Score boxes' },
  { slug: 'qwixx-score-sheet', name: 'Qwixx', category: 'dice', min: 2, max: 5, scoring: 'Score boxes' },
  { slug: 'kismet-score-sheet', name: 'Kismet', category: 'dice', min: 1, max: 6, scoring: 'Score boxes' },
  { slug: 'ship-captain-crew-score-sheet', name: 'Ship Captain Crew', category: 'dice', min: 2, max: 8, scoring: 'Running total' },
  { slug: 'tenzi-score-sheet', name: 'Tenzi', category: 'dice', min: 2, max: 4, scoring: 'Running total' },
  { slug: 'skip-bo-score-sheet', name: 'Skip-Bo', category: 'card', min: 2, max: 6, scoring: 'Round totals' },
  { slug: 'rummy-500-score-sheet', name: 'Rummy 500', category: 'card', min: 2, max: 8, scoring: 'Round totals' },
  { slug: 'gin-rummy-score-sheet', name: 'Gin Rummy', category: 'card', min: 2, max: 2, scoring: 'Round totals' },
  { slug: 'golf-card-game-score-sheet', name: 'Golf card game', category: 'card', min: 2, max: 8, scoring: 'Round totals' },
  { slug: 'spades-score-sheet', name: 'Spades', category: 'card', min: 2, max: 4, scoring: 'Bids and tricks' },
  { slug: 'hearts-score-sheet', name: 'Hearts', category: 'card', min: 3, max: 6, scoring: 'Round totals' },
  { slug: 'euchre-score-sheet', name: 'Euchre', category: 'card', min: 4, max: 4, scoring: 'Team points' },
  { slug: 'canasta-score-sheet', name: 'Canasta', category: 'card', min: 2, max: 6, scoring: 'Round totals' },
  { slug: 'pinochle-score-sheet', name: 'Pinochle', category: 'card', min: 2, max: 4, scoring: 'Bids and meld' },
  { slug: 'shanghai-rummy-score-sheet', name: 'Shanghai Rummy', category: 'card', min: 3, max: 8, scoring: 'Round totals' },
  { slug: 'oh-hell-score-sheet', name: 'Oh Hell', category: 'card', min: 3, max: 7, scoring: 'Bids and tricks' },
  { slug: '3-13-score-sheet', name: '3-13', category: 'card', min: 2, max: 8, scoring: 'Round totals' },
  { slug: 'wizard-score-sheet', name: 'Wizard', category: 'card', min: 3, max: 6, scoring: 'Bids and tricks' },
  { slug: 'dutch-blitz-score-sheet', name: 'Dutch Blitz', category: 'card', min: 2, max: 8, scoring: 'Round totals' },
  { slug: 'nertz-score-sheet', name: 'Nertz', category: 'card', min: 2, max: 8, scoring: 'Round totals' },
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
