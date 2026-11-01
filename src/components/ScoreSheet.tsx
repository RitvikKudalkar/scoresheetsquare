import { useEffect, useMemo, useRef, useState } from 'react';
import { downloadSheetPdf, localPaper } from '../lib/client-pdf';
import { isComplete, layoutSheet, leaderOf, rowIds, type Scores, type SheetGame } from '../lib/sheet';

type Props = {
  game: SheetGame;
  /** `demo` is the pre-filled sheet on the home page; `live` is a game page scorekeeper that saves. */
  mode: 'demo' | 'live';
};

type Saved = { players: string[]; scores: Scores; savedAt: number };

const DEMO_NAMES = ['Ana', 'Ben', 'Cleo', 'Dev', 'Eli', 'Fay', 'Gus', 'Hal', 'Ivy', 'Jo'];
const MAX_HISTORY = 60;

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
  const rows = fill[game.sheet.engine];
  for (let p = 0; p < Math.min(count, rows.length); p++) {
    rows[p].forEach((v, i) => {
      if (ids[i]) scores[ids[i]][p] = v;
    });
  }
  return scores;
}

function PencilCircle() {
  return (
    <svg className="pencil-circle" viewBox="0 0 104 52" preserveAspectRatio="none" aria-hidden="true">
      <path pathLength={1} d="M10 31C5 14 36 4 68 6c28 2 33 26 10 36-24 10-63 8-70-8C3 22 22 10 38 9" />
    </svg>
  );
}

