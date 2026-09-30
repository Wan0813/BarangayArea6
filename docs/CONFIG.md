# Front-end configuration

Every client has a single, easy-to-edit config file. Nothing else should
hard-code a URL, a barangay name, or a download link.

| Client | Config file | Import style |
|---|---|---|
| Admin (React + Vite) | `barangay-admin/src/config.js` | `import { config } from './config'` |
| Mobile (Expo) | `barangay-mobile/src/config.js` | `import { config } from './config'` |
| Website (static) | `barangay-website/src/config.js` | `window.APP_CONFIG` (plain `<script>`) |

## Shared keys

```js
{
  apiBaseUrl: 'http://localhost:5080/api',
  fileBaseUrl: 'http://localhost:5080',   // for /uploads/... paths
  appName: 'Barangay Management Information System',
  barangayName: 'Barangay San Jose Annex Area 6',
  municipality: 'Rodriguez, Rizal',
  androidDownloadUrl: '',
  iosDownloadUrl: '',
  contactEmail: '',
  contactNumber: '',
  officeHours: '',
  pageSize: 20
}
```

## Universal search + reset

All three clients ship a shared search bar component that always renders:

- a text input,
- an optional filter row,
- **Reset** button (clears the text + every filter and reloads page 1).

- Admin: `barangay-admin/src/components/SearchBar.jsx`
- Mobile: `barangay-mobile/src/components/SearchBar.jsx`
- Website: `barangay-website/src/ui.js` → `createSearchBar()`

## Pointing at a deployed API

Change `apiBaseUrl` (and `fileBaseUrl`) in the one config file per client.
For the mobile app on a physical phone, use your PC's LAN IP instead of
`localhost`, e.g. `http://192.168.1.10:5080/api`.
