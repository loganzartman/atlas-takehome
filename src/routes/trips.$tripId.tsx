import { fetchServerSentEvents, useChat } from '@tanstack/ai-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { useState } from 'react'
import { useTRPC } from '#/integrations/trpc/react'

export const Route = createFileRoute('/trips/$tripId')({
  loader: async ({ context, params }) => {
    const trip = await context.queryClient.query(
      context.trpc.trips.get.queryOptions({ id: params.tripId }),
    )
    if (!trip) throw notFound()
  },
  component: TripPage,
})

function TripPage() {
  const { tripId } = Route.useParams()
  // Remount per trip so useChat hydrates the right thread.
  return <Trip key={tripId} tripId={tripId} />
}

function Trip({ tripId }: { tripId: string }) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const { data: trip } = useQuery(trpc.trips.get.queryOptions({ id: tripId }))

  const [input, setInput] = useState('')
  const { messages, sendMessage, isLoading, error } = useChat({
    threadId: tripId,
    connection: fetchServerSentEvents('/api/chat'),
    persistence: true,
    onFinish: () =>
      queryClient.invalidateQueries({
        queryKey: trpc.trips.get.queryKey({ id: tripId }),
      }),
  })

  return (
    <main className="mx-auto max-w-2xl p-8">
      <form
        className="mb-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (!input.trim()) return
          sendMessage(input.trim())
          setInput('')
        }}
      >
        <input
          className="flex-1 rounded border px-2 py-1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
        />
        <button
          type="submit"
          className="rounded border px-3 py-1"
          disabled={isLoading}
        >
          Send
        </button>
      </form>
      {error && <p className="text-red-600">{error.message}</p>}
      <pre className="whitespace-pre-wrap text-xs">
        {JSON.stringify({ trip, messages }, null, 2)}
      </pre>
    </main>
  )
}
