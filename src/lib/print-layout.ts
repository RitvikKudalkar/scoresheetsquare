// One layout for every paper sheet: the build-time PDFs, their preview PNGs, the browser's custom PDF
// and "Print this game". It returns plain drawing operations in points, origin top-left; each backend
// (pdf-lib, SVG) only has to draw rectangles, lines and text.
import { layoutSheet, type Scores, type SheetGame } from './sheet.ts';

export type Paper = 'letter' | 'a4';
export type Version = 'standard' | 'large-print' | '2-per-page';
export type Weight = 'regular' | 'bold';

export type Op =
  | { kind: 'rect'; x: number; y: number; w: number; h: number; fill: string }
  | { kind: 'line'; x1: number; y1: number; x2: number; y2: number; width: number; color: string }
  | { kind: 'text'; x: number; y: number; text: string; size: number; weight: Weight; color: string; align: 'left' | 'center' | 'right' };

export type Page = { width: number; height: number; ops: Op[] };

/** Text width in points, supplied by the backend's real font metrics. */
export type Measure = (text: string, size: number, weight: Weight) => number;

export type SheetOptions = {
  version: Version;
  paper: Paper;
  /** Names to print in the column heads; blank columns when omitted. */
  players?: string[];
  /** Scores to print in the cells ("Print this game"). */
  scores?: Scores;
  siteUrl?: string;
  /** Tally cards only: the player the card belongs to. */
  cardName?: string;
};

const PAPERS: Record<Paper, [number, number]> = { letter: [612, 792], a4: [595.28, 841.89] };
const MARGIN = 34; // 12mm
const INK = '#0f4a35';
const INK_SOFT = '#3e6a57';
const GRAPHITE = '#2b2a27';
const PAPER_WHITE = '#ffffff';

const STYLE = {
  standard: { columns: 6, label: 10.5, hint: 7.5, score: 13, band: 15, maxRow: 30 },
  'large-print': { columns: 4, label: 14, hint: 10, score: 18, band: 20, maxRow: 40 },
  '2-per-page': { columns: 4, label: 9, hint: 0, score: 11, band: 12, maxRow: 24 },
} as const;

/** Shortens text with an ellipsis until it fits the width. */
function fit(text: string, size: number, weight: Weight, width: number, measure: Measure): string {
  if (measure(text, size, weight) <= width) return text;
  let t = text;
  while (t.length > 1 && measure(`${t}…`, size, weight) > width) t = t.slice(0, -1);
  return `${t}…`;
}

