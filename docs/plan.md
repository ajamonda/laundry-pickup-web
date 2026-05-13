# Pickup Web Harness Plan

## Purpose

Pickup web is the operator-facing app for collecting customer laundry into pickup bags and handing those bags off to the factory. The point of this harness is to prove that pickup actions update order / item / bag / location state **together**.

## Actor

- Staff, role `PICKUP`
- Login: dev-login accepting only `staffId` (see [auth-api.md](./auth-api.md))

## Screens

- Login
- Today's pickup request list / detail
- Vehicle selection + run creation
- Bag barcode registration
- On-site photo capture (or URL entry)
- Item checklist → load into bag
- Factory handoff

## Harness Scenarios (assertions worth proving)

- Only today's or overdue requests are shown.
- Bag registration moves `READY → TAKE_OUT`.
- Loading items into a bag that is not `TAKE_OUT` is rejected.
- Loading multiple items from one order transitions every selected item to `PICK_UP`.
- Display uses `displayNameSnapshot`, not the live catalog master.
- A photo reference is captured before completing pickup.
- Orders with `secondHandPickupRequested = true` are visible to the operator.
- Factory handoff transitions bag, order, and item location atomically.

## Frontend Invariants

- No catalog option configuration, no price recalculation here.
- Customer-submitted photos and option snapshots are shown for comparison.
- Pickup/handoff are domain action calls — never direct status edits.
- On failure, keep the request visible with the server's previous state.

API details and status transitions: [pickup-api.md](./pickup-api.md).
