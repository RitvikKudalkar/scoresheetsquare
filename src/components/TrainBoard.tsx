// The hub and one row per train. The game makes rows tappable; the rules page renders it as a still diagram.
// Data attributes mark where tiles land and leave from, so the game can fly tiles between them.
import Domino from './Domino';
import type { Placed } from '../lib/mexican-train';

export type BoardRow = {
  key: string;
  label: string;
  note?: string;
  tiles: Placed[];
  marker: boolean;
  mexican?: boolean;
  /** The selected tile can be played here. */
  target?: boolean;
  /** This train holds a double that must be covered. */
  openDouble?: boolean;
  /** It is this train's owner's turn. */
  turn?: boolean;
  /** Tiles still in a computer player's hand, drawn face down. */
  hand?: number;
};

type Props = {
  engine: number;
  rows: BoardRow[];
  numbers?: boolean;
  /** Tiles shown per train; earlier ones fold into a count. */
  show?: number;
  onPick?: (index: number) => void;
};

function HandStack({ count, index }: { count: number; index: number }) {
  const shown = Math.min(count, 15);
  return (
    <span className="hand-stack" data-hand-stack={index} aria-hidden="true">
      <svg viewBox={`0 0 ${12 + shown * 5} 26`} style={{ inlineSize: `${12 + shown * 5}px` }}>
        {Array.from({ length: shown }, (_, k) => (
          <rect key={k} x={1 + k * 5} y="1" width="10" height="24" rx="2" className="hand-stack-tile" />
        ))}
      </svg>
    </span>
  );
}

export default function TrainBoard({ engine, rows, numbers = false, show = 5, onPick }: Props) {
  return (
    <div className="board">
      <div className="board-hub">
        <Domino a={engine} b={engine} numbers={numbers} upright />
        <span className="t-small">Hub: double {engine}</span>
      </div>
      <ol className="trains">
        {rows.map((row, i) => {
          const hidden = Math.max(0, row.tiles.length - show);
          const visible = row.tiles.slice(-show);
          const body = (
            <>
              <span className="train-head">
                <span className="train-label">{row.label}</span>
                {row.hand !== undefined && <HandStack count={row.hand} index={i} />}
                {row.note && <span className="t-small t-soft">{row.note}</span>}
                {row.marker && !row.mexican && (
                  <span className="train-marker t-small">
                    <svg className="marker-coin" data-marker={i} viewBox="0 0 20 20" aria-hidden="true">
                      <circle cx="10" cy="10" r="8.5" />
                      <circle cx="10" cy="10" r="4.5" />
                    </svg>
                    Marker out: open to all
                  </span>
                )}
                {row.openDouble && <span className="train-double t-small">Cover the double</span>}
              </span>
              <span className="train-tiles" data-train-tiles={i}>
                {hidden > 0 && <span className="train-more t-small">+{hidden}</span>}
                {visible.map((t, j) => (
                  <Domino
                    key={hidden + j}
                    a={t.a}
                    b={t.b}
                    numbers={numbers}
                    upright={t.a === t.b}
                    className={j === visible.length - 1 ? 'is-end' : undefined}
                  />
                ))}
                {row.tiles.length === 0 && <span className="train-empty t-small t-soft">Not started</span>}
              </span>
            </>
          );
          return (
            <li
              key={row.key}
              data-train={i}
              className={['train', row.mexican && 'is-mexican', row.target && 'is-target', row.turn && 'is-turn'].filter(Boolean).join(' ')}
            >
              {row.target && onPick ? (
                <button type="button" className="train-button" onClick={() => onPick(i)} aria-label={`Play on ${row.label}`}>
                  {body}
                </button>
              ) : (
                <div className="train-button">{body}</div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
