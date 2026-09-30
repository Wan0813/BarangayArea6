# Barangay Management Information System — Mobile (Residents)

Expo (SDK 54) + React Native mobile app for **residents** of
_Barangay San Jose Annex Area 6, Rodriguez, Rizal_.

Plain JavaScript (no TypeScript).

## Features

- Sign up (pending admin approval) with a **required** valid ID photo
- Log in / log out, forgot-password flow (email → 6-digit code → new password)
- Submit complaints (with photo) and track their status + admin responses/comments
- Submit emergency rescue requests (with photo) and track status/ETA/response
- View published daily operations and community announcements
- View barangay about / mission / vision / organization / hotlines
- Edit own profile and change password
- Every list screen has a shared **SearchBar** with a Reset button
- Clear loading / empty / error states

## Requirements

- Node 18+
- Expo Go app, or an Android/iOS emulator
- The `.NET` API running at `http://localhost:5080`

## Getting started

```bash
cd barangay-mobile
npm install
npx expo start
```

Then press `a` for Android, `i` for iOS, or scan the QR code with Expo Go.

## Configuration

Everything is configured in **one** file: `src/config.js`.
See `../docs/CONFIG.md`.

When running on a **physical phone**, change `apiBaseUrl` / `fileBaseUrl` from
`localhost` to your computer's LAN IP, e.g.:

```js
apiBaseUrl: 'http://192.168.1.10:5080/api',
fileBaseUrl: 'http://192.168.1.10:5080',
```

## Project structure

```
App.js                     App shell (providers + navigator)
index.js                   Expo entry point
src/
  config.js                API URLs, barangay info, page size
  theme.js                 Colors, spacing, status colors
  api/
    client.js              fetch wrapper (auth token, envelope, 401 handling)
    index.js               endpoint functions
  context/
    AuthContext.jsx        session storage + login/logout/register
  components/              Shared UI (SearchBar, Button, Input, ...)
  screens/                 One file per screen
  navigation/
    RootNavigator.jsx      Auth stack vs. app tabs
```

## API

Base URL: `http://localhost:5080/api` (see `../docs/API.md`).
Uploads come from `fileBaseUrl` + `/uploads/...`.
