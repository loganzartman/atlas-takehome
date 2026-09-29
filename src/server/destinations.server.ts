import { z } from 'zod'

const season = z.enum(['spring', 'summer', 'fall', 'winter'])

export const destinationInfoSchema = z.object({
  name: z.string(),
  bestSeasons: z.array(season),
  knownFor: z.array(z.string()),
  averageDailyBudgetUSD: z.object({
    budget: z.number(),
    midRange: z.number(),
    luxury: z.number(),
  }),
  visaNotes: z.string().optional(),
})

export type DestinationInfo = z.infer<typeof destinationInfoSchema>

// Mock data until there's a real source. Keyed by lowercase city.
const DESTINATIONS: Record<string, DestinationInfo> = {
  lisbon: {
    name: 'Lisbon, Portugal',
    bestSeasons: ['spring', 'fall'],
    knownFor: ['food', 'architecture', 'viewpoints', 'nightlife', 'beaches'],
    averageDailyBudgetUSD: { budget: 70, midRange: 160, luxury: 400 },
    visaNotes:
      'Schengen Area: many nationalities (e.g. US, UK, Canada) visit visa-free for up to 90 days in 180; others need a Schengen visa.',
  },
  rome: {
    name: 'Rome, Italy',
    bestSeasons: ['spring', 'fall'],
    knownFor: ['history', 'food', 'art', 'architecture'],
    averageDailyBudgetUSD: { budget: 90, midRange: 200, luxury: 500 },
    visaNotes:
      'Schengen Area: many nationalities (e.g. US, UK, Canada) visit visa-free for up to 90 days in 180; others need a Schengen visa.',
  },
  kyoto: {
    name: 'Kyoto, Japan',
    bestSeasons: ['spring', 'fall'],
    knownFor: ['temples', 'gardens', 'food', 'culture', 'hiking'],
    averageDailyBudgetUSD: { budget: 80, midRange: 180, luxury: 450 },
    visaNotes:
      'Visa-free short stays (typically up to 90 days) for many nationalities, including US, UK, Canada and most of the EU.',
  },
  'mexico city': {
    name: 'Mexico City, Mexico',
    bestSeasons: ['spring', 'fall', 'winter'],
    knownFor: ['food', 'museums', 'architecture', 'nightlife'],
    averageDailyBudgetUSD: { budget: 50, midRange: 120, luxury: 350 },
    visaNotes:
      'Visa-free tourist stays for many nationalities, including US, Canada, UK and the EU.',
  },
  reykjavik: {
    name: 'Reykjavik, Iceland',
    bestSeasons: ['summer', 'winter'],
    knownFor: ['hiking', 'hot springs', 'northern lights', 'nature'],
    averageDailyBudgetUSD: { budget: 120, midRange: 250, luxury: 600 },
    visaNotes:
      'Schengen Area: many nationalities (e.g. US, UK, Canada) visit visa-free for up to 90 days in 180; others need a Schengen visa.',
  },
  'cape town': {
    name: 'Cape Town, South Africa',
    bestSeasons: ['summer', 'fall'],
    knownFor: ['hiking', 'beaches', 'wine', 'wildlife', 'food'],
    averageDailyBudgetUSD: { budget: 50, midRange: 130, luxury: 400 },
  },
}

/** Accepts "Lisbon" or "Lisbon, Portugal". Null if we don't know the city. */
export async function getDestinationInfo(
  name: string,
): Promise<DestinationInfo | null> {
  const city = name.split(',')[0].trim().toLowerCase()
  return DESTINATIONS[city] ?? null
}
