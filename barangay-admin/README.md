# Barangay MIS — Admin Dashboard

React 18 + Vite single-page dashboard for barangay staff. It talks to the
`MyApp` ASP.NET Core API described in `../docs/API.md`.

Stack: **React 18**, **Vite**, **react-router-dom**, plain CSS (`src/styles.css`).
No UI component library, no Tailwind, no axios — all HTTP goes through `fetch`.

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production bundle in dist/
npm run preview  # serve the production build
```

The API must be running at the address configured in `src/config.js`
(default `http://localhost:5080/api`).

## Configuration

Everything configurable lives in **one** file: `src/config.js`
(see `../docs/CONFIG.md`). Nothing else in the app hard-codes a URL or the
barangay name.

```js
apiBaseUrl: 'http://localhost:5080/api',
fileBaseUrl: 'http://localhost:5080',   // for /uploads/** paths
appName, barangayName, municipality, pageSize: 20, ...
```

To point the dashboard at another server, edit only that file.

## Project layout

```
barangay-admin/
├── index.html
├── package.json
├── vite.config.js            # dev server port 5173
└── src/
    ├── config.js             # THE single config file
    ├── main.jsx, App.jsx     # router + providers
    ├── styles.css            # all styling (plain CSS)
    ├── api/
    │   ├── client.js         # fetch wrapper: Bearer token, JSON, envelope, 401 redirect
    │   └── endpoints.js      # one function per API endpoint
    ├── context/AuthContext.jsx  # token+user session, role helpers
    ├── hooks/
    │   ├── usePagedList.js   # search + filters + paging + loading/error
    │   └── useStaffList.js   # options for "assigned officer" selects
    ├── components/           # SearchBar, Modal, ConfirmDialog, Pagination,
    │                         # StatusBadge, DataTable, Loading, EmptyState,
    │                         # Toast, ImageUpload, ProtectedRoute, PageHeader,
    │                         # StatCard, BarChart, FormField
    ├── layouts/AppLayout.jsx # sidebar + topbar
    └── pages/                # Login, Signup, ForgotPassword, Dashboard, Staff,
                              # Accounts, Households, Complaints, Emergencies,
                              # Operations, DutyRoster, Announcements, About,
                              # Profile, NotFound
```

## Universal search + reset

Every list page reuses the same `components/SearchBar.jsx`:

* a text input (submitted with Enter or the **Search** button),
* a filter row passed as `children`,
* a **Reset** button that clears the text **and** every filter back to
  `initialFilters` and re-fetches page 1.

Page state comes from `usePagedList(fetcher, { initialFilters })`; the page
passes `list.reset` to `<SearchBar onReset={list.reset} />`.

## Roles

| Role | Capabilities in this app |
|---|---|
| **HeadAdmin** | Everything: staff management, account approvals, role changes, and every DELETE. |
| **Admin** | Complaints / emergency status + response + assigned officer, daily operations, roster, households, announcements (no delete of complaints/announcements, no staff management). |
| **Resident** | Read-only **My Complaints** (view threads and reply) plus their own profile. Staff-only routes show a "not available" panel. |

UI elements are hidden or disabled for roles that cannot use them; the API
enforces the same rules.

## Error handling

`api/client.js` unwraps the `{ success, message, data, errors }` envelope,
throws `Error(message)` when `success === false`, and on HTTP **401** clears
the stored session and redirects to `/login`. Pages surface those messages in
toasts or an inline error banner with a Retry button.

Session (token + cached user) is kept in `localStorage` under
`bmis.admin.token` / `bmis.admin.user`.
