import { useEffect, useRef, useState } from 'react';
import { track } from '../lib/analytics';
import type { SheetGame } from '../lib/sheet';
import { WinnerScreen } from './ScoreSheet';
import { useSaved, useWakeLock } from './sheet-shared';

type Props = { game: SheetGame };
type Move = { p: number; points: number };
type Board = { players: string[]; moves: Move[]; target: number };

const TARGETS = [121, 61];
const STREET = 30; // holes per street, in groups of five
const QUICK = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 16];
const MAX_POINTS = 29; // the best hand in cribbage

const emptyBoard = (count: number, names?: string[]): Board => ({ players: names ?? Array(count).fill(''), moves: [], target: 121 });

// Board geometry, in SVG units.
const HOLE = 15;
const GROUP_GAP = 7;
const LABEL_W = 54;
const LANE = 19;
const STREET_GAP = 22;
const holeX = (i: number) => LABEL_W + i * HOLE + Math.floor(i / 5) * GROUP_GAP + HOLE / 2; // i: 0–29 within a street
const FINISH_X = holeX(STREET - 1) + HOLE + GROUP_GAP + 4;
const START_X = LABEL_W - 12;

/** A peg for player p. Players are told apart by shape, not colour (one ink). */
function Peg({ p, x, y, back }: { p: number; x: number; y: number; back?: boolean }) {
  const r = back ? 4.4 : 6.6;
  const cls = back ? 'crib-peg is-back' : 'crib-peg';
  if (p === 1) return <circle className={`${cls} is-ring`} cx={x} cy={y} r={r - 0.9} />;
  if (p === 2) return <rect className={cls} x={x - r * 0.9} y={y - r * 0.9} width={r * 1.8} height={r * 1.8} />;
  return <circle className={cls} cx={x} cy={y} r={r} />;
}

