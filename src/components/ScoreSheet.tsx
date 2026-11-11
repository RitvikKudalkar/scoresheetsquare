import { useEffect, useMemo, useRef, useState } from 'react';
import { track } from '../lib/analytics';
import { downloadSheetPdf, localPaper } from '../lib/client-pdf';
import {
  applyOptions,
  bidKey,
  bidPoints,
  bonusKey,
  cardsIn,
  roundIndex,
  columnsPer,
  optionChoices,
  type GameOptions,
  isComplete,
  layoutSheet,
  leaderOf,
  meldKey,
  nilKey,
  notices,
  phaseKey,
  phasesMade,
  rankPlayers,
  rowIds,
  rowPoints,
  subColumns,
  teamColumns,
  tookKey,
  type Scores,
  type SheetGame,
} from '../lib/sheet';
import TallySheet from './TallySheet';
import { PencilCircle, useSaved, useWakeLock } from './sheet-shared';

type Props = {
  game: SheetGame;
  /** `demo` is the pre-filled sheet on the home page; `live` is a game page scorekeeper that saves. */
  mode: 'demo' | 'live';
};

const DEMO_NAMES = ['Ana', 'Ben', 'Cleo', 'Dev', 'Eli', 'Fay', 'Gus', 'Hal', 'Ivy', 'Jo'];
const MAX_HISTORY = 60;
// The winner screen's ad space appears only once AdSense is set up.
const ADS_ENABLED = Boolean(import.meta.env.PUBLIC_ADSENSE_CLIENT);

export default function ScoreSheet(props: Props) {
  return props.game.sheet.engine === 'tally' ? <TallySheet {...props} /> : <PointsSheet {...props} />;
}

// Triple Yahtzee gives each player several columns, so a row holds players × columnsPer values.
function emptyScores(game: SheetGame, count: number): Scores {
  return Object.fromEntries(rowIds(game.sheet).map((id) => [id, Array(count * columnsPer(game.sheet)).fill(null)]));
}

// A believable half-played game, so the home page sheet shows numbers that add up.
function demoScores(game: SheetGame, count: number): Scores {
  const scores = emptyScores(game, count);
  const ids = rowIds(game.sheet);
  const fill: Record<string, number[][]> = {
    category: [[3, 6, 9, 16, 15, 24, 22, 0, 25, 30], [2, 8, 12, 12, 20, 18, 17, 28, 25, 0], [4, 6, 6, 20, 10, 30, 0, 0, 25, 30], [1, 4, 9, 8, 25, 24, 21, 24, 0, 30]],
    'round-totals': [[15, 5, 40, 0, 25, 10], [0, 30, 10, 45, 5, 20], [25, 10, 0, 15, 50, 5], [10, 20, 35, 5, 0, 30]],
    'running-turns': [[500, 0, 750, 1200, 350, 0], [0, 0, 600, 450, 1500, 300], [1000, 350, 0, 400, 0, 850], [550, 900, 300, 0, 650, 0]],
  };
  const rows = fill[game.sheet.engine] ?? [];
  for (let p = 0; p < Math.min(count, rows.length); p++) {
    rows[p].forEach((v, i) => {
      if (ids[i]) scores[ids[i]][p] = v;
      // Phase 10 demo: a phase made whenever the round's points are low.
      if (ids[i] && game.sheet.engine === 'round-totals' && game.sheet.phases && v <= 15) {
        scores[phaseKey(ids[i])] ??= Array(count).fill(null);
        scores[phaseKey(ids[i])][p] = 1;
      }
    });
  }
  return scores;
}

