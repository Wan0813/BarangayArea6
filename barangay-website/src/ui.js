/* =============================================================================
 * ui.js - shared, framework-free UI helpers for the public website
 * -----------------------------------------------------------------------------
 *  Everything hangs off the global `UI` object so plain <script> tags can use
 *  it from index.html / app.js without any build step.
 *
 *  The most important helper is the universal search bar:
 *
 *      UI.createSearchBar({
 *        searchPlaceholder: 'Search announcements...',
 *        filters: [{ key: 'sort', label: 'Sort', options: [...] }],
 *        onSearch: function (state) { ... }   // { search, filters, reset }
 *      })
 *
 *  It always renders a text input, an optional filter row and a RESET button
 *  that clears the text plus every filter and re-runs the search.
 * ========================================================================== */

(function (global) {
  'use strict';

  /* ======================================================================
   * Small DOM utilities
   * ==================================================================== */

  function qs(selector, root) {
    return (root || global.document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || global.document).querySelectorAll(selector));
  }

  function resolveElement(target) {
    if (!target) return null;
    if (typeof target === 'string') return qs(target);
    if (typeof target === 'object' && target.nodeType === 1) return target;
    return null;
  }

  /** createElement('button', { class: 'btn' }, ['Save']) */
  function el(tag, attrs, children) {
    var node = global.document.createElement(tag);
    if (attrs && typeof attrs === 'object') {
      Object.keys(attrs).forEach(function (key) {
        var value = attrs[key];
        if (value === null || value === undefined || value === false) return;
        if (key === 'text') { node.textContent = String(value); return; }
        if (key === 'html') { node.innerHTML = String(value); return; }
        if (key === 'dataset' && typeof value === 'object') {
          Object.keys(value).forEach(function (dataKey) { node.setAttribute('data-' + dataKey, String(value[dataKey])); });
          return;
        }
        if (key === 'class') { node.className = String(value); return; }
        node.setAttribute(key, value === true ? '' : String(value));
      });
    }
    var list = children;
    if (list !== undefined && list !== null) {
      if (!Array.isArray(list)) list = [list];
      list.forEach(function (child) {
        if (child === null || child === undefined || child === false) return;
        node.appendChild(typeof child === 'object' && child.nodeType === 1
          ? child
          : global.document.createTextNode(String(child)));
      });
    }
    return node;
  }

  function clear(target) {
    var node = resolveElement(target);
    if (!node) return null;
    while (node.firstChild) node.removeChild(node.firstChild);
    return node;
  }

  function setText(target, value) {
    var node = resolveElement(target);
    if (node) node.textContent = value === null || value === undefined ? '' : String(value);
    return node;
  }

  function setHtml(target, html) {
    var node = resolveElement(target);
    if (node) node.innerHTML = html === null || html === undefined ? '' : String(html);
    return node;
  }

  function show(target, visible) {
    var node = resolveElement(target);
    if (!node) return null;
    node.hidden = !visible;
    if (visible) node.removeAttribute('aria-hidden');
    else node.setAttribute('aria-hidden', 'true');
    return node;
  }

  function on(target, type, handler, options) {
    var node = resolveElement(target);
    if (node) node.addEventListener(type, handler, options);
    return node;
  }

  function ready(fn) {
    if (global.document.readyState === 'loading') {
      global.document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  }

  /* ======================================================================
   * Text / value helpers
   * ==================================================================== */

  var HTML_ESCAPES = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '`': '&#96;',
    '=': '&#61;',
    '/': '&#47;'
  };

  /** Escapes ANY value coming from the API or user input before it is put in HTML. */
  function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value).replace(/[&<>"'`=\/]/g, function (ch) {
      return HTML_ESCAPES[ch] || ch;
    });
  }

  /** Escapes text and keeps line breaks (safe for innerHTML). */
  function multiline(value) {
    return escapeHtml(value).replace(/\r\n|\r|\n/g, '<br>');
  }

  function truncate(value, maxLength, suffix) {
    var text = value === null || value === undefined ? '' : String(value);
    var limit = Number(maxLength) || 160;
    if (text.length <= limit) return text;
    return text.slice(0, limit).replace(/\s+\S*$/, '') + (suffix === undefined ? '…' : suffix);
  }

  function formatNumber(value) {
    var num = Number(value);
    if (!isFinite(num)) return '0';
    try {
      return num.toLocaleString();
    } catch (err) {
      return String(num);
    }
  }

  function formatDate(value, options) {
    var opts = options || {};
    var fallback = opts.fallback === undefined ? '—' : opts.fallback;
    if (value === null || value === undefined || value === '') return fallback;

    var date = value instanceof Date ? value : new Date(value);
    if (!date || isNaN(date.getTime())) return fallback;

    var dateOptions = {
      year: 'numeric',
      month: opts.month || 'short',
      day: 'numeric'
    };
    if (opts.withTime) {
      dateOptions.hour = 'numeric';
      dateOptions.minute = '2-digit';
    }
    try {
      return date.toLocaleDateString(undefined, dateOptions);
    } catch (err) {
      return String(date.toDateString ? date.toDateString() : date);
    }
  }

  function formatDateTime(value, options) {
    return formatDate(value, Object.assign({ withTime: true }, options || {}));
  }

  /** Normalises 'Ongoing' / 'in-progress' into a CSS-friendly token. */
  function normalizeToken(value) {
    return String(value === null || value === undefined ? '' : value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '');
  }

  var STATUS_CLASSES = {
    pending: 'badge--pending',
    ongoing: 'badge--ongoing',
    inprogress: 'badge--ongoing',
    processing: 'badge--ongoing',
    approved: 'badge--approved',
    active: 'badge--approved',
    resolved: 'badge--resolved',
    completed: 'badge--resolved',
    published: 'badge--resolved',
    rejected: 'badge--rejected',
    declined: 'badge--rejected',
    suspended: 'badge--rejected',
    closed: 'badge--neutral',
    draft: 'badge--neutral'
  };

  /** Returns the full class string, e.g. 'badge badge--resolved'. */
  function statusBadgeClass(status) {
    var token = normalizeToken(status);
    return 'badge ' + (STATUS_CLASSES[token] || 'badge--neutral');
  }

  /** Human-friendly label for a status value ('pending' -> 'Pending'). */
  function statusLabel(status) {
    var text = String(status === null || status === undefined ? '' : status).trim();
    if (!text) return 'Unknown';
    return text.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ')
      .replace(/\b\w/g, function (ch) { return ch.toUpperCase(); });
  }

  function initials(value) {
    var parts = String(value === null || value === undefined ? '' : value).trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  function debounce(fn, wait) {
    var timer = null;
    var delay = Number(wait) || 250;
    return function () {
      var context = this;
      var args = arguments;
      if (timer) global.clearTimeout(timer);
      timer = global.setTimeout(function () {
        timer = null;
        fn.apply(context, args);
      }, delay);
    };
  }

  /* ======================================================================
   * Skeleton / empty states
   * ==================================================================== */

  function skeletonCards(count, message) {
    var total = Math.max(1, Number(count) || 3);
    var html = '';
    for (var i = 0; i < total; i++) {
      html += '<div class="card skeleton" aria-hidden="true">' +
        '<div class="skeleton__line skeleton__line--title"></div>' +
        '<div class="skeleton__line"></div>' +
        '<div class="skeleton__line"></div>' +
        '<div class="skeleton__line skeleton__line--short"></div>' +
        '</div>';
    }
    if (message) {
      html = '<p class="muted small loading-note">' + escapeHtml(message) + '</p>' + html;
    }
    return html;
  }

  function emptyState(message, hint) {
    return '<div class="empty-state" role="status">' +
      '<span class="empty-state__icon" aria-hidden="true">🗒️</span>' +
      '<p class="empty-state__title">' + escapeHtml(message || 'Nothing to show yet.') + '</p>' +
      (hint ? '<p class="empty-state__hint">' + escapeHtml(hint) + '</p>' : '') +
      '</div>';
  }

  function errorState(message, hint) {
    return '<div class="empty-state empty-state--warning" role="status">' +
      '<span class="empty-state__icon" aria-hidden="true">📡</span>' +
      '<p class="empty-state__title">' + escapeHtml(message || 'This information is unavailable right now.') + '</p>' +
      (hint ? '<p class="empty-state__hint">' + escapeHtml(hint) + '</p>' : '') +
      '</div>';
  }

  /* ======================================================================
   * Toast notifications
   * ==================================================================== */

  function ensureToastHost() {
    var host = qs('#ui-toast-host');
    if (!host) {
      host = el('div', { id: 'ui-toast-host', class: 'toast-host', role: 'region', 'aria-live': 'polite' });
      (global.document.body || global.document.documentElement).appendChild(host);
    }
    return host;
  }

  function showToast(message, type, timeout) {
    var text = String(message === null || message === undefined ? '' : message).trim();
    if (!text) return null;

    var kind = type || 'info';
    var host = ensureToastHost();
    var node = el('div', {
      class: 'toast toast--' + normalizeToken(kind).replace(/[^a-z]/g, '') || 'info',
      role: 'status'
    }, [
      el('span', { class: 'toast__text', text: text }),
      el('button', { type: 'button', class: 'toast__close', 'aria-label': 'Dismiss notification', text: '×' })
    ]);

    function dismiss() {
      if (!node.parentNode) return;
      node.classList.add('toast--leaving');
      global.setTimeout(function () {
        if (node.parentNode) node.parentNode.removeChild(node);
      }, 220);
    }

    on(node.querySelector('.toast__close'), 'click', dismiss);
    host.appendChild(node);

    var wait = timeout === undefined ? 4500 : Number(timeout);
    if (wait > 0) global.setTimeout(dismiss, wait);
    return node;
  }

  /* ======================================================================
   * Pagination
   * ==================================================================== */

  function toInt(value, fallback) {
    var num = parseInt(value, 10);
    return isFinite(num) ? num : fallback;
  }

  /**
   * renderPagination(hostElementOrSelector, { page, pageSize, totalItems,
   *                            totalPages, hasPrevious, hasNext }, onPage)
   */
  function renderPagination(target, info, onPage) {
    var host = resolveElement(target);
    if (!host) return null;

    var source = info || {};
    var pageSize = Math.max(1, toInt(source.pageSize, 10));
    var page = Math.max(1, toInt(source.page, 1));
    var totalItems = Math.max(0, toInt(source.totalItems, 0));
    var totalPages = toInt(source.totalPages, 0);
    if (!totalPages) totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    totalPages = Math.max(1, totalPages);
    if (page > totalPages) page = totalPages;

    var hasPrevious = source.hasPrevious === undefined ? page > 1 : !!source.hasPrevious;
    var hasNext = source.hasNext === undefined ? page < totalPages : !!source.hasNext;

    clear(host);
    host.classList.add('pagination');

    if (totalPages <= 1) {
      if (totalItems > 0) {
        host.appendChild(el('span', {
          class: 'pagination__summary',
          text: formatNumber(totalItems) + (totalItems === 1 ? ' item' : ' items')
        }));
      }
      return { page: page, totalPages: totalPages, totalItems: totalItems };
    }

    function pageButton(label, targetPage, opts) {
      var options = opts || {};
      var button = el('button', {
        type: 'button',
        class: 'pagination__btn' + (options.active ? ' is-active' : ''),
        text: label,
        'aria-label': options.ariaLabel || ('Page ' + targetPage),
        'aria-current': options.active ? 'page' : null
      });
      if (options.disabled) {
        button.disabled = true;
        button.setAttribute('aria-disabled', 'true');
      } else if (typeof onPage === 'function') {
        on(button, 'click', function () {
          if (targetPage === page) return;
          onPage(targetPage);
        });
      }
      return button;
    }

    host.appendChild(pageButton('‹ Prev', page - 1, { disabled: !hasPrevious, ariaLabel: 'Previous page' }));

    var windowSize = 5;
    var start = Math.max(1, page - Math.floor(windowSize / 2));
    var end = Math.min(totalPages, start + windowSize - 1);
    start = Math.max(1, end - windowSize + 1);

    if (start > 1) {
      host.appendChild(pageButton('1', 1, {}));
      if (start > 2) host.appendChild(el('span', { class: 'pagination__gap', text: '…' }));
    }
    for (var p = start; p <= end; p++) {
      host.appendChild(pageButton(String(p), p, { active: p === page }));
    }
    if (end < totalPages) {
      if (end < totalPages - 1) host.appendChild(el('span', { class: 'pagination__gap', text: '…' }));
      host.appendChild(pageButton(String(totalPages), totalPages, {}));
    }

    host.appendChild(pageButton('Next ›', page + 1, { disabled: !hasNext, ariaLabel: 'Next page' }));
    host.appendChild(el('span', {
      class: 'pagination__summary',
      text: 'Page ' + page + ' of ' + totalPages + ' · ' + formatNumber(totalItems) + ' items'
    }));

    return { page: page, totalPages: totalPages, totalItems: totalItems };
  }

  /* ======================================================================
   * Universal search bar  (text input + filters + RESET)
   * ==================================================================== */

  /**
   * createSearchBar({
   *   searchPlaceholder, label, initialSearch, initialFilters, resetLabel,
   *   debounceMs, busyLabel,
   *   filters: [
   *     { key, label, value, allLabel, options: [ 'A', { value:'B', label:'Bee' } ] }
   *   ],
   *   onSearch: function (state) {}   // state = { search, filters, reset }
   * })
   */
  function createSearchBar(options) {
    var opts = options || {};
    var filterDefs = Array.isArray(opts.filters) ? opts.filters : [];
    var debounceMs = opts.debounceMs === undefined ? 250 : Number(opts.debounceMs);

    var state = {
      search: opts.initialSearch === null || opts.initialSearch === undefined ? '' : String(opts.initialSearch),
      filters: {}
    };
    filterDefs.forEach(function (def) {
      var initial = def.value;
      if (opts.initialFilters && Object.prototype.hasOwnProperty.call(opts.initialFilters, def.key)) {
        initial = opts.initialFilters[def.key];
      }
      state.filters[def.key] = initial === null || initial === undefined ? '' : String(initial);
    });

    var root = el('div', { class: 'search-bar' });
    var form = el('form', { class: 'search-bar__form', role: 'search' });
    var controls = el('div', { class: 'search-bar__controls' });

    /* ---- text input --------------------------------------------------- */
    var inputId = 'search-input-' + Math.random().toString(36).slice(2, 8);
    var input = el('input', {
      id: inputId,
      type: 'search',
      class: 'search-bar__input',
      placeholder: opts.searchPlaceholder || 'Search…',
      autocomplete: 'off',
      spellcheck: 'false',
      value: state.search,
      'aria-label': opts.label || opts.searchPlaceholder || 'Search'
    });

    var field = el('div', { class: 'search-bar__field' }, [
      el('span', { class: 'search-bar__icon', 'aria-hidden': 'true', text: '🔍' }),
      input
    ]);
    controls.appendChild(field);

    /* ---- optional filter selects -------------------------------------- */
    var selectNodes = {};
    if (filterDefs.length) {
      var filtersRow = el('div', { class: 'search-bar__filters' });
      filterDefs.forEach(function (def) {
        var selectId = 'search-filter-' + def.key + '-' + Math.random().toString(36).slice(2, 6);
        var select = el('select', {
          id: selectId,
          class: 'search-bar__select',
          'aria-label': def.label || def.key
        });
        select.appendChild(el('option', { value: '', text: def.allLabel || ('All ' + (def.label || def.key)) }));
        (def.options || []).forEach(function (option) {
          var value = typeof option === 'object' && option !== null ? option.value : option;
          var label = typeof option === 'object' && option !== null ? option.label : option;
          select.appendChild(el('option', { value: value === null || value === undefined ? '' : value, text: label }));
        });
        select.value = state.filters[def.key];
        if (select.value !== state.filters[def.key]) select.value = '';
        state.filters[def.key] = select.value;
        selectNodes[def.key] = select;

        on(select, 'change', function () {
          state.filters[def.key] = select.value;
          emit(false);
        });

        filtersRow.appendChild(el('label', { class: 'search-bar__filter', for: selectId }, [
          el('span', { class: 'search-bar__filter-label', text: def.label || def.key }),
          select
        ]));
      });
      controls.appendChild(filtersRow);
    }

    /* ---- reset button (always present) -------------------------------- */
    var resetButton = el('button', {
      type: 'button',
      class: 'btn btn--ghost search-bar__reset',
      title: 'Clear the search text and every filter'
    }, [
      el('span', { 'aria-hidden': 'true', text: '↺' }),
      el('span', { text: opts.resetLabel || 'Reset' })
    ]);

    var actions = el('div', { class: 'search-bar__actions' }, [
      el('button', { type: 'button', class: 'btn btn--primary search-bar__submit', text: opts.searchButtonLabel || 'Search' }),
      resetButton
    ]);
    controls.appendChild(actions);

    form.appendChild(controls);
    root.appendChild(form);

    var status = el('p', { class: 'search-bar__status muted small', role: 'status', 'aria-live': 'polite' });
    root.appendChild(status);

    /* ---- behaviour ---------------------------------------------------- */
    function snapshot(reset) {
      return {
        search: state.search,
        filters: Object.assign({}, state.filters),
        reset: !!reset
      };
    }

    function emit(reset) {
      if (typeof opts.onSearch !== 'function') return;
      var payload = snapshot(reset);
      try {
        var result = opts.onSearch(payload);
        if (result && typeof result.then === 'function') {
          result.catch(function (err) {
            if (global.console && global.console.error) global.console.error(err);
            showToast('Something went wrong while searching. Please try again.', 'error');
          });
        }
      } catch (err) {
        if (global.console && global.console.error) global.console.error(err);
        showToast('Something went wrong while searching. Please try again.', 'error');
      }
    }

    var debouncedEmit = debounce(function () { emit(false); }, debounceMs);

    on(input, 'input', function () {
      state.search = input.value;
      debouncedEmit();
    });
    on(input, 'search', function () {
      state.search = input.value;
      emit(false);
    });
    on(form, 'submit', function (event) {
      event.preventDefault();
      state.search = input.value;
      emit(false);
    });
    on(resetButton, 'click', function () {
      input.value = '';
      state.search = '';
      Object.keys(selectNodes).forEach(function (key) {
        selectNodes[key].value = '';
        state.filters[key] = '';
      });
      setBusy(false);
      setStatus('Search text and filters cleared.');
      emit(true);
    });

    function setBusy(busy, message) {
      root.classList.toggle('is-busy', !!busy);
      if (busy && message) setStatus(message);
      else if (!busy && status.textContent === (opts.busyLabel || 'Searching…')) setStatus('');
    }

    function setStatus(message) {
      status.textContent = message || '';
    }

    return {
      element: root,
      input: input,
      resetButton: resetButton,
      getState: function () { return snapshot(false); },
      setState: function (next) {
        var patch = next || {};
        if (patch.search !== undefined) {
          state.search = patch.search === null ? '' : String(patch.search);
          input.value = state.search;
        }
        if (patch.filters) {
          Object.keys(patch.filters).forEach(function (key) {
            if (selectNodes[key]) selectNodes[key].value = patch.filters[key];
            state.filters[key] = selectNodes[key] ? selectNodes[key].value : patch.filters[key];
          });
        }
      },
      run: function () { emit(false); },
      reset: function () { resetButton.click(); },
      setBusy: setBusy,
      setStatus: setStatus
    };
  }

  /* ======================================================================
   * Export
   * ==================================================================== */

  global.UI = {
    // DOM
    qs: qs,
    qsa: qsa,
    el: el,
    clear: clear,
    setText: setText,
    setHtml: setHtml,
    show: show,
    on: on,
    ready: ready,
    resolveElement: resolveElement,
    // text / values
    escapeHtml: escapeHtml,
    multiline: multiline,
    truncate: truncate,
    formatNumber: formatNumber,
    formatDate: formatDate,
    formatDateTime: formatDateTime,
    statusBadgeClass: statusBadgeClass,
    statusLabel: statusLabel,
    initials: initials,
    debounce: debounce,
    // states
    skeletonCards: skeletonCards,
    emptyState: emptyState,
    errorState: errorState,
    // feedback + lists
    showToast: showToast,
    renderPagination: renderPagination,
    createSearchBar: createSearchBar
  };
})(window);
