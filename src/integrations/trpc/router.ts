import { z } from 'zod'
import { createTrip, getTrip, listTrips } from '#/server/trips.server'
import { createTRPCRouter, publicProcedure } from './init'

import type { TRPCRouterRecord } from '@trpc/server'

const tripsRouter = {
  list: publicProcedure.query(() => listTrips()),
  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => getTrip(input.id)),
  create: publicProcedure.mutation(() => createTrip()),
} satisfies TRPCRouterRecord

export const trpcRouter = createTRPCRouter({
  trips: tripsRouter,
})
export type TRPCRouter = typeof trpcRouter
