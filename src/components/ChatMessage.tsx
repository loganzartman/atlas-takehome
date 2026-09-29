import type { ReactNode } from 'react'

/** Assistant turns are unstyled (parts render their own Markdown); user turns are a plain-text bubble. */
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
  return <div className="text-sm text-neutral-900">{children}</div>
}
