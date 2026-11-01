import { useEffect, useMemo, useRef, useState } from 'react';
import { track } from '../lib/analytics';
import { downloadSheetPdf, localPaper } from '../lib/client-pdf';
import { isComplete, layoutSheet, leaderOf, notices, phaseKey, phasesMade, rankPlayers, rowIds, type Scores, type SheetGame } from '../lib/sheet';
import TallySheet from './TallySheet';
import { PencilCircle, useSaved, useWakeLock } from './sheet-shared';

type Props = {
  game: SheetGame;
  /** `demo` is the pre-filled sheet on the home page; `live` is a game page scorekeeper that saves. */
  mode: 'demo' | 'live';
};

const DEMO_NAMES = ['Ana', 'Ben', 'Cleo', 'Dev', 'Eli', 'Fay', 'Gus', 'Hal', 'Ivy', 'Jo'];
const MAX_HISTORY = 60;

export default function ScoreSheet(props: Props) {
  return props.game.sheet.engine === 'tally' ? <TallySheet {...props} /> : <PointsSheet {...props} />;
}

function emptyScores(game: SheetGame, count: number): Scores {
  return Object.fromEntries(rowIds(game.sheet).map((id) => [id, Array(count).fill(null)]));
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

function PointsSheet({ game, mode }: Props) {
  const live = mode === 'live';
  const initialCount = game.players.default;
  const [players, setPlayers] = useState<string[]>(() => (live ? Array(initialCount).fill('') : DEMO_NAMES.slice(0, initialCount)));
  const [scores, setScores] = useState<Scores>(() => (live ? emptyScores(game, initialCount) : demoScores(game, initialCount)));
  const [history, setHistory] = useState<{ players: string[]; scores: Scores }[]>([]);
  const [largePrint, setLargePrint] = useState(false);
  const [wakeOn, setWakeOn] = useWakeLock();
  const [active, setActive] = useState<{ rowId: string; p: number } | null>(null);
  const [coarse, setCoarse] = useState(false);
  const [winnerOpen, setWinnerOpen] = useState(false);
  const before = useRef<{ players: string[]; scores: Scores } | null>(null);
  const started = useRef(false);

  const hasScores = Object.values(scores).some((v) => v.some((x) => x !== null));
  const saved = useMemo(() => ({ players, scores }), [players, scores]);
  const { resume, takeResume, dropResume, clearSaved } = useSaved(live, game.slug, saved, hasScores, (s) => {
    setPlayers(s.players);
    setScores(s.scores);
  });

  const layout = useMemo(() => layoutSheet(game.sheet, scores, players.length), [game.sheet, scores, players.length]);
  const leader = leaderOf(game.sheet, layout.totals, game.winCondition, scores);
  const done = live && isComplete(game.sheet, scores, players.length, layout.totals);
  const nameOf = (p: number) => players[p] || `Player ${p + 1}`;
  const notes = live ? notices(game.sheet, scores, players.map((_, p) => nameOf(p)), layout.totals) : [];
  const phased = game.sheet.engine === 'round-totals' && !!game.sheet.phases;

  // A phone gets the on-screen keypad instead of the system keyboard.
  useEffect(() => {
    const mq = matchMedia('(pointer: coarse)');
    setCoarse(mq.matches);
    // A cell tapped before the sheet finished loading is already focused: pick it up.
    const [, rowId, p] = (document.activeElement as HTMLElement | null)?.dataset.cell?.split(':') ?? [];
    if (rowId && document.activeElement?.closest('.scorekeeper')) setActive({ rowId, p: Number(p) });
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
      const row = s[rowId] ?? Array(players.length).fill(null);
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

  const rename = (p: number, name: string) => setPlayers((ps) => ps.map((n, i) => (i === p ? name : n)));

  const addPlayer = () => {
    if (players.length >= game.players.max) return;
    pushHistory();
    setPlayers((ps) => [...ps, '']);
    setScores((s) => Object.fromEntries(Object.entries(s).map(([k, v]) => [k, [...v, null]])));
  };

  const removePlayer = (p: number) => {
    if (players.length <= game.players.min) return;
    pushHistory();
    setPlayers((ps) => ps.filter((_, i) => i !== p));
    setScores((s) => Object.fromEntries(Object.entries(s).map(([k, v]) => [k, v.filter((_, i) => i !== p)])));
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

  // Keypad: Next walks across the players in a row, then down to the next row.
  const entryRows = layout.groups.flatMap((g) => g.rows.map((r) => r.id));
  const focusCell = (rowId: string, p: number) =>
    document.querySelector<HTMLInputElement>(`[data-cell="${game.slug}:${rowId}:${p}"]`)?.focus();
  const nextCell = () => {
    if (!active) return;
    const r = entryRows.indexOf(active.rowId);
    if (active.p + 1 < players.length) focusCell(active.rowId, active.p + 1);
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
  const activeLabel = active ? `${nameOf(active.p)}, ${entryRows.includes(active.rowId) ? layout.groups.flatMap((g) => g.rows).find((r) => r.id === active.rowId)?.label : ''}` : '';

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
                  <th scope="col" key={p} className="sheet-player">
                    <input
                      className="cell-input is-name"
                      value={name}
                      placeholder={`P${p + 1}`}
                      aria-label={`Player ${p + 1} name`}
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
            </thead>
            {layout.groups.map((group) => (
              <tbody key={group.id}>
                {group.label && (
                  <tr className="sheet-group">
                    <th scope="rowgroup" colSpan={players.length + 1}>{group.label}</th>
                  </tr>
                )}
                {group.rows.map((row) => (
                  <tr key={row.id}>
                    <th scope="row" className="sheet-label">
                      {row.label}
                      {row.hint && <span className="sheet-hint">{row.hint}</span>}
                    </th>
                    {players.map((_, p) => {
                      const v = scores[row.id]?.[p];
                      const made = scores[phaseKey(row.id)]?.[p] === 1;
                      return (
                        <td key={p} className={row.phase ? 'has-phase' : undefined}>
                          <input
                            className="cell-input"
                            inputMode={coarse ? 'none' : 'numeric'}
                            enterKeyHint="next"
                            autoComplete="off"
                            value={v ?? ''}
                            data-cell={`${game.slug}:${row.id}:${p}`}
                            aria-label={`${nameOf(p)}, ${row.label}`}
                            onFocus={(e) => {
                              snapshot();
                              setActive({ rowId: row.id, p });
                              if (coarse) e.currentTarget.scrollIntoView({ block: 'center', behavior: 'smooth' });
                            }}
                            onBlur={() => {
                              commit();
                              setActive(null);
                            }}
                            onChange={(e) => writeScore(row.id, p, e.target.value)}
                          />
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
                      <td key={p} className="sheet-total">
                        <output aria-label={`${nameOf(p)}, ${row.label}`}>{v}</output>
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
          <button type="button" className="btn btn-quiet" onClick={addPlayer} disabled={players.length >= game.players.max}>Add player</button>
          <button type="button" className="btn btn-quiet" onClick={printGame} disabled={printing}>{printing ? 'Making PDF…' : 'Print this game'}</button>
          {done && !winnerOpen && <button type="button" className="btn btn-quiet" onClick={() => setWinnerOpen(true)}>Show the winner</button>}
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

function WinnerScreen(props: {
  title: string;
  circled: boolean;
  rows: { name: string; total: number; note?: string }[];
  onPlayAgain: () => void;
  onPrint: () => void;
  printing: boolean;
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
          <button type="button" className="btn btn-quiet" onClick={props.onPrint} disabled={props.printing}>{props.printing ? 'Making PDF…' : 'Print this game'}</button>
          <button type="button" className="btn btn-quiet" onClick={props.onClose}>Back to the sheet</button>
        </div>
        <div className="ad-slot winner-ad" aria-hidden="true"></div>
      </div>
    </section>
  );
}
