import type { ReactNode } from 'react'

/** Assistant turns are plain text; user turns are a right-aligned bubble. */
export function ChatMessage({
  sender,
  children,
}: {
  sender: 'user' | 'assistant'
  children: ReactNode
}) {
  if (sender === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] whitespace-pre-wrap rounded-lg bg-blue-100 px-4 py-3 text-sm text-blue-950">
          {children}
        </div>
      </div>
    )
  }
  return (
    <div className="whitespace-pre-wrap text-sm text-neutral-900">
      {children}
    </div>
  )
}
