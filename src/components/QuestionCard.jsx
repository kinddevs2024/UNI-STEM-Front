import { useEffect, useState } from 'react';
import './QuestionCard.css';

const QuestionCard = ({ 
  question, 
  questionNumber, 
  totalQuestions,
  selectedAnswer,
  onAnswerChange,
  disabled = false
}) => {
  const isMultiSelect = Boolean(question?.allowMultipleCorrect);
  const normalizeAnswer = (value) => {
    if (isMultiSelect) {
      if (Array.isArray(value)) {
        return value.filter((item) => typeof item === 'string' && item.trim() !== '');
      }
      if (typeof value === 'string' && value.trim() !== '') {
        return [value.trim()];
      }
      return [];
    }

    if (typeof value === 'string') {
      return value;
    }
    return '';
  };

  const [localAnswer, setLocalAnswer] = useState(normalizeAnswer(selectedAnswer));

  useEffect(() => {
    setLocalAnswer(normalizeAnswer(selectedAnswer));
  }, [selectedAnswer, question?._id, question?.allowMultipleCorrect]);

  const handleAnswerChange = (value) => {
    setLocalAnswer(value);
    if (onAnswerChange) {
      onAnswerChange(question._id, value);
    }
  };

  const handleMultiAnswerToggle = (option) => {
    const currentAnswers = Array.isArray(localAnswer) ? localAnswer : [];
    const nextAnswers = currentAnswers.includes(option)
      ? currentAnswers.filter((answer) => answer !== option)
      : [...currentAnswers, option];

    handleAnswerChange(nextAnswers);
  };

  return (
    <div className="question-card card">
      <div className="question-header">
        <span className="question-number">
          Question {questionNumber} of {totalQuestions}
        </span>
        <span className="question-points">{question.points} points</span>
      </div>
      
      <div className="question-text">
        {question.question || question.questionText}
      </div>

      {question.type === 'multiple-choice' && question.options ? (
        <div className="question-options">
          {question.options.map((option, index) => (
            <label 
              key={index} 
              className={`option-label ${isMultiSelect ? (Array.isArray(localAnswer) && localAnswer.includes(option) ? 'selected' : '') : (localAnswer === option ? 'selected' : '')}`}
            >
              {isMultiSelect ? (
                <input
                  type="checkbox"
                  name={`question-${question._id}-${index}`}
                  value={option}
                  checked={Array.isArray(localAnswer) && localAnswer.includes(option)}
                  onChange={() => handleMultiAnswerToggle(option)}
                  disabled={disabled}
                />
              ) : (
                <input
                  type="radio"
                  name={`question-${question._id}`}
                  value={option}
                  checked={localAnswer === option}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  disabled={disabled}
                />
              )}
              <span className="option-text">{option}</span>
            </label>
          ))}
        </div>
      ) : (
        <textarea
          className="question-essay-input"
          value={localAnswer}
          onChange={(e) => handleAnswerChange(e.target.value)}
          placeholder="Type your answer here..."
          disabled={disabled}
          rows={10}
        />
      )}
    </div>
  );
};

export default QuestionCard;

