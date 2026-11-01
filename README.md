# ScoreSheetSquare

Free printable score sheets and an online scorekeeper for game night. Astro + TypeScript, React islands, Tailwind 4, static build for Cloudflare Pages.

- [docs/functional-plan.md](docs/functional-plan.md): routes, page anatomy, scoring engines, SEO and ads rules
- [PRODUCT.md](PRODUCT.md): who it is for and what must stay true
- [DESIGN.md](DESIGN.md): the visual system (tokens in its frontmatter mirror `src/styles/global.css`)

## Commands

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # astro check + static build to dist/
```

## Where things live

| Path | What |
|---|---|
| `src/content/games/*.json` | One file per game, validated by `src/content.config.ts`. `status: "live"` builds the page. |
| `src/lib/sheet.ts` | Scoring maths shared by every sheet (category, round totals, running turns). |
| `src/components/ScoreSheet.tsx` | The sheet and scorekeeper island (demo and live modes). |
| `src/pages/index.astro` | Home: split stage with the switchable demo sheet. |
| `src/pages/[slug].astro` | Game page, seven sections in plan order. |
| `public/images/archive/` | Public-domain pictures; credits are in the footer and `assets/credits.json`. |
