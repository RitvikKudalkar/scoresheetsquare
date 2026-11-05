// Mexican Train against up to three computer players. The rules live in lib/mexican-train; this is the table.
import { useEffect, useMemo, useState } from 'react';
import Domino from './Domino';
import TrainBoard, { type BoardRow } from './TrainBoard';
import { PencilCircle } from './sheet-shared';
import { track } from '../lib/analytics';
import {
  canDraw,
  computerStep,
  draw,
  legalMoves,
  newGame,
  nextRound,
  pass,
  play,
  standings,
  totals,
  MAX_PIP,
  type Game,
} from '../lib/mexican-train';

const KEY = 'sss:game:mexican-train-online';
const COMPUTERS = ['Rosa', 'Walt', 'June'];
const STEP_MS = 750;

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

export default function MexicanTrainGame() {
  const [game, setGame] = useState<Game | null>(null);
  const [offer, setOffer] = useState<Game | null>(null);
  const [name, setName] = useState('');
  const [opponents, setOpponents] = useState(2);
  const [rounds, setRounds] = useState(13);
  const [selected, setSelected] = useState<number | null>(null);
  const [numbers, setNumbers] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => setOffer(load()), []);
  useEffect(() => {
    if (game) save(game);
  }, [game]);

  // Keep the last few lines so a quick run of computer turns can still be read.
  useEffect(() => {
    if (game?.message) setLog((l) => (l[l.length - 1] === game.message ? l : [...l.slice(-3), game.message]));
  }, [game?.message]);

  // Computer turns run one action at a time so each play can be seen.
  useEffect(() => {
    if (!game || game.phase !== 'play' || game.players[game.turn].human) return;
    const id = window.setTimeout(() => setGame((g) => (g ? computerStep(g) : g)), STEP_MS);
    return () => window.clearTimeout(id);
  }, [game]);

  useEffect(() => {
    if (game?.phase === 'game-over') track('game_finished', { game: 'mexican-train-online', players: game.players.length });
  }, [game?.phase]);

  const myTurn = game?.phase === 'play' && game.turn === 0;
  const moves = useMemo(() => (game && myTurn ? legalMoves(game, 0) : []), [game, myTurn]);

  function start() {
    const g = newGame([name.trim() || 'You', ...COMPUTERS.slice(0, opponents)], rounds);
    setOffer(null);
    setLog([]);
    setSelected(null);
    setGame(g);
    track('game_started', { game: 'mexican-train-online', players: opponents + 1 });
  }

  function pickTile(i: number) {
    if (!game || !myTurn) return;
    const targets = moves.filter((m) => m.tile === i);
    if (targets.length === 0) return;
    if (targets.length === 1) {
      setSelected(null);
      setGame(play(game, targets[0]));
    } else setSelected(selected === i ? null : i);
  }

  function pickTrain(train: number) {
    if (!game || selected === null) return;
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
              <button type="button" className="btn btn-primary" onClick={() => { setGame(offer); setOffer(null); }}>
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
    const thinking = game.phase === 'play' && owner !== null && owner === game.turn && !p!.human;
    return {
      key: String(i),
      label: owner === null ? 'Mexican Train' : owner === 0 ? 'Your train' : p!.name,
      note: owner === null ? 'Open to everyone' : owner === 0 ? undefined : `${p!.hand.length} tiles${thinking ? ', playing…' : ''}`,
      tiles: t.tiles,
      marker: t.marker,
      mexican: owner === null,
      openDouble: game.openDouble === i,
      target: selected !== null && moves.some((m) => m.tile === selected && m.train === i),
    };
  });

  // Hand sorted for finding tiles; buttons keep each tile's index in the hand.
  const hand = me.hand.map((t, i) => ({ t, i })).sort((x, y) => x.t[0] - y.t[0] || x.t[1] - y.t[1]);
  const playable = new Set(moves.map((m) => m.tile));
  const sum = totals(game);
  const order = standings(game);
  const over = game.phase !== 'play';

  return (
    <div className="mt">
      <div className="mt-status">
        <p className="t-small t-soft">
          Round {game.round + 1} of {game.rounds} · Boneyard {game.boneyard.length} · Your total {sum[0]}
        </p>
        <label className="pill">
          <input type="checkbox" checked={numbers} onChange={(e) => setNumbers(e.target.checked)} />
          Numbers on tiles
        </label>
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
        <section className="mt-hand" aria-label="Your tiles">
          <p className="t-small">
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
              : 'Waiting for the other players…'}
          </p>
          <div className="mt-tiles">
            {hand.map(({ t, i }) => (
              <button
                key={`${t[0]}-${t[1]}`}
                type="button"
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
        <section className="mt-scores" aria-labelledby="mt-scores-title">
          {game.phase === 'game-over' && (
            <div className="winner">
              <p className="t-small">{game.players[order[0]].human ? 'You win' : 'The winner is'}</p>
              <p className="winner-name" id="mt-scores-title">
                {game.players[order[0]].name}
                <PencilCircle />
              </p>
            </div>
          )}
          <div className="sheet">
            <div className="sheet-band">
              <span id={game.phase === 'game-over' ? undefined : 'mt-scores-title'}>Mexican Train</span>
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
                    <tr key={r}>
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
          <button type="button" className="link-button" onClick={() => { save(null); setGame(null); setLog([]); }}>
            Quit this game
          </button>
        </p>
      )}
    </div>
  );
}