export default function ScoreSheet({ game, mode }: Props) {
  const storageKey = `sss:game:${game.slug}`;
  const initialCount = game.players.default;
  const [players, setPlayers] = useState<string[]>(() =>
    mode === 'demo' ? DEMO_NAMES.slice(0, initialCount) : Array(initialCount).fill(''),
  );
  const [scores, setScores] = useState<Scores>(() =>
    mode === 'demo' ? demoScores(game, initialCount) : emptyScores(game, initialCount),
  );
  const [history, setHistory] = useState<{ players: string[]; scores: Scores }[]>([]);
  const [resume, setResume] = useState<Saved | null>(null);
  const [largePrint, setLargePrint] = useState(false);
  const [wakeOn, setWakeOn] = useState(false);
  const before = useRef<{ players: string[]; scores: Scores } | null>(null);
  const wakeLock = useRef<WakeLockSentinel | null>(null);

  const layout = useMemo(() => layoutSheet(game.sheet, scores, players.length), [game.sheet, scores, players.length]);
  const leader = leaderOf(layout.totals, game.winCondition, scores);
  const done = mode === 'live' && isComplete(game.sheet, scores, players.length, layout.totals);

  // Offer the saved game once, after hydration, so server and client render the same first frame.
  useEffect(() => {
    if (mode !== 'live') return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setResume(JSON.parse(raw) as Saved);
    } catch {
      /* storage unavailable: play without saving */
    }
  }, [mode, storageKey]);

  useEffect(() => {
    if (mode !== 'live' || resume) return;
    const started = Object.values(scores).some((v) => v.some((x) => x !== null));
    if (!started) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({ players, scores, savedAt: Date.now() } satisfies Saved));
    } catch {
      /* storage full or blocked */
    }
  }, [mode, players, scores, storageKey, resume]);

  useEffect(() => {
    if (!wakeOn || !('wakeLock' in navigator)) return;
    let cancelled = false;
    const request = () =>
      navigator.wakeLock.request('screen').then((lock) => {
        if (cancelled) lock.release();
        else wakeLock.current = lock;
      }).catch(() => setWakeOn(false));
    request();
    const again = () => document.visibilityState === 'visible' && request();
    document.addEventListener('visibilitychange', again);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', again);
      wakeLock.current?.release();
      wakeLock.current = null;
    };
  }, [wakeOn]);

  const snapshot = () => (before.current = { players, scores });
  const commit = () => {
    const prev = before.current;
    before.current = null;
    if (prev && (prev.scores !== scores || prev.players !== players)) {
      setHistory((h) => [...h.slice(-MAX_HISTORY + 1), prev]);
    }
  };

  const writeScore = (rowId: string, p: number, text: string) => {
    const clean = text.replace(/[^\d-]/g, '');
    const value = clean === '' || clean === '-' ? null : Number(clean);
    setScores((s) => {
      const row = s[rowId] ?? Array(players.length).fill(null);
      return { ...s, [rowId]: row.map((v, i) => (i === p ? value : v)) };
    });
  };

  const rename = (p: number, name: string) => setPlayers((ps) => ps.map((n, i) => (i === p ? name : n)));

  const addPlayer = () => {
    if (players.length >= game.players.max) return;
    setHistory((h) => [...h, { players, scores }]);
    setPlayers((ps) => [...ps, '']);
    setScores((s) => Object.fromEntries(Object.entries(s).map(([k, v]) => [k, [...v, null]])));
  };

  const removePlayer = (p: number) => {
    if (players.length <= game.players.min) return;
    setHistory((h) => [...h, { players, scores }]);
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
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* nothing saved */
    }
  };

  const takeResume = () => {
    if (!resume) return;
    setPlayers(resume.players);
    setScores(resume.scores);
    setResume(null);
  };

  const savedWhen = resume
    ? new Date(resume.savedAt).toLocaleDateString(undefined, { weekday: 'long', hour: 'numeric', minute: '2-digit' })
    : '';
  const live = mode === 'live';
  const nameOf = (p: number) => players[p] || `Player ${p + 1}`;

  // Puts the scores written so far onto the same layout as the printable PDF.
  const [printing, setPrinting] = useState(false);
  const printGame = async () => {
    setPrinting(true);
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

  return (
    <div className={`scorekeeper${largePrint ? ' is-large' : ''}`}>
      {resume && (
        <div className="resume" role="status">
          <p>
            Resume your {game.name} game from {savedWhen}, {resume.players.length} players?
          </p>
          <div className="resume-actions">
            <button type="button" className="btn btn-primary" onClick={takeResume}>Resume</button>
            <button type="button" className="btn btn-quiet" onClick={() => { setResume(null); newGame(false); }}>Start new</button>
          </div>
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
                      return (
                        <td key={p}>
                          <input
                            className="cell-input"
                            inputMode="numeric"
                            enterKeyHint="next"
                            autoComplete="off"
                            value={v ?? ''}
                            aria-label={`${nameOf(p)}, ${row.label}`}
                            onFocus={snapshot}
                            onBlur={commit}
                            onChange={(e) => writeScore(row.id, p, e.target.value)}
                          />
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
          <button type="button" className="btn btn-quiet" onClick={addPlayer} disabled={players.length >= game.players.max}>
            Add player
          </button>
          <button type="button" className="btn btn-quiet" onClick={printGame} disabled={printing}>{printing ? 'Making PDF…' : 'Print this game'}</button>
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

      {done && (
        <section className="winner" aria-live="polite">
          <h2 className="winner-name">
            {leader >= 0 ? `${nameOf(leader)} wins` : 'A tie at the top'}
            {leader >= 0 && <PencilCircle />}
          </h2>
          <ol className="winner-bars">
            {players
              .map((_, p) => ({ name: nameOf(p), total: layout.totals[p], p }))
              .sort((a, b) => (game.winCondition === 'highest' ? b.total - a.total : a.total - b.total))
              .map(({ name, total, p }) => {
                const max = Math.max(1, ...layout.totals);
                return (
                  <li key={p}>
                    <span className="winner-bar-name">{name}</span>
                    <span className="winner-bar" style={{ inlineSize: `${Math.max(4, (total / max) * 100)}%` }}>
                      <span>{total}</span>
                    </span>
                  </li>
                );
              })}
          </ol>
          <div className="winner-actions">
            <button type="button" className="btn btn-primary" onClick={() => newGame(true)}>Play again with same players</button>
            <button type="button" className="btn btn-quiet" onClick={printGame} disabled={printing}>{printing ? 'Making PDF…' : 'Print this game'}</button>
          </div>
        </section>
      )}
    </div>
  );
}
