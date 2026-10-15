# NYSC Youth Transition Survey

React survey with Vercel Functions for collecting responses and generating the
participant reflection. Local development and production both use the handlers
in `api/`; there is no separate local API implementation.

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

3. Start the local application:
   ```
   npm run dev
   ```
   Vite serves the frontend and invokes the same handlers from `api/` that are
   deployed in production. Use the local URL printed by the command.

## Testing the API

To test the POST /api/responses endpoint:

```bash
curl -X POST http://localhost:5173/api/responses \
  -H "Content-Type: application/json" \
  -d '{"_meta":{"session_id":"local-smoke-test"},"_analysis":{"items":[]},"selected_language":"en"}'
```

Expected response:
```json
{
  "success": true,
  "message": "Survey response saved successfully",
  "id": "...",
  "reflection": {}
}
```

## Free pilot deployment

This repository supports Vercel Hobby for a free non-commercial pilot. Vercel
builds the React application and runs the endpoints in `api/` as Node.js
functions. Survey submissions remain in MongoDB Atlas.

1. Import this GitHub repository into Vercel.
2. Set the `MONGODB_URI` environment variable for Production.
3. Deploy and verify that `/api/health` returns HTTP 200 with the plain-text
   response `ok`. If the database connectivity check fails, the endpoint
   returns HTTP 503 with the generic plain-text response `unavailable`.
