const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Readable } = require('node:stream');
const { normalizeSurveyResponse } = require('../../api/_normalize');
const { ANSWER_QUESTION_IDS } = require('../../api/_questionRegistry');
const {
  MAX_REQUEST_BODY_BYTES,
  MAX_ANSWER_ITEMS,
  readJsonRequestBody
} = require('../../api/_submissionValidation');

const databasePath = require.resolve('../../api/_database');
const generatorPath = require.resolve('../generateReflection');
const handlerPath = require.resolve('../../api/responses');

const reflection = {
  title: 'Test reflection',
  intro: 'Test intro',
  sections: [{ heading: 'Test section', paragraph: 'Test paragraph' }],
  closing: 'Test closing'
};

function answerItem(questionId) {
  return {
    question_id: questionId,
    variable: `variable_${questionId}`,
    section: questionId.charAt(0),
    framework: 'SWTS',
    value: 'test-value',
    label: 'Test label',
    question_text: 'Test question?'
  };
}

function payloadWith(activeItems = [], offPathItems = []) {
  return {
    selected_language: 'en',
    _meta: {
      session_id: 'test-session',
      active_question_ids: activeItems.map(item => item.question_id),
      off_path_question_ids: offPathItems.map(item => item.question_id)
    },
    _analysis: { items: activeItems },
    ...(offPathItems.length > 0 ? {
      _audit: { off_path_answers: { items: offPathItems } }
    } : {})
  };
}

function responseRecorder() {
  return {
    statusCode: null,
    body: null,
    headers: {},
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; }
  };
}

