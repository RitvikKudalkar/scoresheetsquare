// Phase 1 games from docs/functional-plan.md, so lists can show a game before its page is live.
export type Category = 'dice' | 'card' | 'tile' | 'board';
export type CatalogueEntry = { slug: string; name: string; category: Category; players: string };

export const catalogue: CatalogueEntry[] = [
  { slug: 'yahtzee-score-sheet', name: 'Yahtzee', category: 'dice', players: '1–10 players' },
  { slug: 'farkle-score-sheet', name: 'Farkle', category: 'dice', players: '2–8 players' },
  { slug: 'bunco-score-sheet', name: 'Bunco', category: 'dice', players: '8–12 players' },
  { slug: 'phase-10-score-sheet', name: 'Phase 10', category: 'card', players: '2–6 players' },
  { slug: 'five-crowns-score-sheet', name: 'Five Crowns', category: 'card', players: '2–7 players' },
  { slug: 'hand-and-foot-score-sheet', name: 'Hand and Foot', category: 'card', players: '4–6 players' },
  { slug: 'skyjo-score-sheet', name: 'Skyjo', category: 'card', players: '2–8 players' },
  { slug: 'uno-score-sheet', name: 'Uno', category: 'card', players: '2–10 players' },
  { slug: 'mexican-train-score-sheet', name: 'Mexican Train', category: 'tile', players: '2–8 players' },
];

export const categoryNames: Record<Category, string> = {
  dice: 'Dice games',
  card: 'Card games',
  tile: 'Tile games',
  board: 'Board games',
};
