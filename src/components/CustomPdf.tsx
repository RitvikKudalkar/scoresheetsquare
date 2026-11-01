import { useEffect, useState } from 'react';
import { track } from '../lib/analytics';
import { downloadSheetPdf, localPaper } from '../lib/client-pdf';
import type { Paper, Version } from '../lib/print-layout';
import type { SheetGame } from '../lib/sheet';

type Props = { game: SheetGame };

export default function CustomPdf({ game }: Props) {
  const [count, setCount] = useState(game.players.default);
  const [names, setNames] = useState<string[]>(() => Array(game.players.max).fill(''));
  const [version, setVersion] = useState<Exclude<Version, '2-per-page'>>('standard');
  const [paper, setPaper] = useState<Paper>('letter');
  const [state, setState] = useState<'idle' | 'working' | 'error'>('idle');

  useEffect(() => setPaper(localPaper()), []);

  const make = async () => {
    setState('working');
    track('custom_pdf', { game: game.slug, version, paper, players: count });
    try {
      // A blank name still claims its column, so the sheet gets exactly `count` columns.
      const players = names.slice(0, count).map((n) => n.trim() || ' ');
      await downloadSheetPdf(
        game,
        { version, paper, players, siteUrl: `scoresheetsquare.com/${game.slug}` },
        `${game.slug}-custom${paper === 'a4' ? '-a4' : ''}.pdf`,
      );
      setState('idle');
    } catch {
      setState('error');
    }
  };

  return (
    <details className="custom">
      <summary className="btn btn-quiet">Customise: add names and players</summary>
      <div className="custom-body">
        <label className="custom-field">
          <span>Players</span>
          <select value={count} onChange={(e) => setCount(Number(e.target.value))}>
            {Array.from({ length: game.players.max - game.players.min + 1 }, (_, i) => game.players.min + i).map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
        <div className="custom-names">
          {Array.from({ length: count }, (_, p) => (
            <label key={p} className="custom-field">
              <span>Player {p + 1}</span>
              <input
                value={names[p]}
                maxLength={18}
                autoComplete="off"
                placeholder="Name (optional)"
                onChange={(e) => setNames((ns) => ns.map((n, i) => (i === p ? e.target.value : n)))}
              />
            </label>
          ))}
        </div>
        <fieldset className="custom-choice">
          <legend>Size</legend>
          <label className="pill"><input type="radio" name="custom-version" checked={version === 'standard'} onChange={() => setVersion('standard')} /> Standard</label>
          <label className="pill"><input type="radio" name="custom-version" checked={version === 'large-print'} onChange={() => setVersion('large-print')} /> Large print</label>
        </fieldset>
        <fieldset className="custom-choice">
          <legend>Paper</legend>
          <label className="pill"><input type="radio" name="custom-paper" checked={paper === 'letter'} onChange={() => setPaper('letter')} /> US Letter</label>
          <label className="pill"><input type="radio" name="custom-paper" checked={paper === 'a4'} onChange={() => setPaper('a4')} /> A4</label>
        </fieldset>
        <button type="button" className="btn btn-primary" onClick={make} disabled={state === 'working'}>
          {state === 'working' ? 'Making your PDF…' : 'Download custom PDF'}
        </button>
        {state === 'error' && <p className="custom-error" role="alert">The PDF could not be made. Check your connection and try again.</p>}
      </div>
    </details>
  );
}
