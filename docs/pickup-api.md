# Pickup API Notes

Backend: `http://localhost:3000` · Swagger: `/docs` · Auth: staff `PICKUP` (or `ADMIN`) · Header: `Authorization: Bearer {accessToken}`

Response shapes below mirror `src/types.ts`. If you change one, change the other.

---

## GET /pickup/requests

List of pickup requests to process today. Items are not included — use the detail endpoint.

Query: `page` (default 1) · `pageSize` (default 20, max 50)

Response:

```json
{
  "items": [
    {
      "orderId": "...",
      "customerId": "...",
      "status": "REQUEST",
      "pickupSchedule": "2026-05-11T10:00:00.000Z",
      "address": "...",
      "phoneNumber": "010-0000-0000",
      "pickupDeliveryPlaceCode": "front_door",
      "pickupDeliveryPlaceText": null,
      "secondHandPickupRequested": false,
      "itemCount": 3,
      "createdAt": "..."
    }
  ],
  "page": 1,
  "pageSize": 20,
  "totalCount": 5,
  "totalPages": 1
}
```

UI:

- `pickupDeliveryPlaceCode`: `front_door` (at the door) / `security_office` (security desk) / `custom_place_text` → show `pickupDeliveryPlaceText`.
- Highlight `secondHandPickupRequested = true` with a badge.

---

## GET /pickup/requests/:orderId

Pickup request detail with items, customer inputs, and photos.

Response:

```json
{
  "orderId": "...",
  "customerId": "...",
  "status": "REQUEST",
  "pickupSchedule": "...",
  "address": "...",
  "phoneNumber": "...",
  "fulfillmentType": "DELIVERY",
  "fulfillmentOptionCode": "regular_delivery",
  "pickupDeliveryPlaceCode": "front_door",
  "pickupDeliveryPlaceText": null,
  "secondHandPickupRequested": false,
  "items": [
    {
      "itemId": "...",
      "catalogItemCode": "shirt",
      "displayNameSnapshot": "Shirt",
      "status": "INIT",
      "location": "CUSTOMER_PICK_UP",
      "options": [
        { "groupCodeSnapshot": "cleaning_method", "optionCodeSnapshot": "regular_wash", "displayNameSnapshot": "Regular Wash" }
      ],
      "inputs": [{ "inputCode": "characteristics_text", "inputValue": "stain on sleeve" }],
      "photoUrls": []
    }
  ]
}
```

UI:

- `displayNameSnapshot` is the label captured at submission time — do not re-read the catalog master.
- Always show `photoUrls` so staff can compare on site.

---

## POST /pickup/runs

Register a vehicle and start today's run.

Request: `{ "vehicleCode": "PICKUP-VAN-01" }` (seeded codes: `PICKUP-VAN-01`, `PICKUP-VAN-02`, `PICKUP-VAN-03`. Backend trims and uppercases.)

Response:

```json
{
  "runId": "...",
  "vehicle": { "code": "PICKUP-VAN-01", "displayName": "Pickup Van 01" },
  "staffId": "staff-1",
  "status": "ACTIVE",
  "startedAt": "..."
}
```

All subsequent bag/handoff calls require `runId`.

---

## POST /pickup/runs/:runId/bags

Attach a bag barcode to the run. `READY → TAKE_OUT`.

Request: `{ "bagBarcode": "BAG-001" }`

Response:

```json
{ "bagId": "...", "barcode": "BAG-001", "status": "TAKE_OUT", "runId": "..." }
```

Errors: `404` bag not found · `409` bag is not in `READY`.

---

## POST /pickup/requests/:orderId/photos

Record an on-site photo reference for the order.

Request: `{ "runId": "...", "photoUrl": "https://..." }`

Response:

```json
{ "photoId": "...", "orderId": "...", "runId": "...", "staffId": "...", "photoUrl": "...", "createdAt": "..." }
```

For MVP, accepting a URL string directly is fine.

---

## POST /pickup/bags/:bagBarcode/items

Load one order's items into the bag.

- Order: `REQUEST → PICK_UP`
- Item: `INIT → PICK_UP`, location `CUSTOMER_PICK_UP → PICK_UP_TRUCK`
- Bag: `TAKE_OUT → CONTAIN`

Request: `{ "runId": "...", "orderId": "...", "itemIds": ["...", "..."] }`

Response:

```json
{
  "runId": "...",
  "bag": { "bagId": "...", "barcode": "BAG-001", "status": "CONTAIN", "runId": "..." },
  "order": { "orderId": "...", "status": "PICK_UP" },
  "items": [{ "itemId": "...", "status": "PICK_UP", "location": "PICK_UP_TRUCK" }]
}
```

Errors: `409` bag is not in `TAKE_OUT`.

---

## POST /pickup/bags/:bagBarcode/handoff

Hand the bag off at the factory. Called per bag.

- Order: `PICK_UP → PROCESSING`
- Item location: `PICK_UP_TRUCK → IN_HOUSE`
- Bag: `CONTAIN → TAKE_BACK`

Request: `{ "runId": "..." }`

Response:

```json
{
  "runId": "...",
  "runStatus": "ACTIVE | COMPLETED",
  "bag": { "bagId": "...", "barcode": "BAG-001", "status": "TAKE_BACK", "runId": "..." },
  "orders": [{ "orderId": "...", "status": "PROCESSING" }],
  "items": [{ "itemId": "...", "status": "PICK_UP", "location": "IN_HOUSE" }]
}
```

`runStatus = COMPLETED` once every bag in the run is handed off.

---

## Status Flow Summary

```
Order:    REQUEST → PICK_UP (put-items) → PROCESSING (handoff)
Item:     INIT → PICK_UP (put-items)
Location: CUSTOMER_PICK_UP → PICK_UP_TRUCK (put-items) → IN_HOUSE (handoff)
Bag:      READY → TAKE_OUT (register) → CONTAIN (put-items) → TAKE_BACK (handoff)
```
