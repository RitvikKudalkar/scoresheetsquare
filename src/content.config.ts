import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const row = z.object({ id: z.string(), label: z.string(), hint: z.string().optional() });

const sheet = z.discriminatedUnion('engine', [
  z.object({
    engine: z.literal('category'),
    sections: z.array(
      z.object({
        id: z.string(),
        label: z.string(),
        rows: z.array(row).min(1),
        subtotal: z.string().optional(),
        bonus: z
          .object({ threshold: z.number(), points: z.number(), label: z.string(), tiers: z.array(z.object({ threshold: z.number(), points: z.number() })).optional() })
          .optional(),
        total: z.string().optional(),
      }),
    ),
    grandTotal: z.string(),
    teams: z.boolean().optional(),
  }),
  z.object({
    engine: z.literal('round-totals'),
    rounds: z.number().int().min(1),
    roundLabels: z.array(z.string()).optional(),
    target: z.number().optional(),
    phases: z.number().int().min(1).optional(),
    finishRound: z.boolean().optional(),
    teams: z.boolean().optional(),
    roundPoints: z.object({ total: z.number(), moon: z.enum(['others', 'self']).optional() }).optional(),
    targetOptions: z.array(z.number()).optional(),
    roundOptions: z.array(z.number().int().min(1)).optional(),
    meldMinimums: z.array(z.object({ from: z.number(), points: z.number() })).optional(),
  }),
  z.object({
    engine: z.literal('running-turns'),
    turns: z.number().int().min(1),
    target: z.number(),
    minimumToBoard: z.number().optional(),
  }),
  z.object({
    engine: z.literal('tally'),
    tallies: z.array(z.object({ id: z.string(), label: z.string() })).min(1),
    sets: z.number().int().min(1),
    roundsPerSet: z.number().int().min(1),
  }),
  z.object({
    engine: z.literal('bid-and-make'),
    rounds: z.number().int().min(1),
    hands: z.array(z.number().int().min(1)).optional(),
    deckSize: z.number().int().optional(),
    teams: z.boolean().optional(),
    meld: z.boolean().optional(),
    trickPoints: z.number().int().optional(),
    made: z.object({ base: z.number(), perBid: z.number() }).optional(),
    overtricks: z
      .object({ points: z.number(), bags: z.object({ every: z.number().int().min(1), penalty: z.number() }).optional() })
      .optional(),
    missed: z.object({ perBid: z.number().optional(), perOff: z.number().optional() }).optional(),
    nil: z.number().optional(),
    target: z.number().optional(),
    targetOptions: z.array(z.number()).optional(),
  }),
]);

const content = z.object({
  intro: z.string(),
  howToUse: z.array(z.string()).min(1),
  exampleRound: z.object({
    caption: z.string(),
    rows: z.array(z.object({ label: z.string(), value: z.string() })).min(1),
    result: z.string(),
  }),
  faqs: z.array(z.object({ q: z.string(), a: z.string() })).min(5).max(8),
});

const games = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/games' }),
  schema: z
    .object({
      slug: z.string().regex(/^[a-z0-9-]+$/),
      name: z.string(),
      aliases: z.array(z.string()).default([]),
      category: z.enum(['dice', 'card', 'board', 'tile', 'bar', 'lawn']),
      keywords: z.array(z.string()).min(1),
      title: z.string().max(60),
      description: z.string().min(70).max(160),
      players: z.object({ min: z.number().int(), max: z.number().int(), default: z.number().int() }),
      winCondition: z.enum(['highest', 'lowest']),
      sheet,
      pdf: z.object({ rows: z.number().int().optional(), showScoringChart: z.boolean().default(false) }),
      scoringReference: z
        .object({ columns: z.array(z.string()).min(2), rows: z.array(z.array(z.string())).min(1) })
        .optional(),
      content: content.optional(),
      related: z.array(z.string()).default([]),
      /** Other pages about the same game (rules, play online), linked under the intro. */
      companions: z.array(z.object({ href: z.string(), label: z.string(), note: z.string() })).default([]),
      phase: z.number().int().min(1).max(4),
      status: z.enum(['live', 'draft']),
    })
    // A live game ships a full page, so it must carry its page text and scoring reference.
    .refine((g) => g.status !== 'live' || (g.content && g.scoringReference), {
      message: 'A live game needs content and scoringReference',
    })
    // Every round a table can choose needs its label.
    .refine((g) => g.sheet.engine !== 'round-totals' || !g.sheet.roundLabels || Math.max(g.sheet.rounds, ...(g.sheet.roundOptions ?? [])) <= g.sheet.roundLabels.length, {
      message: 'roundLabels needs a label for every round, including the largest roundOptions',
    })
    .refine((g) => g.sheet.engine !== 'bid-and-make' || !g.sheet.hands || g.sheet.hands.length === g.sheet.rounds, {
      message: 'A bid sheet with hands needs one hand size per round',
    })
    .refine((g) => g.sheet.engine !== 'bid-and-make' || g.sheet.meld || (g.sheet.made && g.sheet.missed), {
      message: 'A bid sheet needs made and missed points unless it scores meld',
    }),
});

export const collections = { games };
