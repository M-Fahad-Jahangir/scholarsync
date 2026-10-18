// Pre-defined vibrant and accessible color schemes for teachers
export const DEFAULT_TEACHER_COLORS = {
  'Sir Fahad': {
    name: 'Crimson Red',
    bg: '#fee2e2',        // soft light red background
    border: '#f87171',    // red border
    text: '#991b1b',      // deep red text
    accent: '#ef4444',    // vibrant red indicator
    badgeBg: '#fecaca',
  },
  'Ms. Insha Naz': {
    name: 'Teal Emerald',
    bg: '#d1fae5',
    border: '#34d399',
    text: '#065f46',
    accent: '#10b981',
    badgeBg: '#a7f3d0',
  },
  'Sir G. Dastagheer': {
    name: 'Royal Purple',
    bg: '#ede9fe',
    border: '#a78bfa',
    text: '#5b21b6',
    accent: '#8b5cf6',
    badgeBg: '#ddd6fe',
  },
  'Ms. Ambreen': {
    name: 'Warm Amber',
    bg: '#fef3c7',
    border: '#fcd34d',
    text: '#92400e',
    accent: '#f59e0b',
    badgeBg: '#fde68a',
  },
  'Ms. Rahim': {
    name: 'Rose Pink',
    bg: '#fce7f3',
    border: '#f472b6',
    text: '#9d174d',
    accent: '#ec4899',
    badgeBg: '#fbcfe8',
  },
  'Sir. Sattam': {
    name: 'Cyan Azure',
    bg: '#cffafe',
    border: '#22d3ee',
    text: '#155e75',
    accent: '#06b6d4',
    badgeBg: '#a5f3fc',
  },
  'Sir Umar': {
    name: 'Lime Green',
    bg: '#ecfccb',
    border: '#a3e635',
    text: '#3f6212',
    accent: '#84cc16',
    badgeBg: '#d9f99d',
  },
  'Sir H. Hamza': {
    name: 'Electric Indigo',
    bg: '#e0e7ff',
    border: '#818cf8',
    text: '#3730a3',
    accent: '#6366f1',
    badgeBg: '#c7d2fe',
  },
  'Sir Hamza': {
    name: 'Electric Indigo',
    bg: '#e0e7ff',
    border: '#818cf8',
    text: '#3730a3',
    accent: '#6366f1',
    badgeBg: '#c7d2fe',
  },
  'Dr. Limma-e-Habiba': {
    name: 'Soft Lavender',
    bg: '#f3e8ff',
    border: '#c084fc',
    text: '#6b21a8',
    accent: '#a855f7',
    badgeBg: '#e9d5ff',
  },
  'Prof. Aslam': {
    name: 'Tangerine Orange',
    bg: '#ffedd5',
    border: '#fb923c',
    text: '#9a3412',
    accent: '#f97316',
    badgeBg: '#fed7aa',
  },
};

export const COLOR_PALETTES = [
  { name: 'Red', bg: '#fee2e2', border: '#f87171', text: '#991b1b', accent: '#ef4444', badgeBg: '#fecaca' },
  { name: 'Emerald', bg: '#d1fae5', border: '#34d399', text: '#065f46', accent: '#10b981', badgeBg: '#a7f3d0' },
  { name: 'Purple', bg: '#ede9fe', border: '#a78bfa', text: '#5b21b6', accent: '#8b5cf6', badgeBg: '#ddd6fe' },
  { name: 'Amber', bg: '#fef3c7', border: '#fcd34d', text: '#92400e', accent: '#f59e0b', badgeBg: '#fde68a' },
  { name: 'Pink', bg: '#fce7f3', border: '#f472b6', text: '#9d174d', accent: '#ec4899', badgeBg: '#fbcfe8' },
  { name: 'Cyan', bg: '#cffafe', border: '#22d3ee', text: '#155e75', accent: '#06b6d4', badgeBg: '#a5f3fc' },
  { name: 'Lime', bg: '#ecfccb', border: '#a3e635', text: '#3f6212', accent: '#84cc16', badgeBg: '#d9f99d' },
  { name: 'Indigo', bg: '#e0e7ff', border: '#818cf8', text: '#3730a3', accent: '#6366f1', badgeBg: '#c7d2fe' },
  { name: 'Sky Blue', bg: '#e0f2fe', border: '#38bdf8', text: '#0369a1', accent: '#0284c7', badgeBg: '#bae6fd' },
  { name: 'Fuchsia', bg: '#fae8ff', border: '#e879f9', text: '#86198f', accent: '#c026d3', badgeBg: '#f5d0fe' },
  { name: 'Orange', bg: '#ffedd5', border: '#fb923c', text: '#9a3412', accent: '#f97316', badgeBg: '#fed7aa' },
  { name: 'Slate', bg: '#f1f5f9', border: '#94a3b8', text: '#334155', accent: '#64748b', badgeBg: '#e2e8f0' },
];

/**
 * Generate a complete theme object from any custom hex color code
 */
export function generateThemeFromHex(hex, name = 'Custom') {
  if (!hex || !hex.startsWith('#')) hex = '#3b82f6';
  // Parse hex to RGB
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;

  // Darken for readable text
  const darkR = Math.max(0, Math.floor(r * 0.45));
  const darkG = Math.max(0, Math.floor(g * 0.45));
  const darkB = Math.max(0, Math.floor(b * 0.45));

  return {
    name: name || `Custom (${hex})`,
    accent: hex,
    bg: `rgba(${r}, ${g}, ${b}, 0.12)`,
    border: `rgba(${r}, ${g}, ${b}, 0.45)`,
    text: `rgb(${darkR}, ${darkG}, ${darkB})`,
    badgeBg: `rgba(${r}, ${g}, ${b}, 0.22)`,
  };
}

export function getTeacherColor(teacherName, customColors = {}) {
  if (!teacherName) {
    return {
      name: 'Default',
      bg: '#f8fafc',
      border: '#cbd5e1',
      text: '#475569',
      accent: '#94a3b8',
      badgeBg: '#e2e8f0',
    };
  }

  // Check custom user-defined override
  if (customColors[teacherName]) {
    return customColors[teacherName];
  }

  // Check predefined default list
  if (DEFAULT_TEACHER_COLORS[teacherName]) {
    return DEFAULT_TEACHER_COLORS[teacherName];
  }

  // Generate deterministic color based on hash of teacher name
  let hash = 0;
  for (let i = 0; i < teacherName.length; i++) {
    hash = teacherName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLOR_PALETTES.length;
  return COLOR_PALETTES[index];
}
