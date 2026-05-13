# Harness Scenarios

How to drive `laundry-pickup-web` end-to-end and what to assert. Pair this with `contracts.md` (endpoint reference) and `laundry-api/docs/pickup/README.md` (domain authority).

## AppStep machine (from `src/App.tsx`)

```
            ┌──────────┐
  login → requests ⇄ request-detail → pickup-work ──┐
            │                                       │
            ├─→ run-setup ──────────────────────────┘
            └─→ handoff
```

`session` survives reload (persisted). `step` is in-memory and starts at `login` if no session, else `requests`. `selectedOrderId` is in `App.tsx` local state — lost on reload.

## Test environment setup

1. Backend up: `cd laundry-api && npm run start:dev` (`http://localhost:3000`, swagger at `/docs`).
2. Backend seeded: `cd laundry-api && npx prisma db seed` (idempotent — vehicles/bags upsert).
3. FE up: `cd laundry-pickup-web && npm run dev`.
4. Clean state: clear localStorage key `laundry-pickup-web-state`.
5. **Order fixture**: at least one customer order must exist in `REQUEST` status with items in `INIT`/`CUSTOMER_PICK_UP`. Create it by:
   - `POST /auth/customer/dev-login {customerId:"customer-1"}` → token
   - `POST /auth/customer/me/profile {phoneNumber, address}` (if needed)
   - `POST /orders` with valid catalog items (see `laundry-user-web` or `laundry-api/docs/catalog-pricing/`)

## Happy path — full run, one bag, one order

Each step lists: **call**, then **assert on response**, then **re-fetch verification** (to confirm persistence, not just echo).

| # | Step | Call | Assert (response) | Re-fetch |
|---|---|---|---|---|
| 1 | Login | `POST /auth/staff/pickup/dev-login {staffId}` | `staff.role==="PICKUP"`, `accessToken` non-empty | — |
| 2 | List | `GET /pickup/requests` | target `orderId` present, `status==="REQUEST"`, `itemCount>0` | — |
| 3 | Detail | `GET /pickup/requests/:orderId` | every `items[i].status==="INIT"`, `location==="CUSTOMER_PICK_UP"`; `displayNameSnapshot` non-empty | — |
| 4a | Run | `POST /pickup/runs {vehicleCode:"PICKUP-VAN-01"}` | `runId` present, `status==="ACTIVE"`, `vehicle.code==="PICKUP-VAN-01"` | — |
| 4b | Bag | `POST /pickup/runs/:runId/bags {bagBarcode:"PICKUP-BAG-001"}` | `status==="TAKE_OUT"`, `runId` matches | — |
| 5 | Photo | `POST /pickup/requests/:orderId/photos {runId, photoUrl}` | 200, `photoId` present | — |
| 6 | Put items | `POST /pickup/bags/PICKUP-BAG-001/items {runId, orderId, itemIds:[ALL items from step 3]}` | `bag.status==="CONTAIN"`, `order.status==="PICK_UP"`, every `items[i].status==="PICK_UP"`, `location==="PICK_UP_TRUCK"` | `GET /pickup/requests/:orderId` → same state from server |
| 7 | Handoff | `POST /pickup/bags/PICKUP-BAG-001/handoff {runId}` | `bag.status==="TAKE_BACK"`, every `orders[i].status==="PROCESSING"`, every `items[i].location==="IN_HOUSE"`, `runStatus==="COMPLETED"` (only bag in run) | `GET /pickup/requests` → order no longer in list (status past REQUEST) |

**Atomicity invariant**: in step 6 the bag transition, order transition, every item status, and every item location flip in one response — assert all together, not piecewise. Same in step 7.

## Negative scenarios

Each maps 1:1 to a backend error (see contracts.md). Run in isolation against a fresh seeded state unless noted.

