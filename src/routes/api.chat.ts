import { chat, chatParamsFromRequest, toServerSentEventsResponse } from '@tanstack/ai'
import { createOpenRouterText } from '@tanstack/ai-openrouter'
import { reconstructChat, withPersistence } from '@tanstack/ai-persistence'
import { createFileRoute } from '@tanstack/react-router'
import { env } from '#/env'
import { chatPersistence } from '#/server/chat-persistence.server'
import { tripSystemPrompt, tripTools } from '#/server/trip-agent.server'
import { getTrip, tripExists } from '#/server/trips.server'

// The model comes from env, so it can't be checked against the adapter's
// model catalog at compile time; OpenRouter rejects unknown ids at runtime.
type OpenRouterModel = Parameters<typeof createOpenRouterText>[0]

export const Route = createFileRoute('/api/chat')({
  server: {
    handlers: {
      // useChat({ persistence: true }) hydrates a thread from here on mount.
      GET: ({ request }) =>
        reconstructChat(chatPersistence, request, {
          authorize: (threadId) => tripExists(threadId),
        }),
      POST: async ({ request }) => {
        const { messages, threadId, runId } =
          await chatParamsFromRequest(request)
        const trip = await getTrip(threadId)
        if (!trip) {
          return new Response('Trip not found', { status: 404 })
        }
        const abortController = new AbortController()

        const stream = chat({
          adapter: createOpenRouterText(
            env.OPENROUTER_MODEL as OpenRouterModel,
            env.OPENROUTER_API_KEY,
          ),
          messages,
          systemPrompts: [tripSystemPrompt(trip)],
          tools: tripTools,
          context: { tripId: trip.id },
          threadId,
          runId,
          abortController,
          middleware: [withPersistence(chatPersistence)],
        })

        return toServerSentEventsResponse(stream, { abortController })
      },
    },
  },
})
