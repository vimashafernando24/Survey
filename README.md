# NYSC Youth Transition Survey Backend

Simple Node.js backend for collecting survey responses.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file based on `.env.example`:
   ```
   cp .env.example .env
   ```
   Edit `.env` and add your MongoDB Atlas connection string:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/surveydb?retryWrites=true&w=majority
   ```

3. Start the server:
   ```
   npm start
   ```
   The server will run on port 3000 (or PORT env var).

## Testing the API

To test the POST /api/responses endpoint:

```bash
curl -X POST http://localhost:3000/api/responses \
  -H "Content-Type: application/json" \
  -d '{"_meta":{"session_id":"local-smoke-test"},"_analysis":{"items":[]},"selected_language":"en"}'
```

Expected response:
```json
{
  "success": true,
  "message": "Survey response saved successfully",
  "id": "..."
}
```

## Frontend

The survey HTML file is configured to send data to the backend when `enableApiSubmit` is true.

Open `nysc_swts_survey.html` in a browser to test the full flow.

JSON and CSV export buttons remain as backup options.

## Free deployment on Render

This repository includes a `render.yaml` Blueprint for a free Render web
service. The service builds the React application, serves it from Express, and
stores submissions in MongoDB Atlas.

1. In Render, create a new Blueprint from this GitHub repository.
2. Set the secret `MONGODB_URI` environment variable when prompted.
3. Deploy and verify that `/api/health` returns a JSON response with
   `"status": "ok"`.

Free Render services sleep after periods of inactivity, so the first visit
after a quiet period can take longer to load.
