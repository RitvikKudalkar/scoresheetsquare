// Mexican Train against up to three computer players. The rules live in lib/mexican-train; this is the table.
// Every change of state is read back as a physical event (a tile played, drawn or dealt, a marker put out)
// and shown as one, so the board never just swaps one picture for the next.
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import Domino, { DominoBack } from './Domino';
import TrainBoard, { type BoardRow } from './TrainBoard';
import { PencilCircle } from './sheet-shared';
import { track } from '../lib/analytics';
import { clack, dropMarker, fly, reducedMotion, setSound } from '../lib/table-motion';
import {
  canDraw,
  computerStep,
  draw,
  legalMoves,
  newGame,
  nextRound,
  pass,
  pips,
  play,
  standings,
  totals,
  MAX_PIP,
  type Game,
  type Tile,
} from '../lib/mexican-train';

const KEY = 'sss:game:mexican-train-online';
const SOUND_KEY = 'sss:mexican-train-sound';
const COMPUTERS = ['Rosa', 'Walt', 'June'];
const STEP_MS = 800;

function load(): Game | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Game) : null;
  } catch {
    return null;
  }
}

function save(game: Game | null) {
  try {
    if (game && game.phase !== 'game-over') localStorage.setItem(KEY, JSON.stringify(game));
    else localStorage.removeItem(KEY);
  } catch {
    // Private windows can refuse storage; the game still plays.
  }
}

const tileKey = (t: Tile) => `${t[0]}-${t[1]}`;

/** Counts up to a number once it appears, the way a score is added up at the table. */
function CountUp({ value, delay }: { value: number; delay: number }) {
  const [shown, setShown] = useState(() => (reducedMotion() ? value : 0));
  useEffect(() => {
    if (reducedMotion() || value === 0) {
      setShown(value);
      return;
    }
    let frame = 0;
    const startAt = performance.now() + delay;
    const length = Math.min(900, 300 + value * 12);
    const tick = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - startAt) / length));
      setShown(Math.round(value * (1 - (1 - p) ** 3)));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, delay]);
  return <>{shown}</>;
}

