# Score Sheets Site – Functional Plan

2026-11-01 · Ritvik

A US/EU game-night site where every popular game gets one page with a free printable score sheet PDF and an online scorekeeper, targeting low-competition "<game> score sheet" keywords that AI Overview can't answer. Domain: ScoreSheetSquare.com. Design is planned separately.

## Goals and scope

The site wins by giving people what they actually search for: a sheet to print, plus a better online version for those at the table with a phone.

- **Audience:** US/UK/EU families, game groups, bunco and card clubs, older players ("large print" searches).
- **Revenue:** display ads (AdSense first). Long sessions during a game night mean more ad views per visit.
- **Search target:** one page per game for "<game> score sheet" and its printable, pdf, large print and online variants. Checked keywords so far: yahtzee and farkle (>1,000/month, Easy), phase 10 and mexican train (>100, Easy).
- **Edge over competitors:** they offer a single PDF. We offer three PDF versions, a customisable PDF and a live scorekeeper, all on one page.
- **Out of scope for v1:** accounts, multiplayer sync across phones, standalone "how to play" pages (AI Overview answers rules), head terms like "dice roller" and "random team generator" (Hard, or Google has a widget), game logos or box art (trademarks).

## Site map

About 75 routes in a flat structure: game pages sit at the root with their keyword as the slug, and category pages group them. Phase 1 launches 17 routes; the rest arrive over three months. Check each slug's exact keyword and volume in Ahrefs before building it; slugs marked * are best guesses.

