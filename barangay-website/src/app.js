/* =============================================================================
 * app.js - page logic for the promotional website
 * -----------------------------------------------------------------------------
 *  Reads window.APP_CONFIG (src/config.js), loads public data through
 *  window.Api (src/api.js) and renders it with window.UI (src/ui.js).
 *
 *  Every network call is wrapped in try/catch and every section has a friendly
 *  fallback, so the page still looks complete when the API is offline.
 * ========================================================================== */

(function () {
  'use strict';

  var cfg = window.APP_CONFIG || {};
  var UI = window.UI;
  var Api = window.Api;

  var pageSize = Math.max(1, parseInt(cfg.pageSize, 10) || 20);

  var state = {
    info: null,
    downloads: null,
    hotlines: [],
    announcements: [],
    announcementsFiltered: [],
    announcementPage: 1,
    announcementSearch: '',
    announcementSort: 'newest',
    hotlineSearch: '',
    organization: []
  };

  /* ======================================================================
   * Generic helpers
   * ==================================================================== */

  function hasText(value) {
    return value !== null && value !== undefined && String(value).trim() !== '';
  }

  function pickString(source, keys, fallback) {
    if (!source || typeof source !== 'object') return fallback === undefined ? '' : fallback;
    for (var i = 0; i < keys.length; i++) {
      var value = source[keys[i]];
      if (typeof value === 'string' && value.trim() !== '') return value;
    }
    return fallback === undefined ? '' : fallback;
  }

  function pickNumber(source, keys) {
    if (!source || typeof source !== 'object') return null;
    for (var i = 0; i < keys.length; i++) {
      var value = source[keys[i]];
      if (typeof value === 'number' && isFinite(value)) return value;
      if (typeof value === 'string' && value.trim() !== '' && !isNaN(Number(value))) return Number(value);
    }
    return null;
  }

  function asArray(data, keys) {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') {
      var candidates = (keys || []).concat(['items', 'data', 'results', 'list']);
      for (var i = 0; i < candidates.length; i++) {
        var value = data[candidates[i]];
        if (Array.isArray(value)) return value;
      }
    }
    return [];
  }

  function logError(where, err) {
    if (window.console && window.console.warn) {
      window.console.warn('[barangay-website] ' + where + ' failed:', err && err.message ? err.message : err);
    }
  }

  function telHref(number) {
    var raw = String(number === null || number === undefined ? '' : number);
    var cleaned = raw.replace(/[^\d+]/g, '');
    if (!cleaned) return '';
    return 'tel:' + cleaned;
  }

  /* ======================================================================
   * Config-driven content
   * ==================================================================== */

  function downloadInfo() {
    var apiDownloads = state.downloads && typeof state.downloads === 'object' ? state.downloads : {};
    var android = hasText(cfg.androidDownloadUrl)
      ? cfg.androidDownloadUrl
      : pickString(apiDownloads, ['android', 'androidUrl', 'androidDownloadUrl']);
    var ios = hasText(cfg.iosDownloadUrl)
      ? cfg.iosDownloadUrl
      : pickString(apiDownloads, ['ios', 'iosUrl', 'iosDownloadUrl']);
    var direct = hasText(cfg.directDownloadUrl)
      ? cfg.directDownloadUrl
      : pickString(apiDownloads, ['directDownload', 'direct', 'directDownloadUrl']);
    if (!direct) direct = android || ios;

    var version = hasText(cfg.appVersion)
      ? String(cfg.appVersion)
      : pickString(apiDownloads, ['version'], '');
    var notes = hasText(cfg.releaseNotes)
      ? String(cfg.releaseNotes)
      : pickString(apiDownloads, ['notes', 'releaseNotes'], '');

    return { android: android, ios: ios, direct: direct, version: version, notes: notes };
  }

  function applyConfigToDom() {
    UI.setText('[data-config="appName"]', cfg.appName || '');
    UI.setText('[data-config="barangayName"]', cfg.barangayName || '');
    UI.setText('[data-config="municipality"]', cfg.municipality || '');
    UI.setText('[data-config="appVersion"]', cfg.appVersion || '');
    UI.setText('[data-config="contactEmail"]', cfg.contactEmail || '');
    UI.setText('[data-config="contactNumber"]', cfg.contactNumber || '');
    UI.setText('[data-config="officeHours"]', cfg.officeHours || '');
    UI.setText('[data-config="releaseNotes"]', cfg.releaseNotes || '');
    UI.setText('[data-config="appNameFooter"]', cfg.appName || '');

    document.title = (cfg.appName || 'Barangay Management Information System') +
      ' · ' + (cfg.barangayName || 'Barangay') + ' — ' + (cfg.municipality || '');

    // Links that should never be empty: hide them when unconfigured.
    UI.qsa('[data-config-href]').forEach(function (node) {
      var key = node.getAttribute('data-config-href');
      var value = cfg[key];
      if (hasText(value)) {
        node.setAttribute('href', String(value));
        node.hidden = false;
        if (/^https?:/i.test(String(value))) {
          node.setAttribute('target', '_blank');
          node.setAttribute('rel', 'noopener noreferrer');
        }
      } else {
        node.hidden = true;
        node.removeAttribute('href');
      }
    });

    var emailLink = UI.qs('#footer-email');
    if (emailLink) {
      if (hasText(cfg.contactEmail)) emailLink.setAttribute('href', 'mailto:' + cfg.contactEmail);
      else emailLink.removeAttribute('href');
    }

    var telLink = UI.qs('#footer-contact-number');
    if (telLink) {
      var href = telHref(cfg.contactNumber);
      if (href) telLink.setAttribute('href', href);
      else telLink.removeAttribute('href');
    }
  }

  /* ======================================================================
   * Downloads (hero + download section)
   * ==================================================================== */

  function wireDownloadButtons() {
    var info = downloadInfo();

    var targets = [
      { selector: '#hero-android', url: info.android, label: 'Android app (APK)' },
      { selector: '#hero-ios', url: info.ios, label: 'iOS app' },
      { selector: '#download-android', url: info.android, label: 'Android app (APK)' },
      { selector: '#download-ios', url: info.ios, label: 'iOS app' },
      { selector: '#download-direct', url: info.direct, label: 'Direct download' }
    ];

    targets.forEach(function (target) {
      var node = UI.qs(target.selector);
      if (!node) return;
      if (hasText(target.url)) {
        node.setAttribute('href', String(target.url));
        node.classList.remove('is-disabled');
        node.removeAttribute('aria-disabled');
        node.removeAttribute('tabindex');
        node.setAttribute('download', '');
        if (node.hasAttribute('data-open-new')) {
          node.setAttribute('target', '_blank');
          node.setAttribute('rel', 'noopener noreferrer');
        }
      } else {
        node.removeAttribute('href');
        node.classList.add('is-disabled');
        node.setAttribute('aria-disabled', 'true');
        node.setAttribute('tabindex', '-1');
        node.setAttribute('title', target.label + ' link is not available yet.');
      }
    });

    var versionText = hasText(info.version) ? 'v' + info.version : 'Version not set';
    UI.setText('#download-version', versionText);
    UI.setText('#download-release-notes', hasText(info.notes) ? info.notes : 'Release notes will be posted here.');
    UI.setText('#hero-version', versionText);
    UI.setText('#hero-release-notes', hasText(info.notes) ? info.notes : 'Release notes will be posted here.');

    var qrCaption = UI.qs('#qr-caption');
    if (qrCaption) {
      qrCaption.textContent = hasText(info.direct)
        ? 'Scan this QR code with your phone camera to open the download link directly.'
        : 'The QR code appears here once a direct download link is configured in src/config.js.';
    }

    var requirements = UI.qs('#download-requirements');
    if (requirements) {
      requirements.textContent = 'Android 8.0 (Oreo) or newer, 100 MB free storage, and an internet connection for first sign-in.';
    }
  }

  /* ======================================================================
   * Statistics (GET /public/statistics)
   * ==================================================================== */

  var STAT_DEFINITIONS = [
    {
      label: 'Complaints filed',
      icon: '📝',
      hint: 'Community concerns forwarded to the barangay.',
      keys: ['complaintsFiled', 'totalComplaints', 'complaints', 'complaintCount', 'filedComplaints']
    },
    {
      label: 'Complaints resolved',
      icon: '✅',
      hint: 'Cases acted on and closed by the barangay.',
      keys: ['complaintsResolved', 'resolvedComplaints', 'resolvedComplaints', 'resolved', 'resolvedCount']
    },
    {
      label: 'Emergency requests',
      icon: '🚑',
      hint: 'Rescue and assistance requests received.',
      keys: ['emergencyRequests', 'totalEmergencies', 'emergencies', 'emergencyCount']
    },
    {
      label: 'Residents served',
      icon: '👨‍👩‍👧',
      hint: 'Registered residents with an active account.',
      keys: ['residentsServed', 'totalResidents', 'residents', 'residentCount']
    },
    {
      label: 'Households recorded',
      icon: '🏠',
      hint: 'Family records kept by the barangay.',
      keys: ['totalHouseholds', 'households', 'householdCount']
    },
    {
      label: 'Personnel on duty',
      icon: '🛡️',
      hint: 'Officers and staff assigned for the day.',
      keys: ['onDutyPersonnel', 'onDutyToday', 'staffOnDuty', 'totalStaff', 'staff', 'personnelOnDuty']
    }
  ];

  function renderStatistics(data) {
    var host = UI.qs('#statistics-grid');
    if (!host) return;

    if (!data || typeof data !== 'object') {
      UI.setHtml(host, UI.errorState(
        'Live statistics are unavailable right now.',
        'The counters appear here automatically once the barangay server is online.'
      ));
      UI.setText('#statistics-updated', '');
      return;
    }

    var cards = [];
    STAT_DEFINITIONS.forEach(function (definition) {
      var value = pickNumber(data, definition.keys);
      if (value === null) return;
      cards.push(
        '<article class="stat-card">' +
          '<span class="stat-card__icon" aria-hidden="true">' + UI.escapeHtml(definition.icon) + '</span>' +
          '<span class="stat-card__value">' + UI.escapeHtml(UI.formatNumber(value)) + '</span>' +
          '<span class="stat-card__label">' + UI.escapeHtml(definition.label) + '</span>' +
          '<span class="stat-card__hint">' + UI.escapeHtml(definition.hint) + '</span>' +
        '</article>'
      );
    });

    if (!cards.length) {
      var rawKeys = Object.keys(data).slice(0, 8).map(function (key) {
        var value = data[key];
        if (value === null || typeof value === 'object') return null;
        return key + ': ' + UI.formatNumber(value);
      }).filter(Boolean);

      UI.setHtml(host, rawKeys.length
        ? '<div class="card"><h3 class="card__title">Barangay at a glance</h3>' +
          '<ul class="plain-list">' + rawKeys.map(function (line) {
            return '<li>' + UI.escapeHtml(line) + '</li>';
          }).join('') + '</ul></div>'
        : UI.emptyState(
          'Statistics are not published yet.',
          'The barangay has not uploaded its public counters, or the server is offline.'
        ));
    } else {
      UI.setHtml(host, cards.join(''));
    }

    var updated = pickString(data, ['updatedAt', 'generatedAt', 'asOf', 'lastUpdated'], '');
    UI.setText('#statistics-updated', updated
      ? 'Updated ' + UI.formatDateTime(updated, { fallback: updated })
      : '');
  }

  /* ======================================================================
   * Announcements (GET /public/announcements)
   * ==================================================================== */

  function announcementSortValue(item) {
    var value = new Date(pickString(item, ['createdAt', 'publishedAt', 'date'], ''));
    return isNaN(value.getTime()) ? 0 : value.getTime();
  }

  function filterAnnouncements() {
    var query = state.announcementSearch.trim().toLowerCase();
    var list = state.announcements.slice();

    if (query) {
      list = list.filter(function (item) {
        var haystack = [
          pickString(item, ['title'], ''),
          pickString(item, ['body', 'content', 'description'], ''),
          pickString(item, ['createdByName', 'authorName'], '')
        ].join(' ').toLowerCase();
        return haystack.indexOf(query) !== -1;
      });
    }

    list.sort(function (a, b) {
      return state.announcementSort === 'oldest'
        ? announcementSortValue(a) - announcementSortValue(b)
        : announcementSortValue(b) - announcementSortValue(a);
    });

    state.announcementsFiltered = list;
    state.announcementPage = 1;
  }

  function announcementCard(item) {
    var title = pickString(item, ['title'], 'Untitled announcement');
    var body = pickString(item, ['body', 'content', 'description'], '');
    var author = pickString(item, ['createdByName', 'authorName', 'postedBy'], '');
    var dateValue = pickString(item, ['createdAt', 'publishedAt', 'date'], '');
    var imagePath = pickString(item, ['imageUrl', 'imagePath'], '');
    var imageUrl = hasText(imagePath) ? Api.resolveFileUrl(imagePath) : '';
    var isLong = body.length > 300;

    var isPublished = item.isPublished !== false;
    var statusToken = isPublished ? 'Published' : 'Draft';

    return '<article class="card announcement">' +
      (imageUrl
        ? '<img class="announcement__image" src="' + UI.escapeHtml(imageUrl) + '" alt="" loading="lazy" ' +
          'onerror="this.style.display=\'none\'">'
        : '') +
      '<div class="announcement__body">' +
        '<h3 class="card__title">' + UI.escapeHtml(title) + '</h3>' +
        '<p class="meta">' +
          '<span class="' + UI.statusBadgeClass(statusToken) + '">' + UI.escapeHtml(UI.statusLabel(statusToken)) + '</span>' +
          '<span>' + UI.escapeHtml(UI.formatDate(dateValue, { fallback: 'Date not posted' })) + '</span>' +
          (author ? '<span class="meta__dot">•</span><span>Posted by ' + UI.escapeHtml(author) + '</span>' : '') +
        '</p>' +
        '<p class="announcement__text' + (isLong ? ' is-clamped' : '') + '">' +
          UI.multiline(body || 'No details were provided for this announcement.') +
        '</p>' +
        (isLong
          ? '<button type="button" class="link-button" data-toggle-text>Read more</button>'
          : '') +
      '</div>' +
    '</article>';
  }

  function renderAnnouncements() {
    var host = UI.qs('#announcements-list');
    var paginationHost = UI.qs('#announcements-pagination');
    if (!host) return;

    UI.setText('#announcements-count',
      UI.formatNumber(state.announcements.length) + ' published announcement' +
      (state.announcements.length === 1 ? '' : 's'));

    if (!state.announcements.length) {
      UI.setHtml(host, UI.emptyState(
        'No announcements yet.',
        'Barangay posts and advisories will appear here as soon as they are published.'
      ));
      if (paginationHost) UI.clear(paginationHost);
      return;
    }

    var list = state.announcementsFiltered;
    if (!list.length) {
      UI.setHtml(host, UI.emptyState(
        'No announcements match your search.',
        'Try a different keyword or press Reset to see everything again.'
      ));
      if (paginationHost) UI.clear(paginationHost);
      return;
    }

    var totalPages = Math.max(1, Math.ceil(list.length / pageSize));
    var page = Math.min(Math.max(1, state.announcementPage), totalPages);
    state.announcementPage = page;
    var start = (page - 1) * pageSize;
    var pageItems = list.slice(start, start + pageSize);

    UI.setHtml(host, pageItems.map(announcementCard).join(''));

    if (paginationHost) {
      UI.renderPagination(paginationHost, {
        page: page,
        pageSize: pageSize,
        totalItems: list.length,
        totalPages: totalPages
      }, function (nextPage) {
        state.announcementPage = nextPage;
        renderAnnouncements();
        var section = UI.qs('#announcements');
        if (section && section.scrollIntoView) {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }
  }

  function initAnnouncementsSearch() {
    var host = UI.qs('#announcements-search');
    if (!host) return;

    var bar = UI.createSearchBar({
      searchPlaceholder: 'Search announcements by title or content…',
      label: 'Search announcements',
      initialSearch: state.announcementSearch,
      debounceMs: 250,
      filters: [{
        key: 'sort',
        label: 'Sort',
        allLabel: 'Default order (newest)',
        value: state.announcementSort,
        options: [
          { value: 'newest', label: 'Newest first' },
          { value: 'oldest', label: 'Oldest first' }
        ]
      }],
      onSearch: function (query) {
        state.announcementSearch = query.search;
        if (query.filters && hasText(query.filters.sort)) state.announcementSort = query.filters.sort;
        else state.announcementSort = 'newest';

        filterAnnouncements();
        renderAnnouncements();

        if (query.reset) {
          bar.setStatus('Showing all ' + UI.formatNumber(state.announcements.length) + ' announcements.');
        } else {
          bar.setStatus(UI.formatNumber(state.announcementsFiltered.length) + ' match' +
            (state.announcementsFiltered.length === 1 ? '' : 'es') + ' found.');
        }
      }
    });

    host.appendChild(bar.element);
  }

  /* ======================================================================
   * Emergency hotlines (GET /public/hotlines)
   * ==================================================================== */

  function hotlineCard(hotline) {
    var name = pickString(hotline, ['name', 'title', 'label'], 'Barangay hotline');
    var number = pickString(hotline, ['number', 'contactNumber', 'phone', 'mobile'], '');
    var description = pickString(hotline, ['description', 'details', 'note'], '');
    var isEmergency = hotline && hotline.isEmergency === true;
    var href = telHref(number);

    return '<article class="card hotline' + (isEmergency ? ' hotline--emergency' : '') + '">' +
      '<div class="hotline__head">' +
        '<span class="hotline__icon" aria-hidden="true">' + (isEmergency ? '🚨' : '☎️') + '</span>' +
        '<h3 class="card__title">' + UI.escapeHtml(name) + '</h3>' +
      '</div>' +
      (description ? '<p class="hotline__desc">' + UI.escapeHtml(description) + '</p>' : '') +
      (href
        ? '<a class="btn ' + (isEmergency ? 'btn--danger' : 'btn--primary') + ' hotline__call" href="' +
          UI.escapeHtml(href) + '">Call ' + UI.escapeHtml(number) + '</a>'
        : '<p class="muted small">Number not published yet.</p>') +
    '</article>';
  }

  function renderHotlines() {
    var host = UI.qs('#hotlines-list');
    if (!host) return;

    var query = state.hotlineSearch.trim().toLowerCase();
    var list = state.hotlines.slice();

    if (query) {
      list = list.filter(function (hotline) {
        return [pickString(hotline, ['name', 'title', 'label'], ''),
                pickString(hotline, ['number', 'contactNumber', 'phone', 'mobile'], ''),
                pickString(hotline, ['description', 'details', 'note'], '')]
          .join(' ').toLowerCase().indexOf(query) !== -1;
      });
    }

    // Emergency hotlines float to the top.
    list.sort(function (a, b) {
      var aEmergency = a && a.isEmergency === true ? 1 : 0;
      var bEmergency = b && b.isEmergency === true ? 1 : 0;
      return bEmergency - aEmergency;
    });

    if (!state.hotlines.length) {
      UI.setHtml(host, UI.errorState(
        'Hotline numbers are temporarily unavailable.',
        'In a real emergency, call the national emergency hotline 911.'
      ));
      return;
    }

    if (!list.length) {
      UI.setHtml(host, UI.emptyState(
        'No hotline matches your search.',
        'Press Reset to show every hotline again.'
      ));
      return;
    }

    UI.setHtml(host, list.map(hotlineCard).join(''));
  }

  function initHotlinesSearch() {
    var host = UI.qs('#hotlines-search');
    if (!host) return;

    var bar = UI.createSearchBar({
      searchPlaceholder: 'Search hotlines by name or number…',
      label: 'Search hotlines',
      debounceMs: 200,
      onSearch: function (query) {
        state.hotlineSearch = query.search;
        renderHotlines();
        bar.setStatus(query.search
          ? 'Filtering hotlines for "' + query.search + '".'
          : 'Showing all hotlines.');
      }
    });

    host.appendChild(bar.element);
  }

  /* ======================================================================
   * About + office info (GET /public/info)
   * ==================================================================== */

  function aboutPayload(data) {
    if (!data || typeof data !== 'object') return null;
    if (data.about && typeof data.about === 'object') return data.about;
    if (data.info && typeof data.info === 'object') return data.info;
    return data;
  }

  function renderInfoFallbacks() {
    UI.setText('#about-barangay', cfg.barangayName || '');
    UI.setText('#about-municipality', cfg.municipality || '');
    UI.setText('#about-mission', 'To serve every resident with fast, fair and transparent barangay services, and to keep the community informed through a modern digital system.');
    UI.setText('#about-vision', 'A peaceful, clean and progressive barangay where every resident is heard and every concern is acted on quickly.');
    UI.setText('#about-history', '');
    UI.setText('#about-contact-email', hasText(cfg.contactEmail) ? cfg.contactEmail : 'Not published yet');
    UI.setText('#about-contact-number', hasText(cfg.contactNumber) ? cfg.contactNumber : 'Not published yet');
    UI.setText('#about-office-hours', hasText(cfg.officeHours) ? cfg.officeHours : 'Not published yet');
  }

  function renderInfo(data) {
    var about = aboutPayload(data);
    if (!about) {
      renderInfoFallbacks();
      UI.setText('#about-source-note', 'Showing the details configured in src/config.js.');
      return;
    }

    var barangay = pickString(about, ['barangayName', 'name'], cfg.barangayName || '');
    var municipality = pickString(about, ['municipality', 'location', 'address'], cfg.municipality || '');
    var mission = pickString(about, ['mission'], '');
    var vision = pickString(about, ['vision'], '');
    var history = pickString(about, ['history', 'about'], '');
    var email = pickString(about, ['contactEmail', 'email'], '');
    var number = pickString(about, ['contactNumber', 'contact', 'phone'], '');
    var hours = pickString(about, ['officeHours', 'hours'], '');

    UI.setText('#about-barangay', hasText(barangay) ? barangay : (cfg.barangayName || ''));
    UI.setText('#about-municipality', hasText(municipality) ? municipality : (cfg.municipality || ''));
    UI.setText('#about-mission', hasText(mission) ? mission : 'Mission statement will be published soon.');
    UI.setText('#about-vision', hasText(vision) ? vision : 'Vision statement will be published soon.');
    UI.setText('#about-history', hasText(history) ? history : '');
    UI.show('#about-history-wrap', hasText(history));

    UI.setText('#about-contact-email', hasText(email) ? email : (hasText(cfg.contactEmail) ? cfg.contactEmail : 'Not published yet'));
    UI.setText('#about-contact-number', hasText(number) ? number : (hasText(cfg.contactNumber) ? cfg.contactNumber : 'Not published yet'));
    UI.setText('#about-office-hours', hasText(hours) ? hours : (hasText(cfg.officeHours) ? cfg.officeHours : 'Not published yet'));

    // Also refresh the config-driven text nodes with the live values.
    if (hasText(barangay)) {
      UI.setText('[data-config="barangayName"]', barangay);
    }
    if (hasText(municipality)) UI.setText('[data-config="municipality"]', municipality);
    if (hasText(email)) {
      UI.setText('[data-config="contactEmail"]', email);
      var emailLink = UI.qs('#footer-email');
      if (emailLink) emailLink.setAttribute('href', 'mailto:' + email);
    }
    if (hasText(number)) {
      UI.setText('[data-config="contactNumber"]', number);
      var telLink = UI.qs('#footer-contact-number');
      var href = telHref(number);
      if (telLink && href) telLink.setAttribute('href', href);
    }
    if (hasText(hours)) UI.setText('[data-config="officeHours"]', hours);

    UI.setText('#about-source-note', 'Live barangay information from the management system.');
  }

  /* ======================================================================
   * Organizational chart (GET /public/organization)
   * ==================================================================== */

  function isOrganizationNode(value) {
    return value && typeof value === 'object' &&
      (hasText(value.name) || hasText(value.position));
  }

  /** Accepts a ready-made tree or a flat list that uses parentId. */
  function buildOrganizationTree(rawList) {
    var list = asArray(rawList, ['organization', 'members', 'nodes', 'tree']);
    if (!list.length) return [];

    var byId = {};
    var hasChildrenField = list.some(function (item) { return Array.isArray(item && item.children); });

    if (hasChildrenField) {
      return list.filter(isOrganizationNode);
    }

    list.forEach(function (item) {
      if (!isOrganizationNode(item)) return;
      var id = item.id === null || item.id === undefined ? 'root-' + Object.keys(byId).length : String(item.id);
      byId[id] = Object.assign({}, item, { __key: id, children: [] });
    });

    var roots = [];
    Object.keys(byId).forEach(function (key) {
      var node = byId[key];
      var parentId = node.parentId === null || node.parentId === undefined ? null : String(node.parentId);
      if (parentId && byId[parentId]) byId[parentId].children.push(node);
      else roots.push(node);
    });

    return roots.length ? roots : Object.keys(byId).map(function (key) { return byId[key]; });
  }

  function organizationNodeHtml(node) {
    var name = pickString(node, ['name', 'fullName', 'personnelName'], 'Unnamed');
    var position = pickString(node, ['position', 'role', 'title'], '');
    var photoPath = pickString(node, ['photoUrl', 'photoPath', 'imageUrl'], '');
    var children = Array.isArray(node.children) ? node.children : [];

    var html = '<li class="org-node">' +
      '<div class="org-node__card">' +
        (hasText(photoPath)
          ? '<img class="org-node__photo" src="' + UI.escapeHtml(Api.resolveFileUrl(photoPath)) + '" alt="" loading="lazy" onerror="this.style.display=\'none\'">'
          : '<span class="org-node__avatar" aria-hidden="true">' + UI.escapeHtml(UI.initials(name)) + '</span>') +
        '<div class="org-node__text">' +
          '<span class="org-node__name">' + UI.escapeHtml(name) + '</span>' +
          (hasText(position) ? '<span class="org-node__position">' + UI.escapeHtml(position) + '</span>' : '') +
        '</div>' +
      '</div>';

    if (children.length) {
      html += '<ul class="org-tree__children">' + children.map(organizationNodeHtml).join('') + '</ul>';
    }
    return html + '</li>';
  }

  function renderOrganization(rawList) {
    var host = UI.qs('#organization-tree');
    if (!host) return;

    var tree = buildOrganizationTree(rawList);
    if (!tree.length) {
      UI.setHtml(host, UI.emptyState(
        'The organizational chart is not published yet.',
        'Barangay officials and staff will be listed here once the chart is uploaded.'
      ));
      return;
    }

    UI.setHtml(host, '<ul class="org-tree">' + tree.map(organizationNodeHtml).join('') + '</ul>');
  }

  /* ======================================================================
   * Data loaders (each one degrades gracefully when the API is offline)
   * ==================================================================== */

  function loadStatistics() {
    var host = UI.qs('#statistics-grid');
    if (host) UI.setHtml(host, UI.skeletonCards(3, 'Loading live statistics…'));

    return Api.get('/public/statistics')
      .then(function (data) {
        renderStatistics(data);
      })
      .catch(function (err) {
        logError('GET /public/statistics', err);
        renderStatistics(null);
        showApiWarningOnce(err);
      });
  }

  function loadAnnouncements() {
    var host = UI.qs('#announcements-list');
    if (host) UI.setHtml(host, UI.skeletonCards(3, 'Loading announcements…'));

    var path = '/public/announcements?page=1&pageSize=' + encodeURIComponent(String(pageSize)) +
      '&sortBy=date&sortDir=desc';

    return Api.get(path)
      .then(function (data) {
        state.announcements = asArray(data, ['announcements']);
        filterAnnouncements();
        renderAnnouncements();
      })
      .catch(function (err) {
        logError('GET /public/announcements', err);
        state.announcements = [];
        state.announcementsFiltered = [];
        if (host) {
          UI.setHtml(host, UI.errorState(
            'Announcements could not be loaded.',
            'The barangay server is offline or unreachable. Please refresh the page once it is running again.'
          ));
        }
        UI.setText('#announcements-count', '');
        showApiWarningOnce(err);
      });
  }

  function loadHotlines() {
    var host = UI.qs('#hotlines-list');
    if (host) UI.setHtml(host, UI.skeletonCards(3, 'Loading hotline numbers…'));

    return Api.get('/public/hotlines')
      .then(function (data) {
        state.hotlines = asArray(data, ['hotlines']);
        renderHotlines();
      })
      .catch(function (err) {
        logError('GET /public/hotlines', err);
        state.hotlines = [];
        renderHotlines();
        showApiWarningOnce(err);
      });
  }

  function loadInfo() {
    return Api.get('/public/info')
      .then(function (data) {
        state.info = data;
        renderInfo(data);
      })
      .catch(function (err) {
        logError('GET /public/info', err);
        renderInfoFallbacks();
        UI.setText('#about-source-note', 'The barangay server is offline, so the details below come from src/config.js.');
        showApiWarningOnce(err);
      });
  }

  function loadOrganization() {
    var host = UI.qs('#organization-tree');
    if (host) UI.setHtml(host, UI.skeletonCards(2, 'Loading the organizational chart…'));

    return Api.get('/public/organization')
      .then(function (data) {
        state.organization = asArray(data, ['organization']);
        renderOrganization(data);
      })
      .catch(function (err) {
        logError('GET /public/organization', err);
        state.organization = [];
        renderOrganization(null);
        showApiWarningOnce(err);
      });
  }

  function loadDownloads() {
    return Api.get('/public/downloads')
      .then(function (data) {
        state.downloads = data && typeof data === 'object' ? data : null;
        wireDownloadButtons();
      })
      .catch(function (err) {
        logError('GET /public/downloads', err);
        state.downloads = null;
        wireDownloadButtons();
      });
  }

  var apiWarningShown = false;
  function showApiWarningOnce(err) {
    if (apiWarningShown) return;
    apiWarningShown = true;

    var banner = UI.qs('#api-warning');
    if (banner) {
      var detail = banner.querySelector('[data-api-warning-detail]');
      if (detail) {
        detail.textContent = 'The live sections (statistics, announcements, hotlines, about and the app download link) ' +
          'fall back to the content stored in src/config.js. ' +
          (err && err.message ? 'Details: ' + err.message : '');
      }
      UI.show(banner, true);
    }
    UI.showToast('The barangay server is offline. Showing offline content instead.', 'error', 7000);
  }

  /* ======================================================================
   * Page interactions
   * ==================================================================== */

  function initNavigation() {
    var toggle = UI.qs('#nav-toggle');
    var menu = UI.qs('#primary-nav');

    if (toggle && menu) {
      UI.on(toggle, 'click', function () {
        var open = menu.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      UI.qsa('a', menu).forEach(function (link) {
        UI.on(link, 'click', function () {
          menu.classList.remove('is-open');
          toggle.setAttribute('aria-expanded', 'false');
        });
      });
    }

    var header = UI.qs('#site-header');
    if (header) {
      var update = function () {
        header.classList.toggle('is-scrolled', (window.scrollY || window.pageYOffset || 0) > 12);
      };
      UI.on(window, 'scroll', update, { passive: true });
      update();
    }

    var yearNode = UI.qs('#footer-year');
    if (yearNode) yearNode.textContent = String(new Date().getFullYear());
  }

  function initAnnouncementReadMore() {
    var host = UI.qs('#announcements-list');
    if (!host) return;

    UI.on(host, 'click', function (event) {
      var button = event.target && event.target.closest ? event.target.closest('[data-toggle-text]') : null;
      if (!button) return;
      var card = button.closest('.announcement');
      var text = card ? card.querySelector('.announcement__text') : null;
      if (!text) return;
      var clamped = text.classList.toggle('is-clamped');
      button.textContent = clamped ? 'Read more' : 'Show less';
    });
  }

  function initFaqAccordion() {
    var items = UI.qsa('#faq details');
    items.forEach(function (item) {
      UI.on(item, 'toggle', function () {
        if (!item.open) return;
        items.forEach(function (other) {
          if (other !== item) other.open = false;
        });
      });
    });
  }

  function initAnchorLinks() {
    UI.qsa('a[href^="#"]').forEach(function (link) {
      UI.on(link, 'click', function (event) {
        var id = link.getAttribute('href');
        // Read the href at click time: download buttons start as '#download'
        // and may later be replaced by a real installer URL.
        if (!id || id.charAt(0) !== '#' || id === '#') return;
        var target = UI.qs(id);
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (window.history && window.history.replaceState) {
          window.history.replaceState(null, '', id);
        }
      });
    });
  }

  function initStatisticsReload() {
    var button = UI.qs('#statistics-reload');
    if (!button) return;
    UI.on(button, 'click', function () {
      button.disabled = true;
      loadStatistics().then(function () {
        button.disabled = false;
      });
    });
  }

  /* ======================================================================
   * Boot
   * ==================================================================== */

  function boot() {
    if (!Api || typeof Api.get !== 'function') {
      if (window.console && window.console.error) {
        window.console.error('[barangay-website] src/api.js did not load correctly.');
      }
      return;
    }
    if (!UI || typeof UI.escapeHtml !== 'function') {
      if (window.console && window.console.error) {
        window.console.error('[barangay-website] src/ui.js did not load correctly.');
      }
      return;
    }

    try {
      applyConfigToDom();
      wireDownloadButtons();
      initNavigation();
      initFaqAccordion();
      initAnchorLinks();
      initAnnouncementReadMore();
      initAnnouncementsSearch();
      initHotlinesSearch();
      initStatisticsReload();
    } catch (err) {
      logError('page setup', err);
    }

    // Each loader is independent: one failure never blocks the others.
    loadStatistics();
    loadAnnouncements();
    loadHotlines();
    loadInfo();
    loadOrganization();
    loadDownloads();
  }

  UI.ready(boot);
})();
