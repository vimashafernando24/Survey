function numberedIds(prefix, start, end) {
  return Array.from({ length: end - start + 1 }, (_, index) => `${prefix}${start + index}`);
}

const ANSWER_QUESTION_IDS = Object.freeze([
  ...numberedIds('A', 1, 21),
  ...numberedIds('B', 1, 4),
  'B5a_1', 'B5b_1', 'B6_1', 'B7_1', 'B8_1',
  'B5a_2', 'B5b_2', 'B6_2', 'B7_2', 'B8_2',
  'B5a_3',
  ...numberedIds('B', 9, 20),
  ...numberedIds('C', 1, 7),
  ...numberedIds('BC', 1, 3),
  ...numberedIds('SC', 1, 4),
  ...numberedIds('D', 1, 12),
  'D12b',
  ...numberedIds('D', 13, 22),
  ...numberedIds('BD', 1, 3),
  ...numberedIds('SD', 1, 4),
  ...numberedIds('E', 1, 51),
  ...numberedIds('BE', 1, 3),
  ...numberedIds('SE', 1, 4),
  ...numberedIds('F', 1, 5),
  ...numberedIds('BF', 1, 2),
  ...numberedIds('SF', 1, 3)
]);

const ANSWER_QUESTION_ID_SET = new Set(ANSWER_QUESTION_IDS);

module.exports = { ANSWER_QUESTION_IDS, ANSWER_QUESTION_ID_SET };