function drawSheet(
  game: SheetGame,
  box: { x: number; y: number; w: number; h: number },
  opts: SheetOptions,
  measure: Measure,
): Op[] {
  const s = STYLE[opts.version];
  const ops: Op[] = [];
  const names = opts.players ?? [];
  const tally = game.sheet.engine === 'tally' ? game.sheet : null;
  // A Bunco card is one player's: its columns are the tallies, not players.
  const heads = tally
    ? tally.tallies.map((t) => t.label)
    : Array.from(
        { length: Math.min(game.players.max, names.length || (opts.version === 'standard' ? Math.max(game.players.default, s.columns) : s.columns)) },
        (_, p) => names[p] ?? '',
      );
  const columns = heads.length;
  const layout = layoutSheet(game.sheet, opts.scores ?? {}, columns);
  const phased = game.sheet.engine === 'round-totals' && !!game.sheet.phases;

  // Rows: header row, then each group's label, rows and computed rows.
  type Row = { kind: 'head' | 'group' | 'entry' | 'computed'; label: string; hint?: string; id?: string; strong?: boolean; values?: number[] };
  const rows: Row[] = [{ kind: 'head', label: tally ? (opts.cardName?.trim() ? `Name: ${opts.cardName.trim()}` : 'Name') : 'Players' }];
  for (const g of layout.groups) {
    if (g.label) rows.push({ kind: 'group', label: g.label });
    for (const r of g.rows) rows.push({ kind: 'entry', label: r.label, hint: r.hint, id: r.id });
    for (const c of g.computed) rows.push({ kind: 'computed', label: c.label, strong: c.strong, values: c.values });
  }
  if (tally) rows.push({ kind: 'computed', label: 'Night total', strong: true, values: [] });

  const bandH = s.band * 2.1;
  const footH = s.label * 2;
  const weightOf = (r: Row) => (r.kind === 'group' ? 0.75 : 1);
  const units = rows.reduce((a, r) => a + weightOf(r), 0);
  const rowH = Math.min(s.maxRow, (box.h - bandH - footH) / units);
  const labelW = Math.max(box.w * 0.34, Math.min(box.w * 0.42, 150));
  const colW = (box.w - labelW) / columns;
  const rule = 0.5;
  const ruleColor = '#9fb3a8';

  // Header band
  ops.push({ kind: 'rect', x: box.x, y: box.y, w: box.w, h: bandH, fill: INK });
  ops.push({ kind: 'text', x: box.x + 10, y: box.y + bandH * 0.66, text: game.name, size: s.band, weight: 'bold', color: PAPER_WHITE, align: 'left' });
  ops.push({ kind: 'text', x: box.x + box.w - 10, y: box.y + bandH * 0.64, text: 'ScoreSheetSquare.com', size: s.band * 0.55, weight: 'regular', color: PAPER_WHITE, align: 'right' });

  let y = box.y + bandH;
  const tableTop = y;
  for (const r of rows) {
    const h = rowH * weightOf(r);
    const base = y + h / 2 + s.label * 0.34;
    if (r.kind === 'head') {
      ops.push({ kind: 'text', x: box.x + 4, y: base, text: r.label, size: s.label * 0.85, weight: 'regular', color: INK_SOFT, align: 'left' });
      for (let p = 0; p < columns; p++) {
        const name = heads[p];
        if (name.trim()) {
          const cx = box.x + labelW + colW * p + colW / 2;
          ops.push({ kind: 'text', x: cx, y: base, text: fit(name, s.label, 'bold', colW - 6, measure), size: s.label, weight: 'bold', color: GRAPHITE, align: 'center' });
        }
      }
    } else if (r.kind === 'group') {
      ops.push({ kind: 'text', x: box.x + 4, y: y + h - 4, text: r.label, size: s.label * 0.9, weight: 'bold', color: INK, align: 'left' });
    } else {
      const showHint = r.hint && s.hint > 0 && h >= s.label + s.hint + 6;
      const labelY = showHint ? y + h / 2 - 1 : base;
      ops.push({ kind: 'text', x: box.x + 4, y: labelY, text: fit(r.label, s.label, r.strong ? 'bold' : 'regular', labelW - 8, measure), size: s.label, weight: r.strong ? 'bold' : 'regular', color: INK, align: 'left' });
      if (showHint) ops.push({ kind: 'text', x: box.x + 4, y: labelY + s.hint + 2, text: fit(r.hint!, s.hint, 'regular', labelW - 8, measure), size: s.hint, weight: 'regular', color: INK_SOFT, align: 'left' });
      for (let p = 0; p < columns; p++) {
        const value = r.kind === 'computed' ? (opts.scores ? r.values![p] : null) : opts.scores?.[r.id!]?.[p] ?? null;
        if (value !== null && value !== undefined) {
          const cx = box.x + labelW + colW * p + colW / 2;
          ops.push({ kind: 'text', x: cx, y: base + (s.score - s.label) * 0.3, text: String(value), size: s.score, weight: r.strong ? 'bold' : 'regular', color: GRAPHITE, align: 'center' });
        }
        // Phase 10: a tick box in the corner of every round cell, ticked when the phase was made.
        if (phased && r.kind === 'entry') {
          const size = Math.min(9, h * 0.32);
          const bx = box.x + labelW + colW * p + 3;
          const made = opts.scores?.[`phase:${r.id}`]?.[p] === 1;
          ops.push({ kind: 'line', x1: bx, y1: y + 3, x2: bx + size, y2: y + 3, width: 0.6, color: INK_SOFT });
          ops.push({ kind: 'line', x1: bx + size, y1: y + 3, x2: bx + size, y2: y + 3 + size, width: 0.6, color: INK_SOFT });
          ops.push({ kind: 'line', x1: bx + size, y1: y + 3 + size, x2: bx, y2: y + 3 + size, width: 0.6, color: INK_SOFT });
          ops.push({ kind: 'line', x1: bx, y1: y + 3 + size, x2: bx, y2: y + 3, width: 0.6, color: INK_SOFT });
          if (made) {
            ops.push({ kind: 'line', x1: bx + size * 0.2, y1: y + 3 + size * 0.55, x2: bx + size * 0.42, y2: y + 3 + size * 0.8, width: 1, color: GRAPHITE });
            ops.push({ kind: 'line', x1: bx + size * 0.42, y1: y + 3 + size * 0.8, x2: bx + size * 0.85, y2: y + 3 + size * 0.2, width: 1, color: GRAPHITE });
          }
        }
      }
    }
    y += h;
    // Rule under the row: heavier under computed rows, none under group labels.
    if (r.kind !== 'group') {
      const heavy = r.kind === 'computed' || r.kind === 'head';
      ops.push({ kind: 'line', x1: box.x, y1: y, x2: box.x + box.w, y2: y, width: heavy ? 1.2 : rule, color: heavy ? INK : ruleColor });
    }
  }
  // Column rules from the header row down.
  for (let p = 0; p < columns; p++) {
    const x = box.x + labelW + colW * p;
    ops.push({ kind: 'line', x1: x, y1: tableTop, x2: x, y2: y, width: rule, color: ruleColor });
  }

  if (phased) {
    ops.push({ kind: 'text', x: box.x, y: y + footH * 0.8 + s.label * 0.95, text: 'Tick the box in a round when the phase is made.', size: s.label * 0.75, weight: 'regular', color: INK_SOFT, align: 'left' });
  }
  if (opts.siteUrl) {
    ops.push({ kind: 'text', x: box.x, y: y + footH * 0.8, text: `Free printable and online scorekeeper: ${opts.siteUrl}`, size: s.label * 0.75, weight: 'regular', color: INK_SOFT, align: 'left' });
  }
  return ops;
}

