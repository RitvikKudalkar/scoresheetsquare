import { useEffect, useState } from 'react';
import { track } from '../lib/analytics';
import { downloadSheetPdf, localPaper } from '../lib/client-pdf';
import { GENERIC_DEFAULTS, GENERIC_LIMITS, genericGame, loadSettings, publishSettings, type GenericSettings as Settings } from '../lib/generic';
import type { Paper, Version } from '../lib/print-layout';

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

export default function GenericSettings() {
  const [s, setS] = useState<Settings>(GENERIC_DEFAULTS);
  const [version, setVersion] = useState<Exclude<Version, '2-per-page'>>('standard');
  const [paper, setPaper] = useState<Paper>('letter');
  const [state, setState] = useState<'idle' | 'working' | 'error'>('idle');

  useEffect(() => {
    setS(loadSettings());
    setPaper(localPaper());
  }, []);

  const update = (patch: Partial<Settings>) => {
    const next = { ...s, ...patch };
    setS(next);
    publishSettings(next);
  };

  const download = async () => {
    setState('working');
    track('custom_pdf', { game: 'printable-score-sheet', version, paper, players: s.players, rounds: s.rounds });
    try {
      const game = genericGame(s);
      await downloadSheetPdf(
        game,
        { version, paper, players: Array(s.players).fill(' '), siteUrl: 'scoresheetsquare.com/printable-score-sheet' },
        `score-sheet-${s.players}-players-${s.rounds}-rounds${paper === 'a4' ? '-a4' : ''}.pdf`,
      );
      setState('idle');
    } catch {
      setState('error');
    }
  };

  return (
    <form className="generic" onSubmit={(e) => e.preventDefault()}>
      <label className="custom-field">
        <span>Title at the top of the sheet</span>
        <input value={s.title} maxLength={28} placeholder="Score sheet" autoComplete="off" onChange={(e) => update({ title: e.target.value })} />
      </label>
      <div className="generic-row">
        <label className="custom-field">
          <span>Players</span>
          <select value={s.players} onChange={(e) => update({ players: Number(e.target.value) })}>
            {range(...GENERIC_LIMITS.players).map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <label className="custom-field">
          <span>Rounds</span>
          <select value={s.rounds} onChange={(e) => update({ rounds: Number(e.target.value) })}>
            {range(...GENERIC_LIMITS.rounds).map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </div>
      <fieldset className="custom-choice">
        <legend>Who wins</legend>
        <label className="pill"><input type="radio" name="win" checked={s.win === 'highest'} onChange={() => update({ win: 'highest' })} /> Highest score</label>
        <label className="pill"><input type="radio" name="win" checked={s.win === 'lowest'} onChange={() => update({ win: 'lowest' })} /> Lowest score</label>
      </fieldset>
      <fieldset className="custom-choice">
        <legend>Size</legend>
        <label className="pill"><input type="radio" name="g-version" checked={version === 'standard'} onChange={() => setVersion('standard')} /> Standard</label>
        <label className="pill"><input type="radio" name="g-version" checked={version === 'large-print'} onChange={() => setVersion('large-print')} /> Large print</label>
      </fieldset>
      <fieldset className="custom-choice">
        <legend>Paper</legend>
        <label className="pill"><input type="radio" name="g-paper" checked={paper === 'letter'} onChange={() => setPaper('letter')} /> US Letter</label>
        <label className="pill"><input type="radio" name="g-paper" checked={paper === 'a4'} onChange={() => setPaper('a4')} /> A4</label>
      </fieldset>
      <button type="button" className="btn btn-primary" onClick={download} disabled={state === 'working'}>
        <svg className="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19h14" /></svg>
        {state === 'working' ? 'Making your PDF…' : 'Download this sheet'}
      </button>
      {state === 'error' && <p className="custom-error" role="alert">The PDF could not be made. Check your connection and try again, or use a ready-made sheet below.</p>}
    </form>
  );
}
