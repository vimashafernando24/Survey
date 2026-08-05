const { getDatabase } = require('./_database');
const { normalizeSurveyResponse } = require('./_normalize');
const { generateReflection } = require('../story/generateReflection');
const { fallbackReflection } = require('../story/reflectionFallback');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: 'Request body cannot be empty' });
  }

  if (!Array.isArray(req.body._analysis?.items) || !req.body._meta?.session_id) {
    return res.status(400).json({ error: 'Invalid survey response.' });
  }

  try {
    const db = await getDatabase();
    const responseData = normalizeSurveyResponse(req.body);
    const result = await db.collection('survey_responses').insertOne(responseData);

    let reflection;
    try {
      reflection = await generateReflection(responseData);
    } catch (error) {
      console.error('Reflection generation failed after survey save:', error?.message || 'unknown_error');
      reflection = fallbackReflection(responseData.selected_language);
    }

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
