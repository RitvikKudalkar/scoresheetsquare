// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';

// lastmod for the sitemap: the date of the last commit that changed a page's own content, so a
// resubmitted sitemap tells search engines which pages changed. Game pages take it from their game
// file, other pages from their .astro file, and list pages also from the catalogue they render.
const gamesDir = 'src/content/games';
const gameFiles = Object.fromEntries(
  readdirSync(gamesDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => [JSON.parse(readFileSync(`${gamesDir}/${f}`, 'utf8')).slug, `${gamesDir}/${f}`]),
);
const listPages = new Set(['/', '/all-games', '/dice-games', '/card-games', '/board-games']);

/** ISO date of the last commit touching any of the files, or undefined if git has no history for them.
 * @param {string[]} files */
function lastCommit(files) {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cI', '--', ...files], { encoding: 'utf8' }).trim();
    return out || undefined;
  } catch {
    return undefined;
  }
}

/** @param {string} path */
function sourcesFor(path) {
  if (gameFiles[path.slice(1)]) return [gameFiles[path.slice(1)]];
  const page = `src/pages/${path === '/' ? 'index' : path.slice(1)}.astro`;
  const files = existsSync(page) ? [page] : [];
  if (listPages.has(path)) files.push('src/lib/catalogue.ts', 'src/components/CategoryPage.astro');
  return files;
}

export default defineConfig({
  site: 'https://scoresheetsquare.com',
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [
    react(),
    sitemap({
      filter: (page) => !page.includes('/404'),
      serialize(item) {
        const path = new URL(item.url).pathname.replace(/\/$/, '') || '/';
        const files = sourcesFor(path);
        const lastmod = files.length ? lastCommit(files) : undefined;
        return lastmod ? { ...item, lastmod } : item;
      },
    }),
  ],
  vite: { plugins: [tailwindcss()] },
});
