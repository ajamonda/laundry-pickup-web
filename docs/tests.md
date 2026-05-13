# Test Suite — Behavior Pins

You (the agent) are reading this because you are about to change `laundry-pickup-web` code. This doc tells you what the existing tests promise, when you must update them, and where to add new ones. Treat the test files as **executable contracts**, not optional coverage.

## Run before claiming done

```
npm run test:run        # one-shot, used in CI and by you
npm run typecheck       # tsc --noEmit, also part of build
```

If either fails, the change is not done. Do not silence a failing assertion by editing the assertion to match new behavior unless the behavior change was the explicit goal — and in that case, update this doc too.

## Stack

- **vitest** (jsdom) — test runner
- **@testing-library/react** + **user-event** — DOM interaction; prefer role/label queries over class names
- **MSW (node)** — intercepts `fetch` to `*/api/...`; handlers in `src/test/msw/handlers.ts`
- Fresh `QueryClient` per render (`renderWithProviders`); zustand store reset in `beforeEach` (`src/test/setup.ts`)

## What is pinned right now

These are the behaviors that have a failing test if you break them. Each row points at the test and the production code it guards.

| Pinned behavior | Test | Guards code at |
|---|---|---|
| `addBag` deduplicates by `bagBarcode` (no toggling) | `src/store.test.ts` → "addBag is idempotent…" | `src/store.ts:30` |
| `updateBagStatus` only mutates the target bag | `src/store.test.ts` → "updateBagStatus only changes…" | `src/store.ts:37` |
| `clearRun` wipes run/vehicle/bags but **keeps session** | `src/store.test.ts` → "clearRun resets…" | `src/store.ts:44` |
| Pickup work screen pre-checks every order item on detail load | `PickupWorkScreen.test.tsx` → "defaults all items…" | `PickupWorkScreen.tsx:33–37` |
| Bag `<select>` excludes `CONTAIN` and `TAKE_BACK` bags | `PickupWorkScreen.test.tsx` → "only lists TAKE_OUT…" | `PickupWorkScreen.tsx:66` |
| On put-items success, store flips that bag to `CONTAIN` and `onDone` fires | `PickupWorkScreen.test.tsx` → "on put-items success…" | `PickupWorkScreen.tsx:57–62` |
| Handoff screen renders one "공장 인도" button per `CONTAIN` bag | `HandoffScreen.test.tsx` → "only renders a handoff button…" | `HandoffScreen.tsx:65–91` |
| Handoff success flips **only** the target bag to `TAKE_BACK` | `HandoffScreen.test.tsx` → "handoff success only flips…" | `HandoffScreen.tsx:20–24` |
| "모든 백 인도 완료" notice + `clearRun` when no CONTAIN remains and ≥1 TAKE_BACK | `HandoffScreen.test.tsx` → "shows completion notice…" | `HandoffScreen.tsx:28, 47–52` |

If your change touches any "Guards code at" line, the test is the contract — keep it green, or update it deliberately and amend the row above.

## What is intentionally NOT covered

The MVP test suite covers only the **client-side bag state machine** and the two screens that mutate it. The following are intentionally out of scope; do not add tests here unless you have a specific bug to lock in:

- `LoginScreen`, `RequestListScreen`, `RequestDetailScreen`, `RunSetupScreen` — mostly read-only or trivial wiring; bugs surface immediately in dev.
- `utils.ts` — formatting only.
- `api.ts` request helper — exercised transitively by component tests.
- `App.tsx` step routing — simple `useState` switch.
- Visual / layout / styling.
- Backend contract (negative status codes, error messages) — that is the harness's job, not unit tests. See `harness.md`.

If you find yourself wanting to add a unit test in one of these areas, first check whether the bug belongs in `harness.md` as a scenario, or in the backend repo.

## Where to add a new test

Add a test when **and only when** your change introduces a new client-side rule that is not obvious from reading the code. Examples that warrant a test:

- New state in `store.ts` (a new bag status, a new persisted field that interacts with `clearRun`).
- New filter or default-selection rule in a screen that already has a `.test.tsx`.
- A fix for a regression — write the failing test first, then fix.

Examples that do **not** warrant a test:
- Renaming a label, restyling, copy changes.
- Adding a new screen that only reads server data and renders.
- Adding error-surface UI when an existing error path already shows `ErrorNotice`.

## Conventions

- **Query by role/label, not class.** `getByRole('button', { name: '공장 인도' })`, not `container.querySelector('.buy-button')`. CSS is not contract.
- **Assert on store + callback, not on DOM, when verifying mutations.** The DOM may re-render asynchronously via React Query; the store update + `onDone` mock is the deterministic signal.
- **Override MSW per-test for failure cases.** `server.use(http.post('*/api/...', () => HttpResponse.json({message:'…'}, {status:409})))` inside the test — never edit the default handlers.
- **Don't read `localStorage` in tests.** Read `useAppStore.getState()` instead; persistence is an implementation detail of zustand.
- **No `waitFor` on a literal sleep.** Wrap the actual assertion in `waitFor` and let it poll.

## Fixtures

`src/test/fixtures.ts` is the single source of sample server responses. If your code change requires a new response shape, **add to fixtures, do not inline literals in the test** — multiple tests should agree on what a "valid response" looks like.

## When this doc lies

If a row in "What is pinned right now" no longer matches the actual test (file moved, assertion deleted, behavior intentionally changed), fix this doc in the same PR. A stale pin table is worse than no pin table because it lies to the next agent.
