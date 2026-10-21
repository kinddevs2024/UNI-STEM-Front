import { t, useLocale } from "../i18n/runtime";import { useState } from 'react';
import './AnswerReview.css';

const labels = { correct: 'Correct', incorrect: 'Incorrect', unanswered: 'Not answered', graded: 'Essay score' };
const answerText = (value) => Array.isArray(value) ? value.join(', ') : String(value ?? '');

export default function AnswerReview({ questions }) {useLocale();
  const [open, setOpen] = useState(false);
  if (!questions?.length) return null;
  return <section className="answer-review card" aria-labelledby="answer-review-title">
    <div className="answer-review-heading">
      <div><h3 id="answer-review-title">{t("Your answers")}</h3><p>{t("See what you got right and learn from your mistakes.")}</p></div>
      <button type="button" className="button-primary" aria-expanded={open} aria-controls="answer-review-list" onClick={() => setOpen(!open)}>{t(open ? 'Hide answers' : 'Review answers')}</button>
    </div>
    {open && <ol id="answer-review-list" className="answer-review-list">{questions.map((q, index) => <li key={q.id} className={`answer-review-question answer-review-${q.status}`}>
      <div className="answer-review-meta"><span>{t("Question ")}{t(index + 1)}</span><strong>{t(labels[q.status] || 'Not answered')}</strong><span>{q.score} / {q.maxScore}{t(" points")}</span></div>
      <h4>{q.question}</h4>
      {q.type === 'multiple-choice' && q.options?.length > 0 && <ul className="answer-review-options">{q.options.map((option, i) => {
            const selected = (Array.isArray(q.answer) ? q.answer : [q.answer]).includes(option);
            const correct = q.correctAnswers.includes(option);
            return <li key={i} className={correct ? 'is-correct' : selected ? 'is-incorrect' : ''}><span>{t(option)}</span>{correct && <strong>{t("✓ Correct answer")}</strong>}{selected && <strong>{t("Your answer")}</strong>}</li>;
          })}</ul>}
      <p><strong>{t("Your answer: ")}</strong>{answerText(q.answer) || t('Not answered')}</p>
      {q.type === 'multiple-choice' && q.correctAnswers.length > 0 && <p><strong>{t("Correct answer: ")}</strong>{q.correctAnswers.join(', ')}</p>}
    </li>)}</ol>}
  </section>;
}
