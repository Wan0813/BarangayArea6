# Barangay Area 6 — API Contract

Base URL (dev): `http://localhost:5080/api`
Auth header: `Authorization: Bearer <jwt>`
Uploads are served statically from the API root: `/uploads/**`

## Envelope

Every JSON endpoint returns:

```json
{
  "success": true,
  "message": null,
  "data": { },
  "errors": []
}
```

Lists return `PagedResult<T>` inside `data`:

```json
{ "items": [], "page": 1, "pageSize": 20, "totalItems": 0, "totalPages": 0, "hasNext": false, "hasPrevious": false }
```

Errors use the same envelope with `success:false`, a human `message`, and `errors[]`.

## Enum string values

| Enum | Values |
|---|---|
| Role | `Resident`, `Admin`, `HeadAdmin` |
| AccountStatus | `Pending`, `Active`, `Declined`, `Suspended` |
| ComplaintStatus | `Pending`, `Ongoing`, `Resolved`, `Rejected` |
| EmergencyStatus | `Pending`, `Approved`, `Processing`, `Declined` |
| OperationCategory | `PatrolPeaceAndOrder`, `Cleanliness`, `HealthServices`, `Meeting`, `ResidentServices`, `Other` |
| DutyShift | `Day`, `Night`, `Graveyard`, `WholeDay` |

## Standard query params (recommended for every list endpoint)

`?search=&status=&page=1&pageSize=20&sortBy=date&sortDir=desc`

All clients must expose a **search bar with a Reset button** that clears
`search` + filters and re-fetches page 1.

---

## Auth — `/api/auth` (public unless noted)

| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/register` | `multipart/form-data` | Resident or Admin sign-up. Fields: `username, fullName, email, password, confirmPassword, age, contactNumber, address, registerAs (Resident\|Admin), validIdType, validId (file, required)` |
| POST | `/login` | `{ usernameOrEmail, password }` → `{ token, expiresAt, user }` | 403-ish envelope while `Pending`/`Declined` |
| POST | `/forgot-password` | `{ email }` | Emails a 6-digit code (SHA-256 hashed at rest) |
| POST | `/verify-reset-code` | `{ email, code }` | Validates code before showing the reset form |
| POST | `/reset-password` | `{ email, code, newPassword, confirmPassword }` | |
| GET | `/me` 🔒 | — | Current user |
| POST | `/change-password` 🔒 | `{ currentPassword, newPassword, confirmPassword }` | |

`UserDto`: `{ id, username, fullName, email, contactNumber, address, age, role, status, position, validIdType, validIdImageUrl, photoUrl, statusRemarks, householdId, householdNumber, createdAt, lastLoginAt }`

---

## Users / Accounts — `/api/users` 🔒 staff

| Method | Path | Roles | Body |
|---|---|---|---|
| GET | `/?search=&role=&status=&page=&pageSize=` | Admin, HeadAdmin | searches username, fullName, email, address |
| GET | `/{id}` | Admin, HeadAdmin | |
| POST | `/` | **HeadAdmin** | `{ fullName, username, email, password, position, contactNumber, address, role }` |
| PUT | `/{id}` | **HeadAdmin** | profile fields |
| PUT | `/{id}/status` | **HeadAdmin** | `{ status, remarks, householdId? }` — approving a resident can attach them to a household |
| PUT | `/{id}/role` | **HeadAdmin** | `{ role, position }` |
| PUT | `/{id}/position` | **HeadAdmin** | `{ position }` |
| POST | `/{id}/photo` | HeadAdmin | `multipart/form-data` `photo` |
| DELETE | `/{id}` | **HeadAdmin** | |

**Self-service profile (all roles):** use `PUT /api/auth/profile` and
`POST /api/auth/photo` (see the Auth section) from the mobile app and the
admin Profile page.

---

## Complaints — `/api/complaints` 🔒

| Method | Path | Roles | Body |
|---|---|---|---|
| GET | `/?search=&status=&type=&page=&pageSize=&sortBy=&sortDir=` | all (resident sees only own) | search matches **username, subject, location**, plus type/desc |
| GET | `/{id}` | owner or staff | |
| POST | `/` | Resident (staff may also file) | `multipart`: `type, subject, description, location, image?` |
| PUT | `/{id}/status` | Admin, HeadAdmin | `{ status, response, assignedOfficerId }` |
| POST | `/{id}/comments` | owner or staff | `{ message, status? }` |
| GET | `/{id}/comments` | owner or staff | |
| DELETE | `/{id}` | **HeadAdmin** | |
| GET | `/stats` | staff | `{ total, pending, ongoing, resolved, rejected, todayCount, byType:[{type,count}] }` |
| GET | `/types` | all | distinct type suggestions |

`ComplaintDto`: `{ id, type, subject, description, location, imageUrl, status, response, assignedOfficerId, assignedOfficerName, userId, reporterUsername, reporterFullName, reporterContact, reporterAddress, createdAt, updatedAt, resolvedAt, commentCount }`

---

## Emergencies — `/api/emergencies` 🔒

| Method | Path | Roles | Body |
|---|---|---|---|
| GET | `/?search=&status=&page=&pageSize=` | all (resident sees only own) | |
| GET | `/{id}` | owner or staff | |
| POST | `/` | Resident | `multipart`: `kind, location, contactNumber, description, image?` |
| PUT | `/{id}/status` | Admin, HeadAdmin | `{ status, response, eta, assignedOfficerId }` |
| DELETE | `/{id}` | **HeadAdmin** | |
| GET | `/stats` | staff | `{ total, pending, approved, processing, declined, todayCount }` |

---

## Daily Operations — `/api/operations` 🔒

| Method | Path | Roles | Body |
|---|---|---|---|
| GET | `/?search=&category=&published=&from=&to=&page=` | all (residents only see published) | search matches title, details, category, assigned names |
| GET | `/{id}` | all | |
| POST | `/` | Admin, HeadAdmin | `multipart`: `date, title, details, category, assignedOfficerId?, assignedStaffId?, personnelInvolved?, isPublished, image?` |
| PUT | `/{id}` | Admin, HeadAdmin | same |
| PUT | `/{id}/publish` | Admin, HeadAdmin | `{ isPublished }` |
| DELETE | `/{id}` | Admin, HeadAdmin | |

`DailyOperationDto`: `{ id, date, title, details, category, imageUrl, assignedOfficerId, assignedOfficerName, assignedStaffId, assignedStaffName, personnelInvolved, isPublished, createdByUserId, createdByName, createdAt }`

---

## Announcements — `/api/announcements` 🔒

| Method | Path | Roles |
|---|---|---|
| GET | `/?search=&page=` | all (resident sees published) |
| POST | `/` | Admin, HeadAdmin (multipart: title, body, isPublished, image?) |
| PUT | `/{id}` | Admin, HeadAdmin |
| PUT | `/{id}/publish` | Admin, HeadAdmin |
| DELETE | `/{id}` | HeadAdmin |

---

## Dashboard — `/api/dashboard` 🔒 staff

| Method | Path | Returns |
|---|---|---|
| GET | `/overview` | `{ pendingSignups, pendingComplaints, pendingEmergencies, totalResidents, totalHouseholds, totalStaff, publishedOperations, totalComplaints, totalEmergencies, complaintStats, emergencyStats }` |
| GET | `/duty-roster?date=YYYY-MM-DD` | `DutyRosterDto[]` — name, assignedDuty, area, position, shift, timeRange, isOnDuty |
| GET | `/households-summary?page=` | households with `residentCount` |

`DutyRosterDto`: `{ id, date, shift, assignedDuty, area, position, personnelName, contactNumber, timeRange, isOnDuty, userId }`

---

## Households — `/api/households` 🔒 staff

`GET /` (search, page) · `GET /{id}` · `POST /` · `PUT /{id}` · `DELETE /{id}` (HeadAdmin)
`POST /{id}/members` · `PUT /members/{memberId}` · `DELETE /members/{memberId}`

`HouseholdDto`: `{ id, householdNumber, address, purok, headOfFamily, contactNumber, isActive, residentCount, members: [{ id, fullName, age, gender, relationToHead, civilStatus, occupation, isAppUser }] }`

---

## Duty Roster — `/api/duty-roster` 🔒 staff

`GET /?date=&search=&page=` · `POST /` · `PUT /{id}` · `DELETE /{id}`
Body: `{ date, shift, assignedDuty, area, position, personnelName, contactNumber, timeRange, isOnDuty, userId? }`

---

## About — `/api/about`

| Method | Path | Roles |
|---|---|---|
| GET | `/` | public → `{ about, hotlines, organization }` |
| PUT | `/` | HeadAdmin |
| GET/POST | `/hotlines` | GET public / POST HeadAdmin |
| PUT/DELETE | `/hotlines/{id}` | HeadAdmin |
| GET/POST | `/organization` | GET public / POST HeadAdmin |
| PUT/DELETE | `/organization/{id}` | HeadAdmin |

---

## Public (website, no auth) — `/api/public`

| Method | Path | Returns |
|---|---|---|
| GET | `/info` | barangay name, mission, vision, office hours, contact |
| GET | `/hotlines` | hotline list |
| GET | `/organization` | org chart tree |
| GET | `/announcements?page=` | published announcements |
| GET | `/statistics` | counters for the landing page (complaints filed, resolved, residents served) |
| GET | `/downloads` | `{ android, ios, directDownload, version, notes }` |
