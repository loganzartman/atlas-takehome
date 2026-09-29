# process

implementation time: ~2:05 (see commits)

answers are human-written.

## reflection

This project looks a bit different from what I'd normally ship:

- There's only one engineer working on it; it can be brittle
- The codebase is small; risk of action-at-a-distance is lower
- The feature surface is small enough that I can just look at the whole thing in a browser
- It's greenfield; I can choose integrations to fit the project, rather than the other way around

I suspected that the "Must have" scope would really push the two-hour time limit, so I planned to mostly generate the implementation. Further, I didn't plan to do a careful review of foundational components, which I'd usually do to avoid magnifying small mistakes over time. My goal was to move quickly while ensuring that the LLM had enough clarity to avoid a disagreement that would force me to backtrack.

I started by roughly choosing some frameworks in my head: TanStack easily gets me typed frontend<-> backend integration, a frontend and backend router, etc. Even SQLite felt too heavy for the database given the scope (why not a hash map?) and lack of complex relationships, but it was the simplest setup that got me Prisma (a typed ORM). Every bit of static analysis you can plug into to the LLM reduces mistakes.

I ran the interactive setup process for TanStack to make sure everything was using the latest best practices. Then, I prompted the LLM to do some mechanical steps--remove samples, integrate OpenRouter, etc.--while I wrote down a plan and grabbed API keys. Next, I reviewed the plan with the LLM. At this point, I was reading diffs, but I knew that would change. My approach was to slowly "let the clutch out", so to speak, as the LLM gained more context on my goals.

Once I had LLM responses streaming to the browser, it was time to move fast. Frankly, there is no way one could implement and "fully verify" a project of this scope in two hours--but the goal was to demonstrate the functionality, so I feel that exercising the result in browser was verification enough. While the LLM was working, I created a (very low-fi) figma prototype. I dropped it into the LLM and had it build presentation components in parallel. Then, they were available later when I was ready to plug them in to the data from the backend.

### what I'd do differently

I think the execution went well considering my initial knowledge. I wasn't aware of frameworks like Vercel/TanStack AI, but had I been, I would have written off the response streaming as simply delegating to these tools. That likely would have gotten me to iterating on the product sooner, and I probably could have shipped a more refined experience. For example, I'd have the chat box auto-scroll!

### scaling up

10k RPH implies 100s of concurrent users, which is substantial. Assuming users spend maybe an hour planning a trip, and plan a single-digit number of trips per year, this is something like hundreds of thousands of users.

- I have no idea how well this actually works, because I'm not booking a trip. I tested it by saying things that I might say while planning a trip, and its responses looked ok. To launch this, we'd need to solve problems people actually have while planning trips, and then build a framework to ensure that the product continues to solve them, even as we iterate on the implementation.
- The model choice is (1) constantly evolving and (2) should be based in measurable outcomes. My choice of Qwen 3.8 27B, which is cheap and yielded reasonable output, didn't exist a few months ago. It's critical to establish an evaluation platform--say, golden UX journeys, run against the actual service, with some kind of judge evaluating them. The model choice is a balance between intelligence and cost.
- The schema is rudimentary. There's no actual trip booking in my prototype, and a lot of things are hand-waved: should we represent things like tentative dates for flight searching? How do you represent a location--a city, a national park, Disney World? A lot of this is constrained by the mechanics of booking trips, which don't exist in my prototype.

## annotated highlights

Agent transcripts were trimmed for brevity by LLM.

### AI integration library

Initially, I was planning to write my own streaming chat endpoint using trpc. When I got to that point, the LLM suggested @vercel/ai. While I was concerned that the abstraction could be a mismatch, I made the call that (1) I was building a chat app, so it was probably close, and (2) I needed to save time to be on track to deliver the core feature set. I did a quick search and pointed the LLM at @tanstack/ai, suspecting a better integration with the rest of TanStack. In this environment, stability guarantees and small bugs were not a concern.

My approach was to build a deep, end-to-end thread as quickly as possible, and then flesh out as many features as I could.

> **LLM:** "The tool loop is the hard part. … I'd use the Vercel AI SDK with OpenRouter's AI SDK provider rather than writing this by hand."

> **Me:** sgtm, is tanstack/ai a good fit for this? https://tanstack.com/ai otherwise, I'll look at vercel ai

> **LLM:** "TanStack AI fits this project well, and I'd lean toward it over Vercel AI. The main risk is that it's still pre-1.0. … If TanStack AI's churn starts to hurt, switching is cheap because the design is the same. … I'd drop the "tRPC streaming endpoint using SSE" item. Make the chat a Start server route (/api/chat) … Keep tRPC for reading the profile and todo list"

> **Me:** let's try it; designed for tanstack seems good. install and do a barebones integration as per the docs + skills. tear down todo-app ui as you encounter it. bare minimum ui: box for input, show raw output. stop if you need to make significant decisions.

### parallelizing

I wanted to optimize for prototyping speed, so I tried to pair tasks that required fiddling with the code with those that required some human discretion. This allowed me to think about stuff while the LLM was executing changes in parallel.

For example, I was able to draw a mockup while the LLM did one task, then have it implement UI while I reviewed the previous output. Later, I had it use subagents to knock out non-overlapping UI tasks: markdown rendering for chat and the Trip Plan widget. Thanks to the visual reference and existing conversation data, these changes were quickly verified and accepted.

> **Me:** while I'm reviewing this code, sketch out some barebones components for this UI mock: conversation bubbles, the input box, the trip plan view: [Image #1]. later, we'll wire it up.

