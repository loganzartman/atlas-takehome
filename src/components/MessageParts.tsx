import type { UIMessage } from '@tanstack/ai-react'

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
        return <span key={i}>{part.content}</span>
      case 'thinking':
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: parts have no id and only append
          <p key={i} className="text-xs text-neutral-500">
            {streaming ? 'Thinking...' : 'Finished thinking'}
          </p>
        )
      default:
        return null
    }
  })
}
