# Auth API Notes for Pickup Web

## Backend

- Base URL: `http://localhost:3000`
- Swagger: `http://localhost:3000/docs`
- Auth type: staff
- Required role: `PICKUP`
- Token usage: `Authorization: Bearer {accessToken}`

## Pickup Staff Dev Login

`POST /auth/staff/pickup/dev-login`

Request:

```json
{
  "staffId": "staff-1"
}
```

Response:

```json
{
  "accessToken": "jwt-token",
  "staff": {
    "staffId": "staff-1",
    "role": "PICKUP",
    "displayName": null,
    "phoneNumber": null
  }
}
```

Frontend behavior:

- Store `accessToken` after login.
- Store `staff.staffId` and `staff.role` for the current session.
- This app should call the pickup staff login endpoint only.
- Do not let users choose a role in the request body. The endpoint determines the role.

## Protected API Calls

Headers:

```text
Authorization: Bearer {accessToken}
```

Access expectations:

- Pickup APIs accept staff role `PICKUP`.
- Staff role `ADMIN` is also allowed by the backend role guard when an API declares pickup access.
- Wash and delivery staff tokens should not be treated as valid pickup sessions in this frontend.

## Token Rules

- Staff token payload contains `subjectType: "STAFF"`, `staffId`, and `staffRole`.
- Customer tokens must not be used for pickup screens.
- If an API returns `401`, clear the stored token and send the user back to pickup staff login.
- If an API returns `403`, show an insufficient-role state and require login with the pickup role.
