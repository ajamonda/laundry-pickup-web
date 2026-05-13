# Contracts

Everything you need to call this app's APIs correctly. For prose explanation, see `laundry-api/docs/pickup/README.md`. This file is a lookup table — keep it dense.

Base URL via `VITE_API_BASE_URL` (default `/api`, proxied by Vite to `http://localhost:3000`).

## Seed data the harness can rely on

From `laundry-api/prisma/seed.ts`:

| Kind | Values | Initial state |
|---|---|---|
| Pickup vehicles | `PICKUP-VAN-01`, `PICKUP-VAN-02`, `PICKUP-VAN-03` | `active: true` |
| Pickup bags | `PICKUP-BAG-001` … `PICKUP-BAG-010` | `status: READY`, no run |
| Catalog items | `shirt`, `pants`, `sneakers`, `ugg_boots`, `accessory_shirt`, `tent`, `lifestyle_laundry` | — |

Staff/customer records are **created on first dev-login** (`findOrCreateStaff` in `staff-dev-login.use-case.ts:15`, same for customer). So `staff-1`, `customer-1` or any other id works without a separate seed step.

Orders in `REQUEST` state must be created via the **customer flow** (`POST /orders` after `POST /auth/customer/dev-login`) — pickup web does not own that endpoint. Harness setup must drive `laundry-user-web` or hit the API directly.

## Auth

| Endpoint | Purpose | Notes |
|---|---|---|
| `POST /auth/staff/pickup/dev-login` | Used by this app | Body `{staffId: string}`. Returns `StaffSession`. Role is decided by URL, not body. |
| `POST /auth/customer/dev-login` | Setup-only | Used by harness to create the customer that owns the order. |

JWT payload: `{ subjectType: "STAFF"|"CUSTOMER", staffId|customerId, staffRole? }`. Pickup endpoints accept `staffRole ∈ {PICKUP, ADMIN}`. Anything else → `403`.

Header on every protected call: `Authorization: Bearer ${accessToken}`. Wired in `src/api.ts:92` (`request()`).

## Endpoint ↔ FE wiring

All `/pickup/*` use `StaffAuthGuard` + `@StaffRoles('PICKUP')`. Authority for endpoint list: `pickup.controller.ts`.

| HTTP | Path | `api.ts` fn | Response type (`types.ts`) | Component that calls it | AppStep |
|---|---|---|---|---|---|
| POST | `/auth/staff/pickup/dev-login` | `staffDevLogin` | `StaffSession` | `LoginScreen` | `login` |
| GET | `/pickup/requests?page&pageSize` | `getPickupRequests` | `PickupRequestsResponse` | `RequestListScreen` | `requests` |
| GET | `/pickup/requests/:orderId` | `getPickupRequestDetail` | `PickupRequestDetail` | `RequestDetailScreen`, `PickupWorkScreen` | `request-detail`, `pickup-work` |
| POST | `/pickup/runs` | `createRun` | `PickupRun` | `RunSetupScreen` | `run-setup` |
| POST | `/pickup/runs/:runId/bags` | `registerBag` | `PickupBagResult` | `RunSetupScreen` → `BagScanner` | `run-setup` |
| POST | `/pickup/requests/:orderId/photos` | `recordPhoto` | `PickupPhotoResult` | `PickupWorkScreen` | `pickup-work` |
| POST | `/pickup/bags/:bagBarcode/items` | `putItemsIntoBag` | `PickupContainmentResult` | `PickupWorkScreen` → `ItemChecklist` | `pickup-work` |
| POST | `/pickup/bags/:bagBarcode/handoff` | `handoffBag` | `PickupHandoffResult` | `HandoffScreen` | `handoff` |

Backend trims+uppercases `vehicleCode`. FE URL-encodes `:bagBarcode` (api.ts:78, 85). FE pageSize cap (backend): 50.

## Domain transitions (effect of each POST)

Authority: `prisma-pickup.repository.ts`.

| Call | Bag | Order | Item.status | Item.location |
|---|---|---|---|---|
| `registerBag` | `READY → TAKE_OUT` (binds to run) | — | — | — |
| `recordPhoto` | — | — | — | — (just records row) |
| `putItemsIntoBag` | `TAKE_OUT → CONTAIN` | `REQUEST → PICK_UP` | `INIT → PICK_UP` | `CUSTOMER_PICK_UP → PICK_UP_TRUCK` |
| `handoffBag` | `CONTAIN → TAKE_BACK` | `PICK_UP → PROCESSING` (each order in bag) | — | `PICK_UP_TRUCK → IN_HOUSE` |
| (run-level) | — | — | — | run flips `ACTIVE → COMPLETED` after last bag's handoff |

