---
name: ScoreSheetSquare
description: The printed score pad, live. One ink on pad paper, the real sheet always in view.
colors:
  pad-paper: "#EEF1E4"
  pad-stage: "#E2E7D3"
  sheet: "#FBFCF6"
  pad-ink: "#0F4A35"
  pad-ink-soft: "#3E6A57"
  graphite: "#2B2A27"
  pencil-red: "#B42318"
  pad-ink-deep: "#0A3626"
typography:
  wordmark:
    fontFamily: "'STIX Two Text', 'Times New Roman', serif"
    fontSize: "clamp(3.5rem, 9vw, 9.5rem)"
    fontWeight: 400
    lineHeight: 0.9
    letterSpacing: "-0.035em"
  head:
    fontFamily: "'STIX Two Text', 'Times New Roman', serif"
    fontSize: "clamp(2rem, 1.3rem + 3.2vw, 4rem)"
    fontWeight: 400
    lineHeight: 1.08
    letterSpacing: "-0.026em"
  lead:
    fontFamily: "'STIX Two Text', 'Times New Roman', serif"
    fontSize: "clamp(1.25rem, 1.1rem + 0.7vw, 1.625rem)"
    fontWeight: 400
    lineHeight: 1.35
    letterSpacing: "-0.01em"
  body:
    fontFamily: "'STIX Two Text', 'Times New Roman', serif"
    fontSize: "clamp(1.125rem, 1.05rem + 0.3vw, 1.3125rem)"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0em"
  small:
    fontFamily: "'STIX Two Text', 'Times New Roman', serif"
    fontSize: "clamp(0.875rem, 0.85rem + 0.1vw, 0.9375rem)"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0em"
  score:
    fontFamily: "'STIX Two Text', 'Times New Roman', serif"
    fontSize: "1.375rem"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0em"
rounded:
  none: "0px"
  sheet: "2px"
  pill: "999px"
spacing:
  gutter-phone: "16px"
  gutter: "32px"
  column-pad: "64px"
  inside: "24px"
  section: "160px"
  section-phone: "96px"
components:
  button-primary:
    backgroundColor: "{colors.pad-ink}"
    textColor: "{colors.pad-paper}"
    rounded: "{rounded.none}"
    padding: "16px 28px"
    height: "56px"
  button-primary-hover:
    backgroundColor: "{colors.pad-ink-deep}"
    textColor: "{colors.pad-paper}"
  button-quiet:
    backgroundColor: "{colors.pad-stage}"
    textColor: "{colors.pad-ink}"
    rounded: "{rounded.none}"
    padding: "16px 24px"
    height: "56px"
  sheet:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.pad-ink}"
    rounded: "{rounded.sheet}"
  sheet-header-band:
    backgroundColor: "{colors.pad-ink}"
    textColor: "{colors.sheet}"
    typography: "{typography.lead}"
    padding: "14px 20px"
  score-cell:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.graphite}"
    typography: "{typography.score}"
    height: "48px"
  keypad-key:
    backgroundColor: "{colors.pad-stage}"
    textColor: "{colors.pad-ink}"
    typography: "{typography.lead}"
    rounded: "{rounded.none}"
    height: "64px"
---

# Design System: ScoreSheetSquare

Product truth lives in [PRODUCT.md](PRODUCT.md); routes, page anatomy and engines in [docs/functional-plan.md](docs/functional-plan.md). This file owns how the site looks and behaves on screen and on paper.

## Overview

**The world: the printed score pad.** The site is the pencil-and-paper score pad that sits in every game drawer: pale ruled paper, one printed ink, a solid header band at the top of each sheet, numbers written in by hand. Everything on screen is printed in that one ink on that one paper. The only other marks are graphite (the scores people enter) and the red pencil (the leader circled, the winner, a mistake).

**The idea.** On this site, *the sheet you came to print* becomes *the fixed half of the screen*. The real sheet for the game you picked, at true size, never leaves view while everything else scrolls past it. On the home page it is a demo you can write on; on a game page it is the live scorekeeper. Competitors show a thumbnail of a PDF. We show the sheet itself, working.

