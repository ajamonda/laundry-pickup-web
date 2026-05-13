# laundry-pickup-web — Agent Brief

You (the agent) are about to harness this app. Read this first. It tells you what the app is, where the authoritative facts live, and which doc to open next.

## What this app is

A staff-facing React + Vite SPA for **pickup operators**. They:

1. Log in as `PICKUP` staff (dev-login).
2. Browse today's pickup requests from customers.
3. Start a pickup *run* with a vehicle, attach barcoded *bags* to it.
4. Drive to customer addresses, photograph the pickup spot, load that customer's items into a specific bag.
5. Return to the factory and hand off each bag.

State machine driven entirely by backend domain actions; the FE does no status math.

## Place in the monorepo

```
laundry-service-prototype/
├─ laundry-api/                 backend (NestJS modular monolith)
│  ├─ src/modules/pickup/       this app's only domain dependency
│  ├─ src/modules/auth/         dev-login endpoints
│  ├─ prisma/seed.ts            seed data we rely on
│  └─ docs/pickup/README.md     AUTHORITATIVE pickup contract
├─ laundry-user-web/            customer app — creates the orders we pick up
└─ laundry-pickup-web/          ← you are here
   ├─ src/
   │  ├─ App.tsx                AppStep machine
   │  ├─ api.ts                 fetch wrapper + endpoint fns
   │  ├─ types.ts               FE response types (one per endpoint)
   │  ├─ store.ts               zustand persisted state (localStorage)
   │  └─ components/            one file per AppStep screen
   └─ docs/
      ├─ README.md              ← you are reading this
      ├─ contracts.md           endpoint↔fn↔type↔component table, errors, seed
      ├─ harness.md             scenarios with concrete assertions
      └─ tests.md               in-repo vitest suite: what is pinned, when to update
```

## Where truth lives — open these directly, do not paraphrase them

| Question | File |
|---|---|
| Pickup domain state machine, table schema | `laundry-api/docs/pickup/README.md` |
| Auth domain (JWT shape, guards) | `laundry-api/docs/auth-actor/README.md` |
| HTTP routes for pickup | `laundry-api/src/modules/pickup/interfaces/http/pickup.controller.ts` |
| Verbatim error messages + transition rules | `laundry-api/src/modules/pickup/infrastructure/prisma-pickup.repository.ts` |
| FE request payloads & response decoding | `laundry-pickup-web/src/api.ts` + `src/types.ts` |
| FE persisted state shape | `laundry-pickup-web/src/store.ts` |
| Seed values (vehicles, bags) | `laundry-api/prisma/seed.ts` |

If a fact in this `docs/` folder ever conflicts with one of those files, the file wins. These docs are an index, not a source.

## Next steps

- For "what can I call and what comes back": **contracts.md**.
- For "how do I drive an end-to-end run and what do I assert": **harness.md**.
- For "what does the in-repo test suite already pin, and when must I update it": **tests.md**. Open this whenever you are about to modify `src/store.ts`, `src/components/PickupWorkScreen.tsx`, or `src/components/HandoffScreen.tsx`.

## Conventions used in these docs

- `path/to/file.ts:LN` means line `LN` of that file is the relevant authority.
- "Backend says" = exception/text from `prisma-pickup.repository.ts`.
- "FE assumes" = behavior implemented in `src/`. Where backend and FE disagree, harness.md → "Known drifts" calls it out.
