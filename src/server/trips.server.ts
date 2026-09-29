import { prisma } from '#/db'
import { PLAN_ITEMS } from '#/lib/trip-profile'

export function createTrip() {
  return prisma.trip.create({
    data: {
      profile: { create: {} },
      priorities: {
        create: Object.keys(PLAN_ITEMS).map((item, rank) => ({ item, rank })),
      },
    },
  })
}

export function listTrips() {
  return prisma.trip.findMany({ orderBy: { createdAt: 'desc' } })
}

export function getTrip(id: string) {
  return prisma.trip.findUnique({
    where: { id },
    include: { profile: true, priorities: { orderBy: { rank: 'asc' } } },
  })
}

export async function tripExists(id: string) {
  return (await prisma.trip.count({ where: { id } })) > 0
}
