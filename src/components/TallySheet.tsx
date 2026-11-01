import { useEffect, useMemo, useRef, useState } from 'react';
import { track } from '../lib/analytics';
import type { Scores, SheetGame, TallyConfig } from '../lib/sheet';
import { PencilCircle, useSaved, useWakeLock } from './sheet-shared';

type Props = { game: SheetGame; mode: 'demo' | 'live' };
type Night = { players: string[]; counts: Scores; set: number; round: number };

const MAX_HISTORY = 60;
const DEMO = ['Ana', 'Ben', 'Cleo', 'Dev', 'Eli', 'Fay', 'Gus', 'Hal', 'Ivy', 'Jo', 'Kit', 'Lou'];

function emptyNight(config: TallyConfig, count: number, names?: string[]): Night {
  return {
    players: names ?? Array(count).fill(''),
    counts: Object.fromEntries(config.tallies.map((t) => [t.id, Array(count).fill(0)])),
    set: 1,
    round: 1,
  };
}

/** Bunco: wins, losses and buncos counted for each player across a night of sets and rounds. */
export default function TallySheet({ game, mode }: Props) {
  const config = game.sheet as TallyConfig;
  const live = mode === 'live';
  const [night, setNight] = useState<Night>(() => {
    const n = emptyNight(config, game.players.default, live ? undefined : DEMO.slice(0, game.players.default));
    if (!live) {
      // Half way through a demo night.
      n.counts = { wins: [4, 2, 3, 1, 5, 2, 3, 4, 1, 2, 3, 2], losses: [2, 4, 3, 5, 1, 4, 3, 2, 5, 4, 3, 4], buncos: [1, 0, 0, 0, 2, 0, 1, 0, 0, 0, 0, 1] };
      n.round = 6;
    }
    return n;
  });
  const [history, setHistory] = useState<Night[]>([]);
  const [wakeOn, setWakeOn] = useWakeLock();
  const started = useRef(false);

  const hasCounts = Object.values(night.counts).some((v) => v.some((x) => (x ?? 0) > 0));
  const { resume, takeResume, dropResume, clearSaved } = useSaved(live, game.slug, night, hasCounts, setNight);

  useEffect(() => {
    if (live && hasCounts && !started.current) {
      started.current = true;
      track('game_started', { game: game.slug, players: night.players.length });
    }
  }, [live, hasCounts]);

  const nameOf = (p: number) => night.players[p] || `Player ${p + 1}`;
  const change = (next: Night) => {
    setHistory((h) => [...h.slice(-MAX_HISTORY + 1), night]);
    setNight(next);
  };

  const bump = (tally: string, p: number, by: number) => {
    const row = night.counts[tally];
    const value = Math.max(0, (row[p] ?? 0) + by);
    change({ ...night, counts: { ...night.counts, [tally]: row.map((v, i) => (i === p ? value : v)) } });
  };

  const step = (by: number) => {
    let { set, round } = night;
    round += by;
    if (round > config.roundsPerSet) {
      round = 1;
      set = Math.min(config.sets, set + 1);
    }
    if (round < 1) {
      round = set > 1 ? config.roundsPerSet : 1;
      set = Math.max(1, set - 1);
    }
    change({ ...night, set, round });
  };

  const rename = (p: number, name: string) => setNight((n) => ({ ...n, players: n.players.map((x, i) => (i === p ? name : x)) }));

  const addPlayer = () => {
    if (night.players.length >= game.players.max) return;
    change({
      ...night,
      players: [...night.players, ''],
      counts: Object.fromEntries(Object.entries(night.counts).map(([k, v]) => [k, [...v, 0]])),
    });
  };

  const removePlayer = (p: number) => {
    if (night.players.length <= game.players.min) return;
    change({
      ...night,
      players: night.players.filter((_, i) => i !== p),
      counts: Object.fromEntries(Object.entries(night.counts).map(([k, v]) => [k, v.filter((_, i) => i !== p)])),
    });
  };

  const undo = () => {
    const last = history.at(-1);
    if (!last) return;
    setHistory((h) => h.slice(0, -1));
    setNight(last);
  };

  const newNight = () => {
    if (hasCounts) track('game_finished', { game: game.slug, players: night.players.length });
    setHistory([]);
    setNight(emptyNight(config, night.players.length, night.players));
    started.current = false;
    clearSaved();
  };

  // The usual Bunco prizes: most of each tally. Ties share the line.
  const standings = useMemo(
    () =>
      config.tallies.map((t) => {
        const values = night.counts[t.id].map((v) => v ?? 0);
        const best = Math.max(...values);
        const who = best > 0 ? values.flatMap((v, p) => (v === best ? [nameOf(p)] : [])) : [];
        return { id: t.id, label: `Most ${t.label.toLowerCase()}`, who, best };
      }),
    [night],
  );
  const winsLeader = (() => {
    const wins = night.counts[config.tallies[0].id].map((v) => v ?? 0);
    const best = Math.max(...wins);
    return best > 0 && wins.filter((w) => w === best).length === 1 ? wins.indexOf(best) : -1;
  })();

  return (
    <div className="scorekeeper tally">
      {resume && (
        <div className="resume" role="status">
          <p>Resume your {game.name} night from {resume.when}, {resume.players} players?</p>
          <div className="resume-actions">
            <button type="button" className="btn btn-primary" onClick={takeResume}>Resume</button>
            <button type="button" className="btn btn-quiet" onClick={() => { dropResume(); newNight(); }}>Start new</button>
          </div>
        </div>
      )}

      <div className="sheet" data-ui>
        <div className="sheet-band">
          <span>{game.name}</span>
          <span className="sheet-band-site">ScoreSheetSquare.com</span>
        </div>

        <div className="tally-round" aria-live="polite">
          <div>
            <p className="t-small">Set {night.set} of {config.sets}, round {night.round} of {config.roundsPerSet}</p>
            <p className="tally-target">Roll for {night.round}s</p>
          </div>
          {live && (
            <div className="tally-round-buttons">
              <button type="button" className="btn btn-quiet" onClick={() => step(-1)} disabled={night.set === 1 && night.round === 1}>Back</button>
              <button type="button" className="btn btn-primary" onClick={() => step(1)} disabled={night.set === config.sets && night.round === config.roundsPerSet}>
                Next round
              </button>
            </div>
          )}
        </div>

        <div className="sheet-scroll">
          <table className="sheet-grid tally-grid">
            <caption className="sr-only">{game.name} tally</caption>
            <thead>
              <tr>
                <th scope="col" className="sheet-corner">Player</th>
                {config.tallies.map((t) => <th scope="col" key={t.id} className="tally-head">{t.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {night.players.map((name, p) => (
                <tr key={p}>
                  <th scope="row" className="sheet-player tally-name">
                    <input
                      className="cell-input is-name"
                      value={name}
                      placeholder={`Player ${p + 1}`}
                      aria-label={`Player ${p + 1} name`}
                      onChange={(e) => rename(p, e.target.value)}
                    />
                    {live && night.players.length > game.players.min && (
                      <button type="button" className="remove-player" onClick={() => removePlayer(p)} aria-label={`Remove ${nameOf(p)}`}>
                        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" /></svg>
                      </button>
                    )}
                  </th>
                  {config.tallies.map((t, ti) => {
                    const v = night.counts[t.id][p] ?? 0;
                    return (
                      <td key={t.id} className="tally-cell">
                        <div className="stepper">
                          <button type="button" onClick={() => bump(t.id, p, -1)} disabled={v === 0} aria-label={`One less ${t.label.toLowerCase()} for ${nameOf(p)}`}>−</button>
                          <output aria-label={`${nameOf(p)}, ${t.label}`}>
                            {v}
                            {ti === 0 && p === winsLeader && <PencilCircle />}
                          </output>
                          <button type="button" onClick={() => bump(t.id, p, 1)} aria-label={`One more ${t.label.toLowerCase()} for ${nameOf(p)}`}>+</button>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <dl className="tally-standings">
          {standings.map((s) => (
            <div key={s.id}>
              <dt>{s.label}</dt>
              <dd>{s.who.length ? `${s.who.join(' and ')}, ${s.best}` : 'Nobody yet'}</dd>
            </div>
          ))}
        </dl>
      </div>

      {live && (
        <div className="sheet-controls">
          <button type="button" className="btn btn-quiet" onClick={undo} disabled={history.length === 0}>Undo</button>
          <button type="button" className="btn btn-quiet" onClick={addPlayer} disabled={night.players.length >= game.players.max}>Add player</button>
          <button type="button" className="btn btn-quiet" onClick={newNight}>New night</button>
          <label className="pill">
            <input type="checkbox" checked={wakeOn} onChange={(e) => setWakeOn(e.target.checked)} />
            Keep screen on
          </label>
        </div>
      )}
    </div>
  );
}
