// src/modules/auth/placementTest.data.js
// Ngân hàng câu hỏi bài test đầu vào (placement test).
// Dữ liệu tĩnh, thuộc sở hữu module auth — không truy vấn DB module khác.

const PLACEMENT_TEST_QUESTIONS = [
  { id: 1, level: 'A1', question_text: "She ___ to school every day.", options: [{ id: 'a', text: 'go' }, { id: 'b', text: 'goes' }, { id: 'c', text: 'going' }, { id: 'd', text: 'gone' }], correct_option_id: 'b' },
  { id: 2, level: 'A1', question_text: "This is ___ apple.", options: [{ id: 'a', text: 'a' }, { id: 'b', text: 'an' }, { id: 'c', text: 'the' }, { id: 'd', text: 'no article' }], correct_option_id: 'b' },
  { id: 3, level: 'A2', question_text: "I ___ my homework yesterday.", options: [{ id: 'a', text: 'do' }, { id: 'b', text: 'did' }, { id: 'c', text: 'done' }, { id: 'd', text: 'doing' }], correct_option_id: 'b' },
  { id: 4, level: 'A2', question_text: "There ___ some milk in the fridge.", options: [{ id: 'a', text: 'is' }, { id: 'b', text: 'are' }, { id: 'c', text: 'be' }, { id: 'd', text: 'am' }], correct_option_id: 'a' },
  { id: 5, level: 'B1', question_text: "By the time we arrived, the movie ___.", options: [{ id: 'a', text: 'already started' }, { id: 'b', text: 'has already started' }, { id: 'c', text: 'had already started' }, { id: 'd', text: 'starts already' }], correct_option_id: 'c' },
  { id: 6, level: 'B1', question_text: "If I ___ more time, I would learn French.", options: [{ id: 'a', text: 'have' }, { id: 'b', text: 'had' }, { id: 'c', text: 'will have' }, { id: 'd', text: 'having' }], correct_option_id: 'b' },
  { id: 7, level: 'B2', question_text: "The report ___ by the manager before the meeting starts.", options: [{ id: 'a', text: 'will review' }, { id: 'b', text: 'will be reviewed' }, { id: 'c', text: 'is reviewing' }, { id: 'd', text: 'reviews' }], correct_option_id: 'b' },
  { id: 8, level: 'B2', question_text: "Choose the correct sentence.", options: [{ id: 'a', text: 'Despite of the rain, we went out.' }, { id: 'b', text: 'Despite the rain, we went out.' }, { id: 'c', text: 'Despite the rain, but we went out.' }, { id: 'd', text: 'Although the rain, we went out.' }], correct_option_id: 'b' },
  { id: 9, level: 'C1', question_text: "Not only ___ late, but he also forgot the documents.", options: [{ id: 'a', text: 'he was' }, { id: 'b', text: 'was he' }, { id: 'c', text: 'he is' }, { id: 'd', text: 'is he' }], correct_option_id: 'b' },
  { id: 10, level: 'C1', question_text: "She insisted that he ___ the contract immediately.", options: [{ id: 'a', text: 'signs' }, { id: 'b', text: 'signed' }, { id: 'c', text: 'sign' }, { id: 'd', text: 'will sign' }], correct_option_id: 'c' },
  { id: 11, level: 'C2', question_text: "Choose the option closest in meaning to 'a blessing in disguise'.", options: [{ id: 'a', text: 'A hidden danger' }, { id: 'b', text: 'A good thing that seemed bad at first' }, { id: 'c', text: 'A lucky coincidence' }, { id: 'd', text: 'A well-planned surprise' }], correct_option_id: 'b' },
  { id: 12, level: 'C2', question_text: "Choose the correct sentence.", options: [{ id: 'a', text: 'Had I known earlier, I would have acted differently.' }, { id: 'b', text: 'If I had knew earlier, I would act differently.' }, { id: 'c', text: 'Had I know earlier, I would have act differently.' }, { id: 'd', text: 'I had known earlier, I would have acted differently.' }], correct_option_id: 'a' }
];

// Ngưỡng % số câu đúng -> level đề xuất
const LEVEL_THRESHOLDS = [
  { minPercent: 86, level: 'C2' },
  { minPercent: 71, level: 'C1' },
  { minPercent: 51, level: 'B2' },
  { minPercent: 31, level: 'B1' },
  { minPercent: 16, level: 'A2' },
  { minPercent: 0, level: 'A1' }
];

module.exports = { PLACEMENT_TEST_QUESTIONS, LEVEL_THRESHOLDS };
