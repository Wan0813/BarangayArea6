# Barangay Management Information System — Area 6

Barangay San Jose Annex Area 6 · Rodriguez, Rizal

A capstone system with four parts:

| Folder | What it is | Stack |
|---|---|---|
| `MyApp/` | Backend REST API | C# / ASP.NET Core (.NET 9), DDD-style solution |
| `barangay-admin/` | Admin dashboard (web) | React + Vite |
| `barangay-mobile/` | Resident / user app | React Native (Expo SDK 54) |
| `barangay-website/` | Promotional website + app download | Static HTML + CSS + vanilla JS |
| `bmis/` | Original front-end prototype kept as reference | Static HTML + CSS + JS |
| `docs/` | API contract and configuration guide | Markdown |

---

## 1. Roles

| Role | Can do |
|---|---|
| **Head Admin** | Everything: manage staff & accounts, update **and delete** complaints/emergencies/announcements, households, duty roster, About page. |
| **Admin** (standard) | Update complaint status/response/comments and emergency status. **Cannot** delete complaints. No staff management. |
| **Resident** (mobile user) | Sign up (needs approval), file complaints, request emergency rescue, read announcements & daily operations, manage own profile. |

New sign-ups land in **Pending** and cannot log in until a head admin approves them
(they see the submitted valid ID in the Accounts page).

---

## 2. Backend — `MyApp/`

Solution split into five projects:

```
MyApp/
├── MyApp.sln
└── src/
    ├── MyApp.Shared/          # enums, ApiResponse/PagedResult/SearchQuery, exceptions, constants
    ├── MyApp.Domain/          # entities + IApplicationDbContext
    ├── MyApp.Application/     # DTOs, services, guards, mapping, DI
    ├── MyApp.Infrastructure/  # EF Core (MySQL), JWT, BCrypt, SHA-256 codes, MailKit, file storage
    └── MyApp.API/             # controllers, middleware, Program.cs, appsettings
```

### First-time setup

```powershell
# From the repository root
powershell -ExecutionPolicy Bypass -File scripts/setup-backend.ps1
```

That creates the solution, adds the projects, installs the NuGet packages and builds.
Then create/refresh the database and run:

```powershell
cd MyApp
dotnet ef database update --project src/MyApp.Infrastructure --startup-project src/MyApp.API
cd src/MyApp.API
dotnet run            # http://localhost:5080  (Swagger at /swagger)
```

The API also applies migrations and seeds baseline data automatically on startup.

### Default accounts (change after first login)

| Username | Password | Role |
|---|---|---|
| `headadmin` | `Admin@123` | Head Admin (Barangay Captain) |
| `admin` | `Admin@123` | Admin (Secretary) |

### Configuration — `MyApp/src/MyApp.API/appsettings.json`

| Key | Purpose |
|---|---|
| `ConnectionStrings:Default` | MySQL connection string (`root` / your password) |
| `Jwt:Key` | Signing key — **change this** (32+ chars) |
| `Email:SenderEmail` / `Email:Password` | Gmail SMTP via MailKit (app password) |
| `Seed:*` | Baseline accounts and demo data on first run |
| `Downloads:*` | APK / store links shown on the website |
| `Cors:AllowedOrigins` | Leave empty for development (allows any origin) |

Security notes: passwords use **BCrypt**, password-reset codes are random 6-digit
values stored only as **SHA-256** hashes with expiry and attempt limits, and JWTs
carry the user id, username, role and status.

---

## 3. Admin desktop app — `barangay-admin/`

React + Vite dashboard wrapped in **Electron**, so it runs as an installable
Windows program (it still talks to the API over HTTP).

```powershell
cd barangay-admin
npm install
npm run electron:dev   # opens the desktop app window (close `npm run dev` first: same port)
```

To build the installer (`release/Barangay Admin Setup 1.0.0.exe`):

```powershell
npm run dist
```

Edit `src/config.js` for the API URL, barangay name and page size.
(`npm run dev` still serves the plain browser version at http://localhost:5173.)

Pages: Login, Signup, Forgot password, Dashboard, Staff, Accounts, Households,
Complaints, Emergencies, Daily Operations, Duty Roster, Announcements, About, Profile.

The **Dashboard** shows pending sign-ups, pending complaints, pending emergencies,
total residents (per household) and total households, plus complaints stats
(pending / ongoing / resolved / rejected), emergencies stats
(pending / approved / process / declined) and the **personnel on duty** board
(name, assigned duty, area, position).

The **Complaints** page has a search bar (username, subject, location), a
status-update action per row (status + response + assigned officer) and a
comment thread for detailed responses. Delete buttons appear **only** for the
head admin.

---

## 4. Mobile app — `barangay-mobile/`

```powershell
cd barangay-mobile
npm install
npx expo start
```

Edit `src/config.js` for the API URL. On a physical phone use your PC's LAN IP
(for example `http://192.168.1.10:5080/api`) instead of `localhost`.

Residents submit complaints (select a suggested type **or** type their own),
request emergency rescue, and read community posts / announcements, daily
operations, hotlines and About Us.

---

## 5. Promotional website — `barangay-website/`

Open `index.html` (or right-click → *Open with Live Server*).

Edit `src/config.js` (`window.APP_CONFIG`) for the API URL, download links,
version and contact details. The site pulls mission/vision, hotlines,
organization chart, published announcements and live statistics from
`/api/public/*`, and degrades gracefully when the API is offline.

---

## 6. Shared conventions

- **One response envelope** everywhere: `{ success, message, data, errors }`.
- **One list shape** everywhere: `{ items, page, pageSize, totalItems, totalPages, hasNext, hasPrevious }`.
- **One search convention** everywhere: `?search=&status=&page=&pageSize=&sortBy=&sortDir=`
  with a **search bar + Reset button** component reused on every list screen
  (`SearchBar.jsx` in the admin app and mobile app, `createSearchBar()` on the website).
- Enums are serialized as **strings** (e.g. `"Pending"`, `"HeadAdmin"`).
- Uploaded images are returned as web-relative paths (`uploads/...`); combine them
  with `fileBaseUrl` from each client's config.

See `docs/API.md` for the full endpoint contract and `docs/CONFIG.md` for the
per-client configuration files.
