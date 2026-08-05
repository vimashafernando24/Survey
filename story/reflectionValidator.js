const ROOT_KEYS = ['title', 'intro', 'sections', 'closing'];
const SECTION_KEYS = ['heading', 'paragraph'];
const BANNED = [
  /\b(?:you should|you need to|we recommend|our recommendation|consider pursuing)\b/i,
  /\b(?:diagnos(?:e|ed|is)|disorder|treatment)\b/i,
  /\b(?:will definitely|are destined|guarantees|predicts)\b/i,
  /\b(?:ambitious|hardworking|talented|intelligent|resilient|creative personality)\b/i,
  /\b(?:because|therefore|thus|this means|suggests that|indicates that you are)\b/i,
  /(?:^|\n)\s*(?:[-*#>] |\d+[.)]\s)/m,
  /```|\*\*|__|\[[^\]]+\]\([^)]+\)/
];

function hasExactKeys(value, keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const actual = Object.keys(value).sort();
  return actual.length === keys.length && actual.every((key, index) => key === [...keys].sort()[index]);
}

function validText(value, maxLength) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength;
}

function usesRequestedLanguage(text, language) {
  const hasSinhala = /[\u0D80-\u0DFF]/u.test(text);
  const hasTamil = /[\u0B80-\u0BFF]/u.test(text);
  if (language === 'si') return hasSinhala && !hasTamil;
  if (language === 'ta') return hasTamil && !hasSinhala;
  return !hasSinhala && !hasTamil;
}

function validateReflection(value, language = 'en') {
  if (!hasExactKeys(value, ROOT_KEYS)) return false;
  if (!validText(value.title, 100) || !validText(value.intro, 500) || !validText(value.closing, 500)) return false;
  if (!Array.isArray(value.sections) || value.sections.length < 1 || value.sections.length > 4) return false;

  for (const section of value.sections) {
    if (!hasExactKeys(section, SECTION_KEYS)) return false;
    if (!validText(section.heading, 100) || !validText(section.paragraph, 1200)) return false;
  }

  const combined = [
    value.title,
    value.intro,
    ...value.sections.flatMap(section => [section.heading, section.paragraph]),
    value.closing
  ].join('\n');

  return combined.length <= 5000
    && usesRequestedLanguage(combined, language)
    && !BANNED.some(pattern => pattern.test(combined));
}

module.exports = { validateReflection };
