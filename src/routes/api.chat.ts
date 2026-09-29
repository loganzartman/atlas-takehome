import { chat, chatParamsFromRequest, toServerSentEventsResponse } from '@tanstack/ai'
import { createOpenRouterText } from '@tanstack/ai-openrouter'
import { createFileRoute } from '@tanstack/react-router'
import { env } from '#/env'

// The model comes from env, so it can't be checked against the adapter's
// model catalog at compile time; OpenRouter rejects unknown ids at runtime.
type OpenRouterModel = Parameters<typeof createOpenRouterText>[0]

export const Route = createFileRoute('/api/chat')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages, threadId, runId } =
          await chatParamsFromRequest(request)
        const abortController = new AbortController()

        const stream = chat({
          adapter: createOpenRouterText(
            env.OPENROUTER_MODEL as OpenRouterModel,
            env.OPENROUTER_API_KEY,
          ),
          messages,
          threadId,
          runId,
          abortController,
        })

        return toServerSentEventsResponse(stream, { abortController })
      },
    },
  },
})
