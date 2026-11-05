// Mexican Train with a double-12 set: dealing, legal plays, doubles, markers, scoring and the computer players.
// Pure data in, data out, so the game can be saved to localStorage and resumed as it was.

export type Tile = [number, number];
/** A tile on a train, turned so `a` matches the end it was played on and `b` is the new open end. */
export type Placed = { a: number; b: number };
/** `owner` is the player's index, or null for the Mexican Train. */
export type Train = { owner: number | null; tiles: Placed[]; marker: boolean };
export type Player = { name: string; human: boolean; hand: Tile[]; scores: number[] };
export type Move = { tile: number; train: number };

export type Game = {
  players: Player[];
  rounds: number;
  /** 0-based round; its engine double is 12 - round. */
  round: number;
  engine: number;
  trains: Train[];
  boneyard: Tile[];
  turn: number;
  /** The player in turn has drawn their one tile. */
  drew: boolean;
  /** Train index of a double that must be covered before any other play. */
  openDouble: number | null;
  /** Consecutive passes with an empty boneyard; a full table of them blocks the round. */
  passes: number;
  phase: 'play' | 'round-over' | 'game-over';
  /** Who went out this round, or null when the round was blocked. */
  outPlayer: number | null;
  message: string;
};

export const MAX_PIP = 12;
export const DEAL = 15;

export const pips = (t: Tile) => t[0] + t[1];
export const isDouble = (t: Tile) => t[0] === t[1];
export const tileName = (t: Tile) => (isDouble(t) ? `double ${t[0]}` : `${t[0]}-${t[1]}`);
export const mexicanIndex = (g: Game) => g.players.length;
export const trainName = (g: Game, i: number) => {
  const owner = g.trains[i].owner;
  if (owner === null) return 'the Mexican Train';
  return owner === 0 && g.players[0].human ? 'your train' : `${g.players[owner].name}'s train`;
};

function fullSet(): Tile[] {
  const set: Tile[] = [];
  for (let a = 0; a <= MAX_PIP; a++) for (let b = a; b <= MAX_PIP; b++) set.push([a, b]);
  return set;
}

function shuffle<T>(list: T[], random: () => number): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function openEnd(g: Game, train: number): number {
  const tiles = g.trains[train].tiles;
  return tiles.length ? tiles[tiles.length - 1].b : g.engine;
}

/** Deals the next round: the engine double goes in the hub, everyone draws 15, the boneyard keeps the rest. */
export function dealRound(g: Game, random: () => number = Math.random): Game {
  const engine = MAX_PIP - g.round;
  const deck = shuffle(
    fullSet().filter((t) => !(t[0] === engine && t[1] === engine)),
    random,
  );
  const players = g.players.map((p, i) => ({ ...p, hand: deck.slice(i * DEAL, (i + 1) * DEAL) }));
  const first = g.round % players.length;
  return {
    ...g,
    players,
    engine,
    boneyard: deck.slice(players.length * DEAL),
    trains: [...players.map((_, i) => ({ owner: i, tiles: [], marker: false })), { owner: null, tiles: [], marker: true }],
    turn: first,
    drew: false,
    openDouble: null,
    passes: 0,
    phase: 'play',
    outPlayer: null,
    message: `Round ${g.round + 1}: the double ${engine} is in the hub. ${players[first].human ? 'You start.' : `${players[first].name} starts.`}`,
  };
}

export function newGame(names: string[], rounds: number, random: () => number = Math.random): Game {
  const base: Game = {
    players: names.map((name, i) => ({ name, human: i === 0, hand: [], scores: [] })),
    rounds,
    round: 0,
    engine: MAX_PIP,
    trains: [],
    boneyard: [],
    turn: 0,
    drew: false,
    openDouble: null,
    passes: 0,
    phase: 'play',
    outPlayer: null,
    message: '',
  };
  return dealRound(base, random);
}

/** A double whose every partner tile is already on the table can't be covered, so it stops blocking play. */
function coverable(g: Game, value: number): boolean {
  let seen = 0;
  for (const t of g.trains) for (const p of t.tiles) if (p.a === value || p.b === value) seen += 1;
  if (g.engine === value) seen += 1;
  // A double-12 set has 13 tiles carrying each number.
  return seen < MAX_PIP + 1;
}

/** Trains this player may play on right now, ignoring which tiles they hold. */
export function openTrains(g: Game, player: number): number[] {
  if (g.openDouble !== null && coverable(g, openEnd(g, g.openDouble))) return [g.openDouble];
  return g.trains.flatMap((t, i) => (t.owner === player || t.owner === null || t.marker ? [i] : []));
}

export function legalMoves(g: Game, player: number): Move[] {
  if (g.phase !== 'play') return [];
  const trains = openTrains(g, player);
  const moves: Move[] = [];
  g.players[player].hand.forEach((t, tile) => {
    for (const train of trains) {
      const end = openEnd(g, train);
      if (t[0] === end || t[1] === end) moves.push({ tile, train });
    }
  });
  return moves;
}

