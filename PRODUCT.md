# Product

<!-- impeccable:product-schema 1 -->

Source of truth for scope and routes: [docs/functional-plan.md](docs/functional-plan.md).

## Platform

web

## Stack

Astro + TypeScript, React islands only for the scorekeeper and tools, Tailwind; static build deployed to Cloudflare Pages. `trailingSlash: 'never'`, `build.format: 'file'`.

## Users

- US/UK/EU families, game groups, bunco and card clubs, and older players (who search for "large print").
- Two situations: **before the game**, someone searches "<game> score sheet" on a laptop or phone so they can print a sheet; **during the game**, someone at the table keeps score on a phone that is passed around, put down and locked between turns.

## Product Purpose

Every popular game gets one page that has a free printable score sheet (Standard, Large print, 2-per-page, plus a customisable PDF) and a live online scorekeeper. Success means ranking for low-competition "<game> score sheet" keywords and keeping people on the page for the whole game night, which earns display ad revenue.

## Positioning

Competitors offer a single PDF. ScoreSheetSquare offers three PDF versions, a customiser and a live scorekeeper on the same page, with no email gate, no countdown and no account.

## Operating Context

- Paper: US Letter (default) and A4, home printers, pencils, a kitchen or dining table.
- Phones at the table: one-handed entry, a big numeric keypad, the screen kept awake, auto-save in case the phone locks.
- Games in v1 use six scoring engines: category sheet, round totals, running turns, bid and make, tables and tallies, custom board.

## Capabilities and Constraints

- Game pages are built from one data file per game (content collection) that drives the route, scorekeeper, PDFs, preview image, schema and related links.
- Each game page has seven sections in a fixed order: header, download block, scorekeeper, scoring reference, how to use, FAQs, related games.
- Ad slots are reserved at a fixed height from day one: below the download block, between the scoring reference and FAQs, in a desktop sidebar, and on the winner screen. Ads are never placed inside the scorekeeper or next to score entry or download buttons.
- Printing the HTML page prints only the sheet.
- Out of scope for v1: accounts, multiplayer sync, standalone how-to-play pages.
- Undecided: UK spellings or A4-first later; PWA install; multiplayer sync in v2.

## Brand Commitments

- Name: ScoreSheetSquare (domain ScoreSheetSquare.com). No logo, colours or fonts exist yet.
- Own artwork and colours only: no game logos, box art or trade dress. Footer carries a "not affiliated" trademark line.

## Evidence on Hand

- No testimonials, user counts, press or reviews exist. Do not invent any.
- No photography exists. Sheet preview images are generated from game data at build time.

## Product Principles

1. The sheet is the product. The page leads with what people searched for: the download and the tool.
2. Instant and honest. No gates, no fake buttons, no ads where a thumb is entering scores.
3. Built for the table, not the desk. Phone, one hand, poor light, many hands.
4. One page per game. Variants are buttons on that page, never separate pages.

## Accessibility & Inclusion

- Older players are a core audience: readable at 200% zoom, large tap targets, strong contrast, a large-print PDF for every game.
- Keyboard-usable scorekeeper with labelled inputs.
