import { useState } from 'react'

/** Enter sends, Shift+Enter adds a newline. Clears itself after sending. */
export function ChatInput({
  onSubmit,
  disabled,
  placeholder = 'Where do you want to go?',
}: {
  onSubmit: (text: string) => void
  disabled?: boolean
  placeholder?: string
}) {
  const [value, setValue] = useState('')
  const canSend = !disabled && value.trim().length > 0

  const send = () => {
    if (!canSend) return
    onSubmit(value.trim())
    setValue('')
  }

  return (
    <form
      className="flex items-end gap-3 rounded-lg bg-white px-5 py-4 shadow-elevation-3 focus-within:ring-2 focus-within:ring-blue-600/40"
      onSubmit={(e) => {
        e.preventDefault()
        send()
      }}
    >
      <textarea
        className="min-h-12 flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-neutral-500"
        rows={2}
        value={value}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            send()
          }
        }}
      />
      <button
        type="submit"
        aria-label="Send"
        disabled={!canSend}
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-elevation-1 transition hover:shadow-elevation-2 disabled:bg-neutral-300 disabled:shadow-none"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      </button>
    </form>
  )
}
