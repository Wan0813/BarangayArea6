/** Small formatting helpers shared by pages. */

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function pad(n) {
  return String(n).padStart(2, '0');
}

/** Format an ISO date or date-only string. Returns '—' for empty values. */
export function formatDate(value) {
  if (!value) return '—';
  const str = String(value);
  if (DATE_ONLY.test(str)) {
    const [y, m, d] = str.split('-');
    return `${m}/${d}/${y}`;
  }
  const date = new Date(str);
  if (Number.isNaN(date.getTime())) return str;
  return `${pad(date.getMonth() + 1)}/${pad(date.getDate())}/${date.getFullYear()}`;
}

/** Format an ISO date-time string. */
export function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  let hours = date.getHours();
  const suffix = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${pad(date.getMonth() + 1)}/${pad(date.getDate())}/${date.getFullYear()} ${pad(hours)}:${pad(
    date.getMinutes(),
  )} ${suffix}`;
}

/** yyyy-MM-dd for <input type="date">. */
export function toDateInputValue(value) {
  if (!value) return '';
  const str = String(value);
  if (DATE_ONLY.test(str)) return str;
  const date = new Date(str);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayInputValue() {
  return toDateInputValue(new Date());
}

/** Turn 'PatrolPeaceAndOrder' / 'HeadAdmin' into 'Patrol Peace And Order'. */
export function humanize(value) {
  if (value === null || value === undefined || value === '') return '—';
  return String(value)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Lower-case, dash-separated token for CSS classes. */
export function slug(value) {
  return humanize(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function classNames(...args) {
  return args.filter(Boolean).join(' ');
}

export function truncate(value, length = 80) {
  if (!value) return '';
  const str = String(value);
  return str.length > length ? `${str.slice(0, length - 1)}…` : str;
}

/** Extract a user-facing message from any thrown value. */
export function errorMessage(err) {
  if (!err) return 'Something went wrong.';
  if (typeof err === 'string') return err;
  return err.message || 'Something went wrong.';
}

export const ROLE_LABELS = {
  Resident: 'Resident',
  Admin: 'Admin',
  HeadAdmin: 'Head Admin',
};

export const VALID_ID_TYPES = [
  'Philippine Passport',
  "Driver's License",
  'SSS ID',
  'GSIS ID',
  'UMID',
  'PhilHealth ID',
  "Voter's ID / Voter Certificate",
  'Postal ID',
  'PRC ID',
  'NBI Clearance',
  'Police Clearance',
  'Barangay ID',
  'Senior Citizen ID',
  'PWD ID',
  'TIN ID',
  'Student ID',
  'Other',
];

export const COMPLAINT_STATUSES = ['Pending', 'Ongoing', 'Resolved', 'Rejected'];
export const EMERGENCY_STATUSES = ['Pending', 'Approved', 'Processing', 'Declined'];
export const ACCOUNT_STATUSES = ['Pending', 'Active', 'Declined', 'Suspended'];
export const DUTY_SHIFTS = ['Day', 'Night', 'Graveyard', 'WholeDay'];
export const OPERATION_CATEGORIES = [
  'PatrolPeaceAndOrder',
  'Cleanliness',
  'HealthServices',
  'Meeting',
  'ResidentServices',
  'Other',
];
