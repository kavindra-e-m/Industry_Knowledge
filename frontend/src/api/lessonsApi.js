import lessonsMock from "../mocks/lessons.json";

// TODO: Replace mock with axios request to /api/lessons/patterns

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

export async function fetchLessonsLearned() {
  await delay(650);
  return lessonsMock;
}

export async function fetchPatternById(patternId) {
  await delay(300);
  const pattern = lessonsMock.find((p) => p.pattern_id === patternId);
  if (!pattern) throw new Error(`Pattern not found: ${patternId}`);
  return pattern;
}
