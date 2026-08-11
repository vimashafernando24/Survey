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
  return validateReflectionDetailed(value, language).valid;
}

function validateReflectionDetailed(value, language = 'en') {
  const reasons = [];
  if (!hasExactKeys(value, ROOT_KEYS)) {
    return { valid: false, reasons: ['root_structure'] };
  }
  if (!validText(value.title, 100)) reasons.push('title_length');
  if (!validText(value.intro, 500)) reasons.push('intro_length');
  if (!validText(value.closing, 500)) reasons.push('closing_length');
  if (!Array.isArray(value.sections) || value.sections.length < 1 || value.sections.length > 4) {
    return { valid: false, reasons: [...reasons, 'sections_count'] };
  }

  for (const section of value.sections) {
    if (!hasExactKeys(section, SECTION_KEYS)) {
      reasons.push('section_structure');
      continue;
    }
    if (!validText(section.heading, 100)) reasons.push('section_heading_length');
    if (!validText(section.paragraph, 1200)) reasons.push('section_paragraph_length');
  }

  const combined = [
    value.title,
    value.intro,
    ...value.sections.flatMap(section => [section.heading, section.paragraph]),
    value.closing
  ].join('\n');

  if (combined.length > 5000) reasons.push('total_length');
  if (!usesRequestedLanguage(combined, language)) reasons.push('requested_language');
  BANNED.forEach(pattern => {
    const match = combined.match(pattern);
    if (match) reasons.push(`prohibited_phrase:"${match[0]}"`);
  });

  return { valid: reasons.length === 0, reasons: [...new Set(reasons)] };
}

module.exports = { validateReflection, validateReflectionDetailed };
