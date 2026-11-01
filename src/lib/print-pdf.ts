// pdf-lib backend for print-layout. Runs in Node (build script) and in the browser (custom PDF, Print this game).
import { PDFDocument, rgb, type PDFFont } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { sheetPages, type Measure, type Page, type SheetOptions } from './print-layout.ts';
import type { SheetGame } from './sheet.ts';

export type FontBytes = { regular: Uint8Array | ArrayBuffer; bold: Uint8Array | ArrayBuffer };

const toRgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};

export async function measureWith(fonts: FontBytes): Promise<{ doc: PDFDocument; measure: Measure; regular: PDFFont; bold: PDFFont }> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const regular = await doc.embedFont(fonts.regular, { subset: true });
  const bold = await doc.embedFont(fonts.bold, { subset: true });
  const measure: Measure = (text, size, weight) => (weight === 'bold' ? bold : regular).widthOfTextAtSize(text, size);
  return { doc, measure, regular, bold };
}

export async function sheetPdf(game: SheetGame, opts: SheetOptions, fonts: FontBytes, title: string): Promise<Uint8Array> {
  const { doc, measure, regular, bold } = await measureWith(fonts);
  doc.setTitle(title);
  doc.setAuthor('ScoreSheetSquare.com');
  doc.setCreator('ScoreSheetSquare.com');
  doc.setProducer('ScoreSheetSquare.com');
  // Fixed date keeps rebuilt PDFs byte-identical when nothing changed.
  doc.setCreationDate(new Date('2026-01-01T00:00:00Z'));
  doc.setModificationDate(new Date('2026-01-01T00:00:00Z'));

  for (const p of sheetPages(game, opts, measure)) drawPage(doc, p, regular, bold);
  return doc.save();
}

function drawPage(doc: PDFDocument, p: Page, regular: PDFFont, bold: PDFFont) {
  const page = doc.addPage([p.width, p.height]);
  const flip = (y: number) => p.height - y;
  for (const op of p.ops) {
    if (op.kind === 'rect') {
      page.drawRectangle({ x: op.x, y: flip(op.y + op.h), width: op.w, height: op.h, color: toRgb(op.fill) });
    } else if (op.kind === 'line') {
      page.drawLine({ start: { x: op.x1, y: flip(op.y1) }, end: { x: op.x2, y: flip(op.y2) }, thickness: op.width, color: toRgb(op.color) });
    } else {
      const font = op.weight === 'bold' ? bold : regular;
      const w = font.widthOfTextAtSize(op.text, op.size);
      const x = op.align === 'left' ? op.x : op.align === 'center' ? op.x - w / 2 : op.x - w;
      page.drawText(op.text, { x, y: flip(op.y), size: op.size, font, color: toRgb(op.color) });
    }
  }
}
