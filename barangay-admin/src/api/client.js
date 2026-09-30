import { config } from '../config';

/* ------------------------------------------------------------------ */
/* Session storage (token + user).  AuthContext uses these helpers.    */
/* ------------------------------------------------------------------ */

const TOKEN_KEY = 'bmis.admin.token';
const USER_KEY = 'bmis.admin.user';

function safeParse(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export const session = {
  getToken() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  getUser() {
    try {
      return safeParse(localStorage.getItem(USER_KEY));
    } catch {
      return null;
    }
  },
  set(token, user) {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      if (user !== undefined) localStorage.setItem(USER_KEY, JSON.stringify(user ?? null));
    } catch {
      /* storage full / disabled — session simply won't persist */
    }
  },
  setUser(user) {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user ?? null));
    } catch {
      /* ignore */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {
      /* ignore */
    }
  },
};

/* ------------------------------------------------------------------ */
/* URL helpers                                                         */
/* ------------------------------------------------------------------ */

/** Join a path onto config.apiBaseUrl without letting a leading "/" eat the prefix. */
export function buildUrl(path, params) {
  const base = String(config.apiBaseUrl || '').replace(/\/+$/, '');
  const clean = String(path || '').replace(/^\/+/, '');
  let url = clean ? `${base}/${clean}` : base;

  if (params) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      qs.append(key, String(value));
    });
    const query = qs.toString();
    if (query) url += (url.includes('?') ? '&' : '?') + query;
  }
  return url;
}

/** Turn "/uploads/x.png" into an absolute URL on config.fileBaseUrl. */
export function resolveFileUrl(path) {
  if (!path) return null;
  const value = String(path).trim();
  if (!value) return null;
  if (/^(https?:|data:|blob:)/i.test(value)) return value;
  const base = String(config.fileBaseUrl || '').replace(/\/+$/, '');
  return `${base}/${value.replace(/^\/+/, '')}`;
}

/* ------------------------------------------------------------------ */
/* Error normalisation + redirect on 401                               */
/* ------------------------------------------------------------------ */

function describeErrors(errors) {
  if (!Array.isArray(errors) || errors.length === 0) return '';
  const parts = errors
    .map((e) => {
      if (e === null || e === undefined) return '';
      if (typeof e === 'string') return e;
      if (typeof e === 'object') return e.message || e.description || e.error || '';
      return String(e);
    })
    .filter(Boolean);
  return parts.join(' ');
}

function expireSession() {
  session.clear();
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.replace('/login');
  }
}

/* ------------------------------------------------------------------ */
/* Core request                                                        */
/* ------------------------------------------------------------------ */

async function request(method, path, options = {}) {
  const { params, body, form, signal } = options;

  const headers = { Accept: 'application/json' };
  const token = session.getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload;
  if (body !== undefined && body !== null) {
    if (form) {
      payload = body; // FormData — let the browser set the boundary
    } else {
      headers['Content-Type'] = 'application/json';
      payload = JSON.stringify(body);
    }
  }

  let response;
  try {
    response = await fetch(buildUrl(path, params), { method, headers, body: payload, signal });
  } catch (err) {
    if (err && err.name === 'AbortError') throw err;
    throw new Error(
      `Cannot reach the server at ${config.apiBaseUrl}. Make sure the API is running.`,
    );
  }

  if (response.status === 401) {
    expireSession();
    throw new Error('Your session has expired. Please sign in again.');
  }

  const raw = await response.text();
  let envelope = null;
  if (raw) {
    try {
      envelope = JSON.parse(raw);
    } catch {
      envelope = null;
    }
  }

  // Non-JSON response (rare) — fall back to HTTP status.
  if (envelope === null || typeof envelope !== 'object') {
    if (response.ok) return null;
    throw new Error(`Request failed with status ${response.status}.`);
  }

  if (envelope.success === false) {
    const detail = describeErrors(envelope.errors);
    const message = envelope.message || `Request failed with status ${response.status}.`;
    throw new Error(detail ? `${message} ${detail}` : message);
  }

  if (!response.ok) {
    throw new Error(envelope.message || `Request failed with status ${response.status}.`);
  }

  // Unwrap the { success, message, data, errors } envelope.
  return envelope.data === undefined ? null : envelope.data;
}

export const get = (path, params, options) => request('GET', path, { params, ...options });
export const post = (path, body, options) => request('POST', path, { body, ...options });
export const put = (path, body, options) => request('PUT', path, { body, ...options });
export const del = (path, options) => request('DELETE', path, options);
export const postForm = (path, formData, options) =>
  request('POST', path, { body: formData, form: true, ...options });
export const putForm = (path, formData, options) =>
  request('PUT', path, { body: formData, form: true, ...options });

export default { get, post, put, del, postForm, putForm, session, resolveFileUrl, buildUrl };
