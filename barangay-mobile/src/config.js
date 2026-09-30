// Single source of truth for the mobile app.
// See docs/CONFIG.md — nothing else should hard-code a URL, barangay name,
// or download link.
//
// NOTE: This address is baked into the APK at build time. Phones cannot
// reach `localhost` (that would be the phone itself), so this must be the
// PC's LAN IP whenever the app runs on a real device.
export const config = {
  apiBaseUrl: 'http://192.168.100.48:5080/api',
  fileBaseUrl: 'http://192.168.100.48:5080', // for /uploads/... paths
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
