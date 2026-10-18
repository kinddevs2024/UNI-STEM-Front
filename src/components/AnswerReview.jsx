import { useState } from 'react';
import './AnswerReview.css';

const labels = {correct:'Correct', incorrect:'Incorrect', unanswered:'Not answered', graded:'Essay score'};
const answerText = value => Array.isArray(value) ? value.join(', ') : String(value ?? '');

export default function AnswerReview({ questions }) {
  const [open, setOpen] = useState(false);
  if (!questions?.length) return null;
  return <section className="answer-review card" aria-labelledby="answer-review-title">
    <div className="answer-review-heading">
      <div><h3 id="answer-review-title">Your answers</h3><p>See what you got right and learn from your mistakes.</p></div>
      <button type="button" className="button-primary" aria-expanded={open} aria-controls="answer-review-list" onClick={() => setOpen(!open)}>{open ? 'Hide answers' : 'Review answers'}</button>
    </div>
    {open && <ol id="answer-review-list" className="answer-review-list">{questions.map((q,index) => <li key={q.id} className={`answer-review-question answer-review-${q.status}`}>
      <div className="answer-review-meta"><span>Question {index+1}</span><strong>{labels[q.status] || 'Not answered'}</strong><span>{q.score} / {q.maxScore} points</span></div>
      <h4>{q.question}</h4>
      {q.type === 'multiple-choice' && q.options?.length > 0 && <ul className="answer-review-options">{q.options.map((option,i) => {
        const selected = (Array.isArray(q.answer) ? q.answer : [q.answer]).includes(option);
        const correct = q.correctAnswers.includes(option);
        return <li key={i} className={correct ? 'is-correct' : selected ? 'is-incorrect' : ''}><span>{option}</span>{correct && <strong>✓ Correct answer</strong>}{selected && <strong>Your answer</strong>}</li>;
      })}</ul>}
      <p><strong>Your answer: </strong>{answerText(q.answer) || 'Not answered'}</p>
      {q.type === 'multiple-choice' && q.correctAnswers.length > 0 && <p><strong>Correct answer: </strong>{q.correctAnswers.join(', ')}</p>}
    </li>)}</ol>}
  </section>;
}