| Route | Page | Target keyword | Group | Phase |
|---|---|---|---|---|
| / | Home | game score sheets, printable score sheets | Hub | 1 |
| /all-games | A–Z index of every game | free printable score sheets | Hub | 1 |
| /printable-score-sheet | Generic sheet, 2–8 players, custom rounds | printable score sheet, blank score sheet | Tool | 1 |
| /yahtzee-score-sheet | Yahtzee | yahtzee score sheet | Dice | 1 |
| /farkle-score-sheet | Farkle (also "10000") | farkle score sheet | Dice | 1 |
| /bunco-score-sheet | Bunco, with tally and table sheets | bunco score sheet, bunco tally sheet | Dice | 1 |
| /phase-10-score-sheet | Phase 10, with phase tracking | phase 10 score sheet | Card | 1 |
| /five-crowns-score-sheet | Five Crowns | five crowns score sheet | Card | 1 |
| /hand-and-foot-score-sheet | Hand and Foot | hand and foot score sheet | Card | 1 |
| /skyjo-score-sheet | Skyjo | skyjo score sheet* | Card | 1 |
| /uno-score-sheet | Uno | uno score sheet* | Card | 1 |
| /mexican-train-score-sheet | Mexican Train dominoes | mexican train score sheet | Tile | 1 |
| /dice-games | Category: dice games | dice game score sheets | Category | 1 |
| /card-games | Category: card games | card game score sheets | Category | 1 |
| /board-games | Category: board and tile games | board game score sheets | Category | 1 |
| /about, /contact, /privacy, /terms | Legal and trust pages | — | Legal | 1 |
| /triple-yahtzee-score-sheet | Triple Yahtzee | triple yahtzee score sheet | Dice | 2 |
| /qwixx-score-sheet | Qwixx | qwixx score sheet | Dice | 2 |
| /kismet-score-sheet | Kismet | kismet score sheet | Dice | 2 |
| /ship-captain-crew-score-sheet | Ship Captain Crew | ship captain crew score sheet* | Dice | 2 |
| /tenzi-score-sheet | Tenzi | tenzi score sheet* | Dice | 2 |
| /skip-bo-score-sheet | Skip-Bo | skip bo score sheet | Card | 2 |
| /rummy-500-score-sheet | Rummy 500 | rummy 500 score sheet | Card | 2 |
| /gin-rummy-score-sheet | Gin Rummy | gin rummy score sheet | Card | 2 |
| /golf-card-game-score-sheet | Golf card game | golf card game score sheet | Card | 2 |
| /spades-score-sheet | Spades (bids, bags) | spades score sheet | Card | 2 |
| /hearts-score-sheet | Hearts | hearts score sheet | Card | 2 |
| /euchre-score-sheet | Euchre (teams) | euchre score sheet | Card | 2 |
| /canasta-score-sheet | Canasta | canasta score sheet | Card | 2 |
| /pinochle-score-sheet | Pinochle | pinochle score sheet | Card | 2 |
| /shanghai-rummy-score-sheet | Shanghai / contract rummy | shanghai rummy score sheet | Card | 2 |
| /oh-hell-score-sheet | Oh Hell / Up and Down the River | oh hell score sheet | Card | 2 |
| /3-13-score-sheet | 3-13 card game | 3 13 score sheet* | Card | 2 |
| /wizard-score-sheet | Wizard | wizard score sheet | Card | 2 |
| /dutch-blitz-score-sheet | Dutch Blitz | dutch blitz score sheet | Card | 2 |
| /nertz-score-sheet | Nertz | nertz score sheet* | Card | 2 |
| /chicken-foot-score-sheet | Chicken Foot dominoes | chicken foot score sheet | Tile | 3 |
| /rummikub-score-sheet | Rummikub | rummikub score sheet | Tile | 3 |
| /dominoes-score-sheet | Dominoes (generic) | dominoes score sheet | Tile | 3 |
| /scrabble-score-keeper | Scrabble, with word-score helper | scrabble score keeper, scrabble score sheet | Board | 3 |
| /ticket-to-ride-score-calculator | Ticket to Ride | ticket to ride score calculator | Board | 3 |
| /catan-score-tracker | Catan victory points | catan score tracker* | Board | 3 |
| /wingspan-score-sheet | Wingspan | wingspan score sheet | Board | 3 |
| /7-wonders-score-sheet | 7 Wonders | 7 wonders score sheet | Board | 3 |
| /carcassonne-score-tracker | Carcassonne | carcassonne score tracker* | Board | 3 |
| /azul-score-sheet | Azul | azul score sheet* | Board | 3 |
| /terraforming-mars-score-sheet | Terraforming Mars | terraforming mars score sheet* | Board | 3 |
| /lawn-and-bar-games | Category: lawn, bar and sports | — | Category | 3 |
| /cribbage-board | Online cribbage board + printable | cribbage board online | Bar | 3 |
| /darts-scoreboard | Darts: cricket and 501 | darts scoreboard, cricket darts score sheet | Bar | 3 |
| /bowling-score-sheet | Bowling sheet + frame calculator | bowling score sheet, bowling score calculator | Bar | 3 |
| /cornhole-scoreboard | Cornhole | cornhole scoreboard | Lawn | 3 |
| /pickleball-score-keeper | Pickleball | pickleball score keeper | Lawn | 3 |
| /ping-pong-scoreboard | Table tennis | ping pong scoreboard | Bar | 3 |
| /mini-golf-scorecard | Mini golf | mini golf scorecard | Lawn | 3 |
| /golf-scorecard | Golf scorecard printable | golf scorecard printable | Lawn | 3 |
| /bocce-score-sheet | Bocce | bocce score sheet* | Lawn | 3 |
| /horseshoes-score-sheet | Horseshoes | horseshoes score sheet* | Lawn | 3 |
| /kubb-score-sheet | Kubb | kubb score sheet* | Lawn | 3 |
| /game-night-tools | Category: tools | game night tools | Category | 4 |
| /chess-clock | Online chess clock | chess clock online | Tool | 4 |
| /turn-timer | Board game turn timer | board game timer | Tool | 4 |
| /trivia-scoreboard | Trivia / quiz scoreboard for teams | trivia scoreboard | Tool | 4 |
| /game-show-buzzer | Buzzer for 2–8 players | game show buzzer | Tool | 4 |
| /sand-timer | 1, 2 and 3-minute game timers | 1 minute sand timer | Tool | 4 |
| /dnd-dice-roller | D&D dice roller (d4–d20, modifiers) | dice roller dnd | Generator | 4 |
| /nfl-random-team-generator | Random NFL team picker | nfl random team generator | Generator | 4 |
| /mlb-random-team-generator | Random MLB team picker | mlb random team generator | Generator | 4 |
| /nhl-random-team-generator | Random NHL team picker | nhl random team generator | Generator | 4 |
| /random-team-generator-with-names | Split names into teams | random team generator with names | Generator | 4 |
| /scattergories-list-generator | Category list generator | scattergories list generator | Generator | 4 |

