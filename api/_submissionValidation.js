const { ANSWER_QUESTION_IDS, ANSWER_QUESTION_ID_SET } = require('./_questionRegistry');

const MAX_REQUEST_BODY_BYTES = 256 * 1024;
const MAX_ANSWER_ITEMS = ANSWER_QUESTION_IDS.length;

function requestBodySize(req) {
  const declaredLength = Number(req.headers?.['content-length']);
  const declaredBytes = Number.isFinite(declaredLength) && declaredLength >= 0
    ? declaredLength
    : 0;

  let bodyBytes;
  if (Buffer.isBuffer(req.rawBody)) bodyBytes = req.rawBody.length;
  else if (typeof req.rawBody === 'string') bodyBytes = Buffer.byteLength(req.rawBody);
  else if (Buffer.isBuffer(req.body)) bodyBytes = req.body.length;
  else if (typeof req.body === 'string') bodyBytes = Buffer.byteLength(req.body);
  else {
    try {
      bodyBytes = Buffer.byteLength(JSON.stringify(req.body || {}));
    } catch {
      bodyBytes = Number.POSITIVE_INFINITY;
    }
  }

  return Math.max(declaredBytes, bodyBytes);
}

async function readJsonRequestBody(req) {
  const declaredLength = Number(req.headers?.['content-length']);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BODY_BYTES) {
    return { statusCode: 413, error: 'Request body is too large.' };
  }

  const chunks = [];
  let receivedBytes = 0;
  let bodyTooLarge = false;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    receivedBytes += buffer.length;
    if (receivedBytes <= MAX_REQUEST_BODY_BYTES) chunks.push(buffer);
    else bodyTooLarge = true;
  }

  if (bodyTooLarge) {
    return { statusCode: 413, error: 'Request body is too large.' };
  }

  const rawBody = Buffer.concat(chunks).toString('utf8');
  try {
    return { body: rawBody ? JSON.parse(rawBody) : {} };
  } catch {
    return { statusCode: 400, error: 'Malformed JSON request body.' };
  }
}

function validateQuestionIds(ids, fieldName) {
  const seen = new Set();

  for (const id of ids) {
    if (typeof id !== 'string' || !ANSWER_QUESTION_ID_SET.has(id)) {
      return `${fieldName} contains an unknown question ID.`;
    }
    if (seen.has(id)) {
      return `${fieldName} contains a duplicate question ID.`;
    }
    seen.add(id);
  }

  return null;
}

function validateSubmissionQuestionIds(payload) {
  const activeItems = payload._analysis.items;
  const offPathAnswers = payload._audit?.off_path_answers;

  if (offPathAnswers != null && !Array.isArray(offPathAnswers.items)) {
    return 'Off-path answer items must be an array.';
  }

  const offPathItems = offPathAnswers?.items || [];
  const allItems = [...activeItems, ...offPathItems];
  if (allItems.length > MAX_ANSWER_ITEMS) {
    return `Survey response cannot contain more than ${MAX_ANSWER_ITEMS} answer items.`;
  }

  const itemIds = allItems.map(item => item?.question_id);
  const itemError = validateQuestionIds(itemIds, 'Answer items');
  if (itemError) return itemError;

  const activeQuestionIds = payload._meta.active_question_ids;
  const offPathQuestionIds = payload._meta.off_path_question_ids;
  if (activeQuestionIds !== undefined && !Array.isArray(activeQuestionIds)) {
    return 'Active question IDs must be an array.';
  }
  if (offPathQuestionIds !== undefined && !Array.isArray(offPathQuestionIds)) {
    return 'Off-path question IDs must be an array.';
  }

  return validateQuestionIds(
    [...(activeQuestionIds || []), ...(offPathQuestionIds || [])],
    'Question ID metadata'
  );
}

module.exports = {
  MAX_REQUEST_BODY_BYTES,
  MAX_ANSWER_ITEMS,
  readJsonRequestBody,
  requestBodySize,
  validateSubmissionQuestionIds
};
