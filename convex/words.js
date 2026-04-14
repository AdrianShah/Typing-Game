export const wordListEasy = [
    "the", "be", "of", "and", "a", "to", "in", "he", "have", "it", "that", "for", "they", "I", "with", "as", "not", "on", "she", "at",
    "by", "we", "you", "do", "but", "or", "say", "who", "can", "if", "no", "man", "out", "so", "up", "go", "new", "get", "now", "way"
];

export const wordListMedium = [
    "which", "would", "there", "make", "when", "more", "other", "what", "time", "about", "than", "into", "could", "state", "only",
    "year", "some", "take", "come", "these", "know", "see", "use", "like", "then", "first", "any", "work", "may", "such", "give", "over",
    "think", "most", "even", "find", "also", "after", "many", "must", "look", "before", "great", "back", "through", "long", "where",
    "much", "should", "well", "people", "down", "own", "just", "because", "good", "each", "those", "feel", "seem"
];

export const wordListHard = [
    "consider", "general", "develop", "position", "computer", "interest", "national", "possible", "maintain", "present",
    "governor", "program", "question", "suddenly", "although", "different", "throughout", "particular", "especially", 
    "experience", "important", "difference", "understand", "completely", "everything", "investment", "technology", "environment"
];

export function getRandomWords(count, difficulty = 'medium') {
    let pool = [];
    if (difficulty === 'easy') pool = [...wordListEasy, ...wordListMedium.slice(0, 10)];
    else if (difficulty === 'extreme') pool = [...wordListHard, ...wordListMedium.slice(0, 5)];
    else if (difficulty === 'hard') pool = [...wordListHard, ...wordListMedium.slice(0, 20)];
    else pool = [...wordListEasy, ...wordListMedium, ...wordListHard.slice(0, 10)];
    
    let result = [];
    // Duplicate pool if count > pool size
    while(result.length < count) {
        const shuffle = [...pool].sort(() => 0.5 - Math.random());
        result.push(...shuffle);
    }
    return result.slice(0, count);
}