| Scenario | Setup | Call | Expect |
|---|---|---|---|
| Wrong role | Token from `/auth/staff/wash/dev-login` | any `/pickup/*` | `403` |
| Stale token | Tamper or wait | any `/pickup/*` | `401` |
| Unknown vehicle | — | `createRun {vehicleCode:"X"}` | `400 Active pickup vehicle was not found.` |
| Double run | Run already active | `createRun` again same staff | `409 Staff already has an active pickup run.` |
| Vehicle in use | Other staff has run on PICKUP-VAN-01 | `createRun {vehicleCode:"PICKUP-VAN-01"}` | `409 Pickup vehicle is already in use.` |
| Unknown bag | — | `registerBag {bagBarcode:"NOPE"}` | `400 Active pickup bag was not found.` |
| Re-register bag | Bag already TAKE_OUT | `registerBag` same barcode | `409 Pickup bag must be READY.` |
| Put-items, no photo | Skip step 5 | step 6 | `400 Pickup photo is required before bag containment.` |
| Put-items, partial | Send subset of itemIds | step 6 | `400 MVP pickup requires all order items.` |
| Put-items twice | After successful step 6 | step 6 again | `409 Pickup bag must be TAKE_OUT.` *(bag is now CONTAIN; this fires before re-bag check)* |
| Put-items, dup item across bags | Two bags, same items | second call | `409 One or more items are already in a pickup bag.` |
| Handoff empty bag | Register only, no put-items | step 7 | `409 Pickup bag must be CONTAIN.` |
| Detail unknown | — | `GET /pickup/requests/no-such` | `404 Pickup request not found.` |

## FE invariants worth spot-checking

Inspect code, not just responses:

- No catalog or pricing call anywhere in `src/` — `grep -r "catalog\|pricing\|estimate" src/` should be empty.
- No status string is constructed client-side — `grep -rn "PICK_UP\|TAKE_OUT\|CONTAIN" src/` only in `types.ts`, `store.ts` literal unions, and rendering paths that read server data.
- `displayNameSnapshot` from response is what gets rendered (`ItemList.tsx`, `ItemChecklist.tsx`) — never re-derived from `catalogItemCode`.
- On `ApiError`, components surface via `ErrorNotice` and do NOT mutate query cache (mutations don't call `setQueryData` with synthetic data).

## Known FE ↔ BE drifts (real bugs the harness should catch)

1. **Photo "optional" lie** — `PickupWorkScreen.tsx:132–134` UI says photo registration is optional and lets you skip. Backend rejects put-items without a photo (`prisma-pickup.repository.ts:260`). Harness must reproduce and flag.

2. **No 401 auto-logout** — `src/api.ts` throws `ApiError(401, ...)` and components surface it as a generic error. Session is not cleared, user is not bounced to login. Verify whether this is intended; flag if not.

3. **Optimistic local bag status** — `PickupWorkScreen.tsx:58` calls `updateBagStatus(selectedBag, 'CONTAIN')` on success without re-reading from server. If the backend response shape ever omits the bag, local cache is the only place the new status lives. Re-fetch in harness to confirm authoritative state. *(This FE-side flip is pinned by `PickupWorkScreen.test.tsx` — see `tests.md`. Don't silently remove the local update.)*

## Relationship to the in-repo vitest suite

`tests.md` describes a small client-side vitest suite that pins behaviors a backend harness cannot see: bag deduplication, default item selection, the `TAKE_OUT`-only bag filter, the optimistic local status flips on put-items/handoff success, and the `clearRun`-preserves-session rule. Those tests are the contract for those FE behaviors; this doc remains the contract for backend-driven transitions.

Before modifying `src/store.ts`, `src/components/PickupWorkScreen.tsx`, or `src/components/HandoffScreen.tsx`, open `tests.md` first and check the pin table.

When adding a new scenario, ask: does it assert a *transition fired together*, or does it only check one field? Single-field assertions miss the whole point of this app — every action is a coordinated multi-table write.

## Quick reset between scenarios

```ts
// in browser devtools
localStorage.removeItem('laundry-pickup-web-state');
location.reload();
```

Backend reset: re-run `npx prisma migrate reset && npx prisma db seed` in `laundry-api/` (destroys data).
