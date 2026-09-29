import { z } from 'zod'
import type { TripProfile } from '#/generated/prisma/browser'

const place = (what: string) =>
  z
    .string()
    .describe(`${what}, as "City, State, Country" (omit State if not applicable)`)

/**
 * Everything the agent can lock in about a trip. Fields are only set once the
 * traveler has committed; tentative preferences stay in the conversation or
 * in `notes`.
 */
export const tripProfileSchema = z.object({
  destination: place('Where the trip goes'),
  origin: place('Where the travelers live; they all share its nationality'),
  startDate: z.iso.date().describe('First day of the trip (YYYY-MM-DD)'),
  endDate: z.iso.date().describe('Last day of the trip (YYYY-MM-DD)'),
  travelers: z.int().positive().describe('Number of people traveling'),
  budget: z.string().describe('Total budget, e.g. "around $2k"'),
  visaNotes: z
    .string()
    .describe("Visa requirements at the destination for the origin's nationality"),
  activityPrefs: z.string().describe('What the travelers want to do and see'),
  foodPrefs: z.string().describe('Food preferences'),
  constraints: z
    .string()
    .describe('Hard constraints: accessibility, mobility, diet, etc.'),
  notes: z
    .string()
    .describe('Your own notes, e.g. preferences not yet locked in'),
})

export type TripProfileInput = z.infer<typeof tripProfileSchema>

// Fails to compile if the schema and the TripProfile model disagree on fields.
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false
true satisfies Same<
  keyof TripProfileInput,
  Exclude<keyof TripProfile, 'tripId' | 'updatedAt'>
>

/**
 * The planning checklist. Each item is done once all of its profile fields
 * are set. Declaration order is the default priority.
 */
export const PLAN_ITEMS = {
  destination: ['destination'],
  dates: ['startDate', 'endDate'],
  activities: ['activityPrefs'],
  origin: ['origin'],
  travelers: ['travelers'],
  budget: ['budget'],
  visa: ['visaNotes'],
  constraints: ['constraints'],
  food: ['foodPrefs'],
} as const satisfies Record<string, ReadonlyArray<keyof TripProfileInput>>

export type PlanItem = keyof typeof PLAN_ITEMS
