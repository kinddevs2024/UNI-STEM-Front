import { useState } from "react";
import "./QuestionFormStep.css";

// Question Form Component for Step 3
const QuestionFormStep = ({
  olympiadId,
  olympiadType,
  questions,
  onAddQuestion,
  onFinish,
  onBack,
}) => {
  const [questionForm, setQuestionForm] = useState({
    question: "",
    type: olympiadType === "test" ? "multiple-choice" : "essay",
    options: ["", "", "", ""],
    correctAnswer: "",
    points: 10,
  });

  const handleAddQuestion = (e) => {
    e.preventDefault();

    if (olympiadType === "test") {
      // Validate multiple choice question
      if (!questionForm.question || !questionForm.correctAnswer) {
        return;
      }
      const validOptions = questionForm.options.filter(
        (opt) => opt.trim() !== ""
      );
      if (validOptions.length < 2) {
        return;
      }

      onAddQuestion({
        question: questionForm.question,
        type: "multiple-choice",
        options: validOptions,
        correctAnswer: questionForm.correctAnswer,
        points: questionForm.points,
      });
    } else {
      // Essay question
      if (!questionForm.question) {
        return;
      }

      onAddQuestion({
        question: questionForm.question,
        type: "essay",
        points: questionForm.points,
      });
    }

    // Reset form
    setQuestionForm({
      question: "",
      type: olympiadType === "test" ? "multiple-choice" : "essay",
      options: ["", "", "", ""],
      correctAnswer: "",
      points: 10,
    });
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...questionForm.options];
    newOptions[index] = value;
    setQuestionForm({ ...questionForm, options: newOptions });
  };

  return (
    <div className="step-content">
      <h2>Step 3: Add Questions</h2>
      <p className="step-description">
        Add questions to your {olympiadType === "test" ? "test" : "essay"}{" "}
        olympiad
      </p>

      {/* Questions List */}
      {questions && questions.length > 0 && (
        <div className="questions-list">
          <h3>Added Questions ({questions.length})</h3>
          {questions.map((q, index) => (
            <div key={q._id || index} className="question-item card">
              <div className="question-header">
                <span className="question-number">Q{index + 1}</span>
                <span className="question-points">{q.points} pts</span>
              </div>
              <p className="question-text">{q.question || "No question text"}</p>
              {q.type === "multiple-choice" && q.options && q.options.length > 0 && (
                <div className="question-options">
                  {q.options.map((opt, optIndex) => (
                    <div
                      key={optIndex}
                      className={`option ${
                        opt === q.correctAnswer ? "correct" : ""
                      }`}
                    >
                      {String.fromCharCode(65 + optIndex)}. {opt}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Question Form */}
      <form onSubmit={handleAddQuestion} className="question-form">
        <div className="form-group">
          <label>Question</label>
          <textarea
            value={questionForm.question}
            onChange={(e) =>
              setQuestionForm({ ...questionForm, question: e.target.value })
            }
            placeholder="Enter your question..."
            rows="3"
            required
          />
        </div>

        {olympiadType === "test" && (
          <>
            <div className="form-group">
              <label>Options</label>
              {questionForm.options.map((option, index) => {
                const isSelected = questionForm.correctAnswer === option && option.trim() !== "";
                return (
                <div key={index} className={`option-input-row ${isSelected ? "is-selected" : ""}`}>
                  <span className="option-label">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${String.fromCharCode(65 + index)}`}
                    className="option-input"
                  />
                  <input
                    type="radio"
                    name="correctAnswer"
                    value={option}
                    checked={questionForm.correctAnswer === option}
                    onChange={(e) =>
                      setQuestionForm({
                        ...questionForm,
                        correctAnswer: e.target.value,
                      })
                    }
                    disabled={!option.trim()}
                  />
                  <label className="radio-label">Correct</label>
                  {isSelected && <span className="selected-badge">Selected</span>}
                </div>
                );
              })}
            </div>
          </>
        )}

        <div className="form-row">
          <div className="form-group">
            <label>Points</label>
            <input
              type="number"
              value={questionForm.points}
              onChange={(e) =>
                setQuestionForm({
                  ...questionForm,
                  points: parseInt(e.target.value) || 10,
                })
              }
              min="1"
              required
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="button-secondary" onClick={onBack}>
            Back
          </button>
          <button type="submit" className="button-primary">
            Add Question
          </button>
          <button type="button" className="button-success" onClick={onFinish}>
            Finish
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuestionFormStep;