/** Cribbage: a peg board for 2 or 3 players (or two teams), played to 121 or 61. */
export default function CribbageBoard({ game }: Props) {
  const [board, setBoard] = useState<Board>(() => emptyBoard(game.players.default));
  const [active, setActive] = useState(0);
  const [other, setOther] = useState('');
  const [winnerOpen, setWinnerOpen] = useState(false);
  const [wakeOn, setWakeOn] = useWakeLock();
  const started = useRef(false);
  const { players, moves, target } = board;

  const { resume, takeResume, dropResume, clearSaved } = useSaved(true, game.slug, board, moves.length > 0, (b) => setBoard(b));

  const nameOf = (p: number) => players[p] || `Player ${p + 1}`;
  const scores = players.map((_, p) => Math.min(target, moves.reduce((a, m) => (m.p === p ? a + m.points : a), 0)));
  // The back peg marks where the front peg was before its last move.
  const backs = players.map((_, p) => {
    const last = moves.findLastIndex((m) => m.p === p);
    return last < 0 ? 0 : Math.min(target, moves.slice(0, last).reduce((a, m) => (m.p === p ? a + m.points : a), 0));
  });
  const winner = scores.findIndex((s) => s >= target);
  const done = winner >= 0;
  // A skunk: the loser is short of 91 in a game to 121 (31 in a game to 61); a double skunk short of 61 (none in 61).
  const skunkLine = target === 121 ? 91 : 31;
  const skunkNote = (s: number) => (target === 121 && s < 61 ? 'double skunk' : s < skunkLine ? 'skunked' : undefined);

  useEffect(() => {
    if (moves.length > 0 && !started.current) {
      started.current = true;
      track('game_started', { game: game.slug, players: players.length });
    }
  }, [moves.length]);

  useEffect(() => {
    if (done) {
      setWinnerOpen(true);
      track('game_finished', { game: game.slug, players: players.length });
    }
  }, [done]);

  const add = (points: number) => {
    if (done || points <= 0) return;
    setBoard((b) => ({ ...b, moves: [...b.moves, { p: active, points }] }));
  };
  const addOther = () => {
    const n = Number(other);
    if (Number.isInteger(n) && n > 0 && n <= MAX_POINTS) {
      add(n);
      setOther('');
    }
  };
  const undo = () => setBoard((b) => ({ ...b, moves: b.moves.slice(0, -1) }));
  const rename = (p: number, name: string) => setBoard((b) => ({ ...b, players: b.players.map((x, i) => (i === p ? name : x)) }));
  const setPlayerCount = (n: number) =>
    setBoard((b) => ({ ...b, players: Array.from({ length: n }, (_, i) => b.players[i] ?? ''), moves: b.moves.filter((m) => m.p < n) }));
  const newGame = (keepPlayers: boolean) => {
    setBoard({ ...emptyBoard(players.length, keepPlayers ? players : undefined), target });
    setActive(0);
    setWinnerOpen(false);
    started.current = false;
    clearSaved();
  };

  // Streets: 4 of 30 holes in a game to 121, 2 in a game to 61; the finish hole sits at the end of the last.
  const streets = Math.round((target - 1) / STREET);
  const streetH = players.length * LANE + STREET_GAP;
  const height = streets * streetH;
  const width = FINISH_X + 14;
  const pegAt = (score: number, p: number) => {
    const laneY = (s: number) => s * streetH + 12 + p * LANE + LANE / 2;
    if (score <= 0) return { x: START_X, y: laneY(0) };
    if (score >= target) return { x: FINISH_X, y: laneY(streets - 1) };
    const s = Math.floor((score - 1) / STREET);
    return { x: holeX((score - 1) % STREET), y: laneY(s) };
  };

  const recent = moves.slice(-5).reverse();
  const runningTotal = (index: number) => moves.slice(0, index + 1).reduce((a, m) => (m.p === moves[index].p ? a + m.points : a), 0);

  return (
    <div className="scorekeeper cribbage">
      {resume && (
        <div className="resume" role="status">
          <p>Resume your cribbage game from {resume.when}, {resume.players} players?</p>
          <div className="resume-actions">
            <button type="button" className="btn btn-primary" onClick={takeResume}>Resume</button>
            <button type="button" className="btn btn-quiet" onClick={() => { dropResume(); newGame(false); }}>Start new</button>
          </div>
        </div>
      )}

      <div className="sheet" data-ui>
        <div className="sheet-band">
          <span>{game.name}</span>
          <span className="sheet-band-site">ScoreSheetSquare.com</span>
        </div>

        <div className="crib-board">
          <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Cribbage board to ${target}: ${players.map((_, p) => `${nameOf(p)} ${scores[p]}`).join(', ')}`}>
            {Array.from({ length: streets }, (_, s) => (
              <g key={s}>
                <text className="crib-street" x={2} y={s * streetH + 12 + (players.length * LANE) / 2 + 4}>
                  {s * STREET + 1}–{(s + 1) * STREET}
                </text>
                {players.map((_, p) =>
                  Array.from({ length: STREET }, (_, i) => (
                    <circle key={`${p}-${i}`} className="crib-hole" cx={holeX(i)} cy={s * streetH + 12 + p * LANE + LANE / 2} r={2.5} />
                  )),
                )}
              </g>
            ))}
            <text className="crib-street" x={FINISH_X - 4} y={(streets - 1) * streetH + 6}>{target}</text>
            {players.map((_, p) => {
              const y = (streets - 1) * streetH + 12 + p * LANE + LANE / 2;
              return <circle key={p} className="crib-hole is-finish" cx={FINISH_X} cy={y} r={3.2} />;
            })}
            {players.map((_, p) => {
              const b = pegAt(backs[p], p);
              const f = pegAt(scores[p], p);
              return (
                <g key={p}>
                  {moves.some((m) => m.p === p) && <Peg p={p} x={b.x} y={b.y} back />}
                  <Peg p={p} x={f.x} y={f.y} />
                </g>
              );
            })}
          </svg>
        </div>

        <ul className="crib-players" aria-label="Players">
          {players.map((_, p) => (
            <li key={p} className={p === active ? 'is-active' : undefined}>
              <button type="button" className="crib-pick" aria-pressed={p === active} onClick={() => setActive(p)} aria-label={`Peg for ${nameOf(p)}`}>
                <svg viewBox="0 0 16 16" aria-hidden="true"><Peg p={p} x={8} y={8} /></svg>
              </button>
              <input
                className="cell-input is-name"
                value={players[p]}
                placeholder={`Player ${p + 1}`}
                aria-label={`Player ${p + 1} name`}
                onFocus={() => setActive(p)}
                onChange={(e) => rename(p, e.target.value)}
              />
              <output className="crib-score" aria-label={`${nameOf(p)} score`}>{scores[p]}</output>
              <span className="crib-togo t-small t-soft">{done ? '' : `${target - scores[p]} to go`}</span>
            </li>
          ))}
        </ul>

        <div className="crib-pad" role="group" aria-label={`Add points for ${nameOf(active)}`}>
          <p className="crib-pad-label">Peg for {nameOf(active)}</p>
          <div className="crib-keys">
            {QUICK.map((n) => (
              <button key={n} type="button" onClick={() => add(n)} disabled={done} aria-label={`Add ${n} for ${nameOf(active)}`}>
                +{n}
              </button>
            ))}
          </div>
          <form
            className="crib-other"
            onSubmit={(e) => {
              e.preventDefault();
              addOther();
            }}
          >
            <label>
              <span className="t-small t-soft">Other</span>
              <input inputMode="numeric" value={other} maxLength={2} onChange={(e) => setOther(e.target.value.replace(/\D/g, ''))} aria-label={`Points to add for ${nameOf(active)}`} />
            </label>
            <button type="submit" className="btn btn-quiet" disabled={done || other === ''}>Add</button>
          </form>
        </div>

        {recent.length > 0 && (
          <ol className="crib-log t-small" aria-live="polite" aria-label="Last moves">
            {recent.map((m, i) => {
              const index = moves.length - 1 - i;
              return (
                <li key={index}>
                  {nameOf(m.p)} +{m.points} <span className="t-soft">to {Math.min(target, runningTotal(index))}</span>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <div className="sheet-controls">
        <button type="button" className="btn btn-quiet" onClick={undo} disabled={moves.length === 0}>Undo</button>
        <button type="button" className="btn btn-quiet" onClick={() => newGame(true)} disabled={moves.length === 0}>New game</button>
        {done && !winnerOpen && <button type="button" className="btn btn-quiet" onClick={() => setWinnerOpen(true)}>Show the winner</button>}
        <label className="pill">
          Play to
          <select value={target} onChange={(e) => setBoard((b) => ({ ...b, target: Number(e.target.value) }))}>
            {TARGETS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="pill">
          Players
          <select value={players.length} onChange={(e) => { setPlayerCount(Number(e.target.value)); setActive(0); }}>
            {Array.from({ length: game.players.max - game.players.min + 1 }, (_, i) => game.players.min + i).map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <label className="pill">
          <input type="checkbox" checked={wakeOn} onChange={(e) => setWakeOn(e.target.checked)} />
          Keep screen on
        </label>
      </div>

      {winnerOpen && done && (
        <WinnerScreen
          title={`${nameOf(winner)} wins`}
          circled
          rows={players
            .map((_, p) => p)
            .sort((a, b) => scores[b] - scores[a])
            .map((p) => ({ name: nameOf(p), total: scores[p], note: p === winner ? undefined : skunkNote(scores[p]) }))}
          onPlayAgain={() => newGame(true)}
          onClose={() => setWinnerOpen(false)}
        />
      )}
    </div>
  );
}
