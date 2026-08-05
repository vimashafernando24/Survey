const OpenAI = require('openai');
const { extractApprovedFacts } = require('./reflectionFacts');
const { fallbackReflection } = require('./reflectionFallback');
const { buildReflectionInput } = require('./reflectionPrompt');
const { validateReflection } = require('./reflectionValidator');

const REFLECTION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'intro', 'sections', 'closing'],
  properties: {
    title: { type: 'string' },
    intro: { type: 'string' },
    sections: {
      type: 'array',
      minItems: 1,
      maxItems: 4,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['heading', 'paragraph'],
        properties: {
          heading: { type: 'string' },
          paragraph: { type: 'string' }
        }
      }
    },
    closing: { type: 'string' }
  }
};

function configuredTimeout() {
  const value = Number(process.env.OPENAI_REFLECTION_TIMEOUT_MS);
  return Number.isFinite(value) && value >= 1000 && value <= 25000 ? value : 12000;
}

async function generateReflection(savedResponse) {
  const language = ['en', 'si', 'ta'].includes(savedResponse?.selected_language)
    ? savedResponse.selected_language
    : 'en';
  const approvedFacts = extractApprovedFacts(savedResponse);

  if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_REFLECTION_MODEL || approvedFacts.length === 0) {
    return fallbackReflection(language);
  }

  const prompt = buildReflectionInput(language, approvedFacts);
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: configuredTimeout(),
    maxRetries: 0
  });

  const response = await client.responses.create({
    model: process.env.OPENAI_REFLECTION_MODEL,
    reasoning: { effort: 'none' },
    max_output_tokens: 1200,
    instructions: prompt.instructions,
    input: prompt.input,
    text: {
      format: {
        type: 'json_schema',
        name: 'participant_reflection',
        strict: true,
        schema: REFLECTION_SCHEMA
      }
    }
  });

  let reflection;
  try {
    reflection = JSON.parse(response.output_text);
  } catch {
    throw new Error('reflection_invalid_json');
  }

  if (!validateReflection(reflection, language)) throw new Error('reflection_validation_failed');
  return reflection;
}

module.exports = { generateReflection };
