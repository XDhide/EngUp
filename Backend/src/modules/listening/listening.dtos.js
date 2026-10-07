function toLessonListItemDto(lesson) {
  return {
    id: lesson.id,
    title: lesson.title,
    difficulty: lesson.difficulty,
    topic: lesson.topic,
    audio_url: lesson.audio_url
  };
}

function toLessonDetailDto(lesson) {
  return {
    id: lesson.id,
    title: lesson.title,
    audio_url: lesson.audio_url,
    transcript: lesson.transcript
  };
}

function toDictationResultDto(result) {
  return {
    accuracy_percent: result.accuracy_percent,
    wrong_words: result.wrong_words
  };
}

module.exports = {
  toLessonListItemDto,
  toLessonDetailDto,
  toDictationResultDto
};
