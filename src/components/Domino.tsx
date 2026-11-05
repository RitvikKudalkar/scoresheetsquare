// One domino drawn as SVG in pad ink on sheet white, with pips (up to 12 a side) or numbers for large print.
// Doubles lie crosswise in a train, as they do on a real table, so a tile can also be drawn upright.

const L = 0.24, M = 0.5, R = 0.76;
const T = 0.22, B = 0.78;
const ROWS4 = [0.18, 0.39, 0.61, 0.82];

/** Pip centres inside one square half, as fractions of its side. */
const LAYOUTS: [number, number][][] = [
  [],
  [[M, M]],
  [[L, T], [R, B]],
  [[L, T], [M, M], [R, B]],
  [[L, T], [R, T], [L, B], [R, B]],
  [[L, T], [R, T], [M, M], [L, B], [R, B]],
  [[L, T], [L, M], [L, B], [R, T], [R, M], [R, B]],
  [[L, T], [L, M], [L, B], [M, M], [R, T], [R, M], [R, B]],
  [[L, T], [M, T], [R, T], [L, M], [R, M], [L, B], [M, B], [R, B]],
  [[L, T], [M, T], [R, T], [L, M], [M, M], [R, M], [L, B], [M, B], [R, B]],
  [...ROWS4.map((y): [number, number] => [L, y]), ...ROWS4.map((y): [number, number] => [R, y]), [M, 0.39], [M, 0.61]],
  [...ROWS4.map((y): [number, number] => [L, y]), ...ROWS4.map((y): [number, number] => [R, y]), [M, 0.28], [M, M], [M, 0.72]],
  [...ROWS4.map((y): [number, number] => [L, y]), ...ROWS4.map((y): [number, number] => [R, y]), ...ROWS4.map((y): [number, number] => [M, y])],
];

function Half({ value, x, y, numbers }: { value: number; x: number; y: number; numbers: boolean }) {
  if (numbers) {
    return (
      <text x={x + 25} y={y + 26} textAnchor="middle" dominantBaseline="central" className="domino-number">
        {value}
      </text>
    );
  }
  const r = value >= 10 ? 3.6 : 4.4;
  return (
    <>
      {LAYOUTS[value].map(([px, py], i) => (
        <circle key={i} cx={x + 4 + px * 42} cy={y + 4 + py * 42} r={r} />
      ))}
    </>
  );
}

type Props = {
  a: number;
  b: number;
  /** Shows numbers instead of pips. */
  numbers?: boolean;
  /** Drawn upright, `a` on top: how a double lies across a train. */
  upright?: boolean;
  className?: string;
};

export default function Domino({ a, b, numbers = false, upright = false, className }: Props) {
  return (
    <svg
      className={['domino', upright && 'is-upright', className].filter(Boolean).join(' ')}
      viewBox={upright ? '0 0 50 100' : '0 0 100 50'}
      aria-hidden="true"
      focusable="false"
    >
      {upright ? (
        <>
          <rect x="1" y="1" width="48" height="98" rx="5" className="domino-face" />
          <line x1="8" y1="50" x2="42" y2="50" className="domino-rule" />
        </>
      ) : (
        <>
          <rect x="1" y="1" width="98" height="48" rx="5" className="domino-face" />
          <line x1="50" y1="8" x2="50" y2="42" className="domino-rule" />
        </>
      )}
      <g className="domino-pips">
        <Half value={a} x={0} y={0} numbers={numbers} />
        <Half value={b} x={upright ? 0 : 50} y={upright ? 50 : 0} numbers={numbers} />
      </g>
    </svg>
  );
}

/** The back of a domino: what a tile looks like in someone else's hand or in the boneyard. */
export function DominoBack({ className }: { className?: string }) {
  return (
    <svg className={['domino', 'domino-back', className].filter(Boolean).join(' ')} viewBox="0 0 100 50" aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="98" height="48" rx="5" className="domino-back-face" />
      <circle cx="50" cy="25" r="3.2" className="domino-back-pin" />
    </svg>
  );
}
