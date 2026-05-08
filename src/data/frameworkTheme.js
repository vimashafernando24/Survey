export const frameworkThemes = {
  'SWTS / ILO': {
    label: 'SWTS / ILO',
    color: '#3e7690',
    bg: 'rgba(62,118,144,.12)',
    border: 'rgba(62,118,144,.28)'
  },
  'Sri Lanka Study': {
    label: 'Sri Lanka Study',
    color: '#d28d46',
    bg: 'rgba(210,141,70,.12)',
    border: 'rgba(210,141,70,.3)'
  },
  'Bourdieu Capital': {
    label: 'Bourdieu Capital',
    color: '#b45f7a',
    bg: 'rgba(180,95,122,.12)',
    border: 'rgba(180,95,122,.28)'
  },
  'Self-Determination': {
    label: 'Self-Determination',
    color: '#5d8a56',
    bg: 'rgba(93,138,86,.12)',
    border: 'rgba(93,138,86,.28)'
  },
  'SWTS / ILO · Bourdieu Capital': {
    label: 'SWTS / ILO · Bourdieu Capital',
    color: '#8a6a3a',
    bg: 'rgba(138,106,58,.12)',
    border: 'rgba(138,106,58,.28)'
  }
};

export const frameworkLabelAliases = {
  SWTS: 'SWTS / ILO',
  Bourdieu: 'Bourdieu Capital',
  SDT: 'Self-Determination',
  SriLanka: 'Sri Lanka Study',
  srilanka: 'Sri Lanka Study',
  swts: 'SWTS / ILO',
  bourdieu: 'Bourdieu Capital',
  sdt: 'Self-Determination'
};

export function normalizeFrameworkLabel(value) {
  if (!value) return '';
  return frameworkLabelAliases[value] || value;
}

export function getFrameworkTheme(value) {
  const label = normalizeFrameworkLabel(value);
  return frameworkThemes[label] || {
    label,
    color: '#7c7168',
    bg: 'rgba(124,113,104,.12)',
    border: 'rgba(124,113,104,.24)'
  };
}

export const frameworkColors = Object.fromEntries(
  Object.entries(frameworkThemes).map(([key, theme]) => [key, theme.color])
);