Also served: /404, /sitemap-index.xml (generated), /robots.txt, /ads.txt (after AdSense approval), /pdf/* and /images/* (see Printable PDFs).

## Game page anatomy

Every game page has the same seven sections in this order, so the tool and the download sit above the fold and the text below makes the page worth ranking (800–1,200 words).

1. **Header:** H1 "<Game> Score Sheet – Free Printable PDF & Online Scorekeeper", a one-line intro, breadcrumb (Home › Card games › Phase 10).
2. **Download block:** preview image of the sheet plus buttons for Standard, Large print and 2-per-page PDFs, and a "Customise" option (player names, number of players). Downloads start instantly, with no email gate or countdown.
3. **Online scorekeeper:** the live tool (spec below).
4. **Scoring reference:** a table of what scores what (e.g. Farkle combinations, Phase 10's ten phases, Yahtzee categories and the 35-point upper bonus). This is the content AI Overview would otherwise summarise, kept short and visual.
5. **How to use this sheet:** 2–3 short paragraphs plus a filled-in example round as a table.
6. **FAQs:** 5–8 questions drawn from the keyword tool's Questions tab ("how many points to win farkle", "what is a bonus in yahtzee"), with FAQPage schema.
7. **Related games:** 4–6 linked cards (same category or similar players), then the footer with the "not affiliated" trademark line.

Rules for every page:

- One page per game. "Printable", "pdf", "large print" and "online" are buttons and headings on that page, never separate pages.
- Own artwork and colours only: no game logos, box art or trade dress.
- Every page must work fully before it ships: tool tested on a phone, all three PDFs open and print on US Letter and A4.

## Online scorekeeper

One reusable scorekeeper runs every game through six scoring engines, so adding a game is a config file, not new code.

**Core features (all engines)**

- Add, remove, rename and reorder players; min/max players per game (e.g. Yahtzee 1–10).
- Enter scores with a big numeric keypad on mobile; totals update instantly; leader highlighted.
- Undo last entry; edit any past cell.
- Game end detection (target reached, fixed rounds done, lowest wins) with a winner screen and "Play again with same players".
- Auto-save to the browser (localStorage) so a refresh or locked phone doesn't lose the game; "Resume game" banner on return; one saved game per game type.
- Keep screen awake during a game (Wake Lock API), with a toggle.
- "Print this game" exports the current scores onto the PDF layout.
- Works offline once loaded; no account, no data sent to a server.

**Scoring engines**

| Engine | How it scores | Games |
|---|---|---|
| Category sheet | Fixed categories × players; computed rows (subtotal, bonus, grand total); a category can be scratched (0) | Yahtzee, Triple Yahtzee, Kismet, Qwixx (rows), Wingspan, 7 Wonders, Ticket to Ride, Terraforming Mars, Azul |
| Round totals | Rounds × players, sum per player; end by fixed rounds or target; high or low wins; optional per-round note (e.g. phase completed) | Phase 10, Five Crowns (11 rounds), Skyjo, Uno, Hand and Foot, Mexican Train (13 rounds), Rummy 500, Golf, Hearts, Canasta, Rummikub, Skip-Bo, 3-13, Shanghai, Dutch Blitz, Nertz, dominoes, generic sheet |
| Running turns | Each turn adds to a running total; rules like Farkle's minimum to get on the board and a final round once someone passes the target | Farkle, Tenzi, Ship Captain Crew, Catan, Carcassonne |
| Bid and make | Players or teams bid each round; points from bid vs tricks taken; bags/penalties | Spades, Oh Hell, Wizard, Euchre (teams), Pinochle |
| Tables and tallies | Rotating tables, rounds of 21, wins/losses/buncos tallied per player | Bunco |
| Custom board | Game-specific component | Cribbage (peg board), darts (cricket marks, 501 checkout), bowling (frames, strikes/spares), Scrabble (word score with letter and word multipliers), pickleball/ping pong/cornhole (rally scoreboard) |

Game night tools and generators (chess clock, buzzer, team generators) are standalone components, not engines.

## Printable PDFs and preview images

PDFs are generated at build time from each game's data, so every game gets three ready files plus a browser-side customiser, and the HTML page (with ads) stays the page that ranks.

| Version | File path | Details |
|---|---|---|
| Standard | /pdf/<slug>.pdf | One sheet per page, 6 player columns (game-dependent) |
| Large print | /pdf/<slug>-large-print.pdf | Bigger type and cells, fewer players per sheet |
| 2 per page | /pdf/<slug>-2-per-page.pdf | Two half-size sheets to save paper |
| Custom | generated in the browser | Player names, player count, rounds; Letter or A4 |

- **Paper sizes:** every static PDF in both US Letter (default) and A4; the A4 files use a `-a4` suffix. The page picks the default from the visitor's locale.
- **Generation:** a build script draws each sheet from the game file (pdf-lib or similar); the same layout code powers the custom PDF and "Print this game".
- **Indexing:** PDFs are served with `X-Robots-Tag: noindex` so Google sends searchers to the HTML page, not a bare PDF with no ads.
- **Preview images:** a PNG of page 1 per game at /images/<slug>.png, used in the download block, as the OG image and for Google Images and Pinterest. Descriptive file names and alt text ("Printable Farkle score sheet with scoring chart").
- **Print CSS:** printing the HTML page itself prints only the sheet, not the whole page.

## Game data model

Each game is one file in a content collection (e.g. `src/content/games/farkle.ts`); its route, scorekeeper, three PDFs, preview image, schema and related links are all built from it.

| Field | Example (Farkle) | Used for |
|---|---|---|
| slug | farkle-score-sheet | Route, PDF and image names |
| name, aliases | Farkle; 10000, Zilch | H1, page text, search terms |
| category | dice | Category page, breadcrumb |
| keywords | farkle score sheet; farkle score sheet printable | Title, description, headings |
| players | min 2, max 8, default 4 | Scorekeeper and PDF columns |
| engine | running-turns | Which scoring engine |
| engineConfig | target 10,000; minimum to get on board 500; final round on | Engine rules |
| winCondition | highest | End screen |
| pdf | rows 20; show scoring chart: yes | PDF layout |
| scoringReference | combinations and points | Scoring reference table |
| content | intro, how-to-use, example round, FAQs | Page text, FAQPage schema |
| related | yahtzee, bunco, tenzi, qwixx | Related games block |
| phase, status | 1, live | Build order, sitemap |

A schema validator runs at build so a game file with a missing field fails the build instead of shipping a broken page.

## Hub, category and utility pages

These pages route visitors and authority to the game pages; each still needs its own useful content so it isn't thin.

| Page | What it does |
|---|---|
| Home (/) | Search box ("find your game"), popular games grid, category tiles, "Resume your game" if a saved game exists, short intro text |
| A–Z index (/all-games) | Every game alphabetically with player count and engine type; filter by players (2, 3–4, 5+) and category |
| Category pages (/dice-games etc.) | Grid of that category's games, 300–500 words on the category, links to each game |
| Generic sheet (/printable-score-sheet) | Choose players (2–8), rounds (5–20), title; download PDF or keep score online with the round-totals engine |
| Game night tools | Chess clock (two sides, increments), turn timer (per-player countdown, alarm), trivia scoreboard (teams, +/- buttons, fullscreen), buzzer (first-press lockout, sounds), sand timer (1/2/3 min, visual) |
| Generators | D&D dice roller (d4–d100, modifiers, roll history), NFL/MLB/NHL team pickers (current team lists, logos excluded), names-into-teams splitter, Scattergories list generator |
| About, Contact, Privacy, Terms | Who runs the site, contact form or email, cookie and ads disclosure, trademark disclaimer |

## SEO and technical requirements

The stack matches your other sites (Astro, static, Cloudflare Pages), with the canonical and URL rules fixed from day one so the calculheuredetravail bug can't happen here.

- **Stack:** Astro + TypeScript, React islands only for the scorekeeper and tools, Tailwind; static build deployed to Cloudflare Pages.
- **URLs:** `trailingSlash: 'never'` and `build.format: 'file'`; lowercase, hyphenated slugs; 301s in `public/_redirects` if a slug ever changes.
- **Canonicals:** built from `Astro.url.pathname` in the layout, never a hardcoded default; `og:url` and schema `url` use the same value.
- **Sitemap and robots:** `@astrojs/sitemap` generated on every build, excluding legal and 404 pages if desired; robots.txt links it; `*.pages.dev` gets `X-Robots-Tag: noindex`.
- **Structured data:** WebApplication (per game page, its own URL), FAQPage (matching visible FAQs), BreadcrumbList on every non-home page.
- **Titles and descriptions:** unique per page from the game file, title 50–60 characters with the main keyword first.
- **Internal links:** header menu with all categories, related games on every page, category pages linking every game, breadcrumbs.
- **Performance:** static HTML first, scorekeeper hydrates on visible (`client:visible`), images sized and lazy-loaded, Core Web Vitals green on mobile.
- **Accessibility:** keyboard-usable scorekeeper, labelled inputs, readable contrast, works at 200% zoom (matters for the large-print audience).
- **Analytics:** GA4 events for PDF downloads (by version), game started, game finished; Search Console verified at launch.
- **Pre-deploy check:** run the `tool-site-seo-check` skill before every deploy that adds pages.
- **Off-site:** Pinterest account pinning each preview image; later, a few links from board game forums and BoardGameGeek files sections where allowed.

## Ads and AdSense readiness

Apply for AdSense once about 25 game pages are live and the site is 4–6 weeks old; until then, build pages and leave reserved ad space empty.

- **Before applying:** About, Contact, Privacy (cookies and ads disclosure) and Terms live and linked in the footer; no thin, placeholder or broken pages; trademark disclaimer in the footer.
- **Ad slots (reserved in the design from day one, fixed height to avoid layout shift):** below the download block, between scoring reference and FAQs, in the sidebar on desktop, and on the end-of-game winner screen below the result.
- **Never place ads** inside the scorekeeper, next to score entry buttons or download buttons. Accidental clicks there break AdSense policy.
- **Never** auto-refresh ads, hide downloads behind ads, or add fake download buttons.
- **After approval:** add /ads.txt; consent banner for EU/UK visitors (Google-certified CMP).

## Launch phases and success checks

Four phases over about three months, each gated by a check in Search Console before the next big batch.

1. **Phase 1 – Week 1–2 (17 routes):** engines for category sheet, round totals, running turns and tables/tallies; PDF build script; 9 game pages, generic sheet, home, A–Z, 3 categories, legal pages. *Gate:* all pages indexed and showing impressions within 3 weeks.
2. **Phase 2 – Weeks 3–5 (+20 games):** bid-and-make engine; remaining dice and card games at 3–5 pages a week. *Gate:* Phase 1 pages averaging position under 30; then apply for AdSense around 25+ pages.
3. **Phase 3 – Weeks 6–9 (+24 routes):** tile and board games, custom boards (cribbage, darts, bowling, Scrabble, rally scoreboards), lawn and bar category.
4. **Phase 4 – Weeks 10–12 (+12 routes):** game night tools and generators.

Ongoing: check Search Console weekly (Pages report for indexing, Performance → Queries for new keyword ideas to add as FAQs or pages); pin each new preview image on Pinterest.

## Open questions

- Domain: ScoreSheetSquare.com chosen (unregistered on 1 Nov 2026; buy it).
- Verify volume and difficulty for the slugs marked * (Skyjo, Uno, Catan, etc.) and for Bunco, Five Crowns and Hand and Foot before Phase 1 is final.
- English (US) only at launch, or add UK spellings and A4-first later?
- Multiplayer sync (everyone sees the scores on their own phone) as a v2 feature?
- Install as an app (PWA) for repeat players?
