/**
 * Single place to configure the admin dashboard.
 * See docs/CONFIG.md — nothing else in this app may hard-code a URL,
 * a download link or the barangay name.
 */
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
  officeHours: '',
  pageSize: 20,
};

export default config;
