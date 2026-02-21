export const DEFAULT_OLYMPIAD_SUBJECTS = [
  "Mathematics",
  "Psychology",
  "English",
  "Science",
  "Physics",
  "Chemistry",
];

export const DEFAULT_OLYMPIAD_SUBJECT = DEFAULT_OLYMPIAD_SUBJECTS[0];

export const normalizeSubject = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ");

export const mergeSubjects = (...subjectLists) => {
  const merged = [];
  const seen = new Set();

  subjectLists.flat().forEach((subject) => {
    const normalized = normalizeSubject(subject);
    if (!normalized) return;

    const key = normalized.toLocaleLowerCase();
    if (seen.has(key)) return;

    seen.add(key);
    merged.push(normalized);
  });

  return merged;
};

export const loadCustomSubjects = (storageKey) => {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return mergeSubjects(parsed);
  } catch {
    return [];
  }
};

export const saveCustomSubjects = (storageKey, subjects) => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(mergeSubjects(subjects)));
  } catch {
    // Ignore localStorage errors
  }
};
