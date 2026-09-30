// Single source of truth for the mobile app.
// See docs/CONFIG.md — nothing else should hard-code a URL, barangay name,
// or download link.
//
// NOTE: On a physical phone, replace `localhost` with your PC's LAN IP,
// e.g. 'http://192.168.1.10:5080/api'.
export const config = {
  apiBaseUrl: 'http://localhost:5080/api',
  fileBaseUrl: 'http://localhost:5080', // for /uploads/... paths
  appName: 'Barangay Management Information System',
  barangayName: 'Barangay San Jose Annex Area 6',
  municipality: 'Rodriguez, Rizal',
  androidDownloadUrl: '',
  iosDownloadUrl: '',
  contactEmail: '',
  contactNumber: '',
  officeHours: 'Monday - Friday, 8:00 AM - 5:00 PM',
  pageSize: 20,
};

export default config;
