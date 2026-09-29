import { fetchServerSentEvents, useChat } from '@tanstack/ai-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { ChatInput } from '#/components/ChatInput'
import { ChatMessage } from '#/components/ChatMessage'
import { MessageParts } from '#/components/MessageParts'
import { TripLayout } from '#/components/TripLayout'
import { TripPlanCard } from '#/components/TripPlanCard'
import type { ProfilePriority, TripProfile } from '#/generated/prisma/browser'
import { useTRPC } from '#/integrations/trpc/react'
import {
  isItemDone,
  isPlanItem,
  placeCity,
  planItemLabel,
  toLocalDay,
} from '#/lib/trip-profile'

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
    <TripLayout
      messages={
        <>
          {messages.map((message, i) =>
            message.role === 'system' ? null : (
              <ChatMessage key={message.id} sender={message.role}>
                <MessageParts
                  message={message}
                  streaming={isLoading && i === messages.length - 1}
                />
              </ChatMessage>
            ),
          )}
          {error && <p className="text-sm text-red-600">{error.message}</p>}
        </>
      }
      input={<ChatInput onSubmit={sendMessage} disabled={isLoading} />}
      plan={
        trip && (
          <TripPlan profile={trip.profile} priorities={trip.priorities} />
        )
      }
    />
  )
}

function TripPlan({
  profile,
  priorities,
}: {
  profile: TripProfile | null
  priorities: ProfilePriority[]
}) {
  const checklist = priorities
    .filter((p) => !p.skipped)
    .map((p) => p.item)
    .filter(isPlanItem)
    .map((item) => ({
      label: planItemLabel(profile, item),
      done: isItemDone(profile, item),
    }))
  return (
    <TripPlanCard
      title={
        profile?.destination
          ? `Trip to ${placeCity(profile.destination)}`
          : 'New trip'
      }
      startDate={profile?.startDate ? toLocalDay(profile.startDate) : undefined}
      endDate={profile?.endDate ? toLocalDay(profile.endDate) : undefined}
      checklist={checklist}
    />
  )
}
