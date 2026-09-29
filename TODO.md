## user flows

i want to plan a trip! 
it would be nice if i could just talk to a travel agent who knows everything about everywhere!

- intro
  - do you have a date or place in mind?
    - yes: record either date or place, leave other undetermined
    - no: what do you want to do or see?

if i have a time or place in mind, that's the priority. figure out the rest.

if i want to do a certain thing, that's the priority. figure out the rest.

i want to know how my planning is going
- todo list
  - shows things we've figured out
  - shows things "up next"

### stretch

- trip snapshot
  - graphic/multimedia display of current trip profile
    - where => cover photo
    - when => date
    - budget ("for under $2k")
      - hide for high rollers? :P
    - where + when => weather
- vibes chooser
  - user expresses a non-specific preference; LLM invents a set of multimedia cards
    - e.g. "warm places", "mediterranean food"
- review and book
  - "your trip is ready!"
  - review itemized purchases and cost

## data model

- trip profile
  - where
  - when
  - budget
  - nationality
  - visa
  - activity prefs
  - food prefs
- todo list
  - prioritized list of things to find out
  - e.g. budget, food prefs, ...
  - initialize to default, allow model to adjust
  - model is reminded at each step

### db modeling

don't model users. the user gets their own db (not a bad idea with sqlite...)

- [ ] conversation
  - [ ] message history
  - [ ] trip profile
  - [ ] todo list

## llm integration

### access

- [x] create openrouter account
- [x] put API key into local env
- [x] add model config to env

### e2e

- [x] request a response from llm, dump to frontend
- [x] server route using @tanstack/ai chat adapter
- [x] _stream_ the response from llm

### trip-builder

- [ ] call a dummy tool from LLM
- [ ] recompute "TODO list" for LLM system prompt each turn
- [ ] instruct LLM to invoke `update-profile` tool 