> **LLM:** "These are presentational components that take props, not wired to anything … I'll also add a throwaway /preview route with mock data, so I can screenshot it against your design … I won't touch the files you're reviewing."

> **Me:** can you kick off a subagent to add remark's react markdown for rendering response text? then, can you discuss how we add tool calls for (1) writing plan items, and (2) calling a mock getDestinationInfo tool like this: [DestinationInfo type] … also kick off a subagent to integrate the trip plan component in place of the raw json.

> **LLM:** "I'll start both subagents in parallel in this working tree, each owning separate files so they don't collide. … I'll build [the tools] after the two subagents finish, since both tools touch /api/chat"

### schema iteration

I asked the LLM to propose a DB schema before implementing. Here, it suggested that a trip profile should have a list of generic attributes with string-typed data. I pushed back and suggested a fixed set of strongly-typed attributes encoded directly into the profile object. My rationale was that, eventually, a conventional backend needs a certain set of data to reliably execute bookings. Not only do we need that data in a predictable format, but we also need the chat agent to actually *collect* that data, and not spin for an hour collecting miscellaneous details about the trip. I also trimmed off some of the LLM's fields as unnecessary for a prototype.

> **LLM:** "The main design choice is to put the trip profile and the priorities in one table, so the todo list can't drift from what's actually been learned. … `key String // "where", "when", "budget", ... the model may add new ones` … A typed TripProfile with a column per field plus a separate priorities table would give real types … But the model couldn't add new topics (say, "accessibility needs"), and priorities would sit in a second table that can drift from the profile."

> **Me:** agreed on (2) and (3). was originally thinking typed profile table. at some point, we need some typed/validated data--things like dates, places, budgets, etc. i think we could handle things like accessibility needs as a separate free-form field, maybe "constraints". we kind of want to constrain what the model collects, so it eventually "finishes" a plan. "priorities can drift"--in what way?

> **LLM:** "Concretely, drift means the database holding two answers to "do we know X yet?" … Completion comes only from the profile. The priorities table stores order and "skipped", never "done" … [on vague answers] Leave the field empty until it's specific. The model keeps the vague version in the conversation."

> **Me:** exactly agree with your conclusion. profile is source of truth, priorities is just a sort key. worst case is we get a non-total ordering. for now, let's simplify the model: places are String? (no country code) in the rough shape "City, State, Country", all travellers share a nationality (the "origin"). budget can be freeform String? ("around $2k"). "prisma columns mirror it" is there a really easy way to generate the zod schema from the prisma schema? if not, no worries. great point on vague answers: fields are for things locked in; conversation history can encode initial preferences; at agent's discretion, it can write notes. let's do it.

> **LLM:** "Zod from Prisma: there is a ready-made generator … but I wrote the schema by hand. It's mainly the model's tool input, which needs hand-written descriptions on every field … A compile-time check … breaks the build if the schema and the TripProfile model stop having the same fields"

### Agent tools and conflicts

This was the decision on what to do with conflicting information. This came up naturally when I asked the LLM to implement tools for writing the trip profile data. My goal was to encode conflict handling into the deterministic tool-call: if the agent tries to store a field that's already been "decided" (e.g. vegetarian food but asks for hot dogs), the tool itself reports that the field would be replaced and prompts the agent to clarify with the user. Ultimately, it's up to the agent whether it will set, replace, or unset trip parameters--LLMs are generally good at honoring intent these days. But, we make sure to surface these conflicts deterministically rather than relying on the agent's context window.

The LLM also made some reasonable proposals that I accepted: displaying tool calls in chat, and the tool call limit.

> **LLM:** "Decisions for you
> 1. Write directly, or ask first? … I'd write directly and let the plan card be the visible confirmation, since the model can correct fields later.
> 2. Clearing fields: should update_profile accept null to un-set a field? I'd say yes …
> 3. Showing tool calls in chat: … I'd add a small grey line like "Updated plan: dates, budget" …
> 4. Loop cap: … I'd leave it."

> **Me:** 1. write directly! the tool should, if there's already a preference written, prompt the agent to clarify with the user. we can have a "overwrite" flag. 2. sure! 3. sounds good. 4. ship it.

> **LLM:** ""Actually, can we do June 3–9 instead?": the model passed overwrite: true on its first call. You'd asked outright, so it counted that as confirmation, and there was no round-trip. … [calling the tool directly] A different date without overwrite was refused, with the instruction to ask."

### finishing plans and "Book trip"

It's pretty important that eventually, the agent stops talking and lets you buy things. This motivated my schema design (fixed set of fields) as well as a "book trip" tool call. The LLM suggested that we encode trip validation into the tool, so that the agent can decide "the checklist is done; let's offer a booking", but a deterministic validation process indicates whether it's actually ready to book. I went ahead with this approach, as I think it's a pretty solid way to make sure the conversation gets wrapped up into an actual booked trip.

> **TODO.md**
> - review and book
>   - "your trip is ready!"
>   - review itemized purchases and cost

> **Me:** we kind of want to constrain what the model collects, so it eventually "finishes" a plan.

> **LLM:** "Priority keys are a fixed list … no model-invented topics, which also gives you the "eventually finishes" property: the plan is complete when every field is filled or skipped."

> **Me:** go ahead and commit this. last task: once the agent checks all the boxes, we should have the llm emit a "Book trip" button. super simple and hacky, no-op button.

> **LLM:** "I'll add an offer_booking tool that the model calls once the checklist is complete, rendering as a "Book trip" button (with server-side validation so it can't appear early). … If anything is still open it refuses and names the open items, and no button appears."

> **LLM (system prompt it wrote):** "When every item is done or skipped, summarize the finished plan and call offer_booking so the traveler can book."