function nextTurn(g: Game): Game {
  return { ...g, turn: (g.turn + 1) % g.players.length, drew: false };
}

function endRound(g: Game, outPlayer: number | null): Game {
  const players = g.players.map((p, i) => ({
    ...p,
    scores: [...p.scores, i === outPlayer ? 0 : p.hand.reduce((sum, t) => sum + pips(t), 0)],
  }));
  const last = g.round + 1 >= g.rounds;
  const who = outPlayer === null ? 'Nobody can play and the boneyard is empty.' : `${players[outPlayer].human ? 'You go' : `${players[outPlayer].name} goes`} out.`;
  return { ...g, players, outPlayer, phase: last ? 'game-over' : 'round-over', message: `${who} Round ${g.round + 1} is over.` };
}

export function play(g: Game, move: Move): Game {
  const player = g.players[g.turn];
  const tile = player.hand[move.tile];
  const end = openEnd(g, move.train);
  const placed: Placed = tile[0] === end ? { a: tile[0], b: tile[1] } : { a: tile[1], b: tile[0] };
  const hand = player.hand.filter((_, i) => i !== move.tile);
  const trains = g.trains.map((t, i) =>
    i === move.train ? { ...t, tiles: [...t.tiles, placed], marker: t.owner === g.turn ? false : t.marker } : t,
  );
  const players = g.players.map((p, i) => (i === g.turn ? { ...p, hand } : p));
  const who = player.human ? 'You' : player.name;
  let next: Game = { ...g, players, trains, passes: 0, message: `${who} played the ${tileName(tile)} on ${trainName(g, move.train)}.` };

  // Going out ends the round, even on a double.
  if (hand.length === 0) return endRound(next, g.turn);

  if (isDouble(tile)) {
    // A double is covered before anything else; the player who laid it goes again to try.
    next = { ...next, openDouble: move.train, drew: false };
    next.message += player.human ? ' Now cover it.' : '';
    return coverable(next, tile[0]) ? next : nextTurn({ ...next, openDouble: null });
  }
  return nextTurn({ ...next, openDouble: null });
}

/** Draw one tile from the boneyard. */
export function draw(g: Game): Game {
  const [tile, ...boneyard] = g.boneyard;
  const players = g.players.map((p, i) => (i === g.turn ? { ...p, hand: [...p.hand, tile] } : p));
  const who = g.players[g.turn].human ? 'You draw' : `${g.players[g.turn].name} draws`;
  return { ...g, players, boneyard, drew: true, message: `${who} a tile.` };
}

/** No play after drawing (or nothing left to draw): the player's train gets a marker and the turn passes. */
export function pass(g: Game): Game {
  const trains = g.trains.map((t) => (t.owner === g.turn ? { ...t, marker: true } : t));
  const passes = g.boneyard.length === 0 ? g.passes + 1 : 0;
  const who = g.players[g.turn].human ? 'You pass' : `${g.players[g.turn].name} passes`;
  const next = { ...g, trains, passes, message: `${who} and put out a marker.` };
  if (passes >= g.players.length) return endRound(next, null);
  return nextTurn(next);
}

export function canDraw(g: Game) {
  return g.phase === 'play' && !g.drew && g.boneyard.length > 0;
}

export function nextRound(g: Game, random: () => number = Math.random): Game {
  return dealRound({ ...g, round: g.round + 1 }, random);
}

export const totals = (g: Game) => g.players.map((p) => p.scores.reduce((a, b) => a + b, 0));

/** Lowest total wins; ties go to whoever went out (scored zero) in more rounds. */
export function standings(g: Game): number[] {
  const t = totals(g);
  const zeros = g.players.map((p) => p.scores.filter((s) => s === 0).length);
  return g.players.map((_, i) => i).sort((a, b) => t[a] - t[b] || zeros[b] - zeros[a]);
}

/**
 * One computer action: play, draw or pass. It lays doubles it can cover, keeps its own train
 * moving (and lifts its marker), and otherwise sheds its heaviest tile.
 */
export function computerStep(g: Game, random: () => number = Math.random): Game {
  const me = g.turn;
  const moves = legalMoves(g, me);
  if (moves.length === 0) return canDraw(g) ? draw(g) : pass(g);
  const hand = g.players[me].hand;
  const own = g.trains.findIndex((t) => t.owner === me);
  const score = (m: Move) => {
    const t = hand[m.tile];
    let s = pips(t);
    if (isDouble(t)) s += hand.some((o, i) => i !== m.tile && (o[0] === t[0] || o[1] === t[0])) ? 30 : -15;
    if (m.train === own) s += g.trains[own].marker ? 20 : 4;
    if (g.trains[m.train].owner === null) s += 1;
    return s + random() * 0.5;
  };
  const best = moves.reduce((a, b) => (score(b) > score(a) ? b : a));
  return play(g, best);
}