## Preconditions enforced by backend (will reject otherwise)

`putItemsIntoBag`:
- active run owned by this staff exists
- bag exists, `active`, `currentRunId === runId`, `status === TAKE_OUT`
- **at least one `PickupPhoto` row exists for (orderId, runId)** ← FE UI says optional, backend says required
- order exists, `status === REQUEST`
- `itemIds` are unique, non-empty, and **equal the full set** of `order.items` (MVP: no partials)
- every item is `status:INIT` and `location:CUSTOMER_PICK_UP`
- no item is already in any pickup bag

`handoffBag`:
- bag is registered to this run, `status === CONTAIN`, has ≥1 contained item

`createRun`:
- vehicle exists and `active`
- staff has no other `ACTIVE` run
- vehicle is not on another `ACTIVE` run

## Error catalog (verbatim, for negative assertions)

Source: `prisma-pickup.repository.ts` (line refs approximate).

| Status | Message | When |
|---|---|---|
| 400 | `Active pickup vehicle was not found.` | bad/inactive vehicleCode on createRun |
| 400 | `Pickup staff was not found.` | staff row absent (rare; dev-login creates it) |
| 409 | `Staff already has an active pickup run.` | staff has unclosed run |
| 409 | `Pickup vehicle is already in use.` | vehicle on another active run |
| 400 | `Active pickup bag was not found.` | bad barcode on registerBag |
| 409 | `Pickup bag must be READY.` | registerBag on non-READY bag |
| 404 | `Pickup request order was not found.` | unknown orderId (put-items / detail) |
| 400 | `Item ids must be unique and non-empty.` | bad payload |
| 400 | `Pickup bag is not registered to this run.` | bag/run mismatch |
| 409 | `Pickup bag must be TAKE_OUT.` | put-items on wrong bag state |
| 400 | `Pickup photo is required before bag containment.` | put-items with zero photos |
| 409 | `Order must be REQUEST.` | order past REQUEST |
| 400 | `MVP pickup requires all order items.` | partial itemIds |
| 409 | `Order items must be INIT and CUSTOMER_PICK_UP.` | item not in correct state |
| 409 | `One or more items are already in a pickup bag.` | re-bag |
| 409 | `Pickup bag must be CONTAIN.` | handoff on wrong state |
| 409 | `Pickup bag has no contained items.` | handoff on empty bag |
| 400 | `Active pickup run was not found.` | run closed/missing on bag ops |
| 404 | `Pickup request not found.` | detail on unknown orderId (`get-pickup-request-detail.use-case.ts:13`) |
| 401 | (default) | missing/expired token |
| 403 | (default) | role mismatch |

## Response shapes — do not duplicate, read `src/types.ts`

For full TypeScript types of every response field, open `laundry-pickup-web/src/types.ts`. Key types:
`StaffSession`, `PickupRequestSummary`, `PickupRequestsResponse`, `PickupRequestItem`, `PickupRequestDetail`, `PickupRun`, `PickupBagResult`, `PickupContainmentResult`, `PickupHandoffResult`, `PickupPhotoResult`.

If a response field name disagrees with what you remember, `types.ts` is right. Examples of FE field choices that bit earlier docs:
- Run uses `runId` (not `id`) and `vehicle: {code, displayName}` (not flat `vehicleCode`).
- Bag uses `barcode` field + separate `bagId`. List items use `itemCount`, not embedded `items[]`.
- Paging: `totalCount` + `totalPages`, not `total`.

## FE persisted state

`src/store.ts` (zustand+persist, localStorage key `laundry-pickup-web-state`):

```ts
{ session, runId, vehicleCode, registeredBags: { bagBarcode, status }[] }
```

Harness reset: delete that localStorage key OR call `setSession(null)` + `clearRun()`.

The FE keeps a local `registeredBags[]` cache and updates `bag.status` optimistically on `putItemsIntoBag` success (`PickupWorkScreen.tsx:58`). Backend is still authoritative — re-fetch to verify.
