import type { UIMessage } from '@tanstack/ai-react'
import { Markdown } from '#/components/Markdown'

/** Renders each part of a message by type. Unhandled part types render nothing. */
export function MessageParts({
  message,
  streaming,
}: {
  message: UIMessage
  /** True while this message is the one being generated. */
  streaming: boolean
}) {
  return message.parts.map((part, i) => {
    switch (part.type) {
      case 'text':
        // biome-ignore lint/suspicious/noArrayIndexKey: parts have no id and only append
        return <Markdown key={i}>{part.content}</Markdown>
      case 'thinking':
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: parts have no id and only append
          <p key={i} className="text-xs text-neutral-500">
            {streaming ? 'Thinking...' : 'Finished thinking'}
          </p>
        )
      case 'tool-call':
        if (part.name === 'offer_booking') {
          return part.output?.shown ? <BookTripButton key={part.id} /> : null
        }
        return (
          <p key={part.id} className="text-xs text-neutral-500">
            {describeToolCall(part)}
          </p>
        )
      default:
        return null
    }
  })
}

// No-op for now: booking isn't implemented.
function BookTripButton() {
  return (
    <button
      type="button"
      className="my-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow-elevation-1 transition hover:shadow-elevation-2"
    >
      Book trip
    </button>
  )
}

type ToolCall = Extract<UIMessage['parts'][number], { type: 'tool-call' }>

function describeToolCall({ name, input, output, state }: ToolCall) {
  const done = state === 'complete'
  switch (name) {
    case 'update_profile': {
      if (!done) return 'Updating plan...'
      const updated: string[] = output?.updated ?? []
      const conflicts: Array<{ field: string }> = output?.conflicts ?? []
      if (output?.error) return `Plan not updated: ${output.error}`
      return [
        updated.length > 0 && `Updated plan: ${updated.join(', ')}`,
        conflicts.length > 0 &&
          `Needs confirmation: ${conflicts.map((c) => c.field).join(', ')}`,
      ]
        .filter(Boolean)
        .join('. ') || 'Plan unchanged'
    }
    case 'update_priorities':
      return done ? 'Reordered plan' : 'Reordering plan...'
    case 'get_destination_info':
      return `${done ? 'Looked up' : 'Looking up'} ${input?.name ?? 'destination'}`
    default:
      return `${done ? 'Used' : 'Using'} ${name}`
  }
}
