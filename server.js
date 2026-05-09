require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// MongoDB connection
let db;
const client = new MongoClient(process.env.MONGODB_URI);

function normalizeSurveyResponse(payload) {
  const meta = payload._meta || {};
  const analysisItems = payload._analysis?.items || [];
  const offPathAnswers = payload._audit?.off_path_answers || null;
  const receivedAt = new Date();

  // Canonical answers object keyed by question_id — single source of truth
  const answers = {};
  analysisItems.forEach(item => {
    answers[item.question_id] = {
      variable: item.variable,
      section: item.section,
      framework: item.framework || null,
      value: item.value,
      label: item.label,
      question_text: item.question_text || '',
      is_active_path: true
    };
  });

  return {
    respondent: {
      session_id: meta.session_id || null,
      language: payload.selected_language || null
    },
    submission: {
      submitted_at: meta.timestamp ? new Date(meta.timestamp) : receivedAt,
      received_at: receivedAt,
      status: meta.completion_status || 'complete',
      completion_percentage: meta.completion_percentage ?? null
    },
    path: {
      branch: meta.branch || null,
      active_branch: meta.active_branch || meta.branch || null,
      active_sections: meta.active_sections || [],
      answered_sections: meta.answered_sections || [],
      off_path_sections: meta.off_path_sections || [],
      active_question_ids: meta.active_question_ids || [],
      off_path_question_ids: meta.off_path_question_ids || []
    },
    answers,
    audit: {
      off_path_answers: offPathAnswers
    },
    selected_language: payload.selected_language || null,
    createdAt: receivedAt,
    schema_version: 'v2'
  };
}

async function connectDB() {
  try {
    await client.connect();
    db = client.db('nysc_survey');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// API endpoint
app.post('/api/responses', async (req, res) => {
  try {
    // Validate body is not empty
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: 'Request body cannot be empty' });
    }

    if (!db) {
      return res.status(503).json({ error: 'Database connection is not ready. Please try again.' });
    }

    const responseData = normalizeSurveyResponse(req.body);

    // Save to MongoDB
    const collection = db.collection('survey_responses');
    const result = await collection.insertOne(responseData);

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Survey response saved successfully',
      id: result.insertedId
    });
  } catch (error) {
    console.error('Error saving response:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve the React frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server
connectDB().then(() => {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
});
