require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.disable('x-powered-by');
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : true
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'dist')));

// MongoDB connection
let db;
if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is required');
  process.exit(1);
}
const client = new MongoClient(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 10000
});

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

app.get('/api/health', (req, res) => {
  res.status(db ? 200 : 503).json({
    status: db ? 'ok' : 'unavailable',
    database: db ? 'connected' : 'disconnected'
  });
});

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

    if (!Array.isArray(req.body._analysis?.items) || !req.body._meta?.session_id) {
      return res.status(400).json({ error: 'Invalid survey response.' });
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
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
  });

  async function shutdown(signal) {
    console.log(`${signal} received; shutting down`);
    server.close(async () => {
      await client.close();
      process.exit(0);
    });
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
});
