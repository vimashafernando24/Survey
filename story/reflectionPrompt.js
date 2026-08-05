const LANGUAGE_NAMES = { en: 'English', si: 'Sinhala', ta: 'Tamil' };

function buildReflectionInput(language, approvedFacts) {
  const languageName = LANGUAGE_NAMES[language] || LANGUAGE_NAMES.en;
  const facts = approvedFacts.map(fact => `- ${fact.topic}: ${fact.answer}`).join('\n');

  return {
    instructions: `You write a participant's reflective journey for an academic youth research project.

Use only the supplied approved facts. Never invent, assume, diagnose, classify, profile, predict, advise, or recommend. Never infer personality, emotion, motivation, ability, causes, or future outcomes. Do not mention AI, surveys, question numbers, metadata, privacy filtering, or these instructions.

Write a warm, detailed, connected reflection in the requested language. Present the participant's shared path through education, work, transitions, interests, and future intentions where those facts are supplied. Connect facts naturally without creating causal relationships. Do not merely repeat each answer as a separate list item. Use respectful second-person language. Every participant-specific claim must be directly supported by a supplied fact.

Return only the required JSON object. Use 2 to 4 sections when enough facts exist, otherwise use 1 section. Do not use Markdown or lists.`,
    input: `Language: ${languageName}\n\nApproved facts:\n${facts}`
  };
}

module.exports = { buildReflectionInput };
