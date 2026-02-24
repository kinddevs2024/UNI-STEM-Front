import * as XLSX from "xlsx";

/**
 * Normalize header key for matching (lowercase, trim, collapse spaces).
 */
function norm(s) {
  if (s == null) return "";
  return String(s).toLowerCase().trim().replace(/\s+/g, " ");
}

/**
 * Find column index by possible header names.
 */
function findColumnIndex(headers, ...names) {
  const normalized = names.map((n) => norm(n));
  for (let i = 0; i < headers.length; i++) {
    const h = norm(headers[i]);
    if (normalized.some((n) => h === n || h.includes(n))) return i;
  }
  return -1;
}

/**
 * Parse "Correct Answer" value: can be "A","B","C","D" or "1","2","3","4" or comma-separated for multiple.
 * Returns array of option indices (0-based).
 */
function parseCorrectAnswer(value, optionCount) {
  if (value == null || value === "") return [];
  const raw = String(value).trim().toUpperCase();
  if (!raw) return [];
  const parts = raw.split(/[,;|\/]/).map((p) => p.trim()).filter(Boolean);
  const indices = new Set();
  for (const p of parts) {
    if (/^[A-Z]$/.test(p)) {
      const idx = p.charCodeAt(0) - 65;
      if (idx >= 0 && idx < optionCount) indices.add(idx);
    } else if (/^[1-9]\d*$/.test(p)) {
      const idx = parseInt(p, 10) - 1;
      if (idx >= 0 && idx < optionCount) indices.add(idx);
    }
  }
  return Array.from(indices);
}

/**
 * Parse "Allow Multiple" / "Multiple" column: YES/NO, 1/0, true/false.
 */
function parseAllowMultiple(value) {
  if (value == null || value === "") return false;
  const v = String(value).trim().toLowerCase();
  if (v === "yes" || v === "1" || v === "true" || v === "x" || v === "да") return true;
  return false;
}

/**
 * Parse numeric points (default 10).
 */
function parsePoints(value) {
  if (value == null || value === "") return 10;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 10;
}

/**
 * Parse Excel or CSV file and return array of question objects for API.
 * Expected columns (first row = headers):
 * - Question Text (or Question)
 * - Option A, Option B, Option C, Option D (or Option 1,2,3,4)
 * - Correct Answer (e.g. "A", "B", "C", "D" or "1","2","3","4"; comma-separated for multiple)
 * - Points (optional, default 10)
 * - Allow Multiple / Multiple (optional, YES/NO)
 *
 * @param {File} file - .xlsx or .csv file
 * @returns {Promise<{ questions: Array<{ question, type, options, correctAnswer, correctAnswers, allowMultipleCorrect, points }>, errors: string[] }>}
 */
export function parseQuestionsFromExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = parseQuestionsFromArrayBuffer(e.target.result, file.name);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * @param {ArrayBuffer} buffer
 * @param {string} [filename] - used to detect CSV
 */
export function parseQuestionsFromArrayBuffer(buffer, filename = "") {
  const errors = [];
  const isCsv = /\.csv$/i.test(filename);
  let data;

  if (isCsv) {
    const decoder = new TextDecoder("utf-8");
    const text = decoder.decode(buffer);
    const wb = XLSX.read(text, { type: "string", raw: false });
    const ws = wb.Sheets[wb.SheetNames[0]];
    data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  } else {
    const wb = XLSX.read(buffer, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  }

  if (!Array.isArray(data) || data.length < 2) {
    return { questions: [], errors: ["File must have a header row and at least one data row."] };
  }

  const headers = data[0].map((h) => (h != null ? String(h) : ""));
  const questionCol = findColumnIndex(headers, "Question Text", "Question", "Question text");
  const optionColA = findColumnIndex(headers, "Option A", "Option 1", "A");
  const optionColB = findColumnIndex(headers, "Option B", "Option 2", "B");
  const optionColC = findColumnIndex(headers, "Option C", "Option 3", "C");
  const optionColD = findColumnIndex(headers, "Option D", "Option 4", "D");
  const correctCol = findColumnIndex(headers, "Correct Answer", "Correct", "Correct answer", "Answer");
  const pointsCol = findColumnIndex(headers, "Points", "Point");
  const multipleCol = findColumnIndex(headers, "Allow Multiple", "Multiple", "Multiple Correct");

  if (questionCol < 0) {
    return { questions: [], errors: ["Missing column: 'Question Text' or 'Question'."] };
  }
  if (correctCol < 0) {
    return { questions: [], errors: ["Missing column: 'Correct Answer'."] };
  }

  const optionCols = [optionColA, optionColB, optionColC, optionColD].filter((c) => c >= 0);
  if (optionCols.length < 2) {
    return { questions: [], errors: ["At least two option columns are required (e.g. Option A, Option B)."] };
  }

  const questions = [];
  for (let r = 1; r < data.length; r++) {
    const row = data[r];
    if (!Array.isArray(row)) continue;

    const questionText = row[questionCol] != null ? String(row[questionCol]).trim() : "";
    if (!questionText) {
      errors.push(`Row ${r + 1}: empty question text, skipped.`);
      continue;
    }

    const options = optionCols
      .map((col) => (row[col] != null ? String(row[col]).trim() : ""))
      .filter((o) => o !== "");
    if (options.length < 2) {
      errors.push(`Row ${r + 1}: at least 2 non-empty options required, skipped.`);
      continue;
    }

    const correctIndices = parseCorrectAnswer(row[correctCol], options.length);
    if (correctIndices.length === 0) {
      errors.push(`Row ${r + 1}: invalid or missing Correct Answer (use A,B,C,D or 1,2,3,4), skipped.`);
      continue;
    }

    const allowMultiple = multipleCol >= 0 ? parseAllowMultiple(row[multipleCol]) : false;
    const points = pointsCol >= 0 ? parsePoints(row[pointsCol]) : 10;
    const correctAnswers = correctIndices.map((i) => options[i]);
    const correctAnswer = correctAnswers[0];

    questions.push({
      question: questionText,
      type: "multiple-choice",
      options,
      correctAnswer,
      correctAnswers,
      allowMultipleCorrect: allowMultiple,
      points,
    });
  }

  return { questions, errors };
}
