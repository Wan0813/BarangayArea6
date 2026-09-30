/* =============================================================================
 * Barangay Management Information System - WEBSITE CONFIGURATION
 * =============================================================================
 *
 *  >>> THIS IS THE ONLY FILE YOU NEED TO EDIT. <<<
 *
 *  Every URL, barangay name, contact detail and download link used by the
 *  website lives here. Nothing else in the website hard-codes them.
 *
 *  How to use:
 *    1. Open this file in any text editor (Notepad, VS Code, ...).
 *    2. Change the values between the quotes.
 *    3. Save, then refresh index.html in your browser.
 *
 *  Tip: the API is usually running on your own PC.
 *    - Desktop browser ....... http://localhost:5080/api
 *    - Another device ........ use your PC's LAN IP, e.g. http://192.168.1.10:5080/api
 * ========================================================================== */

window.APP_CONFIG = {

  /* ---------------------------------------------------------------- Server */
  // Base address of the REST API (must include the trailing /api).
  apiBaseUrl: 'http://localhost:5080/api',

  // Root address of the server that hosts uploaded files (/uploads/...).
  fileBaseUrl: 'http://localhost:5080',

  // How long (milliseconds) to wait for the API before showing the
  // "server unavailable" fallback text. 8000 = 8 seconds.
  requestTimeoutMs: 8000,

  /* -------------------------------------------------------- Identity / SEO */
  appName: 'Barangay Management Information System',
  barangayName: 'Barangay San Jose Annex Area 6',
  municipality: 'Rodriguez, Rizal',

  /* ------------------------------------------------------------- Downloads */
  // Leave a download URL empty ('') and the matching button is shown as
  // "Coming soon" instead of a broken link.
  androidDownloadUrl: '',        // e.g. '../barangay-mobile/Builds/barangay-app.apk'
  iosDownloadUrl: '',            // e.g. 'https://apps.apple.com/ph/app/...'
  directDownloadUrl: '',         // used by the "Direct download" button + QR code

  appVersion: '1.0.0',
  releaseNotes: 'First public release. File complaints, request emergency ' +
                'rescue, read barangay announcements, and keep your resident ' +
                'account up to date - straight from your phone.',

  /* ---------------------------------------------------- Contact and office */
  // TODO: replace these placeholders with the real barangay details.
  contactEmail: 'barangay.area6@example.com',
  contactNumber: '(02) 8123-4567',
  officeHours: 'Monday to Friday, 8:00 AM - 5:00 PM',
  facebookUrl: '',               // e.g. 'https://www.facebook.com/yourbarangay'

  /* ------------------------------------------------------------- Portals */
  // Where the staff/admin web portal is deployed (used by the footer link).
  adminPortalUrl: 'http://localhost:5173',

  /* ------------------------------------------------------------- Listings */
  // Number of announcements shown per page on the website.
  pageSize: 20
};
