/* =============================================================================
 * api.js - tiny fetch helper for the public website
 * -----------------------------------------------------------------------------
 *  Reads window.APP_CONFIG (see src/config.js) and talks to the REST API.
 *
 *  Every response from the API uses the same envelope:
 *      { success: true|false, message: string|null, data: any, errors: [] }
 *
 *  Api.get('/public/info')      -> resolves with the unwrapped `data`
 *  Api.post('/public/thing', {}) -> resolves with the unwrapped `data`
 *
 *  Any of these FAILURES throws an ApiError with a friendly `message`:
 *    - the server is offline / unreachable / times out
 *    - the server replied success: false
 *    - the server replied with a non-2xx HTTP status
 * ========================================================================== */

(function (global) {
  'use strict';

  var DEFAULT_TIMEOUT_MS = 8000;

  /** Error thrown for every API problem. Carries an end-user friendly message. */
  function ApiError(message, status, errors, cause) {
    var self = new Error(message || 'Something went wrong.');
    self.name = 'ApiError';
    self.status = status || 0;
    self.errors = Array.isArray(errors) ? errors : [];
    self.cause = cause || null;
    // Keep `instanceof ApiError` working.
    self.constructor = ApiError;
    Object.setPrototypeOf(self, ApiError.prototype);
    return self;
  }
  ApiError.prototype = Object.create(Error.prototype);
  ApiError.prototype.constructor = ApiError;

  function settings() {
    return global.APP_CONFIG || {};
  }

  function trimTrailingSlashes(value) {
    return String(value == null ? '' : value).replace(/\/+$/, '');
  }

  function apiBaseUrl() {
    return trimTrailingSlashes(settings().apiBaseUrl);
  }

  function fileBaseUrl() {
    return trimTrailingSlashes(settings().fileBaseUrl);
  }

  function isAbsolute(value) {
    return /^(https?:)?\/\//i.test(value) ||
           /^data:/i.test(value) ||
           /^blob:/i.test(value);
  }

  /** Turns '/public/info' into 'http://host:5080/api/public/info'. */
  function buildUrl(path) {
    var raw = String(path == null ? '' : path).trim();
    if (isAbsolute(raw)) return raw;
    var base = apiBaseUrl();
    if (!base) {
      throw new ApiError('No API address is configured. Please set apiBaseUrl in src/config.js.');
    }
    return base + (raw.charAt(0) === '/' ? raw : '/' + raw);
  }

  function friendlyNetworkMessage(err) {
    if (err && (err.name === 'AbortError' || err.code === 20)) {
      return 'The barangay server took too long to answer. Please try again in a moment.';
    }
    return 'The barangay server is not reachable right now. Some live information is temporarily unavailable.';
  }

  function collectErrors(payload) {
    if (!payload || typeof payload !== 'object') return [];
    var list = payload.errors;
    if (!list) return [];
    if (Array.isArray(list)) return list.filter(Boolean).map(String);
    return [String(list)];
  }

  function request(path, options) {
    var opts = options || {};
    var url;
    try {
      url = buildUrl(path);
    } catch (err) {
      return Promise.reject(err);
    }

    var init = {
      method: opts.method || 'GET',
      headers: Object.assign({ Accept: 'application/json' }, opts.headers || {}),
      cache: 'no-store'
    };
    if (opts.body !== undefined) init.body = opts.body;

    var timeoutMs = Number(settings().requestTimeoutMs) || DEFAULT_TIMEOUT_MS;
    var controller = null;
    var timer = null;
    if (typeof global.AbortController === 'function') {
      controller = new global.AbortController();
      init.signal = controller.signal;
      timer = global.setTimeout(function () {
        try { controller.abort(); } catch (e) { /* ignore */ }
      }, timeoutMs);
    }

    return global.fetch(url, init)
      .catch(function (err) {
        throw new ApiError(friendlyNetworkMessage(err), 0, [], err);
      })
      .then(function (response) {
        return response.text().then(function (text) {
          return { response: response, text: text };
        });
      })
      .then(function (result) {
        if (timer) global.clearTimeout(timer);

        var response = result.response;
        var payload = null;
        var text = (result.text || '').trim();
        if (text) {
          try { payload = JSON.parse(text); } catch (err) { payload = null; }
        }

        // ---- Non-2xx HTTP status ------------------------------------------
        if (!response.ok) {
          var httpMessage = (payload && (payload.message || payload.title)) ||
            ('The server refused the request (HTTP ' + response.status + ').');
          throw new ApiError(httpMessage, response.status, collectErrors(payload));
        }

        // ---- Envelope: { success, message, data, errors } -----------------
        if (payload && typeof payload === 'object' &&
            Object.prototype.hasOwnProperty.call(payload, 'success')) {
          if (payload.success === false) {
            throw new ApiError(
              payload.message || 'The server rejected the request.',
              response.status,
              collectErrors(payload)
            );
          }
          return payload.data === undefined ? null : payload.data;
        }

        // ---- Plain JSON (no envelope) or empty body -----------------------
        if (payload === null && text) {
          throw new ApiError('The server returned an unexpected response. Please try again.');
        }
        return payload;
      })
      .catch(function (err) {
        if (timer) global.clearTimeout(timer);
        if (err instanceof ApiError) throw err;
        throw new ApiError('Something went wrong while loading data.', 0, [], err);
      });
  }

  /** GET a path and resolve with the unwrapped `data` payload. */
  function get(path) {
    return request(path, { method: 'GET' });
  }

  /** POST JSON to a path and resolve with the unwrapped `data` payload. */
  function post(path, body) {
    var init = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    };
    if (body !== undefined && body !== null) {
      try {
        init.body = JSON.stringify(body);
      } catch (err) {
        return Promise.reject(new ApiError('The data could not be sent to the server.', 0, [], err));
      }
    }
    return request(path, init);
  }

  /**
   * Turns a stored file path such as '/uploads/announcements/1.jpg' into a
   * full, browser-usable URL. Already-absolute URLs pass straight through.
   */
  function resolveFileUrl(path) {
    var value = String(path == null ? '' : path).trim();
    if (!value) return '';
    if (isAbsolute(value)) return value;
    var base = fileBaseUrl() || apiBaseUrl().replace(/\/api$/i, '');
    if (!base) return value;
    return base + (value.charAt(0) === '/' ? value : '/' + value);
  }

  function isConfigured() {
    return !!apiBaseUrl();
  }

  global.Api = {
    ApiError: ApiError,
    get: get,
    post: post,
    request: request,
    resolveFileUrl: resolveFileUrl,
    apiBaseUrl: apiBaseUrl,
    fileBaseUrl: fileBaseUrl,
    isConfigured: isConfigured
  };
})(window);
