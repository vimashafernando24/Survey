const test = require('node:test');
const assert = require('node:assert/strict');

const { extractApprovedFacts } = require('../reflectionFacts');
const { fallbackReflection } = require('../reflectionFallback');
const { validateReflection, validateReflectionDetailed } = require('../reflectionValidator');

test('extracts only approved active-path narrative facts', () => {
  const facts = extractApprovedFacts({
    answers: {
      B1: { variable: 'edu_status', question_text: 'Education status?', label: 'Completed education', is_active_path: true },
      B2: { variable: 'household_income', question_text: 'Household income?', label: 'LKR 60,000', is_active_path: true },
      B3: { variable: 'ideal_sector', question_text: 'Preferred sector?', label: 'Education and teaching', is_active_path: false },
      B4: { variable: 'reason_not_seeking', question_text: 'Reason?', label: 'Own illness or disability', is_active_path: true }
    }
  });

  assert.deepEqual(facts, [{ topic: 'Education status?', answer: 'Completed education' }]);
});

test('fallback supports every survey language', () => {
  for (const language of ['en', 'si', 'ta']) {
    assert.equal(validateReflection(fallbackReflection(language), language), true);
  }
});

test('validator rejects advice and unexpected fields', () => {
  const reflection = fallbackReflection('en');
  reflection.sections[0].paragraph = 'You should apply for a new job.';
  assert.equal(validateReflection(reflection, 'en'), false);

  const extra = { ...fallbackReflection('en'), metadata: {} };
  assert.equal(validateReflection(extra, 'en'), false);
});

test('validator reports actionable failure categories', () => {
  const reflection = fallbackReflection('en');
  reflection.sections[0].paragraph = 'This means you should change direction.';

  const result = validateReflectionDetailed(reflection, 'en');
  assert.equal(result.valid, false);
  assert.deepEqual(result.reasons, ['prohibited_phrase:"you should"', 'prohibited_phrase:"This means"']);
});