/** Two half-width sheets side by side on a landscape page, cut down the middle. */
function twoUp(paper: Paper) {
  const [pw, ph] = PAPERS[paper];
  const width = ph;
  const height = pw;
  const w = (width - MARGIN * 3) / 2;
  const h = height - MARGIN * 2;
  return { width, height, left: { x: MARGIN, y: MARGIN, w, h }, right: { x: MARGIN * 2 + w, y: MARGIN, w, h } };
}

export function sheetPages(game: SheetGame, opts: SheetOptions, measure: Measure): Page[] {
  const [pw, ph] = PAPERS[opts.paper];
  const full = { x: MARGIN, y: MARGIN, w: pw - MARGIN * 2, h: ph - MARGIN * 2 };

  // Tally games with names: one named card per player, two to a page (one per page in large print).
  if (game.sheet.engine === 'tally' && opts.players?.length) {
    const card = (cardName: string, box: typeof full, version: Version) =>
      drawSheet(game, box, { ...opts, version, players: undefined, cardName }, measure);
    if (opts.version === 'large-print') {
      return opts.players.map((name) => ({ width: pw, height: ph, ops: card(name, full, 'large-print') }));
    }
    const pages: Page[] = [];
    const { width, height, left, right } = twoUp(opts.paper);
    for (let i = 0; i < opts.players.length; i += 2) {
      const second = opts.players[i + 1];
      pages.push({
        width,
        height,
        ops: [...card(opts.players[i], left, '2-per-page'), ...(second === undefined ? [] : card(second, right, '2-per-page'))],
      });
    }
    return pages;
  }

  if (opts.version === '2-per-page') {
    const { width, height, left, right } = twoUp(opts.paper);
    return [{ width, height, ops: [...drawSheet(game, left, opts, measure), ...drawSheet(game, right, opts, measure)] }];
  }
  return [{ width: pw, height: ph, ops: drawSheet(game, full, opts, measure) }];
}

export function pdfFileName(slug: string, version: Version, paper: Paper): string {
  return `${slug}${version === 'standard' ? '' : `-${version}`}${paper === 'a4' ? '-a4' : ''}.pdf`;
}

/** Renders a page as an SVG string (used for the preview PNG). */
export function pageToSvg(page: Page, scale = 1): string {
  const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const anchor = { left: 'start', center: 'middle', right: 'end' } as const;
  const body = page.ops
    .map((op) => {
      if (op.kind === 'rect') return `<rect x="${op.x}" y="${op.y}" width="${op.w}" height="${op.h}" fill="${op.fill}"/>`;
      if (op.kind === 'line') return `<line x1="${op.x1}" y1="${op.y1}" x2="${op.x2}" y2="${op.y2}" stroke="${op.color}" stroke-width="${op.width}"/>`;
      return `<text x="${op.x}" y="${op.y}" font-family="STIX Two Text" font-size="${op.size}" font-weight="${op.weight === 'bold' ? 600 : 400}" fill="${op.color}" text-anchor="${anchor[op.align]}">${esc(op.text)}</text>`;
    })
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${page.width * scale}" height="${page.height * scale}" viewBox="0 0 ${page.width} ${page.height}"><rect width="100%" height="100%" fill="#ffffff"/>${body}</svg>`;
}
