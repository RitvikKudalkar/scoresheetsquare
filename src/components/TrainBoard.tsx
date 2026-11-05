// The hub and one row per train. The game makes rows tappable; the rules page renders it as a still diagram.
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
};

type Props = {
  engine: number;
  rows: BoardRow[];
  numbers?: boolean;
  /** Tiles shown per train; earlier ones fold into a count. */
  show?: number;
  onPick?: (index: number) => void;
};

export default function TrainBoard({ engine, rows, numbers = false, show = 5, onPick }: Props) {
  return (
    <div className="board">
      <div className="board-hub">
        <Domino a={engine} b={engine} numbers={numbers} />
        <span className="t-small">Hub: double {engine}</span>
      </div>
      <ol className="trains">
        {rows.map((row, i) => {
          const hidden = Math.max(0, row.tiles.length - show);
          const body = (
            <>
              <span className="train-head">
                <span className="train-label">{row.label}</span>
                {row.note && <span className="t-small t-soft">{row.note}</span>}
                {row.marker && !row.mexican && <span className="train-marker t-small">Marker out: open to all</span>}
                {row.openDouble && <span className="train-marker t-small">Cover the double</span>}
              </span>
              <span className="train-tiles">
                {hidden > 0 && <span className="train-more t-small">+{hidden}</span>}
                {row.tiles.slice(-show).map((t, j) => (
                  <Domino key={hidden + j} a={t.a} b={t.b} numbers={numbers} className={t.a === t.b ? 'is-double' : undefined} />
                ))}
                {row.tiles.length === 0 && <span className="train-empty t-small t-soft">Not started</span>}
              </span>
            </>
          );
          return (
            <li key={row.key} className={['train', row.mexican && 'is-mexican', row.target && 'is-target'].filter(Boolean).join(' ')}>
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
