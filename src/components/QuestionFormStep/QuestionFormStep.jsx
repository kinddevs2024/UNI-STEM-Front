import { useState } from "react";
import "./QuestionFormStep.css";

// Question Form Component for Step 3
const QuestionFormStep = ({
  olympiadId,
  olympiadType,
  questions,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
  onFinish,
  onBack,
}) => {
  const [questionForm, setQuestionForm] = useState({
    question: "",
    type: olympiadType === "test" ? "multiple-choice" : "essay",
    options: ["", "", "", ""],
    correctAnswer: "",
    correctAnswers: [],
    allowMultipleCorrect: false,
    points: 10,
  });
  const [editingQuestionId, setEditingQuestionId] = useState(null);

  const getQuestionCorrectAnswers = (question) => {
    const fromArray = Array.isArray(question?.correctAnswers)
      ? question.correctAnswers.filter((answer) =>
          (Array.isArray(question?.options) ? question.options : []).includes(answer)
        )
      : [];

    if (fromArray.length > 0) return [...new Set(fromArray)];
    if (typeof question?.correctAnswer === "string" && question.correctAnswer.trim() !== "") {
      return [question.correctAnswer];
    }
    return [];
  };

  const handleAddQuestion = (e) => {
    e.preventDefault();
    const isEditing = Boolean(editingQuestionId);

    if (olympiadType === "test") {
      if (!questionForm.question) {
        return;
      }
      const validOptions = (Array.isArray(questionForm.options) ? questionForm.options : []).filter(
        (opt) => String(opt).trim() !== ""
      );
      if (validOptions.length < 2) {
        return;
      }

      const selectedCorrectAnswers = questionForm.allowMultipleCorrect
        ? (Array.isArray(questionForm.correctAnswers) ? questionForm.correctAnswers : []).filter((answer) =>
            validOptions.includes(answer)
          )
        : (typeof questionForm.correctAnswer === "string" && validOptions.includes(questionForm.correctAnswer)
            ? [questionForm.correctAnswer]
            : []);

      if (selectedCorrectAnswers.length === 0) {
        return;
      }

      const payload = {
        question: questionForm.question,
        type: "multiple-choice",
        options: validOptions,
        correctAnswer: selectedCorrectAnswers[0],
        correctAnswers: selectedCorrectAnswers,
        allowMultipleCorrect: Boolean(questionForm.allowMultipleCorrect),
        points: questionForm.points,
      };

      if (isEditing && onUpdateQuestion) {
        onUpdateQuestion(editingQuestionId, payload);
      } else {
        onAddQuestion(payload);
      }
    } else {
      // Essay question
      if (!questionForm.question) {
        return;
      }

      const payload = {
        question: questionForm.question,
        type: "essay",
        points: questionForm.points,
      };

      if (isEditing && onUpdateQuestion) {
        onUpdateQuestion(editingQuestionId, payload);
      } else {
        onAddQuestion(payload);
      }
    }

    // Reset form
    setQuestionForm({
      question: "",
      type: olympiadType === "test" ? "multiple-choice" : "essay",
      options: ["", "", "", ""],
      correctAnswer: "",
      correctAnswers: [],
      allowMultipleCorrect: false,
      points: 10,
    });
    setEditingQuestionId(null);
  };

  const handleEditQuestion = (question) => {
    const normalizedOptions = Array.isArray(question?.options)
      ? question.options
      : [];
    const paddedOptions = [...normalizedOptions];
    while (paddedOptions.length < 4) {
      paddedOptions.push("");
    }

    setQuestionForm({
      question: question?.question || "",
      type: question?.type === "multiple-choice" ? "multiple-choice" : "essay",
      options: paddedOptions,
      correctAnswer: getQuestionCorrectAnswers(question)[0] || "",
      correctAnswers: getQuestionCorrectAnswers(question),
      allowMultipleCorrect: Boolean(
        question?.allowMultipleCorrect || getQuestionCorrectAnswers(question).length > 1
      ),
      points: Number(question?.points) || 10,
    });
    setEditingQuestionId(question?._id || null);
  };

  const handleDeleteQuestion = (questionId) => {
    if (!onDeleteQuestion) return;
    onDeleteQuestion(questionId);
    if (editingQuestionId === questionId) {
      setEditingQuestionId(null);
      setQuestionForm({
        question: "",
        type: olympiadType === "test" ? "multiple-choice" : "essay",
        options: ["", "", "", ""],
        correctAnswer: "",
        correctAnswers: [],
        allowMultipleCorrect: false,
        points: 10,
      });
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...questionForm.options];
    newOptions[index] = value;
    setQuestionForm((prev) => {
      const nextOptions = [...newOptions];
      const validOptionSet = new Set(nextOptions.filter((opt) => String(opt).trim() !== ""));
      const nextCorrectAnswers = (Array.isArray(prev.correctAnswers) ? prev.correctAnswers : []).filter((answer) =>
        validOptionSet.has(answer)
      );
      const nextCorrectAnswer = validOptionSet.has(prev.correctAnswer) ? prev.correctAnswer : "";

      return {
        ...prev,
        options: nextOptions,
        correctAnswers: nextCorrectAnswers,
        correctAnswer: nextCorrectAnswer,
      };
    });
  };

  const handleAddOption = () => {
    setQuestionForm((prev) => ({
      ...prev,
      options: [...(Array.isArray(prev.options) ? prev.options : []), ""],
    }));
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
                    (() => {
                      const correctList = Array.isArray(q.correctAnswers) && q.correctAnswers.length > 0
                        ? q.correctAnswers
                        : q.correctAnswer
                          ? [q.correctAnswer]
                          : [];
                      const isCorrect = correctList.includes(opt);
                      return (
                    <div
                      key={optIndex}
                      className={`option ${isCorrect ? "correct" : ""}`}
                    >
                      {String.fromCharCode(65 + optIndex)}. {opt}
                    </div>
                      );
                    })()
                  ))}
                </div>
              )}
              <div className="form-actions" style={{ justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => handleEditQuestion(q)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="button-danger"
                  onClick={() => handleDeleteQuestion(q?._id)}
                >
                  Delete
                </button>
              </div>
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
              <div className="form-group" style={{ marginBottom: "10px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input
                    type="checkbox"
                    checked={Boolean(questionForm.allowMultipleCorrect)}
                    onChange={(e) =>
                      setQuestionForm((prev) => {
                        const nextAllowMultiple = e.target.checked;
                        const nextCorrectAnswers = nextAllowMultiple
                          ? Array.from(
                              new Set([
                                ...(Array.isArray(prev.correctAnswers) ? prev.correctAnswers : []),
                                ...(prev.correctAnswer ? [prev.correctAnswer] : []),
                              ].filter(Boolean))
                            )
                          : [
                              (Array.isArray(prev.correctAnswers) ? prev.correctAnswers[0] : null) ||
                                prev.correctAnswer ||
                                "",
                            ].filter(Boolean);

                        return {
                          ...prev,
                          allowMultipleCorrect: nextAllowMultiple,
                          correctAnswers: nextAllowMultiple ? nextCorrectAnswers : nextCorrectAnswers.slice(0, 1),
                          correctAnswer: nextCorrectAnswers[0] || "",
                        };
                      })
                    }
                  />
                  <span>Allow multiple correct answers</span>
                </label>
              </div>
              {questionForm.options.map((option, index) => {
                const isSelected = questionForm.allowMultipleCorrect
                  ? (Array.isArray(questionForm.correctAnswers) ? questionForm.correctAnswers : []).includes(option) && option.trim() !== ""
                  : questionForm.correctAnswer === option && option.trim() !== "";
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
                  {questionForm.allowMultipleCorrect ? (
                    <input
                      type="checkbox"
                      value={option}
                      checked={(Array.isArray(questionForm.correctAnswers) ? questionForm.correctAnswers : []).includes(option)}
                      onChange={(e) =>
                        setQuestionForm((prev) => {
                          const current = Array.isArray(prev.correctAnswers) ? prev.correctAnswers : [];
                          const nextCorrectAnswers = e.target.checked
                            ? [...new Set([...current, option])]
                            : current.filter((answer) => answer !== option);

                          return {
                            ...prev,
                            correctAnswers: nextCorrectAnswers,
                            correctAnswer: nextCorrectAnswers[0] || "",
                          };
                        })
                      }
                      disabled={!option.trim()}
                    />
                  ) : (
                    <input
                      type="radio"
                      name="correctAnswer"
                      value={option}
                      checked={questionForm.correctAnswer === option}
                      onChange={(e) =>
                        setQuestionForm({
                          ...questionForm,
                          correctAnswer: e.target.value,
                          correctAnswers: [e.target.value],
                        })
                      }
                      disabled={!option.trim()}
                    />
                  )}
                  <label className="radio-label">Correct</label>
                  {isSelected && <span className="selected-badge">Selected</span>}
                </div>
                );
              })}
              <button
                type="button"
                className="button-secondary"
                onClick={handleAddOption}
              >
                + Add Option
              </button>
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
            {editingQuestionId ? "Update Question" : "Add Question"}
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