**The live thing.** Tap any cell of the sheet and write a score. Totals, the Yahtzee upper bonus and the leader circle update straight away. It works with a thumb, keeps working offline, and without JavaScript the same sheet renders as a static, printable table.

**Composition: the split stage** (art direction dealt by tasteskill, seed 1366701792, `.taste-skill/direction.json`). On desktop, one column is `position: sticky; height: 100svh` and holds the sheet on the stage tone; the other scrolls with all the reading in one measure. On a phone the stage becomes the top of the page and then lets go.

**Mode by surface.**
- Home, category pages, A–Z: **Persuade.** The first screen answers "can I get a score sheet for my game here?" in large type, with the action working on screen.
- Game pages: **Operate first, Read second.** The download and the scorekeeper sit above the fold; the reading column under them earns the ranking.
- Legal pages: **Read.**

**What it must never become:** a printables-template site with pastel cards, a dark "gamer" UI, a cartoon dice mascot, or a page that looks like a PDF host. It is a well-printed pad, not a toy.

## Colors

One paper, one ink. The palette is the materials of a printed score pad, not a brand palette.

### Primary
- **Pad ink** `#0F4A35`: the one printed ink. It sets all type, headings, rules inside sheets, the sheet header band and the primary button. Contrast on pad paper is 8.9:1.
- **Pad ink deep** `#0A3626`: hover and pressed state for the primary button only.

### Secondary
- **Graphite** `#2B2A27`: only for what a person has written: entered scores, typed player names. It separates "printed" from "written in" at a glance.
- **Pencil red** `#B42318`: the red pencil. It is used for the circle around the leader's total, the winner line, and error text. Never on a button, link or heading.

### Neutral
- **Pad paper** `#EEF1E4`: the page ground (reading column, header, footer menu half).
- **Pad stage** `#E2E7D3`: one tone step down. It is the fixed stage the sheet lies on, quiet buttons, keypad keys and reserved ad slots.
- **Sheet** `#FBFCF6`: the sheet itself, the one near-white object on the page.
- **Pad ink soft** `#3E6A57`: secondary notes, unselected game names in the showcase index, player counts. 5.4:1 on pad paper. Running text never uses it.

### Named Rules
- **The one-ink rule.** If it is printed, it is pad ink. No second brand hue, no category colours, no black. Category differences are said in words, not colour.
- **Written vs printed.** Graphite means a person wrote it. Never set printed labels in graphite or entered scores in pad ink.
- **Red is a pencil, not a brand.** Pencil red appears at most twice on a screen.
- **Surfaces step, they do not outline.** Paper → stage → sheet is the only depth. No borders between page regions.

## Typography

One face: **STIX Two Text** (Google Fonts, self-hosted via `@fontsource/stix-two-text`, weights 400, 600, italic 400). It is the plain, typed roman of a printed form, which is exactly how score pads are set. Its figures are lining and tabular with `font-variant-numeric: tabular-nums lining-nums`, so columns of scores line up.

### Hierarchy
- **Wordmark** `clamp(3.5rem, 9vw, 9.5rem)`, 400, tracking -0.035em, lowercase, one line. It is used only as the crossing name on the home hero and the full-width name in the footer.
- **Head** `clamp(2rem, 1.3rem + 3.2vw, 4rem)`, 400, leading 1.08. H1 on game pages and section headings on the home page. Sentence case.
- **Lead** `clamp(1.25rem, 1.1rem + 0.7vw, 1.625rem)`. The one supporting sentence, sheet header bands, showcase index names on phones, keypad digits.
- **Body** `clamp(1.125rem, 1.05rem + 0.3vw, 1.3125rem)`, leading 1.5, measure 46–62ch. Older players read this, so it never goes below 18px.
- **Small** 14–15px. Player counts, credits, the legal line. Nothing on the site is smaller than 14px.
- **Score** 22px in sheet cells (28px in large-print mode), tabular figures, graphite.

That is five sizes plus the score cell. Do not add a sixth.

### Named Rules
- **Emphasis is weight 600 or size, never colour or italic on one word.** Italic is used only for the names of games in running text.
- **No labels in capitals, no tracking on small text, no monospace anywhere.** Sheet row labels are sentence case ("Three of a kind", "Upper bonus").
- **Headlines are two lines or fewer at every width.** The H1 pattern "<Game> score sheet" runs at Head size, and the longer SEO title ("…Free Printable PDF & Online Scorekeeper") is the `<title>`, not the visible H1 line. If the full plan wording must be visible, the second half sits on the line under the H1 at Lead size.

