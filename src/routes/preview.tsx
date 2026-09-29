import { createFileRoute } from '@tanstack/react-router'
import { ChatInput } from '#/components/ChatInput'
import { ChatMessage } from '#/components/ChatMessage'
import { TripLayout } from '#/components/TripLayout'
import { TripPlanCard } from '#/components/TripPlanCard'

// Throwaway page for eyeballing the components with mock data.
export const Route = createFileRoute('/preview')({ component: Preview })

const lorem =
  'Lorem ipsum dolor sit amet consectetur adipiscing elit. Non culpa ipsum eum qui tempore anim aliqua ullamco id. Nostrud minim nostrud omnis illum aliqua. Dolor in voluptas qui velit fugiat deserunt accusamus dolor placeat iusto omnis aliqua.\n\nOmnis magna sunt sunt magna ullamco. Eos sed duis occaecat illum dolorum ut. Optio fuga pariatur irure voluptas cumque est qui molestias et.'

const beachPhoto =
  'https://images.unsplash.com/photo-1531514381259-8c9fedc910b8?w=1200&q=80&auto=format&fit=crop'

function Preview() {
  return (
    <TripLayout
      messages={
        <>
          <ChatMessage sender="assistant">{lorem}</ChatMessage>
          <ChatMessage sender="user">I like long walks on the beach!</ChatMessage>
          <ChatMessage sender="assistant">{lorem}</ChatMessage>
        </>
      }
      input={<ChatInput onSubmit={(text) => console.log('submit', text)} />}
      plan={
        <TripPlanCard
          title="Trip to Italy"
          startDate={new Date(2026, 4, 20)}
          endDate={new Date(2026, 4, 26)}
          weather={{ high: 74, summary: 'sunny' }}
          imageUrl={beachPhoto}
          checklist={[
            { label: 'Under $4,000', done: true },
            { label: 'Vegetarian food', done: true },
            { label: 'Type of accommodations', done: false },
            { label: 'Flight preferences', done: false },
          ]}
        />
      }
    />
  )
}
