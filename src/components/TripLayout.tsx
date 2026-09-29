import type { ReactNode } from 'react'

/**
 * Conversation (just under half the width) beside the trip plan. On very wide
 * screens the conversation is centered with the plan to its right; below that
 * there's no room for a centered column, so the screen is split between the
 * two with the conversation on the left.
 */
export function TripLayout({
  messages,
  input,
  plan,
}: {
  messages: ReactNode
  input: ReactNode
  plan: ReactNode
}) {
  return (
    <div className="grid h-screen grid-cols-[minmax(0,9fr)_minmax(0,11fr)] gap-x-20 bg-neutral-50 px-10 min-[112rem]:grid-cols-[1fr_min(45vw,48rem)_1fr]">
      <main className="flex min-h-0 flex-col min-[112rem]:col-start-2">
        <div className="flex-1 space-y-8 overflow-y-auto pt-16 pb-8">
          {messages}
        </div>
        <div className="pb-8">{input}</div>
      </main>
      {/* Padding inside the scroller keeps the card's shadow from clipping. */}
      <aside className="-mx-3 min-h-0 overflow-y-auto px-3 pt-16 pb-8">
        <div className="max-w-2xl">{plan}</div>
      </aside>
    </div>
  )
}
