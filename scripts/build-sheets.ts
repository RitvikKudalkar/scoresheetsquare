// Builds every live game's PDFs (3 versions × Letter and A4) and its preview PNG from the game files.
// Runs before `astro build`; output goes to public/pdf and public/images (both gitignored).
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import { pageToSvg, pdfFileName, sheetPages, type Page, type Paper, type Version } from '../src/lib/print-layout.ts';
import { measureWith, sheetPdf } from '../src/lib/print-pdf.ts';
import type { SheetGame } from '../src/lib/sheet.ts';
import { catalogue } from '../src/lib/catalogue.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const gamesDir = join(root, 'src/content/games');
const pdfDir = join(root, 'public/pdf');
const imageDir = join(root, 'public/images/sheets');
const ogDir = join(root, 'public/images/og');
const ogDefault = join(root, 'public/images/og-default.png');
const fontFiles = [join(root, 'public/fonts/STIXTwoText-Regular.ttf'), join(root, 'public/fonts/STIXTwoText-SemiBold.ttf')];

const versions: Version[] = ['standard', 'large-print', '2-per-page'];
const papers: Paper[] = ['letter', 'a4'];
const versionTitle: Record<Version, string> = { standard: '', 'large-print': ' (Large Print)', '2-per-page': ' (2 per Page)' };

type GameFile = SheetGame & { status: 'live' | 'draft' };

const fonts = { regular: await readFile(fontFiles[0]), bold: await readFile(fontFiles[1]) };
await mkdir(pdfDir, { recursive: true });
await mkdir(imageDir, { recursive: true });
await mkdir(ogDir, { recursive: true });

// The blank sheet at /printable-score-sheet ships ready-made PDFs too, with 12 rounds.
const blankSheet: GameFile = {
  slug: 'printable-score-sheet',
  name: 'Score sheet',
  players: { min: 2, max: 8, default: 6 },
  winCondition: 'highest',
  sheet: { engine: 'round-totals', rounds: 12 },
  status: 'live',
};

const files = (await readdir(gamesDir)).filter((f) => f.endsWith('.json'));
const games: GameFile[] = [blankSheet];
for (const file of files) games.push(JSON.parse(await readFile(join(gamesDir, file), 'utf8')) as GameFile);

// Every game listed in the catalogue must have a live page, so no list ever shows "Sheet coming soon".
const liveSlugs = new Set(games.filter((g) => g.status === 'live').map((g) => g.slug));
const missing = catalogue.filter((e) => !liveSlugs.has(e.slug)).map((e) => e.slug);
if (missing.length) {
  console.error(`sheets: catalogue entries without a live game file: ${missing.join(', ')}`);
  process.exit(1);
}

let count = 0;
for (const game of games) {
  if (game.status !== 'live') continue;
  const siteUrl = `scoresheetsquare.com/${game.slug}`;

  for (const version of versions) {
    for (const paper of papers) {
      const title = game === blankSheet ? `Printable Score Sheet${versionTitle[version]}` : `${game.name} Score Sheet${versionTitle[version]}`;
      const bytes = await sheetPdf(game, { version, paper, siteUrl }, fonts, title);
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

  // Share image: the same sheet, tilted on the stage colour and cropped by the bottom edge, 1200×630.
  const ogTitle = game === blankSheet ? 'Printable score sheet' : game.name;
  await writeFile(join(ogDir, `${game.slug}.png`), ogPng(page, ogTitle, 'Free printable score sheet'));

  // The default share image for every page without its own is drawn once and committed.
  if (game === blankSheet && !existsSync(ogDefault)) {
    await writeFile(ogDefault, ogPng(page, 'Free printable score sheets', 'and online scorekeepers for dice, card and tile games'));
  }
  console.log(`sheets: ${game.slug}`);
}
console.log(`sheets: ${count} PDFs written`);

function ogPng(page: Page, title: string, sub: string): Uint8Array {
  return new Resvg(ogSvg(page, title, sub), { font: { fontFiles, loadSystemFonts: false, defaultFontFamily: 'STIX Two Text' } })
    .render()
    .asPng();
}

/** Splits text into lines of at most `max` characters, at word breaks. */
function wrap(text: string, max: number): string[] {
  const lines: string[] = [];
  for (const word of text.split(' ')) {
    const last = lines.at(-1);
    if (last !== undefined && `${last} ${word}`.length <= max) lines[lines.length - 1] = `${last} ${word}`;
    else lines.push(word);
  }
  return lines;
}

// DESIGN.md tokens: pad stage ground, pad ink type, the sheet at a slight angle like paper on a table.
function ogSvg(page: Page, title: string, sub: string): string {
  const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const ink = '#0F4A35';
  const titleLines = wrap(title, 15);
  const size = titleLines.length > 2 ? 60 : 76;
  const subLines = wrap(sub, 30);
  const titleTop = 150;
  const titleText = titleLines
    .map((l, i) => `<text x="64" y="${titleTop + i * size * 1.08}" font-size="${size}" letter-spacing="-1.8" fill="${ink}">${esc(l)}</text>`)
    .join('');
  const subTop = titleTop + (titleLines.length - 1) * size * 1.08 + 70;
  const subText = subLines.map((l, i) => `<text x="64" y="${subTop + i * 44}" font-size="34" fill="${ink}">${esc(l)}</text>`).join('');
  const scale = 560 / page.width;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" font-family="STIX Two Text">
<rect width="1200" height="630" fill="#E2E7D3"/>
<g transform="translate(610 70) rotate(-4) scale(${scale})">${pageToSvg(page).replace('fill="#ffffff"', 'fill="#FBFCF6"')}</g>
${titleText}${subText}
<rect x="64" y="540" width="56" height="3" fill="${ink}"/>
<text x="64" y="582" font-size="26" fill="${ink}">ScoreSheetSquare.com</text>
</svg>`;
}
