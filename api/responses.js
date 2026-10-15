const { getDatabase } = require('./_database');
const { normalizeSurveyResponse } = require('./_normalize');
const { generateReflection } = require('../story/generateReflection');
const { fallbackReflection } = require('../story/reflectionFallback');
const {
  MAX_REQUEST_BODY_BYTES,
  requestBodySize,
  validateSubmissionQuestionIds
} = require('./_submissionValidation');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (requestBodySize(req) > MAX_REQUEST_BODY_BYTES) {
    return res.status(413).json({ error: 'Request body is too large.' });
  }

  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: 'Request body cannot be empty' });
  }

  if (!Array.isArray(req.body._analysis?.items) || !req.body._meta?.session_id) {
    return res.status(400).json({ error: 'Invalid survey response.' });
  }

  const validationError = validateSubmissionQuestionIds(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    const db = await getDatabase();
    const responseData = normalizeSurveyResponse(req.body);
    const result = await db.collection('survey_responses').insertOne(responseData);

    let reflection;
    let reflectionSource = 'ai';
    let reflectionError = null;
    try {
      reflection = await generateReflection(responseData);
    } catch (error) {
      reflectionError = error?.message || 'unknown_error';
      console.error('Reflection generation failed after survey save:', reflectionError);
      reflectionSource = 'fallback';
      reflection = fallbackReflection(responseData.selected_language);
    }

    await db.collection('survey_responses').updateOne(
      { _id: result.insertedId },
      { $set: { reflection, reflection_source: reflectionSource, reflection_error: reflectionError } }
    );

    return res.status(201).json({
      success: true,
      message: 'Survey response saved successfully',
      id: result.insertedId,
      reflection
    });
  } catch (error) {
    console.error('Error saving response:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
