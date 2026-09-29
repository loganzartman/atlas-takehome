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

- [ ] create openrouter account
- [ ] put API key into local env
- [ ] add model config to env

### e2e

- [ ] request a response from llm, dump to frontend
- [ ] server route using @tanstack/ai chat adapter
- [ ] _stream_ the response from llm

### trip-builder

- [ ] call a dummy tool from LLM
- [ ] recompute "TODO list" for LLM system prompt each turn
- [ ] instruct LLM to invoke `update-profile` tool 
