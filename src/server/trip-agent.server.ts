import { toolDefinition } from '@tanstack/ai'
import { z } from 'zod'
import { prisma } from '#/db'
import type { ProfilePriority, TripProfile } from '#/generated/prisma/client'
import {
  isItemDone,
  isPlanItem,
  PLAN_ITEMS,
  planItemSchema,
  type TripProfileInput,
  tripProfileSchema,
} from '#/lib/trip-profile'
import { destinationInfoSchema, getDestinationInfo } from './destinations.server'
import { getTrip } from './trips.server'

type TripContext = { tripId: string }
type ProfileField = keyof TripProfileInput
type Plan = { profile: TripProfile | null; priorities: ProfilePriority[] }

const DATE_FIELDS = new Set<ProfileField>(['startDate', 'endDate'])

// Dates are calendar days stored as UTC midnight.
function toWire(value: TripProfile[ProfileField] | undefined) {
  return value instanceof Date ? value.toISOString().slice(0, 10) : (value ?? null)
}

/** The checklist in priority order, with each item's current values. */
function describePlan({ profile, priorities }: Plan) {
  return priorities.flatMap(({ item, skipped }) =>
    isPlanItem(item)
      ? [
          {
            item,
            status: skipped
              ? 'skipped'
              : isItemDone(profile, item)
                ? 'done'
                : 'open',
            values: Object.fromEntries(
              PLAN_ITEMS[item].map((field) => [field, toWire(profile?.[field])]),
            ),
          },
        ]
      : [],
  )
}

async function loadPlan(tripId: string) {
  const trip = await getTrip(tripId)
  if (!trip) throw new Error(`Trip ${tripId} not found`)
  return trip
}

// Every profile field optional; null clears it.
const profileShape = tripProfileSchema.shape
const profilePatchShape = Object.fromEntries(
  Object.entries(profileShape).map(([field, schema]) => [
    field,
    schema
      .nullable()
      .optional()
      .describe(schema.description ?? ''),
  ]),
) as {
  [F in ProfileField]: z.ZodOptional<z.ZodNullable<(typeof profileShape)[F]>>
}

const updateProfile = toolDefinition({
  name: 'update_profile',
  description:
    'Record trip details the traveler has committed to. Pass only the fields to change; null clears a field. A field that already holds a different value is left unchanged and reported as a conflict unless overwrite is true.',
  inputSchema: z.object({
    ...profilePatchShape,
    overwrite: z
      .boolean()
      .optional()
      .describe(
        'Replace values that are already set. Only use after the traveler confirmed the change.',
      ),
  }),
}).server<TripContext>(async ({ overwrite, ...patch }, { context }) => {
  const plan = await loadPlan(context.tripId)
  const current = plan.profile

  const data: Record<string, unknown> = {}
  const updated: ProfileField[] = []
  const conflicts: Array<{
    field: ProfileField
    current: unknown
    proposed: unknown
  }> = []

  for (const [field, proposed] of Object.entries(patch) as Array<
    [ProfileField, string | number | null | undefined]
  >) {
    if (proposed === undefined) continue
    const existing = toWire(current?.[field])
    if (existing === proposed) continue
    // notes are the agent's own scratchpad, so they never conflict.
    if (existing !== null && field !== 'notes' && !overwrite) {
      conflicts.push({ field, current: existing, proposed })
      continue
    }
    data[field] =
      DATE_FIELDS.has(field) && typeof proposed === 'string'
        ? new Date(proposed)
        : proposed
    updated.push(field)
  }

  const start = 'startDate' in data ? data.startDate : current?.startDate
  const end = 'endDate' in data ? data.endDate : current?.endDate
  if (start instanceof Date && end instanceof Date && end < start) {
    return {
      error: 'endDate is before startDate; nothing was saved.',
      plan: describePlan(plan),
    }
  }

  if (updated.length > 0) {
    await prisma.tripProfile.update({
      where: { tripId: context.tripId },
      data,
    })
  }

  return {
    updated,
    conflicts,
    ...(conflicts.length > 0 && {
      instruction:
        'The conflicting fields already hold values. Ask the traveler whether to replace them, and only call update_profile again with overwrite: true if they agree.',
    }),
    plan: describePlan(await loadPlan(context.tripId)),
  }
})

const updatePriorities = toolDefinition({
  name: 'update_priorities',
  description:
    "Reorder the planning checklist or skip items the traveler doesn't care about.",
  inputSchema: z.object({
    first: z
      .array(planItemSchema)
      .optional()
      .describe('Items to move to the top, in this order. Others keep their order after them.'),
    skip: z.array(planItemSchema).optional(),
    unskip: z.array(planItemSchema).optional(),
  }),
}).server<TripContext>(async ({ first = [], skip = [], unskip = [] }, { context }) => {
  const { tripId } = context
  const plan = await loadPlan(tripId)
  const current = plan.priorities.map((p) => p.item)
  const order = [
    ...new Set([...first.filter((item) => current.includes(item)), ...current]),
  ]

  await prisma.$transaction(
    plan.priorities.map((p) =>
      prisma.profilePriority.update({
        where: { tripId_item: { tripId, item: p.item } },
        data: {
          rank: order.indexOf(p.item),
          skipped: skip.some((item) => item === p.item)
            ? true
            : unskip.some((item) => item === p.item)
              ? false
              : p.skipped,
        },
      }),
    ),
  )

  return { plan: describePlan(await loadPlan(tripId)) }
})

const getDestination = toolDefinition({
  name: 'get_destination_info',
  description:
    'Look up a destination: best seasons, what it is known for, typical daily spend per person in USD, and general visa notes. Returns null for unknown destinations.',
  inputSchema: z.object({
    name: z
      .string()
      .describe('City, optionally with its country, e.g. "Lisbon, Portugal"'),
  }),
  outputSchema: destinationInfoSchema.nullable(),
}).server(({ name }) => getDestinationInfo(name))

export const tripTools = [updateProfile, updatePriorities, getDestination]

export function tripSystemPrompt(plan: Plan, today = new Date()) {
  const checklist = describePlan(plan)
    .map(({ item, status, values }, i) => {
      const fields = Object.entries(values)
        .map(([field, value]) => `${field}=${value ?? 'unset'}`)
        .join(', ')
      return `${i + 1}. ${item} [${status}] ${fields}`
    })
    .join('\n')

  return `You are a friendly, knowledgeable travel agent helping a traveler plan one trip. Today is ${today.toISOString().slice(0, 10)}.

Work through the checklist below: ask about the first open item, one or two questions at a time, and follow the traveler's lead if they bring up something else. If they have a place or dates in mind, start there; if not, ask what they want to do or see.

Recording the plan:
- Call update_profile as soon as the traveler commits to a detail. Don't record guesses or options still under discussion; keep those in notes, which are yours to rewrite freely.
- Places are "City, State, Country" (omit State if not applicable). Dates are YYYY-MM-DD.
- If update_profile reports conflicts, ask the traveler whether to replace the existing value. Only call it again with overwrite: true once they agree.
- Use update_priorities when the traveler's priorities change or they don't care about an item.
- Work out visa requirements from the origin (all travelers share its nationality) and the destination, and record them in visaNotes.

Call get_destination_info when a destination comes up, to ground suggestions about seasons, costs and activities. Its visa notes are general; apply them to the traveler's nationality. If it returns null, say you don't have data on that place rather than guessing.

When every item is done or skipped, summarize the finished plan.

Current checklist, in priority order:
${checklist}

Your notes: ${plan.profile?.notes ?? '(none)'}`
}
