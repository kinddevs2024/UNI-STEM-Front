import * as XLSX from 'xlsx';
export function createQuestionWorkbook(questions, gradeCategory, template = false, olympiadType = 'test') {
  const examples = {
    test: [{ question: 'What is 2 + 2?', type: 'multiple-choice', options: ['3','4','5','6'], correctAnswers: ['4'], points: 10 }],
    essay: [{ question: 'Describe a scientific discovery and explain its importance.', type: 'essay', options: [], points: 10 }],
  };
  const rows = template ? (olympiadType === 'mixed' ? [...examples.test, ...examples.essay] : examples[olympiadType] || examples.test) : questions;
  const optionCount = Math.max(4, ...rows.map(row => row.options?.length || 0));
  const headers = ['Question Text', 'Type', ...Array.from({ length: optionCount }, (_, i) => `Option ${i + 1}`), 'Correct Answer', 'Points', 'Allow Multiple'];
  const data = rows.map(question => [String(question.question || ''), question.type || 'multiple-choice', ...Array.from({ length: optionCount }, (_, i) => String(question.options?.[i] || '')),
    (question.correctAnswers?.length ? question.correctAnswers : [question.correctAnswer]).filter(Boolean).map(answer => (question.options || []).indexOf(answer) + 1).join(','), Number(question.points) || 1, question.allowMultipleCorrect ? 'YES' : 'NO']);
  const sheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
  sheet['!cols'] = headers.map((_, index) => ({ wch: index === 0 ? 60 : 22 }));
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, gradeCategory === 'student' ? 'Student' : `Grade ${gradeCategory || 'shared'}`);
  return book;
}
export function downloadQuestionWorkbook(questions, gradeCategory, template = false, olympiadType = 'test') {
  const book = createQuestionWorkbook(questions, gradeCategory, template, olympiadType);
  XLSX.writeFile(book, `questions-${gradeCategory || 'shared'}${template ? '-template' : ''}.xlsx`);
}