function PointsSheet({ game: base, mode }: Props) {
  const live = mode === 'live';
  const initialCount = base.players.default;
  const [players, setPlayers] = useState<string[]>(() => (live ? Array(initialCount).fill('') : DEMO_NAMES.slice(0, initialCount)));
  const [scores, setScores] = useState<Scores>(() => (live ? emptyScores(base, initialCount) : demoScores(base, initialCount)));
  // The table's choices (target, rounds, moon rule); `game` below is the sheet as they play it.
  const [options, setOptions] = useState<GameOptions>({});
  const game = useMemo(() => ({ ...base, sheet: applyOptions(base.sheet, options) }), [base, options]);
  const choices = optionChoices(base.sheet);
  const [history, setHistory] = useState<{ players: string[]; scores: Scores }[]>([]);
  const [largePrint, setLargePrint] = useState(false);
  const [wakeOn, setWakeOn] = useWakeLock();
  const [active, setActive] = useState<{ rowId: string; p: number } | null>(null);
  const [coarse, setCoarse] = useState(false);
  const [winnerOpen, setWinnerOpen] = useState(false);
  const before = useRef<{ players: string[]; scores: Scores } | null>(null);
  const started = useRef(false);

  const hasScores = Object.values(scores).some((v) => v.some((x) => x !== null));
  const saved = useMemo(() => ({ players, scores, options }), [players, scores, options]);
  const { resume, takeResume, dropResume, clearSaved } = useSaved(live, game.slug, saved, hasScores, (s) => {
    setPlayers(s.players);
    setScores(s.scores);
    setOptions(s.options ?? {});
  });

  const layout = useMemo(() => layoutSheet(game.sheet, scores, players.length), [game.sheet, scores, players.length]);
  const leader = leaderOf(game.sheet, layout.totals, game.winCondition, scores);
  const done = live && isComplete(game.sheet, scores, players.length, layout.totals);
  const teams = teamColumns(game.sheet);
  const column = teams ? 'Team' : 'Player';
  const nameOf = (p: number) => players[p] || `${column} ${p + 1}`;
  const notes = live ? notices(game.sheet, scores, players.map((_, p) => nameOf(p)), layout.totals) : [];
  const phased = game.sheet.engine === 'round-totals' && !!game.sheet.phases;
  const bidding = game.sheet.engine === 'bid-and-make' ? game.sheet : null;
  // Sheet columns: one per player, or several (Triple Yahtzee's ×1, ×2, ×3).
  const subs = subColumns(game.sheet);
  const k = subs?.length ?? 1;
  const width = players.length * k;
  const columns = Array.from({ length: width }, (_, v) => v);
  const ownerOf = (v: number) => Math.floor(v / k);
  const columnName = (v: number) => (subs ? `${nameOf(ownerOf(v))}, column ${subs[v % k].label}` : nameOf(v));

  // A phone gets the on-screen keypad instead of the system keyboard.
  useEffect(() => {
    const mq = matchMedia('(pointer: coarse)');
    setCoarse(mq.matches);
    // A cell tapped before the sheet finished loading is already focused: pick it up.
    const parts = (document.activeElement as HTMLElement | null)?.dataset.cell?.split(':') ?? [];
    const rowId = parts.slice(1, -1).join(':');
    if (rowId && document.activeElement?.closest('.scorekeeper')) setActive({ rowId, p: Number(parts.at(-1)) });
    const on = () => setCoarse(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('keypad-open', coarse && !!active);
  }, [coarse, active]);

  // The winner screen opens once when the game ends; closing it returns to the sheet.
  useEffect(() => {
    if (done) {
      setWinnerOpen(true);
      track('game_finished', { game: game.slug, players: players.length });
    }
  }, [done]);

  useEffect(() => {
    if (!live || started.current) return;
    if (hasScores) {
      started.current = true;
      track('game_started', { game: game.slug, players: players.length });
    }
  }, [live, scores]);

  const snapshot = () => (before.current = { players, scores });
  const commit = () => {
    const prev = before.current;
    before.current = null;
    if (prev && (prev.scores !== scores || prev.players !== players)) setHistory((h) => [...h.slice(-MAX_HISTORY + 1), prev]);
  };
  const pushHistory = () => setHistory((h) => [...h.slice(-MAX_HISTORY + 1), { players, scores }]);

  const setValue = (rowId: string, p: number, value: number | null) =>
    setScores((s) => {
      const row = s[rowId] ?? Array(width).fill(null);
      return { ...s, [rowId]: row.map((v, i) => (i === p ? value : v)) };
    });

  const writeScore = (rowId: string, p: number, text: string) => {
    const clean = text.replace(/[^\d-]/g, '');
    setValue(rowId, p, clean === '' || clean === '-' ? null : Number(clean));
  };

  const togglePhase = (rowId: string, p: number) => {
    pushHistory();
    setValue(phaseKey(rowId), p, scores[phaseKey(rowId)]?.[p] === 1 ? null : 1);
  };

  // Spades nil: none → made → failed → none.
  const cycleNil = (rowId: string, p: number) => {
    pushHistory();
    const now = scores[nilKey(rowId)]?.[p];
    setValue(nilKey(rowId), p, now == null ? 1 : now === 1 ? -1 : null);
  };

  const rename = (p: number, name: string) => setPlayers((ps) => ps.map((n, i) => (i === p ? name : n)));

  const addPlayer = () => {
    if (players.length >= game.players.max) return;
    pushHistory();
    setPlayers((ps) => [...ps, '']);
    setScores((s) => Object.fromEntries(Object.entries(s).map(([key, v]) => [key, [...v, ...Array(k).fill(null)]])));
  };

  const removePlayer = (p: number) => {
    if (players.length <= game.players.min) return;
    pushHistory();
    setPlayers((ps) => ps.filter((_, i) => i !== p));
    setScores((s) => Object.fromEntries(Object.entries(s).map(([key, v]) => [key, v.filter((_, i) => ownerOf(i) !== p)])));
  };

  const undo = () => {
    const last = history.at(-1);
    if (!last) return;
    setHistory((h) => h.slice(0, -1));
    setPlayers(last.players);
    setScores(last.scores);
  };

  const newGame = (keepPlayers: boolean) => {
    const names = keepPlayers ? players : Array(initialCount).fill('');
    setHistory([]);
    setPlayers(names);
    setScores(emptyScores(game, names.length));
    setWinnerOpen(false);
    started.current = false;
    clearSaved();
  };

  // Puts the scores written so far onto the same layout as the printable PDF.
  const [printing, setPrinting] = useState(false);
  const printGame = async () => {
    setPrinting(true);
    track('print_game', { game: game.slug });
    try {
      const paper = localPaper();
      await downloadSheetPdf(
        game,
        { version: 'standard', paper, players: players.map((_, p) => nameOf(p)), scores, siteUrl: `scoresheetsquare.com/${game.slug}` },
        `${game.slug}-game${paper === 'a4' ? '-a4' : ''}.pdf`,
      );
    } catch {
      window.print();
    } finally {
      setPrinting(false);
    }
  };

  // Keypad: Next walks across the players in a row, then down to the next row. A bid round is two
  // rows: everyone's bid, then everyone's tricks.
  const entries = layout.groups.flatMap((g) =>
    g.rows.flatMap((r) =>
      r.bid
        ? [
            { id: bidKey(r.id), label: `${r.label}, bid` },
            ...(bidding?.meld ? [{ id: meldKey(r.id), label: `${r.label}, meld` }] : []),
            { id: tookKey(r.id), label: `${r.label}, ${bidding?.meld ? 'counters' : 'tricks won'}` },
            ...(bidding?.bonus ? [{ id: bonusKey(r.id), label: `${r.label}, bonus` }] : []),
          ]
        : [{ id: r.id, label: r.label }],
    ),
  );
  const entryRows = entries.map((e) => e.id);
  const focusCell = (rowId: string, p: number) =>
    document.querySelector<HTMLInputElement>(`[data-cell="${game.slug}:${rowId}:${p}"]`)?.focus();
  const nextCell = () => {
    if (!active) return;
    const r = entryRows.indexOf(active.rowId);
    if (active.p + 1 < width) focusCell(active.rowId, active.p + 1);
    else if (r + 1 < entryRows.length) focusCell(entryRows[r + 1], 0);
    else (document.activeElement as HTMLElement | null)?.blur();
  };
  const keyPress = (key: string) => {
    if (!active) return;
    const current = scores[active.rowId]?.[active.p];
    const text = current == null ? '' : String(current);
    if (key === 'back') writeScore(active.rowId, active.p, text.slice(0, -1));
    else if (key === 'sign') setValue(active.rowId, active.p, current == null ? null : -current);
    else if (text.replace('-', '').length < 6) writeScore(active.rowId, active.p, text === '0' ? key : text + key);
  };

  const ranked = rankPlayers(game.sheet, layout.totals, game.winCondition, scores);
  const activeLabel = active ? `${columnName(active.p)}, ${entries.find((e) => e.id === active.rowId)?.label ?? ''}` : '';

  const cellInput = (key: string, p: number, label: string, className = 'cell-input', placeholder?: string) => (
    <input
      className={className}
      inputMode={coarse ? 'none' : 'numeric'}
      enterKeyHint="next"
      autoComplete="off"
      value={scores[key]?.[p] ?? ''}
      placeholder={placeholder}
      data-cell={`${game.slug}:${key}:${p}`}
      aria-label={`${columnName(p)}, ${label}`}
      onFocus={(e) => {
        snapshot();
        setActive({ rowId: key, p });
        if (coarse) e.currentTarget.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }}
      onBlur={() => {
        commit();
        setActive(null);
      }}
      onChange={(e) => writeScore(key, p, e.target.value)}
    />
  );

  return (
    <div className={`scorekeeper${largePrint ? ' is-large' : ''}`}>
      {resume && (
        <div className="resume" role="status">
          <p>
            Resume your {game.name} game from {resume.when}, {resume.players} players?
          </p>
          <div className="resume-actions">
            <button type="button" className="btn btn-primary" onClick={takeResume}>Resume</button>
            <button type="button" className="btn btn-quiet" onClick={() => { dropResume(); newGame(false); }}>Start new</button>
          </div>
        </div>
      )}

      {notes.length > 0 && (
        <div className="sheet-notes" role="status">
          {notes.map((n) => <p key={n}>{n}</p>)}
        </div>
      )}

      <div className="sheet" data-ui>
        <div className="sheet-band">
          <span>{game.name}</span>
          <span className="sheet-band-site">ScoreSheetSquare.com</span>
        </div>
        <div className="sheet-scroll">
          <table className="sheet-grid">
            <caption className="sr-only">{game.name} score sheet</caption>
            <thead>
              <tr>
                <th scope="col" className="sheet-corner">{live ? 'Tap a name to change it' : 'Players'}</th>
                {players.map((name, p) => (
                  <th scope="col" key={p} colSpan={k > 1 ? k : undefined} className="sheet-player">
                    <input
                      className="cell-input is-name"
                      value={name}
                      placeholder={teams ? `Team ${p + 1}` : `P${p + 1}`}
                      aria-label={`${column} ${p + 1} name`}
                      onFocus={snapshot}
                      onBlur={commit}
                      onChange={(e) => rename(p, e.target.value)}
                    />
                    {live && players.length > game.players.min && (
                      <button type="button" className="remove-player" onClick={() => removePlayer(p)} aria-label={`Remove ${nameOf(p)}`}>
                        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" /></svg>
                      </button>
                    )}
                  </th>
                ))}
              </tr>
              {subs && (
                <tr className="sheet-sub">
                  <th scope="col" className="sheet-corner">Columns</th>
                  {columns.map((v) => (
                    <th scope="col" key={v} className={v % k === 0 ? 'is-first' : undefined}>{subs[v % k].label}</th>
                  ))}
                </tr>
              )}
            </thead>
            {layout.groups.map((group) => (
              <tbody key={group.id}>
                {group.label && (
                  <tr className="sheet-group">
                    <th scope="rowgroup" colSpan={width + 1}>{group.label}</th>
                  </tr>
                )}
                {group.rows.map((row) => (
                  <tr key={row.id}>
                    <th scope="row" className="sheet-label">
                      {row.label}
                      {row.hint && <span className="sheet-hint">{row.hint}</span>}
                    </th>
                    {columns.map((p) => {
                      if (bidding && row.bid) {
                        const nil = scores[nilKey(row.id)]?.[p];
                        const points = bidPoints(bidding, scores[bidKey(row.id)]?.[p], scores[tookKey(row.id)]?.[p], nil, scores[meldKey(row.id)]?.[p], {
                          cards: cardsIn(bidding, roundIndex(row.id)),
                          bonus: scores[bonusKey(row.id)]?.[p],
                        });
                        return (
                          <td key={p} className={bidding.meld || bidding.bonus ? 'bid-cell has-meld' : 'bid-cell'}>
                            <div className="bid-pair">
                              {cellInput(bidKey(row.id), p, `${row.label}, bid`, 'cell-input is-bid', 'bid')}
                              {bidding.meld && cellInput(meldKey(row.id), p, `${row.label}, meld`, 'cell-input is-bid', 'meld')}
                              {cellInput(tookKey(row.id), p, `${row.label}, ${bidding.meld ? 'counters' : 'tricks won'}`, 'cell-input is-took', 'won')}
                              {bidding.bonus && cellInput(bonusKey(row.id), p, `${row.label}, bonus points`, 'cell-input is-took', 'bonus')}
                            </div>
                            <output className="bid-points" aria-label={`${nameOf(p)}, ${row.label}, points`}>{points ?? ''}</output>
                            {/* Nil shows once the round's bid is in, so empty rounds stay quiet. */}
                            {bidding.nil && (nil != null || scores[bidKey(row.id)]?.[p] != null) && (
                              <button
                                type="button"
                                className={`nil-toggle${nil === 1 ? ' is-made' : nil === -1 ? ' is-failed' : ''}`}
                                aria-label={`${nameOf(p)}, ${row.label}, nil bid: ${nil === 1 ? 'made' : nil === -1 ? 'failed' : 'none'}`}
                                onClick={() => cycleNil(row.id, p)}
                              >
                                {nil === 1 ? `Nil +${bidding.nil}` : nil === -1 ? `Nil −${bidding.nil}` : 'Nil'}
                              </button>
                            )}
                          </td>
                        );
                      }
                      const made = scores[phaseKey(row.id)]?.[p] === 1;
                      // Qwixx: the box takes a count of crosses, and shows what it is worth.
                      const counted = row.scale || row.perUnit !== undefined ? rowPoints(row, scores[row.id]?.[p]) : null;
                      const cls = [row.phase && 'has-phase', subs && p % k === 0 && 'is-first', counted !== null && 'has-points'].filter(Boolean).join(' ');
                      return (
                        <td key={p} className={cls || undefined}>
                          {cellInput(row.id, p, row.label)}
                          {counted !== null && <span className="count-points" aria-hidden="true">{String(counted).replace('-', '−')} pts</span>}
                          {row.phase && (
                            <button
                              type="button"
                              className={made ? 'phase-tick is-made' : 'phase-tick'}
                              aria-pressed={made}
                              aria-label={`${nameOf(p)} made the phase in ${row.label}`}
                              onClick={() => togglePhase(row.id, p)}
                            >
                              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" /></svg>
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {group.computed.map((row) => (
                  <tr key={row.id} className={row.strong ? 'sheet-computed is-strong' : 'sheet-computed'}>
                    <th scope="row" className="sheet-label">{row.label}</th>
                    {row.values.map((v, p) => (
                      <td key={p} colSpan={row.perPlayer && k > 1 ? k : undefined} className={subs && (row.perPlayer || p % k === 0) ? 'sheet-total is-first' : 'sheet-total'}>
                        <output aria-label={`${row.perPlayer ? nameOf(p) : columnName(p)}, ${row.label}`}>{v}</output>
                        {row.id === 'grand-total' && p === leader && <PencilCircle />}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
      </div>

      {live && (
        <div className="sheet-controls">
          <button type="button" className="btn btn-quiet" onClick={undo} disabled={history.length === 0}>Undo</button>
          <button type="button" className="btn btn-quiet" onClick={addPlayer} disabled={players.length >= game.players.max}>Add {column.toLowerCase()}</button>
          <button type="button" className="btn btn-quiet" onClick={printGame} disabled={printing}>{printing ? 'Making PDF…' : 'Print this game'}</button>
          {done && !winnerOpen && <button type="button" className="btn btn-quiet" onClick={() => setWinnerOpen(true)}>Show the winner</button>}
          {choices.targets && (
            <label className="pill">
              Play to
              <select value={'target' in game.sheet ? game.sheet.target : undefined} onChange={(e) => setOptions((o) => ({ ...o, target: Number(e.target.value) }))}>
                {choices.targets.map((t) => <option key={t} value={t}>{t.toLocaleString('en-US')}</option>)}
              </select>
            </label>
          )}
          {choices.rounds && game.sheet.engine === 'round-totals' && (
            <label className="pill">
              {choices.roundsName}
              <select value={game.sheet.rounds} onChange={(e) => setOptions((o) => ({ ...o, rounds: Number(e.target.value) }))}>
                {choices.rounds.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
          )}
          {choices.moon && game.sheet.engine === 'round-totals' && (
            <label className="pill">
              Shooting the moon
              <select value={game.sheet.roundPoints?.moon} onChange={(e) => setOptions((o) => ({ ...o, moon: e.target.value as GameOptions['moon'] }))}>
                <option value="others">26 to everyone else</option>
                <option value="self">26 off the shooter</option>
              </select>
            </label>
          )}
          <label className="pill">
            <input type="checkbox" checked={wakeOn} onChange={(e) => setWakeOn(e.target.checked)} />
            Keep screen on
          </label>
          <label className="pill">
            <input type="checkbox" checked={largePrint} onChange={(e) => setLargePrint(e.target.checked)} />
            Large print
          </label>
        </div>
      )}

      {coarse && active && (
        <div
          className="keypad"
          role="group"
          aria-label={`Keypad for ${activeLabel}`}
          // Keep focus on the cell being written while keys are pressed.
          onPointerDown={(e) => e.preventDefault()}
          onMouseDown={(e) => e.preventDefault()}
        >
          <p className="keypad-label">{activeLabel}</p>
          <div className="keypad-keys">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((k) => (
              <button key={k} type="button" onClick={() => keyPress(k)}>{k}</button>
            ))}
            <button type="button" onClick={() => keyPress('sign')} aria-label="Make negative or positive">±</button>
            <button type="button" onClick={() => keyPress('0')}>0</button>
            <button type="button" onClick={() => keyPress('back')} aria-label="Delete last digit">
              <svg viewBox="0 0 24 24" className="icon" aria-hidden="true"><path d="M9 6h11v12H9l-5-6zM12 10l4 4m0-4-4 4" /></svg>
            </button>
          </div>
          <div className="keypad-actions">
            <button type="button" className="btn btn-quiet" onClick={() => (document.activeElement as HTMLElement | null)?.blur()}>Done</button>
            <button type="button" className="btn btn-primary" onClick={nextCell}>Next</button>
          </div>
        </div>
      )}

      {winnerOpen && (
        <WinnerScreen
          title={leader >= 0 ? `${nameOf(leader)} wins` : 'A tie at the top'}
          circled={leader >= 0}
          rows={ranked.map((p) => ({ name: nameOf(p), total: layout.totals[p], note: phased ? `${phasesMade(game.sheet, scores, p)} phases` : undefined }))}
          onPlayAgain={() => newGame(true)}
          onPrint={printGame}
          printing={printing}
          onClose={() => setWinnerOpen(false)}
        />
      )}
    </div>
  );
}

export function WinnerScreen(props: {
  title: string;
  circled: boolean;
  rows: { name: string; total: number; note?: string }[];
  onPlayAgain: () => void;
  onPrint?: () => void;
  printing?: boolean;
  onClose: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && props.onClose();
    document.addEventListener('keydown', esc);
    document.documentElement.classList.add('winner-open');
    return () => {
      document.removeEventListener('keydown', esc);
      document.documentElement.classList.remove('winner-open');
    };
  }, []);
  const max = Math.max(1, ...props.rows.map((r) => Math.abs(r.total)));
  return (
    <section className="winner-screen" role="dialog" aria-modal="true" aria-labelledby="winner-title">
      <div className="winner-inner">
        <h2 id="winner-title" className="winner-name" tabIndex={-1} ref={heading}>
          {props.title}
          {props.circled && <PencilCircle />}
        </h2>
        <ol className="winner-bars">
          {props.rows.map((r, i) => (
            <li key={i}>
              <span className="winner-bar-name">{r.name}</span>
              <span className="winner-bar" style={{ inlineSize: `${Math.max(6, (Math.abs(r.total) / max) * 100)}%` }}>
                <span>{r.note ? `${r.note}, ${r.total}` : r.total}</span>
              </span>
            </li>
          ))}
        </ol>
        <div className="winner-actions">
          <button type="button" className="btn btn-primary" onClick={props.onPlayAgain}>Play again with same players</button>
          {props.onPrint && <button type="button" className="btn btn-quiet" onClick={props.onPrint} disabled={props.printing}>{props.printing ? 'Making PDF…' : 'Print this game'}</button>}
          <button type="button" className="btn btn-quiet" onClick={props.onClose}>Back to the sheet</button>
        </div>
        {ADS_ENABLED && <div className="ad-slot winner-ad" aria-hidden="true"></div>}
      </div>
    </section>
  );
}
