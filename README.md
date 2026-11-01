# ScoreSheetSquare

Free printable score sheets and an online scorekeeper for game night. Astro + TypeScript, React islands, Tailwind 4, static build for Cloudflare Pages.

- [docs/functional-plan.md](docs/functional-plan.md): routes, page anatomy, scoring engines, SEO and ads rules
- [PRODUCT.md](PRODUCT.md): who it is for and what must stay true
- [DESIGN.md](DESIGN.md): the visual system (tokens in its frontmatter mirror `src/styles/global.css`)

## Commands

```sh
npm install
npm run dev      # builds sheets, then http://localhost:4321
npm run sheets   # PDFs + preview PNGs only (public/pdf, public/images/sheets; gitignored)
npm run build    # sheets + astro check + static build to dist/
```

## Analytics and ads

Copy `.env.example` to `.env` (or set the same variables in Cloudflare Pages):

- `PUBLIC_GA_ID`: GA4 measurement ID. When it is set, the build adds gtag with Consent Mode v2 (UK, EEA and Switzerland start denied) and sends `pdf_download`, `custom_pdf`, `print_game`, `game_started` and `game_finished` events.
- `PUBLIC_ADSENSE_CLIENT`: AdSense publisher ID, after approval. It loads the AdSense script; turn on **Privacy & messaging → European regulations** in AdSense for the Google-certified consent message, and the footer's "Privacy settings" link appears by itself. Add `public/ads.txt` at the same time.

## Where things live

| Path | What |
|---|---|
| `src/content/games/*.json` | One file per game, validated by `src/content.config.ts`. `status: "live"` builds the page. |
| `src/lib/sheet.ts` | Scoring maths shared by every sheet (category, round totals, running turns). |
| `src/components/ScoreSheet.tsx` | The sheet and scorekeeper island (demo and live modes). |
| `src/lib/print-layout.ts` | Paper sheet layout shared by the build PDFs, previews, Customise and Print this game. |
| `scripts/build-sheets.ts` | Writes every live game's PDFs (3 versions × Letter/A4) and preview PNG. |
| `public/fonts/` | STIX Two Text TTFs (OFL) used to embed fonts in PDFs. |
| `src/components/Logo.astro`, `public/favicon.svg` | The logo; `node scripts/build-icons.ts` renders the PNG app icons. |
| `src/components/TallySheet.tsx` | The Bunco tally engine. |
| `src/pages/index.astro` | Home: split stage with the switchable demo sheet. |
| `src/pages/[slug].astro` | Game page, seven sections in plan order. |
| `src/pages/printable-score-sheet.astro` | Blank sheet tool (settings + live sheet + ready-made PDFs). |
| `src/pages/{dice,card,board}-games.astro`, `all-games.astro` | Category pages and the filterable A–Z index. |
| `src/pages/{about,contact,privacy,terms}.astro`, `404.astro` | Trust and legal pages. Fill in `src/lib/site.ts` before launch. |
| `public/images/archive/` | Public-domain pictures; credits are in the footer and `assets/credits.json`. |
