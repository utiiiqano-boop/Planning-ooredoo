export const COLORS = {
  primary: '#E30613',
  primaryDark: '#B8040F',
  primaryLight: '#FF1E2D',

  bg: '#F5F6FA',
  card: '#FFFFFF',
  border: '#E8ECF1',
  textPrimary: '#1A202C',
  textSecondary: '#718096',
  textMuted: '#A0AEC0',

  g1: '#3B82F6',
  g3: '#8B5CF6',
  repos: '#FBBF24',
  conge: '#EF4444',
  g1Bg: '#EFF6FF',
  g3Bg: '#F5F3FF',
  reposBg: '#FFFBEB',
  congeBg: '#FEF2F2',

  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',

  darkBg: '#111827',
  darkCard: '#1F2937',
  darkBorder: '#374151',
  darkText: '#F9FAFB',
  darkTextSecondary: '#9CA3AF',
};

export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 };

export const RADIUS = { sm: 6, md: 10, lg: 14, xl: 20, full: 999 };

export const FONT = { xs: 10, sm: 12, md: 14, lg: 16, xl: 18, xxl: 22, xxxl: 28 };

export const SHADOW = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
};

export const DAYS_SHORT = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
export const DAYS_FR = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
export const DAYS_FR_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
export const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

export const SHIFT_CODES = {
  G1:    { id: 'G1',    label: 'Shift 1', hours: '09h - 15h', color: COLORS.g1,    bg: COLORS.g1Bg,    textColor: '#fff' },
  G3:    { id: 'G3',    label: 'Shift 2', hours: '15h - 09h', color: COLORS.g3,    bg: COLORS.g3Bg,    textColor: '#fff' },
  REPOS: { id: 'REPOS', label: 'Repos',   hours: '-',         color: COLORS.repos, bg: COLORS.reposBg, textColor: '#78350F' },
  CONGE: { id: 'CONGE', label: 'Congé',   hours: '-',         color: COLORS.conge, bg: COLORS.congeBg, textColor: '#fff' },
};

export const RULES = {
  MAX_WORK_DAYS_PER_WEEK: 6,
  MIN_REST_PER_PERSON_PER_WEEK: 1,
  TARGET_G1_PER_WEEK: 3,
  TARGET_G3_PER_WEEK: 3,
};
