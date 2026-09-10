function toTopicDto(topic) {
  return {
    id: topic.id,
    name: topic.name,
    description: topic.description,
    image_url: topic.image_url
  };
}

function toWordDto(word) {
  return {
    id: word.id,
    topic_id: word.topic_id,
    word: word.word,
    phonetic: word.phonetic,
    meaning: word.meaning,
    example_sentence: word.example_sentence,
    audio_url: word.audio_url,
    difficulty: word.difficulty
  };
}

function toWordListItemDto(word) {
  return {
    id: word.id,
    word: word.word,
    phonetic: word.phonetic,
    meaning: word.meaning,
    example_sentence: word.example_sentence,
    audio_url: word.audio_url
  };
}

function toReviewCardDto(card) {
  return {
    card_id: card.id,
    word: card.word ? card.word.word : null,
    meaning: card.word ? card.word.meaning : null,
    recall_probability: card.recall_probability,
    next_review_at: card.next_review_at
  };
}

module.exports = {
  toTopicDto,
  toWordDto,
  toWordListItemDto,
  toReviewCardDto
};