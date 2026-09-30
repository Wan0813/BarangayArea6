// Small design tokens. Keep it simple — functionality over polish.
export const colors = {
  primary: '#EA580C',
  primaryDark: '#C2410C',
  primarySoft: '#FFEDD5',
  danger: '#dc2626',
  dangerSoft: '#fee2e2',
  success: '#16a34a',
  successSoft: '#dcfce7',
  warning: '#d97706',
  warningSoft: '#fef3c7',
  info: '#0891b2',
  infoSoft: '#cffafe',
  neutral: '#6b7280',
  neutralSoft: '#f3f4f6',
  text: '#111827',
  textMuted: '#6b7280',
  border: '#e5e7eb',
  background: '#f8fafc',
  surface: '#ffffff',
  white: '#ffffff',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  pill: 999,
};

export const fonts = {
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 26,
};

// Maps an API status string to badge colors.
export function statusColors(status) {
  switch (status) {
    case 'Pending':
      return { text: colors.warning, background: colors.warningSoft };
    case 'Ongoing':
    case 'Processing':
    case 'Approved':
      return { text: colors.info, background: colors.infoSoft };
    case 'Resolved':
    case 'Active':
      return { text: colors.success, background: colors.successSoft };
    case 'Rejected':
    case 'Declined':
    case 'Suspended':
      return { text: colors.danger, background: colors.dangerSoft };
    default:
      return { text: colors.neutral, background: colors.neutralSoft };
  }
}

export default { colors, spacing, radius, fonts, statusColors };
