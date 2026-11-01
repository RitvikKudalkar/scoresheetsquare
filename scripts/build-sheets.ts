// Builds every live game's PDFs (3 versions × Letter and A4) and its preview PNG from the game files.
// Runs before `astro build`; output goes to public/pdf and public/images (both gitignored).
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import { pageToSvg, pdfFileName, sheetPages, type Paper, type Version } from '../src/lib/print-layout.ts';
import { measureWith, sheetPdf } from '../src/lib/print-pdf.ts';
import type { SheetGame } from '../src/lib/sheet.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const gamesDir = join(root, 'src/content/games');
const pdfDir = join(root, 'public/pdf');
const imageDir = join(root, 'public/images/sheets');
const fontFiles = [join(root, 'public/fonts/STIXTwoText-Regular.ttf'), join(root, 'public/fonts/STIXTwoText-SemiBold.ttf')];

const versions: Version[] = ['standard', 'large-print', '2-per-page'];
const papers: Paper[] = ['letter', 'a4'];
const versionTitle: Record<Version, string> = { standard: '', 'large-print': ' (Large Print)', '2-per-page': ' (2 per Page)' };

type GameFile = SheetGame & { status: 'live' | 'draft' };

const fonts = { regular: await readFile(fontFiles[0]), bold: await readFile(fontFiles[1]) };
await mkdir(pdfDir, { recursive: true });
await mkdir(imageDir, { recursive: true });

const files = (await readdir(gamesDir)).filter((f) => f.endsWith('.json'));
let count = 0;
for (const file of files) {
  const game = JSON.parse(await readFile(join(gamesDir, file), 'utf8')) as GameFile;
  if (game.status !== 'live') continue;
  const siteUrl = `scoresheetsquare.com/${game.slug}`;

  for (const version of versions) {
    for (const paper of papers) {
      const bytes = await sheetPdf(game, { version, paper, siteUrl }, fonts, `${game.name} Score Sheet${versionTitle[version]}`);
      await writeFile(join(pdfDir, pdfFileName(game.slug, version, paper)), bytes);
      count++;
    }
  }

  // Preview: page 1 of the Standard Letter sheet, 1000px wide.
  const { measure } = await measureWith(fonts);
  const [page] = sheetPages(game, { version: 'standard', paper: 'letter', siteUrl }, measure);
  const png = new Resvg(pageToSvg(page), {
    fitTo: { mode: 'width', value: 1000 },
    font: { fontFiles, loadSystemFonts: false, defaultFontFamily: 'STIX Two Text' },
  })
    .render()
    .asPng();
  await writeFile(join(imageDir, `${game.slug}.png`), png);
  console.log(`sheets: ${game.slug}`);
}
console.log(`sheets: ${count} PDFs written`);