## Layout

### Grid and gutters
- 12-column grid, gutters 16px on phones and 32px from 768px. Every page uses these and no others.
- Gaps between sections are 160px on desktop and 96px on phones, always larger than any gap inside a section.
- Text is left-aligned. Only the winner screen is centred.

### The split stage (desktop ≥1024px)
```
┌──────────────────────────┬──────────────────────────────┐
│ STAGE  (47%, sticky)     │ READING COLUMN (53%, scrolls)│
│  pad-stage ground        │  pad-paper ground            │
│  ┌──────────────┐        │  H1 · one sentence           │
│  │▓ YAHTZEE ▓▓▓▓│ band   │  [Download PDF] stubs        │
│  │ Ones   3  4  │        │  ── ad slot (fixed height)   │
│  │ Twos   6  .  │        │  Scoring reference           │
│  │ ...          │ sheet  │  How to use · example slip   │
│  │ Total (194)  │        │  ── ad slot                  │
│  └──────────────┘        │  FAQ as reading text         │
│   cropped by stage edge  │  Related games list          │
└──────────────────────────┴──────────────────────────────┘
```
- The stage holds exactly one sheet, at true size (Standard: 560px wide; Large print: 640px), placed 64px in from the stage's left and 72px from the top. A long sheet is cropped by the stage's bottom edge and the stage scrolls internally on a game page.
- The reading column has 64px padding and a 62ch maximum measure.
- **Break the split once per page.** On the home page the "how it works" slip and the footer run full width. On a game page the winner screen and the footer do.

### Phone (<1024px)
- The stage comes first at the right point in the game-page anatomy (after the header and download block), full width, with a 16px inset. It is not sticky: a sticky tool on a phone hides the reading text.
- On the home page the stage is the top 58svh, and the wordmark runs under it at 21vw, overlapping its bottom edge by 3vw.
- Keypad and controls sit in the bottom thumb zone of the stage.

### Ad slots
Slots are reserved from day one as flat pad-stage blocks of fixed height with no label (AdSense labels its own ads):
- Below the download block: 280px (phone), 250px (desktop).
- Between the scoring reference and the FAQs: same heights.
- Desktop "sidebar" slot: in the split layout this is a 300×600 block placed in the reading column after the related games list, aligned to the column's right edge, so it is never beside the sheet's entry area.
- Winner screen: under the result and its buttons, 250px.
- **Never** inside the stage, next to the keypad, or within 120px of a download button.

## Elevation & Depth

Flat. Depth is a step in tone: pad paper → pad stage → sheet. Nothing at rest has a shadow.

### Shadow Vocabulary
- **Floating only.** The numeric keypad sheet on phones and the player-menu popover use `0 12px 32px -8px rgb(15 74 53 / 0.28)`, the pad ink at low opacity. These are the only shadows on the site.

### Named Rules
- **Paper doesn't glow.** No glows, glass or blur. The sheet sits on the stage the way paper sits on a table: a tone change is enough.

## Shapes

