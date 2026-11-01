// Browser side of the PDF pipeline. pdf-lib and the fonts load only when someone asks for a PDF.
import type { Paper, SheetOptions } from './print-layout.ts';
import type { SheetGame } from './sheet.ts';

/** US, Canada, Mexico and the Philippines use Letter; everyone else A4. */
export function localPaper(): Paper {
  const region = (navigator.language.split('-')[1] ?? '').toUpperCase();
  return region === '' || ['US', 'CA', 'MX', 'PH'].includes(region) ? 'letter' : 'a4';
}

export async function downloadSheetPdf(game: SheetGame, opts: SheetOptions, fileName: string): Promise<void> {
  const [{ sheetPdf }, regular, bold] = await Promise.all([
    import('./print-pdf.ts'),
    fetch('/fonts/STIXTwoText-Regular.ttf').then((r) => r.arrayBuffer()),
    fetch('/fonts/STIXTwoText-SemiBold.ttf').then((r) => r.arrayBuffer()),
  ]);
  const bytes = await sheetPdf(game, opts, { regular, bold }, `${game.name} Score Sheet`);
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: fileName });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