function loadHandler() {
  const state = { savedDocument: null, updatedFields: null };
  require.cache[databasePath] = {
    id: databasePath,
    filename: databasePath,
    loaded: true,
    exports: {
      getDatabase: async () => ({
        collection: () => ({
          insertOne: async document => {
            state.savedDocument = document;
            return { insertedId: 'saved-id' };
          },
          updateOne: async (_filter, update) => {
            state.updatedFields = update.$set;
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
    exports: { generateReflection: async () => reflection }
  };
  delete require.cache[handlerPath];
  return { handler: require(handlerPath), state };
}

async function invoke(payload, headers = {}) {
  const { handler, state } = loadHandler();
  const response = responseRecorder();
  await handler({ method: 'POST', headers, body: payload }, response);
  return { response, state };
}

test('valid complete submission is accepted at the canonical maximum', async () => {
  const questionSource = fs.readFileSync(
    path.resolve(__dirname, '../../src/data/questions.js'),
    'utf8'
  );
  const canonicalIds = [...questionSource.matchAll(/\{id:'([^']+)'[\s\S]*?(?=\n\{id:'|\n\];)/g)]
    .filter(match => /\bvar:'[^']+'/.test(match[0]))
    .map(match => match[1]);

  assert.equal(MAX_ANSWER_ITEMS, 160);
  assert.equal(new Set(ANSWER_QUESTION_IDS).size, ANSWER_QUESTION_IDS.length);
  assert.equal(canonicalIds.length, ANSWER_QUESTION_IDS.length);
  assert.deepEqual(new Set(ANSWER_QUESTION_IDS), new Set(canonicalIds));

  const splitAt = Math.ceil(ANSWER_QUESTION_IDS.length / 2);
  const activeItems = ANSWER_QUESTION_IDS.slice(0, splitAt).map(answerItem);
  const offPathItems = ANSWER_QUESTION_IDS.slice(splitAt).map(answerItem);
  const { response, state } = await invoke(payloadWith(activeItems, offPathItems));

  assert.equal(response.statusCode, 201);
  assert.ok(state.savedDocument);
  assert.equal(Object.keys(state.savedDocument.answers).length, activeItems.length);
  assert.equal(state.savedDocument.audit.off_path_answers.items.length, offPathItems.length);
});

test('valid partial submission preserves existing behavior', async () => {
  const { response, state } = await invoke(payloadWith([]));
  assert.equal(response.statusCode, 201);
  assert.equal(response.body.success, true);
  assert.deepEqual(state.savedDocument.answers, {});
});

test('valid active and off-path answers are accepted', async () => {
  const activeItems = [answerItem('A1')];
  const offPathItems = [answerItem('E1')];
  const { response, state } = await invoke(payloadWith(activeItems, offPathItems));

  assert.equal(response.statusCode, 201);
  assert.equal(state.savedDocument.answers.A1.value, 'test-value');
  assert.equal(state.savedDocument.audit.off_path_answers.items[0].question_id, 'E1');
});

test('unknown question IDs are rejected across answer items and metadata', async () => {
  const unknownItem = answerItem('UNKNOWN');
  const itemResult = await invoke(payloadWith([unknownItem]));
  assert.equal(itemResult.response.statusCode, 400);
  assert.match(itemResult.response.body.error, /unknown question ID/);
  assert.equal(itemResult.state.savedDocument, null);

  const metadataPayload = payloadWith([answerItem('A1')]);
  metadataPayload._meta.active_question_ids = ['UNKNOWN'];
  const metadataResult = await invoke(metadataPayload);
  assert.equal(metadataResult.response.statusCode, 400);
  assert.match(metadataResult.response.body.error, /unknown question ID/);
  assert.equal(metadataResult.state.savedDocument, null);
});

test('duplicate question IDs are rejected', async () => {
  const duplicate = answerItem('A1');
  const itemResult = await invoke(payloadWith([duplicate, duplicate]));
  assert.equal(itemResult.response.statusCode, 400);
  assert.match(itemResult.response.body.error, /duplicate question ID/);
  assert.equal(itemResult.state.savedDocument, null);

  const metadataPayload = payloadWith([duplicate]);
  metadataPayload._meta.off_path_question_ids = ['A1'];
  const metadataResult = await invoke(metadataPayload);
  assert.equal(metadataResult.response.statusCode, 400);
  assert.match(metadataResult.response.body.error, /duplicate question ID/);
  assert.equal(metadataResult.state.savedDocument, null);
});

test('answer item count cannot exceed the canonical maximum', async () => {
  const excessiveItems = Array.from(
    { length: MAX_ANSWER_ITEMS + 1 },
    () => answerItem('A1')
  );
  const { response, state } = await invoke(payloadWith(excessiveItems));
  assert.equal(response.statusCode, 400);
  assert.match(response.body.error, new RegExp(`more than ${MAX_ANSWER_ITEMS}`));
  assert.equal(state.savedDocument, null);
});

test('requests larger than 256 KiB receive HTTP 413', async () => {
  const payload = payloadWith([]);
  payload.padding = 'x'.repeat(MAX_REQUEST_BODY_BYTES);
  const { response, state } = await invoke(payload);
  assert.equal(response.statusCode, 413);
  assert.equal(response.body.error, 'Request body is too large.');
  assert.equal(state.savedDocument, null);
});

test('malformed JSON is safely rejected by the local middleware parser', async () => {
  const request = Readable.from(['{"_meta":']);
  request.headers = {};
  const result = await readJsonRequestBody(request);
  assert.deepEqual(result, {
    statusCode: 400,
    error: 'Malformed JSON request body.'
  });
});

test('local Vite middleware enforces the shared 256 KiB stream limit', async () => {
  const request = Readable.from([
    Buffer.alloc(128 * 1024),
    Buffer.alloc(128 * 1024),
    Buffer.alloc(1)
  ]);
  request.headers = {};
  const result = await readJsonRequestBody(request);
  assert.deepEqual(result, {
    statusCode: 413,
    error: 'Request body is too large.'
  });

  const viteConfig = fs.readFileSync(path.resolve(__dirname, '../../vite.config.js'), 'utf8');
  assert.match(viteConfig, /await readJsonRequestBody\(req\)/);
});

test('stored response structure is unchanged for valid submissions', async () => {
  const payload = payloadWith([answerItem('A1')], [answerItem('E1')]);
  payload._meta.branch = 'employed';
  payload._meta.completion_status = 'complete';
  payload._meta.completion_percentage = 100;
  const expected = normalizeSurveyResponse(payload);
  const { response, state } = await invoke(payload);

  assert.equal(response.statusCode, 201);
  assert.deepEqual(Object.keys(state.savedDocument), Object.keys(expected));
  assert.deepEqual(state.savedDocument.respondent, expected.respondent);
  assert.deepEqual(state.savedDocument.path, expected.path);
  assert.deepEqual(state.savedDocument.answers, expected.answers);
  assert.deepEqual(state.savedDocument.audit, expected.audit);
  assert.equal(state.savedDocument.schema_version, 'v2');
});
