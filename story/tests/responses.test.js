const test = require('node:test');
const assert = require('node:assert/strict');
const { validateReflection } = require('../reflectionValidator');

test('survey remains successful and saved when reflection generation fails', async () => {
  const databasePath = require.resolve('../../api/_database');
  const generatorPath = require.resolve('../generateReflection');
  const handlerPath = require.resolve('../../api/responses');
  let savedDocument;
  let updatedFields;

  require.cache[databasePath] = {
    id: databasePath,
    filename: databasePath,
    loaded: true,
    exports: {
      getDatabase: async () => ({
        collection: () => ({
          insertOne: async document => {
            savedDocument = document;
            return { insertedId: 'saved-id' };
          },
          updateOne: async (filter, update) => {
            updatedFields = update.$set;
            return { matchedCount: 1 };
          }
        })
      })
    }
  };
  require.cache[generatorPath] = {
    id: generatorPath,
    filename: generatorPath,
    loaded: true,
    exports: { generateReflection: async () => { throw new Error('simulated_failure'); } }
  };
  delete require.cache[handlerPath];
  const handler = require(handlerPath);

  const req = {
    method: 'POST',
    body: {
      selected_language: 'en',
      _meta: { session_id: 'test-session' },
      _analysis: { items: [] }
    }
  };
  let statusCode;
  let body;
  const res = {
    status(code) { statusCode = code; return this; },
    json(value) { body = value; return this; },
    setHeader() {}
  };

  await handler(req, res);

  assert.ok(savedDocument);
  assert.equal(statusCode, 201);
  assert.equal(body.success, true);
  assert.equal(body.id, 'saved-id');
  assert.equal(validateReflection(body.reflection, 'en'), true);
  assert.equal(updatedFields.reflection_source, 'fallback');
  assert.equal(updatedFields.reflection_error, 'simulated_failure');
});
