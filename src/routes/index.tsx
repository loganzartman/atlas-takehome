import { fetchServerSentEvents, useChat } from '@tanstack/ai-react'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  const [input, setInput] = useState('')
  const { messages, sendMessage, isLoading, error } = useChat({
    connection: fetchServerSentEvents('/api/chat'),
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
        {JSON.stringify(messages, null, 2)}
      </pre>
    </main>
  )
}
