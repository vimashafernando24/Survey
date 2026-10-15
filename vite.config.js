import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import 'dotenv/config';
import healthHandler from './api/health.js';
import responsesHandler from './api/responses.js';
import submissionValidation from './api/_submissionValidation.js';

const { readJsonRequestBody } = submissionValidation;

const API_HANDLERS = {
  '/api/health': healthHandler,
  '/api/responses': responsesHandler
};

function localVercelFunctions() {
  return {
    name: 'local-vercel-functions',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = new URL(req.url || '/', 'http://localhost').pathname;
        const handler = API_HANDLERS[pathname];
        if (!handler) return next();

        res.status = statusCode => {
          res.statusCode = statusCode;
          return res;
        };
        res.json = payload => {
          if (!res.headersSent) res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify(payload));
        };

        try {
          if (!['GET', 'HEAD'].includes(req.method || 'GET')) {
            const parsedRequest = await readJsonRequestBody(req);
            if (parsedRequest.error) {
              return res.status(parsedRequest.statusCode).json({error:parsedRequest.error});
            }
            req.body = parsedRequest.body;
          }

          await handler(req, res);
        } catch (error) {
          server.config.logger.error(error?.stack || String(error));
          if (!res.headersSent) res.statusCode = 500;
          if (!res.writableEnded) res.end(JSON.stringify({error:'Local API function failed'}));
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), localVercelFunctions()]
});