export default function MexicanTrainGame() {
  const [game, setGame] = useState<Game | null>(null);
  const [offer, setOffer] = useState<Game | null>(null);
  const [name, setName] = useState('');
  const [opponents, setOpponents] = useState(2);
  const [rounds, setRounds] = useState(13);
  const [selected, setSelected] = useState<number | null>(null);
  const [numbers, setNumbers] = useState(false);
  const [sound, setSoundState] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const root = useRef<HTMLDivElement>(null);
  const prev = useRef<Game | null>(null);
  /** Where the tile you just played was sitting in your hand, measured before it leaves. */
  const fromHand = useRef<DOMRect | null>(null);
  const countRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOffer(load());
    try {
      if (localStorage.getItem(SOUND_KEY) === 'on') setSoundState(true);
    } catch {
      // No stored preference: sound stays off.
    }
  }, []);

  useEffect(() => {
    if (game) save(game);
  }, [game]);

  // Keep the last few lines so a quick run of computer turns can still be read.
  useEffect(() => {
    if (game?.message) setLog((l) => (l[l.length - 1] === game.message ? l : [...l.slice(-3), game.message]));
  }, [game?.message]);

  // Computer turns run one action at a time so each play can be watched.
  useEffect(() => {
    if (!game || game.phase !== 'play' || game.players[game.turn].human) return;
    const id = window.setTimeout(() => setGame((g) => (g ? computerStep(g) : g)), STEP_MS);
    return () => window.clearTimeout(id);
  }, [game]);

  useEffect(() => {
    if (game?.phase === 'game-over') track('game_finished', { game: 'mexican-train-online', players: game.players.length });
    if (game && game.phase !== 'play') {
      countRef.current?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'nearest' });
    }
  }, [game?.phase]);

  // Read what just happened and play it out on the table.
  useLayoutEffect(() => {
    const before = prev.current;
    prev.current = game;
    const el = root.current;
    if (!game || !el || reducedMotion()) return;
    const q = (selector: string) => el.querySelector(selector);
    const boneyard = q('[data-boneyard]')?.getBoundingClientRect();

    // A new round (or a new game): deal your hand out of the boneyard, one tile after another.
    if (!before || before.round !== game.round || (before.phase !== 'play' && game.phase === 'play')) {
      if (!boneyard || game.phase !== 'play') return;
      el.querySelectorAll<HTMLElement>('[data-hand-tile] .domino').forEach((tile, k) => {
        fly({ from: boneyard, to: tile, flip: true, duration: 460, delay: 120 + k * 55, strength: 0.35 });
      });
      return;
    }

    const actor = before.turn;
    game.trains.forEach((train, i) => {
      if (train.tiles.length !== before.trains[i].tiles.length + 1) return;
      const rail = q(`[data-train-tiles="${i}"]`);
      rail?.scrollTo({ left: rail.scrollWidth });
      const end = q(`[data-train-tiles="${i}"] .is-end`);
      if (!end) return;
      const human = before.players[actor].human;
      const stack = q(`[data-hand-stack="${before.trains.findIndex((t) => t.owner === actor)}"]`)?.getBoundingClientRect();
      const from = human ? fromHand.current : stack;
      if (from) fly({ from, to: end, flip: !human, duration: human ? 440 : 560 });
      fromHand.current = null;
    });

    if (game.boneyard.length === before.boneyard.length - 1 && boneyard) {
      if (before.players[actor].human) {
        const drawn = game.players[actor].hand[game.players[actor].hand.length - 1];
        const tile = drawn && q(`[data-hand-tile="${tileKey(drawn)}"] .domino`);
        if (tile) fly({ from: boneyard, to: tile, flip: true, duration: 520, strength: 0.6 });
      } else {
        const stack = q(`[data-hand-stack="${before.trains.findIndex((t) => t.owner === actor)}"] svg`);
        if (stack) fly({ from: boneyard, to: stack, backOnly: stack, duration: 480, strength: 0.4 });
      }
    }

    game.trains.forEach((train, i) => {
      if (train.marker && !before.trains[i].marker && train.owner !== null) {
        const coin = q(`[data-marker="${i}"]`);
        if (coin) dropMarker(coin);
      }
    });
  }, [game]);

  const myTurn = game?.phase === 'play' && game.turn === 0;
  const moves = useMemo(() => (game && myTurn ? legalMoves(game, 0) : []), [game, myTurn]);

  function toggleSound(on: boolean) {
    setSoundState(on);
    setSound(on);
    if (on) clack(0.6);
    try {
      localStorage.setItem(SOUND_KEY, on ? 'on' : 'off');
    } catch {
      // The choice lasts for this visit only.
    }
  }

  function start() {
    setSound(sound);
    const g = newGame([name.trim() || 'You', ...COMPUTERS.slice(0, opponents)], rounds);
    prev.current = null;
    setOffer(null);
    setLog([]);
    setSelected(null);
    setGame(g);
    track('game_started', { game: 'mexican-train-online', players: opponents + 1 });
  }

  function measure(i: number) {
    const t = game!.players[0].hand[i];
    fromHand.current = root.current?.querySelector(`[data-hand-tile="${tileKey(t)}"] .domino`)?.getBoundingClientRect() ?? null;
  }

  function pickTile(i: number) {
    if (!game || !myTurn) return;
    const targets = moves.filter((m) => m.tile === i);
    if (targets.length === 0) return;
    if (targets.length === 1) {
      measure(i);
      setSelected(null);
      setGame(play(game, targets[0]));
    } else setSelected(selected === i ? null : i);
  }

  function pickTrain(train: number) {
    if (!game || selected === null) return;
    measure(selected);
    setSelected(null);
    setGame(play(game, { tile: selected, train }));
  }

  if (!game) {
    return (
      <div className="mt-setup">
        {offer && (
          <div className="resume">
            <p>
              You have a game in progress: round {offer.round + 1} of {offer.rounds}.
            </p>
            <div className="resume-actions">
              <button type="button" className="btn btn-primary" onClick={() => { setSound(sound); setGame(offer); setOffer(null); }}>
                Carry on playing
              </button>
              <button type="button" className="btn btn-quiet" onClick={() => { save(null); setOffer(null); }}>
                Start a new game
              </button>
            </div>
          </div>
        )}
        <div className="custom-body mt-form">
          <p className="t-lead">New game</p>
          <label className="custom-field">
            Your name
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="You" maxLength={16} autoComplete="given-name" />
          </label>
          <fieldset className="custom-choice">
            <legend>Computer players</legend>
            {[1, 2, 3].map((n) => (
              <label key={n} className="pill">
                <input type="radio" name="mt-opponents" checked={opponents === n} onChange={() => setOpponents(n)} />
                {n}
              </label>
            ))}
          </fieldset>
          <fieldset className="custom-choice">
            <legend>Game length</legend>
            <label className="pill">
              <input type="radio" name="mt-rounds" checked={rounds === 13} onChange={() => setRounds(13)} />
              Full game, 13 rounds
            </label>
            <label className="pill">
              <input type="radio" name="mt-rounds" checked={rounds === 5} onChange={() => setRounds(5)} />
              Short game, 5 rounds
            </label>
          </fieldset>
          <button type="button" className="btn btn-primary" onClick={start}>
            Deal the tiles
          </button>
        </div>
      </div>
    );
  }

  const me = game.players[0];
  const rows: BoardRow[] = game.trains.map((t, i) => {
    const owner = t.owner;
    const p = owner === null ? null : game.players[owner];
    return {
      key: String(i),
      label: owner === null ? 'Mexican Train' : owner === 0 ? 'Your train' : p!.name,
      note: owner === null ? 'Open to everyone' : owner === 0 ? undefined : `${p!.hand.length} ${p!.hand.length === 1 ? 'tile' : 'tiles'}`,
      hand: owner !== null && owner !== 0 ? p!.hand.length : undefined,
      tiles: t.tiles,
      marker: t.marker,
      mexican: owner === null,
      openDouble: game.openDouble === i,
      turn: game.phase === 'play' && owner === game.turn,
      target: selected !== null && moves.some((m) => m.tile === selected && m.train === i),
    };
  });

  // Hand sorted for finding tiles; buttons keep each tile's index in the hand.
  const hand = me.hand.map((t, i) => ({ t, i })).sort((x, y) => x.t[0] - y.t[0] || x.t[1] - y.t[1]);
  const playable = new Set(moves.map((m) => m.tile));
  const sum = totals(game);
  const order = standings(game);
  const over = game.phase !== 'play';
  const lastRound = me.scores.length - 1;
  const countDone = 300 + game.players.length * 180 + 700;
  const worst = Math.max(...sum, 1);

  return (
    <div className="mt" ref={root}>
      <div className="mt-status">
        <span className="boneyard" data-boneyard>
          <span className="boneyard-pile" aria-hidden="true">
            {game.boneyard.length > 0 && <DominoBack />}
            {game.boneyard.length > 1 && <DominoBack />}
            {game.boneyard.length > 2 && <DominoBack />}
          </span>
          <span className="t-small">{game.boneyard.length ? `Boneyard ${game.boneyard.length}` : 'Boneyard empty'}</span>
        </span>
        <span className="t-small t-soft">
          Round {game.round + 1} of {game.rounds}, your total {sum[0]}
        </span>
        <span className="mt-toggles">
          <label className="pill">
            <input type="checkbox" checked={numbers} onChange={(e) => setNumbers(e.target.checked)} />
            Numbers on tiles
          </label>
          <label className="pill">
            <input type="checkbox" checked={sound} onChange={(e) => toggleSound(e.target.checked)} />
            Sound
          </label>
        </span>
      </div>

      <TrainBoard engine={game.engine} rows={rows} numbers={numbers} onPick={pickTrain} />

      <div className="mt-log" aria-live="polite">
        {log.map((line, i) => (
          <p key={i} className={i === log.length - 1 ? undefined : 't-small t-soft'}>
            {line}
          </p>
        ))}
      </div>

      {!over && (
        <section className={['mt-hand', myTurn && 'is-my-turn'].filter(Boolean).join(' ')} aria-label="Your tiles">
          <p className="mt-prompt">
            {myTurn
              ? moves.length
                ? selected !== null
                  ? 'Now tap the train to play it on.'
                  : game.openDouble !== null
                    ? 'Your turn: cover the double.'
                    : 'Your turn: tap a tile to play it.'
                : canDraw(game)
                  ? 'No tile fits. Draw from the boneyard.'
                  : 'Still no tile fits. Pass and put out your marker.'
              : `${game.players[game.turn].name} is playing…`}
          </p>
          <div className="mt-tiles">
            {hand.map(({ t, i }, k) => (
              <button
                key={tileKey(t)}
                type="button"
                data-hand-tile={tileKey(t)}
                style={{ '--i': k } as CSSProperties}
                className={['hand-tile', myTurn && playable.has(i) && 'is-playable', selected === i && 'is-selected'].filter(Boolean).join(' ')}
                aria-label={`${t[0]} and ${t[1]}${myTurn && !playable.has(i) ? ', does not fit' : ''}`}
                aria-pressed={selected === i}
                aria-disabled={!myTurn || !playable.has(i)}
                onClick={() => pickTile(i)}
              >
                <Domino a={t[0]} b={t[1]} numbers={numbers} />
              </button>
            ))}
          </div>
          {myTurn && moves.length === 0 && (
            <div className="sheet-controls">
              {canDraw(game) ? (
                <button type="button" className="btn btn-primary" onClick={() => setGame(draw(game))}>
                  Draw a tile
                </button>
              ) : (
                <button type="button" className="btn btn-primary" onClick={() => setGame(pass(game))}>
                  Pass and put out marker
                </button>
              )}
            </div>
          )}
        </section>
      )}

      {over && (
        <section className="mt-scores" aria-labelledby="mt-scores-title" style={{ '--count-done': `${countDone}ms` } as CSSProperties}>
          <div className="slip mt-count" ref={countRef}>
            <p className="slip-time" id="mt-scores-title">
              The count, round {game.round + 1}
            </p>
            {game.players.map((p, i) => (
              <div key={i} className="slip-row mt-count-row">
                <span className="mt-count-name">{p.name}</span>
                <span className="mt-count-tiles" aria-hidden="true">
                  {(i === game.outPlayer ? [] : p.hand).map((t, k) => (
                    <span key={tileKey(t)} className="mt-count-tile" style={{ '--d': `${300 + i * 180 + k * 40}ms` } as CSSProperties}>
                      <Domino a={t[0]} b={t[1]} numbers={numbers} />
                    </span>
                  ))}
                  {i === game.outPlayer && <span className="t-small">Went out</span>}
                </span>
                <span className="slip-leader" />
                <span className="mt-count-value">
                  <CountUp value={i === game.outPlayer ? 0 : p.hand.reduce((s, t) => s + pips(t), 0)} delay={300 + i * 180} />
                </span>
              </div>
            ))}
            <p className="slip-result">
              <span>{game.outPlayer === null ? 'Blocked: nobody could play' : `${game.players[game.outPlayer].name} went out`}</span>
            </p>
          </div>

          {game.phase === 'game-over' && (
            <div className="winner mt-winner">
              <p className="t-small">{game.players[order[0]].human ? 'You win' : 'The winner is'}</p>
              <p className="winner-name">
                {game.players[order[0]].name}
                <PencilCircle />
              </p>
              <ol className="winner-bars">
                {order.map((i, k) => (
                  <li key={i}>
                    <span>{game.players[i].name}</span>
                    <span
                      className="winner-bar mt-bar"
                      style={{ inlineSize: `${Math.max(14, (sum[i] / worst) * 100)}%`, '--k': k } as CSSProperties}
                    >
                      {sum[i]}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="sheet">
            <div className="sheet-band">
              <span>Mexican Train</span>
              <span className="sheet-band-site">ScoreSheetSquare.com</span>
            </div>
            <div className="sheet-scroll">
              <table className="sheet-grid">
                <thead>
                  <tr>
                    <th className="sheet-corner" scope="col">Round</th>
                    {game.players.map((p, i) => (
                      <th key={i} scope="col" className="sheet-total">{p.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {me.scores.map((_, r) => (
                    <tr key={r} className={r === lastRound ? 'mt-new-row' : undefined}>
                      <th scope="row" className="sheet-label">Double {MAX_PIP - r}</th>
                      {game.players.map((p, i) => (
                        <td key={i} className="sheet-total mt-score">{p.scores[r]}</td>
                      ))}
                    </tr>
                  ))}
                  <tr className="sheet-computed is-strong">
                    <th scope="row" className="sheet-label">Total</th>
                    {game.players.map((_, i) => (
                      <td key={i} className="sheet-total">
                        <output>{sum[i]}</output>
                        {i === order[0] && <PencilCircle />}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="sheet-controls">
            {game.phase === 'round-over' ? (
              <button type="button" className="btn btn-primary" onClick={() => { setSelected(null); setGame(nextRound(game)); }}>
                Deal round {game.round + 2}: double {MAX_PIP - game.round - 1}
              </button>
            ) : (
              <>
                <button type="button" className="btn btn-primary" onClick={start}>
                  Play again
                </button>
                <a className="btn btn-quiet" href="/mexican-train-score-sheet">
                  Print a score sheet for the table
                </a>
              </>
            )}
          </div>
        </section>
      )}

      {!over && (
        <p className="t-small mt-quit">
          <button type="button" className="link-button" onClick={() => { save(null); prev.current = null; setGame(null); setLog([]); }}>
            Quit this game
          </button>
        </p>
      )}
    </div>
  );
}
