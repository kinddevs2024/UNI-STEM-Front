import test from 'node:test';
import assert from 'node:assert/strict';
import * as XLSX from 'xlsx';
import { createQuestionWorkbook } from '../src/utils/questionWorkbook.js';
import { parseQuestionsFromArrayBuffer } from '../src/utils/parseQuestionsFromExcel.js';

const parse = book => parseQuestionsFromArrayBuffer(XLSX.write(book, { bookType: 'xlsx', type: 'array' }), 'questions.xlsx');

test('export/import preserves multi-answer questions with more than four options', () => {
  const question = { question: 'Select primes', type: 'multiple-choice', options: ['2', '3', '4', '5', '6', '7'], correctAnswers: ['2', '3', '5', '7'], allowMultipleCorrect: true, points: 25 };
  const result = parse(createQuestionWorkbook([question], '5'));
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.questions[0], { ...question, correctAnswer: '2' });
});

test('essay templates and exports re-import without answer or option columns', () => {
  const question = { question: 'Explain your reasoning', type: 'essay', options: [], points: 15 };
  const exported = parse(createQuestionWorkbook([question], 'student'));
  assert.deepEqual(exported.errors, []);
  assert.equal(exported.questions[0].type, 'essay');
  assert.equal(exported.questions[0].points, 15);
  const template = parse(createQuestionWorkbook([], 'student', true, 'essay'));
  assert.deepEqual(template.errors, []);
  assert.equal(template.questions[0].type, 'essay');
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([['Question Text', 'Type', 'Points'], ['Explain gravity', 'essay', 10]]), 'Essay');
  assert.equal(parse(book).questions[0].type, 'essay');
});

test('mixed template includes both question types and rejects ambiguous answer mode', () => {
  const result = parse(createQuestionWorkbook([], '6', true, 'mixed'));
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.questions.map(question => question.type), ['multiple-choice', 'essay']);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([['Question Text', 'Option 1', 'Option 2', 'Correct Answer', 'Allow Multiple'], ['Choose', 'A', 'B', '1,2', 'NO']]), 'Invalid');
  const invalid = parse(book);
  assert.equal(invalid.questions.length, 0);
  assert.match(invalid.errors[0], /Allow Multiple/);
});

test('blank optional cells do not shift correct answer indexes', () => {
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([['Question Text', 'Option 1', 'Option 2', 'Option 3', 'Correct Answer'], ['Choose the last', 'First', '', 'Last', 3]]), 'Options');
  const result = parse(book);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.questions[0].options, ['First', 'Last']);
  assert.equal(result.questions[0].correctAnswer, 'Last');
});
