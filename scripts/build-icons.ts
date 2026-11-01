// One-off: renders the logo mark to PNG app icons. Run with `node scripts/build-icons.ts` after changing public/favicon.svg.
import { readFile, writeFile } from 'node:fs/promises';
import { Resvg } from '@resvg/resvg-js';

const mark = (await readFile('public/favicon.svg', 'utf8')).trim();
// App icons get the pad-paper ground with the mark inset, so the square reads on any home screen.
const padded = (size: number) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 40 40"><rect width="40" height="40" fill="#eef1e4"/><g transform="translate(6 6) scale(0.7)">${mark.replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g></svg>`;

for (const [name, size] of [['apple-touch-icon.png', 180], ['icon-192.png', 192], ['icon-512.png', 512]] as const) {
  await writeFile(`public/${name}`, new Resvg(padded(size)).render().asPng());
}
console.log('icons written');