- **Square corners everywhere** (buttons, stage, ad slots, keypad keys).
- **The sheet** has a 2px radius, which is the slight softness of a cut paper pad, and nothing else does.
- **Pill** is used only for the toggles inside the scorekeeper (Wake lock, Large print).
- **The perforation.** The top edge of every sheet object, slip and download stub is a row of 3px round punches (CSS `mask` with a radial pattern, applied to the element's own edge). It is the pad's tear line and the site's one ornament. It is never used as a divider between page sections.
- **The pencil circle.** A hand-drawn SVG loop (a single path, pencil red, 2px, slightly open at one end) drawn around the leader's total and the winner's name. It is geometry drawn with `stroke-dashoffset`, not an illustration.

## Components

### Buttons
- **Primary:** a solid pad-ink block with pad-paper type at Lead size, 56px high, square corners. Its label says what happens: "Download PDF", "Start scoring", "Play again with same players". There is one primary button per screen.
- **Quiet:** pad-stage fill with pad-ink type. It is used for secondary actions such as "Large print", "2 per page", "Customise" and "Undo".
- **States:** hover darkens to pad ink deep; press moves the button 1px down and drops opacity to 0.92; focus shows a 3px pad-ink outline with 3px offset on paper (a sheet-white outline on ink); disabled is pad-ink-soft at 0.5 opacity with a "not-allowed" cursor. Downloads start immediately: there is no spinner and no countdown.

### Download stubs (the download block)
Each PDF version is a small torn-off sheet: a sheet-white stub with a perforated top edge, the version name at Lead size ("Standard", "Large print", "2 per page") and the paper size underneath ("US Letter · A4" toggles with locale). The whole stub is the link. Standard is set as the primary button underneath the preview, and the other versions are quiet stubs. "Customise" opens an inline panel below (player names, player count, rounds, paper size) and never a modal.

### Sheet (the signature component)
- `data-ui` root, sheet-white, 2px radius, perforated top edge.
- **Header band:** a solid pad-ink bar with the game name in sheet-white at Lead size and "ScoreSheetSquare.com" at Small size on the right. It is printed on every PDF and preview image too, so a screen sheet and a paper sheet are the same object.
- **Grid:** this is a real `<table>`, the one place lines are drawn: 1px pad ink at 35% for cell rules and 1.5px full pad ink under computed rows (subtotal, bonus, total). Row labels are pad ink and entered scores are graphite. Computed rows are set at weight 600.
- **Cells:** 48px tall minimum (56px in large print), tap target = whole cell. A focused cell gets a 2px pad-ink inset ring and a pad-stage fill. A scratched category shows "0" and a graphite strike through its label.
- **Leader:** the pencil circle draws around the leader's total in 360ms when the lead changes.
- **Empty state:** before anyone scores, column heads read "Player 1…4" with "Tap a name to change it" under them in Small, and the first cell is focused.

### Scorekeeper controls
- **Players:** name chips across the sheet head. Tap to rename, long-press or the "…" menu to reorder or remove. "Add player" is a quiet button at the end of the row. Min and max come from the game file.
- **Keypad (phone):** a 4×3 grid of 64px pad-stage keys (1–9, ±, 0, ⌫) plus a full-width primary "Enter" key. It slides up from the bottom and is the only floating element.
- **Undo** is always visible as a quiet button. **Resume banner:** a pad-stage strip at the top of the stage that reads "Resume your Yahtzee game from Tuesday, 4 players" with "Resume" and "Start new".
- **Toggles:** "Keep screen on" and "Large print" as pills in the stage footer.

### Winner screen
This breaks the split and runs full width on pad paper. The winner's name is centred at Head size with the pencil circle drawn around it, and the final totals sit beneath it as one flat bar chart in pad ink, one bar per player, longest first, with values at the bar ends. A raise from the Du Bois data portraits: the chart is drawn bold and flat, with no axes and no gridlines. Below it are "Play again with same players" (primary), "Print this game" (quiet), and then the ad slot.

### Navigation
- **Header:** the wordmark "scoresheetsquare" at Small-plus size (20px), then "Dice games", "Card games", "Board games", "All games" as plain links, and one action, "Find your game", which opens the search inline. There is no bar background, no blur and no pill.
- **Breadcrumb:** "Home › Card games › Phase 10" at Small size in pad ink soft, above the H1.
- **Footer:** one viewport tall and split. The left half shows the late-19th-century Ace of Clubs card (public domain, Cooper Hewitt via Wikimedia Commons), cropped hard by the left and bottom edges. The right half sets the category menu at 2.6vw, then contact, the image credits, and the line "Not affiliated with Hasbro, Mattel or any game publisher. Game names are trademarks of their owners." Under that the name returns full width at Wordmark size.

### Lists (A–Z, related games, category pages)
Two-ended rows with no boxes and no lines: the game name at Body size in pad ink on the left, and on the right the player count in pad ink soft ("2–8 players") with tabular figures. Rows are 44px on phones and 38px on desktop, and groups (A, B, C… or Dice, Card) are separated by 40px with the group word in pad ink soft. Related games use the same list, never cards.

### Scoring reference and example round
- **Scoring reference:** a real table in the reading column (the Farkle combinations, Phase 10 phases, Yahtzee categories), with the same rule weights as the sheet.
- **Example round:** printed on a slip, a sheet-white strip with a perforated top and a straight bottom, rows with dot leaders to the right-hand value, and a final inverted pad-ink row that states the result ("Round total: Ana 145, Ben 120").

### FAQ
This is set as reading text: each item is one paragraph whose question is a run-in in weight 600 ending with its question mark, and whose answer continues on the same line. It uses two CSS columns at ≥1280px in full-width sections and one column in the reading column. There are no accordions; the text is visible and matches the FAQPage schema exactly.

### Imagery
- **Primary imagery is the product's own output:** the sheet rendered in HTML (`data-ui`), and the build-generated PNG previews of page 1 of each PDF (`/images/<slug>.png`).
- **Archival pictures of the game world**, public domain, downloaded to `public/images/archive/`, with credits in the footer:
  - "Playing Card, Ace of Clubs, late 19th century", B.P. Grimaud, public domain (Cooper Hewitt, via Wikimedia Commons). Used in the footer photograph half.
  - "Etruscan dice from Tuscania", public domain (BnF, via Wikimedia Commons). Used on /dice-games and in the home "all games" section.
- Pictures are square-cornered, untinted, and set large. **No** game logos, box art, cartoon dice, stock "family laughing at table" photos, or emoji.

### Motion
- **Signature move:** the home wordmark scales from 1 to 0.94 as the first screen leaves, on a scroll-linked timeline (`animation-timeline: scroll()`), with a static fallback.
- **Entrances:** in each section the heading, then the text, then the sheet or picture rise 24px with opacity, staggered by 70ms, once, using `cubic-bezier(0.16, 1, 0.3, 1)` over 520ms. Content is visible by default and only enhanced when JavaScript runs.
- **Feedback:** the showcase sheet crossfades over 200ms when another game is selected; the pencil circle draws in 360ms; a score cell flashes pad stage for 240ms when its total changes; the keypad slides up in 220ms.
- `prefers-reduced-motion`: all travel is removed and crossfades become instant. The pencil circle appears already drawn.

### Print
`@media print` hides everything except the sheet. It prints in pure black on white (pad ink becomes `#000`, cell rules become 0.75pt), the header band prints as a solid black bar with white type, and `@page` margins are 12mm for both Letter and A4.

### Browser surfaces
`::selection` uses a pad-ink background with sheet-white text. The caret is graphite. Focus rings follow the button spec. Link underlines are 1px with a 0.18em offset in pad ink and thicken to 2px on hover. Scrollbars (the stage on desktop) are thin with a pad-ink-soft thumb on the pad-stage track.

## Do's and Don'ts

### Do:
- **Do** put the sheet on screen within the first viewport of every game page, working.
- **Do** keep everything printed in pad ink and everything written in graphite.
- **Do** use the game-page anatomy order from the functional plan; on desktop, the sheet occupies the stage while sections 1–2 and 4–7 scroll beside it.
- **Do** change what the reading column holds from section to section (a table, a list, a slip, reading text) so the split never becomes monotonous.
- **Do** test every sheet at 200% zoom, in large print, and printed on Letter and A4.
- **Do** use tabular figures for every number that sits in a column.

### Don't:
- **Don't** use game logos, box art, publisher colours or trade dress (PRODUCT.md brand commitment).
- **Don't** add eyebrow labels above headings, ALL-CAPS tracked labels, 01/02/03 numbering, monospace, gradients, glass, glows or shadows on resting surfaces.
- **Don't** build card grids. Games are listed as rows, and related games are a list.
- **Don't** introduce a second hue for categories, success states or links. Red is the pencil only.
- **Don't** place an ad inside the stage, next to the keypad or score cells, or within 120px of a download button.
- **Don't** gate a download behind email, a countdown or an ad.
- **Don't** invent testimonials, player counts or "trusted by" lines. No such proof exists.
- **Don't** use emoji or Unicode symbols as icons. Icons (download, undo, add, more) are one authored SVG set with a 1.75px stroke in pad ink.
