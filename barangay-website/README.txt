===============================================================================
 BARANGAY MANAGEMENT INFORMATION SYSTEM - PROMOTIONAL WEBSITE
===============================================================================

A plain static website: HTML + CSS + vanilla JavaScript.
No build step, no framework, no npm, no bundler.

-------------------------------------------------------------------------------
 1. HOW TO OPEN IT
-------------------------------------------------------------------------------

The quickest way (works by double-clicking):

    Open the file  index.html  in any browser
    (Chrome, Edge, Firefox, Opera).

For the best experience (recommended while developing), serve the folder:

    a) VS Code ............... install the "Live Server" extension, right-click
                               index.html -> "Open with Live Server"
    b) Python ................ open a terminal in this folder and run
                                   python -m http.server 5173
                               then visit http://localhost:5173
    c) Node .................. npx serve .

Why prefer a server? Some browsers block cross-origin requests (fetch) when the
page is opened as a file:// URL. The website still opens fine by double-click,
but the LIVE sections (statistics, announcements, hotlines, about, org chart)
may stay on their fallback text. Running from Live Server / http:// avoids that.

Also make sure the barangay API is running (default http://localhost:5080).

-------------------------------------------------------------------------------
 2. HOW TO EDIT THE SITE - src/config.js
-------------------------------------------------------------------------------

    >>> src/config.js IS THE ONLY FILE YOU NEED TO EDIT. <<<

No URL, barangay name, contact detail or download link is hard-coded anywhere
else. Open  src/config.js  in Notepad or VS Code, change the values between the
quotes, save, then refresh index.html.

    apiBaseUrl           Address of the REST API, INCLUDING the trailing /api.
                         Default: http://localhost:5080/api
                         On a real phone, use your PC's LAN IP instead of
                         localhost, e.g. http://192.168.1.10:5080/api

    fileBaseUrl          Root address that serves uploaded files, so that saved
                         paths like /uploads/announcements/1.jpg can be shown.

    appName              Name of the system shown in the header and footer.

    barangayName         Barangay name shown in the hero, about section and
                         footer.

    municipality         e.g. 'Rodriguez, Rizal'.

    androidDownloadUrl   Link to the Android installer (.apk).
    iosDownloadUrl       Link to the App Store listing (optional).
    directDownloadUrl    Used by the "Direct download" button and the QR code.
                         Leave a value empty ('') and the matching button is
                         shown as "not available yet" instead of a broken link.

    appVersion           Version shown in the hero and download sections.
    releaseNotes         Short description of what is new in this version.

    contactEmail         Barangay email (used by the footer mail link).
    contactNumber        Barangay phone (used by the footer call link).
    officeHours          Shown in the About section and the FAQ.
    facebookUrl          Optional Facebook page link (hidden while empty).

    adminPortalUrl       Where the staff/admin web portal is deployed. This is
                         the "Admin portal" link in the footer.

    pageSize             How many announcements are shown per page.

    requestTimeoutMs     How long to wait for the API before showing the
                         "server unavailable" fallback.

If the API is online, the values returned by GET /api/public/info (barangay
name, mission, vision, history, contacts, office hours) automatically replace
the matching config values.

-------------------------------------------------------------------------------
 3. FILE LAYOUT
-------------------------------------------------------------------------------

    index.html          The whole page: navbar, hero, download, features, how it
                        works, statistics, announcements, hotlines, about, FAQ,
                        call to action and footer.
    src/config.js       ALL editable values (URLs, names, contacts, links).
    src/api.js          Tiny fetch helper: Api.get / Api.post, unwraps the
                        {success, message, data, errors} envelope, throws on
                        success === false. Also Api.resolveFileUrl().
    src/ui.js           Shared helpers + the universal search bar
                        (text input + filters + RESET button), escapeHtml,
                        formatDate, statusBadgeClass, renderPagination,
                        showToast, empty/skeleton states.
    src/app.js          Page logic: loads the public API data and renders the
                        sections, with a friendly fallback everywhere.
    src/styles.css      All styling (responsive: desktop, tablet, phone).
    assets/             logo.svg, app-mockup.svg, qr-placeholder.svg.

-------------------------------------------------------------------------------
 4. DATA SOURCES (public API, no login needed)
-------------------------------------------------------------------------------

    GET /api/public/info           barangay name, mission, vision, history,
                                   contacts, office hours
    GET /api/public/hotlines       hotline list (isEmergency ones are first and
                                   highlighted)
    GET /api/public/organization   organizational chart (rendered as a tree)
    GET /api/public/announcements  published announcements (?page=&pageSize=)
    GET /api/public/statistics     counters for the landing page
    GET /api/public/downloads      { android, ios, directDownload, version,
                                     notes }

Every call is wrapped in try/catch. If the API is offline the page shows
friendly placeholder text (and a small warning banner) instead of breaking.

-------------------------------------------------------------------------------
 5. THE SEARCH BAR (universal search + reset)
-------------------------------------------------------------------------------

The announcements list and the hotline list each ship the shared search bar from
src/ui.js:

    UI.createSearchBar({ onSearch, filters })

It always renders a text input, an optional row of filter selects, and a RESET
button that clears the text and every filter and re-runs the search. Searching
happens client-side on the already loaded list, so it keeps working even when
the API goes offline.

-------------------------------------------------------------------------------
 6. TROUBLESHOOTING
-------------------------------------------------------------------------------

"Live data is unavailable" banner / fallback text on every section
    - The API is not running, or apiBaseUrl is wrong.
    - Open http://localhost:5080/api/public/statistics in the browser to check.
    - If you opened index.html by double-clicking (file://), also try Live
      Server: the browser may block cross-origin fetch for file:// pages.

Download buttons do nothing
    - No download URL is configured in src/config.js (the button is disabled on
      purpose) or the linked file does not exist at that path.

Statistics show a list of raw values instead of cards
    - The API returned counter names the website does not recognise. The page
      still shows them, so rename the fields in /api/public/statistics (or add
      the names to STAT_DEFINITIONS in src/app.js).

QR code box shows the placeholder graphic
    - Set directDownloadUrl in src/config.js, then replace
      assets/qr-placeholder.svg with a real QR image of that link.

===============================================================================
