import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useTRPC } from '#/integrations/trpc/react'

export const Route = createFileRoute('/')({
  loader: ({ context }) =>
    context.queryClient.query(context.trpc.trips.list.queryOptions()),
  component: App,
})

function App() {
  const trpc = useTRPC()
  const navigate = useNavigate()
  const { data: trips = [] } = useQuery(trpc.trips.list.queryOptions())
  const create = useMutation({
    ...trpc.trips.create.mutationOptions(),
    onSuccess: (trip) =>
      navigate({ to: '/trips/$tripId', params: { tripId: trip.id } }),
  })

  return (
    <main className="mx-auto max-w-2xl p-8">
      <button
        type="button"
        className="mb-4 rounded border px-3 py-1"
        disabled={create.isPending}
        onClick={() => create.mutate()}
      >
        New trip
      </button>
      <ul className="list-disc pl-5">
        {trips.map((trip) => (
          <li key={trip.id}>
            <Link to="/trips/$tripId" params={{ tripId: trip.id }}>
              {trip.id}
            </Link>{' '}
            ({trip.createdAt.toLocaleString()})
          </li>
        ))}
      </ul>
    </main>
  )
}
