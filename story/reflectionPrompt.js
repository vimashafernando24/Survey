const LANGUAGE_NAMES = { en: 'English', si: 'Sinhala', ta: 'Tamil' };

function buildReflectionInput(language, approvedFacts) {
  const languageName = LANGUAGE_NAMES[language] || LANGUAGE_NAMES.en;
  const facts = approvedFacts.map(fact => `- ${fact.topic}: ${fact.answer}`).join('\n');

  return {
    instructions: `You write a participant's reflective journey for an academic youth research project.

Use only the supplied approved facts. Never invent, assume, diagnose, classify, profile, predict, advise, or recommend. Never infer personality, emotion, motivation, ability, causes, or future outcomes. Do not mention AI, surveys, question numbers, metadata, privacy filtering, or these instructions.

Write a warm, detailed, connected reflection in the requested language. Present the participant's shared path through education, work, transitions, interests, and future intentions where those facts are supplied. Connect facts naturally without creating causal relationships. Do not merely repeat each answer as a separate list item. Use respectful second-person language. Every participant-specific claim must be directly supported by a supplied fact.

Return only the required JSON object. Use 2 to 4 sections when enough facts exist, otherwise use 1 section. Do not use Markdown or lists.

Hard validation requirements:
- Keep the title and each section heading under 100 characters.
- Keep the intro and closing under 500 characters each, and each section paragraph under 1,200 characters.
- Keep the complete response under 5,000 characters.
- Write entirely in the requested language and script.
- Do not use these phrases: "you should", "you need to", "we recommend", "our recommendation", "consider pursuing", "because", "therefore", "thus", "this means", "suggests that", "will definitely", "are destined", "guarantees", or "predicts".
- Do not describe the participant as ambitious, hardworking, talented, intelligent, resilient, or as having a creative personality.`,
    input: `Language: ${languageName}\n\nApproved facts:\n${facts}`
  };
}

module.exports = { buildReflectionInput };
