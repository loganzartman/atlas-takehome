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

export const planItemSchema = z.enum(
  Object.keys(PLAN_ITEMS) as [PlanItem, ...PlanItem[]],
)

export function isPlanItem(item: string): item is PlanItem {
  return Object.hasOwn(PLAN_ITEMS, item)
}

type DoneFields<K extends PlanItem> = {
  [F in (typeof PLAN_ITEMS)[K][number]]: NonNullable<TripProfile[F]>
}

/** Checklist copy: a generic label while open, the locked-in value once done. */
const PLAN_LABELS: {
  [K in PlanItem]: { open: string; done: (p: DoneFields<K>) => string }
} = {
  destination: { open: 'Destination', done: (p) => p.destination },
  dates: {
    open: 'Travel dates',
    done: (p) => plural(tripDays(p.startDate, p.endDate), 'day'),
  },
  activities: { open: 'Things to do', done: (p) => p.activityPrefs },
  origin: { open: 'Departure city', done: (p) => `From ${p.origin}` },
  travelers: {
    open: 'Number of travelers',
    done: (p) => plural(p.travelers, 'traveler'),
  },
  budget: { open: 'Budget', done: (p) => p.budget },
  visa: { open: 'Visa requirements', done: (p) => p.visaNotes },
  constraints: { open: 'Special requirements', done: (p) => p.constraints },
  food: { open: 'Food preferences', done: (p) => p.foodPrefs },
}

export function isItemDone(profile: TripProfile | null, item: PlanItem) {
  return PLAN_ITEMS[item].every((field) => profile?.[field] != null)
}

export function planItemLabel(profile: TripProfile | null, item: PlanItem) {
  const { open, done } = PLAN_LABELS[item]
  // isItemDone guarantees this item's fields are non-null.
  return profile && isItemDone(profile, item)
    ? done(profile as DoneFields<PlanItem>)
    : open
}

/** "Lisbon, Portugal" -> "Lisbon" */
export function placeCity(place: string) {
  return place.split(',')[0].trim()
}

/**
 * Trip dates are calendar days stored as UTC midnight; rebuild them at local
 * midnight so local formatting shows the intended day.
 */
export function toLocalDay(date: Date) {
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
}

function tripDays(start: Date, end: Date) {
  return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1
}

function plural(n: number, noun: string) {
  return `${n} ${noun}${n === 1 ? '' : 's'}`
}
