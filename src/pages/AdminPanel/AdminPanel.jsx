import { t, useLocale } from "../../i18n/runtime";import { getEntryFee } from '../../utils/coinEntry';
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { adminAPI } from "../../services/api";
import NotificationToast from "../../components/NotificationToast";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";
import { formatDate } from "../../utils/helpers";
import {
  DEFAULT_OLYMPIAD_SUBJECT,
  DEFAULT_OLYMPIAD_SUBJECTS,
  loadCustomSubjects,
  mergeSubjects,
  normalizeSubject,
  saveCustomSubjects } from
"../../utils/olympiadSubjects";
import { parseQuestionsFromExcelFile } from "../../utils/parseQuestionsFromExcel";
import { GRADE_CATEGORIES, gradeLabel } from '../../utils/gradeCategories';
import { downloadQuestionWorkbook } from '../../utils/questionWorkbook';
import GradePrizesEditor from '../../components/GradePrizesEditor';
import "./AdminPanel.css";
import "./PanelRedesign.css";

const CUSTOM_SUBJECTS_STORAGE_KEY = "adminCustomOlympiadSubjects";

// Question Form Component for Step 3
const QuestionFormStep = ({
  olympiadId,
  olympiadType,
  questions: allQuestions,
  onAddQuestion,
  onFinish,
  onBack
}) => {useLocale();
  const [gradeCategory, setGradeCategory] = useState('5');
  const questions = allQuestions.filter((question) => question.gradeCategory === gradeCategory);
  const [questionForm, setQuestionForm] = useState({
    question: "",
    type: olympiadType === "test" ? "multiple-choice" : "essay",
    options: ["", "", "", ""],
    correctAnswer: "",
    correctAnswers: [],
    allowMultipleCorrect: false,
    points: 10
  });

  const handleAddQuestion = (e) => {
    e.preventDefault();

    if (olympiadType === "test") {
      if (!questionForm.question) {
        return;
      }
      const validOptions = (Array.isArray(questionForm.options) ? questionForm.options : []).filter(
        (opt) => opt && String(opt).trim() !== ""
      );
      if (validOptions.length < 2) {
        return;
      }

      const selectedCorrectAnswers = questionForm.allowMultipleCorrect ?
      (Array.isArray(questionForm.correctAnswers) ? questionForm.correctAnswers : []).filter((answer) =>
      validOptions.includes(answer)
      ) :
      typeof questionForm.correctAnswer === "string" && validOptions.includes(questionForm.correctAnswer) ?
      [questionForm.correctAnswer] :
      [];

      if (selectedCorrectAnswers.length === 0) {
        return;
      }

      onAddQuestion({
        gradeCategory,
        question: questionForm.question,
        type: "multiple-choice",
        options: validOptions,
        correctAnswer: selectedCorrectAnswers[0],
        correctAnswers: selectedCorrectAnswers,
        allowMultipleCorrect: Boolean(questionForm.allowMultipleCorrect),
        points: Number(questionForm.points) || 10
      });
    } else {
      // Essay question
      if (!questionForm.question) {
        return;
      }

      onAddQuestion({
        gradeCategory,
        question: questionForm.question,
        type: "essay",
        points: Number(questionForm.points) || 10
      });
    }

    // Reset form
    setQuestionForm({
      question: "",
      type: olympiadType === "test" ? "multiple-choice" : "essay",
      options: ["", "", "", ""],
      correctAnswer: "",
      correctAnswers: [],
      allowMultipleCorrect: false,
      points: 10
    });
  };

  const handleOptionChange = (index, value) => {
    setQuestionForm((prev) => {
      const nextOptions = [...(Array.isArray(prev.options) ? prev.options : [])];
      nextOptions[index] = value;
      const validOptionSet = new Set(nextOptions.filter((opt) => String(opt).trim() !== ""));
      const nextCorrectAnswers = (Array.isArray(prev.correctAnswers) ? prev.correctAnswers : []).filter((answer) =>
      validOptionSet.has(answer)
      );
      const nextCorrectAnswer = validOptionSet.has(prev.correctAnswer) ? prev.correctAnswer : "";

      return {
        ...prev,
        options: nextOptions,
        correctAnswers: nextCorrectAnswers,
        correctAnswer: nextCorrectAnswer
      };
    });
  };

  const handleAddOption = () => {
    setQuestionForm((prev) => ({
      ...prev,
      options: [...(Array.isArray(prev.options) ? prev.options : []), ""]
    }));
  };

  return (
    <div className="step-content">
      <h2>{t("Step 3: Add Questions")}</h2>
      {olympiadId && <GradePrizesEditor olympiad={{ _id: olympiadId, gradePrizes: [] }} gradeCategory={gradeCategory} />}
      <label>{t("School grade / education")}<select value={gradeCategory} onChange={(e) => setGradeCategory(e.target.value)}>{GRADE_CATEGORIES.map((grade) => <option value={grade} key={grade}>{t(gradeLabel(grade))}</option>)}</select></label>
      <p className="step-description">{t("Add questions to your ")}
        {t(olympiadType === "test" ? "test" : "essay")}{t(" ")}{t("olympiad ")}

      </p>

      {/* Questions List */}
      {questions.length > 0 &&
      <div className="questions-list">
          <h3>{t("Added Questions (")}{t((questions || []).length)})</h3>
          {(questions || []).map((q, index) =>
        <div key={q._id || index} className="question-item card">
              <div className="question-header">
                <span className="question-number">{t("Q")}{t(index + 1)}</span>
                <span className="question-points">{t(Number(q?.points) || 0)}{t(" pts")}</span>
              </div>
              <p className="question-text">{q.question || t("No question text")}</p>
              {q.type === "multiple-choice" && q.options && q.options.length > 0 &&
          <div className="question-options">
                  {(q.options || []).map((opt, optIndex) =>
            (() => {
              const correctList = Array.isArray(q.correctAnswers) && q.correctAnswers.length > 0 ?
              q.correctAnswers :
              q.correctAnswer ?
              [q.correctAnswer] :
              [];
              const isCorrect = correctList.includes(opt);
              return (
                <div
                  key={optIndex}
                  className={`option ${isCorrect ? "correct" : ""}`}>

                      {t(String.fromCharCode(65 + optIndex))}. {t(opt)}
                    </div>);

            })()
            )}
                </div>
          }
            </div>
        )}
        </div>
      }

      {/* Add Question Form */}
      <form onSubmit={handleAddQuestion} className="question-form">
        <div className="form-group">
          <label>{t("Question")}</label>
          <textarea
            value={questionForm.question}
            onChange={(e) =>
            setQuestionForm({ ...questionForm, question: e.target.value })
            }
            placeholder={t("Enter your question...")}
            rows="3"
            required />

        </div>

        {olympiadType === "test" &&
        <>
            <div className="form-group">
              <label>{t("Options")}</label>
              <div className="answer-mode-toggle-wrapper">
                <label className="answer-mode-toggle">
                  <input
                  className="answer-mode-toggle-input"
                  type="checkbox"
                  checked={Boolean(questionForm.allowMultipleCorrect)}
                  onChange={(e) =>
                  setQuestionForm((prev) => {
                    const nextAllowMultiple = e.target.checked;
                    const nextCorrectAnswers = nextAllowMultiple ?
                    Array.from(
                      new Set([
                      ...(Array.isArray(prev.correctAnswers) ? prev.correctAnswers : []),
                      ...(prev.correctAnswer ? [prev.correctAnswer] : [])].
                      filter(Boolean))
                    ) :
                    [
                    (Array.isArray(prev.correctAnswers) ? prev.correctAnswers[0] : null) ||
                    prev.correctAnswer ||
                    ""].
                    filter(Boolean);

                    return {
                      ...prev,
                      allowMultipleCorrect: nextAllowMultiple,
                      correctAnswers: nextAllowMultiple ? nextCorrectAnswers : nextCorrectAnswers.slice(0, 1),
                      correctAnswer: nextCorrectAnswers[0] || ""
                    };
                  })
                  } />

                  <span className="answer-mode-toggle-slider" aria-hidden="true" />
                  <span className="answer-mode-toggle-text">{t("Allow multiple correct answers")}</span>
                </label>
              </div>
              {(questionForm.options || []).map((option, index) => {
              const isSelected = questionForm.allowMultipleCorrect ?
              (Array.isArray(questionForm.correctAnswers) ? questionForm.correctAnswers : []).includes(option) && option.trim() !== "" :
              questionForm.correctAnswer === option && option.trim() !== "";
              return (
                <div key={index} className="option-input-row">
                  <span className="option-label">
                    {t(String.fromCharCode(65 + index))}.
                  </span>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={t(`Option ${String.fromCharCode(65 + index)}`)}
                    className="option-input" />

                  <label className="option-select-control">
                    {questionForm.allowMultipleCorrect ?
                    <input
                      className="option-select-input"
                      type="checkbox"
                      value={option}
                      checked={(Array.isArray(questionForm.correctAnswers) ? questionForm.correctAnswers : []).includes(option)}
                      onChange={(e) =>
                      setQuestionForm((prev) => {
                        const current = Array.isArray(prev.correctAnswers) ? prev.correctAnswers : [];
                        const nextCorrectAnswers = e.target.checked ?
                        [...new Set([...current, option])] :
                        current.filter((answer) => answer !== option);

                        return {
                          ...prev,
                          correctAnswers: nextCorrectAnswers,
                          correctAnswer: nextCorrectAnswers[0] || ""
                        };
                      })
                      }
                      disabled={!option.trim()} /> :


                    <input
                      className="option-select-input"
                      type="radio"
                      name="correctAnswer"
                      value={option}
                      checked={questionForm.correctAnswer === option}
                      onChange={(e) =>
                      setQuestionForm({
                        ...questionForm,
                        correctAnswer: e.target.value,
                        correctAnswers: [e.target.value]
                      })
                      }
                      disabled={!option.trim()} />

                    }
                    <span
                      className={`option-select-indicator ${questionForm.allowMultipleCorrect ? "is-checkbox" : "is-radio"} ${isSelected ? "is-selected" : ""}`}
                      aria-hidden="true">

                      {t(questionForm.allowMultipleCorrect && isSelected ? "✓" : "")}
                    </span>
                    <span className="option-select-text">{t("Correct")}</span>
                  </label>
                </div>);

            })}
              <button
              type="button"
              className="button-secondary"
              onClick={handleAddOption}>{t("+ Add Option ")}


            </button>
            </div>
          </>
        }

        <div className="form-row">
          <div className="form-group">
            <label>{t("Points")}</label>
            <input
              type="number"
              value={questionForm.points}
              onChange={(e) =>
              setQuestionForm({
                ...questionForm,
                points: Number(e.target.value) || 10
              })
              }
              min="1"
              required />

          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="button-secondary" onClick={onBack}>{t("Back ")}

          </button>
          <button type="submit" className="button-primary">{t("Add Question ")}

          </button>
          <button type="button" className="button-success" onClick={onFinish}>{t("Finish ")}

          </button>
        </div>
      </form>
    </div>);

};

const AdminPanel = () => {useLocale();
  const location = useLocation();
  const handledEditIdRef = useRef(null);
  const [olympiads, setOlympiads] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedOlympiad, setSelectedOlympiad] = useState(null);
  const [editingOlympiad, setEditingOlympiad] = useState(null);
  const [showQuestionManager, setShowQuestionManager] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Step-by-step form state
  const [currentStep, setCurrentStep] = useState(1); // 1: Type, 2: Basic Info, 3: Questions
  const [createdOlympiadId, setCreatedOlympiadId] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: DEFAULT_OLYMPIAD_SUBJECT,
    type: "", // Will be set in step 1
    startTime: "",
    endTime: "",
    entryFeeCoins: 50,
    duration: 60, // in minutes - will convert to seconds
    status: "draft", // draft, published, unpublished
    olympiadLogo: null // Logo file
  });

  const [statusFilter, setStatusFilter] = useState("all"); // all, published, unpublished, draft

  const [questions, setQuestions] = useState([]);
  const [customSubjects, setCustomSubjects] = useState(() =>
  loadCustomSubjects(CUSTOM_SUBJECTS_STORAGE_KEY)
  );
  const [showAddSubjectInput, setShowAddSubjectInput] = useState(false);
  const [newSubjectInput, setNewSubjectInput] = useState("");
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmLabel: "Confirm"
  });
  const confirmResolverRef = useRef(null);

  const availableSubjects = useMemo(
    () =>
    mergeSubjects(
      DEFAULT_OLYMPIAD_SUBJECTS,
      (Array.isArray(olympiads) ? olympiads : []).map((item) => item?.subject),
      customSubjects,
      formData?.subject ? [formData.subject] : []
    ),
    [olympiads, customSubjects, formData?.subject]
  );

  const fetchOlympiads = useCallback(async () => {
    try {
      // Use admin endpoint to get all olympiads (including drafts)
      const response = await adminAPI.getAllOlympiads();
      const olympiadsData = response.data?.data || response.data || [];
      setOlympiads(Array.isArray(olympiadsData) ? olympiadsData : []);
    } catch (error) {
      setNotification({ message: "Failed to load olympiads", type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOlympiads();
  }, [fetchOlympiads]);

  // Step 1: Select type
  const handleTypeSelect = useCallback((type) => {
    setFormData((prev) => ({ ...prev, type }));
    setCurrentStep(2);
  }, []);

  const askForConfirmation = useCallback(({ title, message, confirmLabel = "Confirm" }) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      confirmLabel
    });

    return new Promise((resolve) => {
      confirmResolverRef.current = resolve;
    });
  }, []);

  const handleConfirmApprove = useCallback(() => {
    if (typeof confirmResolverRef.current === "function") {
      confirmResolverRef.current(true);
    }
    confirmResolverRef.current = null;
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handleConfirmCancel = useCallback(() => {
    if (typeof confirmResolverRef.current === "function") {
      confirmResolverRef.current(false);
    }
    confirmResolverRef.current = null;
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handleSubjectSelect = useCallback((subject) => {
    setFormData((prev) => ({ ...prev, subject }));
  }, []);

  const handleAddSubject = useCallback(() => {
    const normalizedSubject = normalizeSubject(newSubjectInput);
    if (!normalizedSubject) {
      setNotification({
        message: "Please enter a valid subject name",
        type: "error"
      });
      return;
    }

    const nextCustomSubjects = mergeSubjects(customSubjects, [normalizedSubject]);
    setCustomSubjects(nextCustomSubjects);
    saveCustomSubjects(CUSTOM_SUBJECTS_STORAGE_KEY, nextCustomSubjects);
    setFormData((prev) => ({ ...prev, subject: normalizedSubject }));
    setNewSubjectInput("");
    setShowAddSubjectInput(false);
    setNotification({
      message: `Subject "${normalizedSubject}" added`,
      type: "success"
    });
  }, [customSubjects, newSubjectInput]);

  // Step 2: Create olympiad with basic info
  const handleCreateOlympiad = useCallback(async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.title || !formData.title.trim()) {
      setNotification({
        message: "Please provide a title for the olympiad",
        type: "error"
      });
      return;
    }

    if (!formData.type) {
      setNotification({
        message: "Please select an olympiad type",
        type: "error"
      });
      return;
    }

    if (!formData.subject) {
      setNotification({
        message: "Please select a subject",
        type: "error"
      });
      return;
    }

    setLoading(true);
    try {
      // Convert datetime-local to ISO 8601 format with timezone
      const formatDateTime = (dateTimeLocal) => {
        if (!dateTimeLocal) return "";
        return new Date(dateTimeLocal).toISOString();
      };

      // Prepare data for backend - create olympiad first without logo
      const olympiadData = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        entryFeeCoins: Number(formData.entryFeeCoins ?? 50),
        subject: formData.subject,
        startTime: formatDateTime(formData.startTime),
        endTime: formatDateTime(formData.endTime),
        duration: (Number(formData.duration) || 60) * 60, // Convert minutes to seconds
        status: formData.status
      };

      // Create olympiad first
      const response = await adminAPI.createOlympiad(olympiadData);

      // Try multiple possible response structures
      const newOlympiadId =
      response.data?._id ||
      response.data?.olympiad?._id ||
      response.data?.id ||
      response.data?.olympiad?.id;

      if (!newOlympiadId) {
        setNotification({
          message:
          "Olympiad created but ID not received. Please refresh and try again.",
          type: "error"
        });
        setLoading(false);
        return;
      }

      // Now upload logo if one was selected, using the newly created olympiad ID
      if (formData.olympiadLogo) {
        try {
          await adminAPI.uploadOlympiadLogo(
            formData.olympiadLogo,
            newOlympiadId
          );

          // Logo should now be associated with the olympiad via backend
          setNotification({
            message: "Olympiad created and logo uploaded successfully!",
            type: "success"
          });
        } catch (logoError) {
          console.error(
            "Logo upload error:",
            logoError.response?.data || logoError
          );
          // Don't fail the whole process if logo upload fails
          // Olympiad was created successfully, user can upload logo later
          setNotification({
            message:
            "Olympiad created successfully, but logo upload failed. You can update the logo later. " + (
            logoError.response?.data?.message ||
            logoError.response?.data?.error ||
            ""),
            type: "warning"
          });
        }
      } else {
        setNotification({
          message: "Olympiad created! Now add questions.",
          type: "success"
        });
      }

      setCreatedOlympiadId(newOlympiadId);
      setCurrentStep(3); // Move to questions step
    } catch (error) {
      console.error("Error creating olympiad:", error);
      setNotification({
        message: error?.response?.data?.message || error?.message || "Unable to create olympiad. Please check all fields and try again.",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  }, [formData, fetchOlympiads]);

  // Step 3: Add question
  const handleAddQuestion = useCallback(async (questionData) => {
    try {
      // Validate that olympiad was created successfully
      if (!createdOlympiadId) {
        setNotification({
          message: "Please create the olympiad first before adding questions",
          type: "error"
        });
        return;
      }

      const questionPayload = {
        olympiadId: createdOlympiadId,
        ...questionData,
        order: (Array.isArray(questions) ? questions.length : 0) + 1
      };

      const response = await adminAPI.addQuestion(questionPayload);
      setQuestions((prev) => [...prev, response.data]);
      setNotification({
        message: "Question added successfully!",
        type: "success"
      });
    } catch (error) {
      setNotification({
        message: error.response?.data?.message || "Failed to save question",
        type: "error"
      });
    }
  }, [createdOlympiadId, questions]);

  const handleUpdateQuestion = useCallback(async (questionId, questionData) => {
    try {
      const response = await adminAPI.updateQuestion(questionId, questionData);
      const updatedQuestion = response.data;
      setQuestions((prev) =>
      (Array.isArray(prev) ? prev : []).map((q) =>
      q?._id === questionId ? { ...q, ...updatedQuestion } : q
      )
      );
      setNotification({ message: "Question updated", type: "success" });
    } catch (error) {
      setNotification({
        message: error.response?.data?.message || "Failed to update question",
        type: "error"
      });
    }
  }, []);

  const handleDeleteQuestion = useCallback(async (questionId) => {
    const shouldDelete = await askForConfirmation({
      title: "Confirm Question Delete",
      message: "Delete this question?",
      confirmLabel: "Delete"
    });
    if (!shouldDelete) return;
    try {
      await adminAPI.deleteQuestion(questionId);
      setQuestions((prev) =>
      (Array.isArray(prev) ? prev : []).filter((q) => q?._id !== questionId)
      );
      setNotification({ message: "Question deleted", type: "success" });
    } catch (error) {
      setNotification({
        message: error.response?.data?.message || "Failed to delete question",
        type: "error"
      });
    }
  }, [askForConfirmation]);

  // Finish and close
  const handleFinish = useCallback(() => {
    setShowCreateForm(false);
    setCurrentStep(1);
    setCreatedOlympiadId(null);
    setQuestions([]);
    setFormData({
      title: "",
      description: "",
      subject: DEFAULT_OLYMPIAD_SUBJECT,
      type: "",
      startTime: "",
      endTime: "",
      entryFeeCoins: 50,
      duration: 60,
      status: "draft",
      olympiadLogo: null
    });
    fetchOlympiads();
    setNotification({
      message: "Olympiad created successfully with questions!",
      type: "success"
    });
  }, [fetchOlympiads]);

  // Reset form
  const handleCancel = useCallback(() => {
    setShowCreateForm(false);
    setCurrentStep(1);
    setCreatedOlympiadId(null);
    setEditingOlympiad(null);
    setQuestions([]);
    setFormData({
      title: "",
      description: "",
      subject: DEFAULT_OLYMPIAD_SUBJECT,
      type: "",
      startTime: "",
      endTime: "",
      entryFeeCoins: 50,
      duration: 60,
      status: "draft",
      olympiadLogo: null
    });
  }, []);

  // Load olympiad for editing
  const handleEdit = useCallback(async (olympiad) => {
    const normalizeOlympiadData = (payload) => {
      if (!payload) return null;
      const data = payload.data ?? payload;
      if (data?.olympiad) return data.olympiad;
      if (data?.data?.olympiad) return data.data.olympiad;
      if (data?.data) return data.data;
      return data;
    };

    try {
      // Convert ISO dates to datetime-local format
      const formatToLocalDateTime = (isoString) => {
        if (!isoString) return "";
        const date = new Date(isoString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      const buildFormData = (data) => ({
        title: data?.title || "",
        description: data?.description || "",
        subject: data?.subject || DEFAULT_OLYMPIAD_SUBJECT,
        type: data?.type || "test",
        startTime: formatToLocalDateTime(data?.startTime),
        endTime: formatToLocalDateTime(data?.endTime),
        duration: Math.floor((Number(data?.duration) || 3600) / 60),
        entryFeeCoins: getEntryFee(data),
        status: data?.status || "draft",
        olympiadLogo: null
      });

      setEditingOlympiad(olympiad._id);
      setShowCreateForm(true);
      setCurrentStep(2); // Skip type selection for editing
      setFormData(buildFormData(olympiad));

      const response = await adminAPI.getOlympiadById(olympiad._id);
      const olympiadData = normalizeOlympiadData(response?.data);

      const hasValidData =
      olympiadData && (
      olympiadData._id || olympiadData.id || olympiadData.title);

      if (hasValidData) {
        setFormData(buildFormData(olympiadData));
      }
    } catch (error) {
      setNotification({ message: "Failed to load olympiad", type: "error" });
    }
  }, []);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const editId = searchParams.get("edit");
    if (!editId) return;
    if (handledEditIdRef.current === editId) return;

    handledEditIdRef.current = editId;
    handleEdit({ _id: editId });
  }, [location.search, handleEdit]);

  // Update olympiad
  const handleUpdateOlympiad = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formatDateTime = (dateTimeLocal) => {
        if (!dateTimeLocal) return "";
        return new Date(dateTimeLocal).toISOString();
      };

      // Prepare data for backend - update olympiad first
      const olympiadData = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        entryFeeCoins: Number(formData.entryFeeCoins ?? 50),
        subject: formData.subject,
        startTime: formatDateTime(formData.startTime),
        endTime: formatDateTime(formData.endTime),
        duration: (Number(formData.duration) || 60) * 60,
        status: formData.status
      };

      // Keep existing logo URL if no new logo is selected
      if (!formData.olympiadLogo || !(formData.olympiadLogo instanceof File)) {
        const existingLogo = editingOlympiad?.olympiadLogo;
        if (existingLogo) {
          olympiadData.olympiadLogo = existingLogo;
        }
      }

      // Update olympiad first
      await adminAPI.updateOlympiad(editingOlympiad, olympiadData);

      // Then upload new logo if one was selected
      if (formData.olympiadLogo && formData.olympiadLogo instanceof File) {
        try {
          await adminAPI.uploadOlympiadLogo(
            formData.olympiadLogo,
            editingOlympiad
          );

          setNotification({
            message: "Olympiad updated and logo uploaded successfully",
            type: "success"
          });
        } catch (logoError) {
          console.error(
            "Logo upload error:",
            logoError.response?.data || logoError
          );
          // Don't fail the whole process if logo upload fails
          // Olympiad was updated successfully, user can upload logo later
          setNotification({
            message:
            "Olympiad updated successfully, but logo upload failed. You can try uploading the logo again. " + (
            logoError.response?.data?.message ||
            logoError.response?.data?.error ||
            ""),
            type: "warning"
          });
        }
      } else {
        setNotification({
          message: "Olympiad updated successfully",
          type: "success"
        });
      }
      setEditingOlympiad(null);
      setShowCreateForm(false);
      setFormData({
        title: "",
        description: "",
        subject: DEFAULT_OLYMPIAD_SUBJECT,
        type: "",
        startTime: "",
        endTime: "",
        entryFeeCoins: 50,
        duration: 60,
        status: "draft"
      });
      setCurrentStep(1);
      fetchOlympiads();
    } catch (error) {
      setNotification({
        message: error?.response?.data?.message || error?.message || "Unable to update olympiad. Please try again.",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  }, [formData, editingOlympiad, fetchOlympiads]);

  // Open question manager
  const handleManageQuestions = async (olympiad) => {
    setSelectedOlympiad(olympiad);
    setShowQuestionManager(true);
  };

  // Quick status toggle
  const handleToggleStatus = async (olympiad) => {
    try {
      const newStatus =
      olympiad.status === "published" ? "unpublished" : "published";
      await adminAPI.updateOlympiad(olympiad._id, { status: newStatus });
      setNotification({
        message: `Olympiad ${
        newStatus === "published" ? "published" : "unpublished"} successfully`,

        type: "success"
      });
      fetchOlympiads();
    } catch (error) {
      setNotification({
        message: error?.response?.data?.message || error?.message || "Unable to update status. Please try again.",
        type: "error"
      });
    }
  };

  // Filter olympiads by status
  const getFilteredOlympiads = useMemo(() => {
    if (!Array.isArray(olympiads)) return [];
    if (statusFilter === "all") return olympiads;
    return (Array.isArray(olympiads) ? olympiads : []).filter((olympiad) => {
      if (statusFilter === "published") return olympiad.status === "published";
      if (statusFilter === "unpublished")
      return olympiad.status === "unpublished";
      if (statusFilter === "draft") return olympiad.status === "draft";
      return true;
    });
  }, [olympiads, statusFilter]);

  // Get status badge
  const getStatusBadge = useCallback((status) => {
    const statusMap = {
      published: { label: "Published", class: "status-published" },
      unpublished: { label: "Unpublished", class: "status-unpublished" },
      draft: { label: "Draft", class: "status-draft" }
    };
    const statusInfo = statusMap[status] || statusMap["draft"];
    return (
      <span className={`status-badge ${statusInfo.class}`}>
        {t(statusInfo.label)}
      </span>);

  }, []);

  const handleDelete = useCallback(async (id) => {
    const shouldDelete = await askForConfirmation({
      title: "Confirm Olympiad Delete",
      message: "Are you sure you want to delete this olympiad?",
      confirmLabel: "Delete"
    });
    if (!shouldDelete) return;

    try {
      await adminAPI.deleteOlympiad(id);
      setNotification({
        message: "Olympiad deleted successfully",
        type: "success"
      });
      fetchOlympiads();
    } catch (error) {
      setNotification({
        message: "Failed to delete olympiad",
        type: "error"
      });
    }
  }, [askForConfirmation, fetchOlympiads]);

  // Duplicate olympiad
  const handleDuplicate = useCallback(async (olympiad) => {
    const shouldDuplicate = await askForConfirmation({
      title: "Confirm Olympiad Duplicate",
      message: `Are you sure you want to duplicate "${olympiad.title}"?`,
      confirmLabel: "Duplicate"
    });
    if (!shouldDuplicate) {
      return;
    }

    setLoading(true);
    try {
      // 1. Get full olympiad details
      const response = await adminAPI.getOlympiadById(olympiad._id);
      const originalOlympiad = response.data.data || response.data;

      // 2. Get questions
      const questionsResponse = await adminAPI.getQuestions(olympiad._id);
      const originalQuestions = Array.isArray(questionsResponse.data?.data) ?
      questionsResponse.data.data :
      questionsResponse.data || [];

      // 3. Create new olympiad
      const normalizedTitle = (originalOlympiad?.title || 'Olympiad').trim();
      const normalizedDescription = (originalOlympiad?.description || normalizedTitle).trim();
      const normalizedType = originalOlympiad?.type || 'test';
      const normalizedSubject = originalOlympiad?.subject || DEFAULT_OLYMPIAD_SUBJECT;
      const normalizedDuration = Number(originalOlympiad?.duration) || 3600;

      const newOlympiadData = {
        title: `${normalizedTitle} (Copy)`,
        description: normalizedDescription,
        type: normalizedType,
        subject: normalizedSubject,
        startTime: new Date().toISOString(), // Reset start time
        endTime: new Date(Date.now() + 3600000).toISOString(), // Reset end time (1 hour from now)
        duration: normalizedDuration,
        entryFeeCoins: getEntryFee(originalOlympiad),
        status: "draft" // Always draft
      };

      const createResponse = await adminAPI.createOlympiad(newOlympiadData);
      const newOlympiadId =
      createResponse.data?._id ||
      createResponse.data?.olympiad?._id ||
      createResponse.data?.id ||
      createResponse.data?.olympiad?.id;

      if (!newOlympiadId) {
        throw new Error("Failed to get new olympiad ID");
      }

      // 4. Add questions to new olympiad
      // We use a loop to add questions sequentially to preserve order
      for (const question of originalQuestions) {
        const normalizedQuestion = question?.question || question?.questionText || '';
        const normalizedType = question?.type || originalOlympiad?.type || 'essay';
        const normalizedPoints = Number(question?.points) || 10;
        const normalizedOptions = Array.isArray(question?.options) ?
        question.options.filter((opt) => opt && String(opt).trim() !== '') :
        [];
        let normalizedCorrectAnswer = question?.correctAnswer;
        const normalizedCorrectAnswers = Array.isArray(question?.correctAnswers) ?
        question.correctAnswers.filter((answer) => normalizedOptions.includes(answer)) :
        normalizedCorrectAnswer ?
        [normalizedCorrectAnswer] :
        [];
        const allowMultipleCorrect = Boolean(question?.allowMultipleCorrect || normalizedCorrectAnswers.length > 1);

        if (normalizedType === 'multiple-choice') {
          if (!normalizedOptions.length) {
            // Skip invalid MCQ instead of crashing the whole duplication
            // Backend requires options + correctAnswer
            continue;
          }
          if (!normalizedCorrectAnswer || !normalizedOptions.includes(normalizedCorrectAnswer)) {
            normalizedCorrectAnswer = normalizedOptions[0];
          }
        }

        if (!normalizedQuestion || !normalizedType || !normalizedPoints) {
          continue;
        }

        await adminAPI.addQuestion({
          olympiadId: newOlympiadId,
          question: normalizedQuestion,
          type: normalizedType,
          options: normalizedOptions,
          correctAnswer: normalizedType === 'multiple-choice' ? normalizedCorrectAnswer : undefined,
          correctAnswers: normalizedType === 'multiple-choice' ? normalizedCorrectAnswers.length ? normalizedCorrectAnswers : [normalizedCorrectAnswer] : undefined,
          allowMultipleCorrect: normalizedType === 'multiple-choice' ? allowMultipleCorrect : undefined,
          points: normalizedPoints,
          order: question?.order
        });
      }

      setNotification({
        message: "Olympiad duplicated successfully!",
        type: "success"
      });
      fetchOlympiads();
    } catch (error) {
      console.error("Duplicate error:", error);
      setNotification({
        message: "Failed to duplicate olympiad",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  }, [askForConfirmation, fetchOlympiads]);

  if (loading) {
    return (
      <div className="admin-loading brand-panel" data-brand-panel="admin">
        <div className="loading-spinner"></div>
      </div>);

  }

  return (
    <div className="admin-panel-page brand-panel" data-brand-panel="admin">
      <div className="container">
        <div className="admin-header">
          <h1 className="admin-title text-glow">{t("Admin Panel")}</h1>
          <div className="admin-header-actions">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="status-filter">

              <option value="all">{t("All Status")}</option>
              <option value="published">{t("Published")}</option>
              <option value="unpublished">{t("Unpublished")}</option>
              <option value="draft">{t("Draft")}</option>
            </select>
            <button
              className="button-primary header-create-button"
              onClick={() => setShowCreateForm(!showCreateForm)}>

              {t(showCreateForm ? "Cancel" : "+ Create Olympiad")}
            </button>
          </div>
        </div>

        {showCreateForm &&
        <div className="create-form card">
            {/* Step Indicator */}
            <div className="step-indicator">
              <div
              className={`step ${currentStep >= 1 ? "active" : ""} ${
              currentStep > 1 ? "completed" : ""}`
              }>

                <span className="step-number">1</span>
                <span className="step-label">{t("Choose Type")}</span>
              </div>
              <div
              className={`step ${currentStep >= 2 ? "active" : ""} ${
              currentStep > 2 ? "completed" : ""}`
              }>

                <span className="step-number">2</span>
                <span className="step-label">{t("Basic Info")}</span>
              </div>
              <div className={`step ${currentStep >= 3 ? "active" : ""}`}>
                <span className="step-number">3</span>
                <span className="step-label">{t("Add Questions")}</span>
              </div>
            </div>

            {/* Step 1: Choose Type */}
            {currentStep === 1 &&
          <div className="step-content">
                <h2>
                  {t(editingOlympiad ?
              "Step 1: Olympiad Type" :
              "Step 1: Choose Olympiad Type")}
                </h2>
                <p className="step-description">
                  {t(editingOlympiad ?
              `Current type: ${
              formData.type || "Not set"}. Select a different type to change it.` :

              "Select the type of olympiad you want to create")}
                </p>

                <div className="type-selection">
                  <button
                type="button"
                className={`type-card ${
                formData.type === "test" ? "selected" : ""}`
                }
                onClick={() => {
                  setFormData({ ...formData, type: "test" });
                  if (!editingOlympiad) {
                    setCurrentStep(2);
                  }
                }}>

                    <div className="type-icon">📝</div>
                    <h3>{t("Test")}</h3>
                    <p>{t("Multiple choice questions with automatic grading")}</p>
                  </button>

                  <button
                type="button"
                className={`type-card ${
                formData.type === "essay" ? "selected" : ""}`
                }
                onClick={() => {
                  setFormData({ ...formData, type: "essay" });
                  if (!editingOlympiad) {
                    setCurrentStep(2);
                  }
                }}>

                    <div className="type-icon">✍️</div>
                    <h3>{t("Essay")}</h3>
                    <p>{t("Essay questions requiring manual evaluation")}</p>
                  </button>

                  <button
                type="button"
                className={`type-card ${
                formData.type === "mixed" ? "selected" : ""}`
                }
                onClick={() => {
                  setFormData({ ...formData, type: "mixed" });
                  if (!editingOlympiad) {
                    setCurrentStep(2);
                  }
                }}>

                    <div className="type-icon">📚</div>
                    <h3>{t("Mixed")}</h3>
                    <p>{t("Both test and essay questions in one olympiad")}</p>
                  </button>
                </div>

                <div className="form-actions">
                  <button
                type="button"
                className="button-secondary"
                onClick={handleCancel}>{t("Cancel ")}


              </button>
                  {formData.type &&
              <button
                type="button"
                className="button-primary"
                onClick={() => setCurrentStep(2)}>{t("Next → ")}


              </button>
              }
                </div>
              </div>
          }

            {/* Step 2: Basic Info */}
            {currentStep === 2 &&
          <div className="step-content">
                <h2>
                  {t(editingOlympiad ?
              "Edit Olympiad" :
              "Step 2: Basic Information")}
                </h2>
                <p className="step-description">
                  {t(editingOlympiad ?
              "Update the olympiad details" :
              "Fill in the olympiad details")}
                </p>

                <form
              onSubmit={
              editingOlympiad ?
              handleUpdateOlympiad :
              handleCreateOlympiad
              }>

                  <div className="form-row">
                    <div className="form-group">
                      <label>{t("Title")}</label>
                      <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder={t("e.g., Math Olympiad 2025")}
                    required />

                    </div>
                    <div className="form-group">
                      <label>{t("Subject")}</label>
                      <div className="subject-management">
                        <select
                      value={formData.subject}
                      onChange={(e) => handleSubjectSelect(e.target.value)}
                      required>

                          {availableSubjects.map((subject) =>
                      <option key={subject} value={subject}>
                              {t(subject)}
                            </option>
                      )}
                        </select>
                        <button
                      type="button"
                      className="button-secondary subject-add-toggle"
                      onClick={() => setShowAddSubjectInput((prev) => !prev)}>

                          {t(showAddSubjectInput ? "Cancel" : "+ Add new subject")}
                        </button>

                        {showAddSubjectInput &&
                    <div className="subject-add-row">
                            <input
                        type="text"
                        value={newSubjectInput}
                        onChange={(e) => setNewSubjectInput(e.target.value)}
                        placeholder={t("e.g., Psychology")}
                        maxLength={60} />

                            <button
                        type="button"
                        className="button-primary"
                        onClick={handleAddSubject}>{t("Add ")}


                      </button>
                          </div>
                    }
                      </div>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group is-full">
                      <label>{t("Description")}</label>
                      <textarea
                    value={formData.description}
                    onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: e.target.value
                    })
                    }
                    placeholder={t("Enter olympiad description...")}
                    rows="3"
                    required />

                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group is-full">
                      <label>{t("Olympiad Logo")}</label>
                      <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                    setFormData({
                      ...formData,
                      olympiadLogo: e.target.files[0] || null
                    })
                    }
                    className="file-input" />

                      {formData.olympiadLogo &&
                  <div
                    className="file-preview panel-preview">

                          <img
                      src={URL.createObjectURL(formData.olympiadLogo)}
                      alt={t("Logo preview")}
                      className="panel-preview-image" />

                        </div>
                  }
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>{t("Duration (minutes)")}</label>
                      <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) =>
                    setFormData({
                      ...formData,
                      duration: Number(e.target.value) || 60
                    })
                    }
                    required
                    min="1"
                    placeholder={t("60")} />

                      <small className="panel-field-hint">{t("Will be converted to seconds (")}
                    {t((Number(formData.duration) || 60) * 60)}{t("s) ")}
                  </small>
                    </div>
                    <div className="form-group"><label htmlFor="entry-fee-coins">{t("Entry fee (coins)")}</label><input id="entry-fee-coins" type="number" min="0" max="1000000" step="1" required value={formData.entryFeeCoins ?? 50} onChange={(e) => setFormData({ ...formData, entryFeeCoins: e.target.value })} /><small className="panel-field-hint">{t("Default: 50 coins. Charged once when a student starts. First place earns 100 coins after final results.")}</small></div>
                    <div className="form-group">
                      <label>{t("Status")}</label>
                      <select
                    value={formData.status}
                    onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                    }
                    required>

                        <option value="draft">{t("Draft")}</option>
                        <option value="published">{t("Published (Visible)")}</option>
                        <option value="unpublished">{t("Unpublished (Unvisible) ")}

                    </option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>{t("Start Time")}</label>
                      <input
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) =>
                    setFormData({
                      ...formData,
                      startTime: e.target.value
                    })
                    }
                    required />

                    </div>
                    <div className="form-group">
                      <label>{t("End Time")}</label>
                      <input
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) =>
                    setFormData({ ...formData, endTime: e.target.value })
                    }
                    required />

                    </div>
                  </div>

                  <div className="form-actions">
                    <button
                  type="button"
                  className="button-secondary"
                  onClick={() => setCurrentStep(1)}>{t("← Back ")}


                </button>
                    <button
                  type="button"
                  className="button-secondary"
                  onClick={handleCancel}>{t("Cancel ")}


                </button>
                    {editingOlympiad ?
                <>
                        <button
                    type="button"
                    className="button-secondary"
                    onClick={async () => {
                      // Save current changes before navigating
                      const formatDateTime = (dateTimeLocal) => {
                        if (!dateTimeLocal) return "";
                        return new Date(dateTimeLocal).toISOString();
                      };

                      try {
                        const olympiadData = {
                          title: formData.title,
                          description: formData.description,
                          type: formData.type,
                          entryFeeCoins: Number(formData.entryFeeCoins ?? 50),
                          subject: formData.subject,
                          startTime: formatDateTime(formData.startTime),
                          endTime: formatDateTime(formData.endTime),
                          duration: (Number(formData.duration) || 60) * 60,
                          status: formData.status
                        };
                        await adminAPI.updateOlympiad(
                          editingOlympiad,
                          olympiadData
                        );
                        // Load questions for step 3
                        const questionsResponse =
                        await adminAPI.getQuestions(editingOlympiad);
                        setQuestions(questionsResponse.data || []);
                        setCreatedOlympiadId(editingOlympiad);
                        setCurrentStep(3);
                      } catch (error) {
                        setNotification({
                          message:
                          error.response?.data?.message ||
                          "Failed to save changes",
                          type: "error"
                        });
                      }
                    }}>{t("Next: Questions → ")}


                  </button>
                        <button type="submit" className="button-primary">{t("Update Olympiad ")}

                  </button>
                      </> :

                <>
                        <button type="submit" className="button-primary">{t("Create & Add Questions ")}

                  </button>
                      </>
                }
                  </div>
                </form>
              </div>
          }

            {/* Step 3: Add Questions */}
            {currentStep === 3 &&
          <QuestionFormStep
            olympiadId={createdOlympiadId}
            olympiadType={formData.type}
            questions={questions}
            onAddQuestion={handleAddQuestion}
            onUpdateQuestion={handleUpdateQuestion}
            onDeleteQuestion={handleDeleteQuestion}
            onFinish={handleFinish}
            onBack={() => setCurrentStep(2)} />

          }
          </div>
        }

        <div className="admin-olympiads">
          {getFilteredOlympiads.map((olympiad) => {
            // Get logo URL - handle both relative and absolute URLs
            // Check multiple possible field names for logo
            const logoField =
            olympiad.olympiadLogo ||
            olympiad.logo ||
            olympiad.photo ||
            olympiad.image;

            const getLogoUrl = (logo) => {
              if (!logo) return null;
              // If it's already a full URL (starts with http), return as is
              if (logo.startsWith("http://") || logo.startsWith("https://")) {
                return logo;
              }
              // If it starts with /api, it's already correct for proxy
              if (logo.startsWith("/api")) {
                return logo;
              }
              // Otherwise, prepend /api if in dev mode, or construct full URL
              const API_BASE_URL =
              import.meta.env.VITE_API_URL ||
              "/api";
              return logo.startsWith("/") ?
              `${API_BASE_URL}${logo}` :
              `${API_BASE_URL}/${logo}`;
            };

            const logoUrl = getLogoUrl(logoField);

            return (
              <div key={olympiad._id} className="admin-olympiad-card card">
                <div className="olympiad-card-header">
                  <div className="olympiad-logo-container">
                    {logoUrl ?
                    <img
                      src={logoUrl}
                      alt={t(`${olympiad.title} logo`)}
                      className="olympiad-logo"
                      onError={(e) => {
                        // Show placeholder if image fails to load
                        e.target.style.display = "none";
                        const container = e.target.parentElement;
                        if (
                        container &&
                        !container.querySelector(".logo-placeholder"))
                        {
                          const placeholder = document.createElement("div");
                          placeholder.className = "logo-placeholder";
                          placeholder.textContent = "📋";
                          container.appendChild(placeholder);
                        }
                      }} /> :


                    <div className="logo-placeholder">📋</div>
                    }
                  </div>
                  <div className="olympiad-info">
                    <div className="olympiad-title-row">
                      <h3>{olympiad.title}</h3>
                      {t(getStatusBadge(olympiad.status || "draft"))}
                    </div>
                    <div className="olympiad-meta">
                      <span>{t(olympiad.subject)}</span>
                      <span>•</span>
                      <span>{t(olympiad.type)}</span>
                      <span>•</span>
                      <span>{t(formatDate(olympiad.startTime))}</span>
                    </div>
                  </div>
                </div>
                <div className="olympiad-actions">
                  <button
                    className="button-secondary"
                    onClick={() => handleToggleStatus(olympiad)}
                    title={
                    olympiad.status === "published" ? t(
                      "Make Unvisible") : t(
                      "Make Visible")
                    }>

                    {olympiad.status === "published" ? t("🔒 Hide") : t("👁️ Show")}
                  </button>
                  <button
                    className="button-secondary"
                    onClick={() => handleEdit(olympiad)}>{t("Edit ")}


                  </button>
                  <button
                    className="button-secondary"
                    onClick={() => handleManageQuestions(olympiad)}>{t("Questions ")}


                  </button>
                  <button
                    className="button-secondary"
                    onClick={() => handleDuplicate(olympiad)}
                    title={t("Duplicate Olympiad")}>{t("Duplicate ")}


                  </button>
                  <button
                    className="button-danger"
                    onClick={() => handleDelete(olympiad._id)}>{t("Delete ")}


                  </button>
                </div>
              </div>);

          })}
        </div>
      </div>

      {/* Question Manager Modal */}
      {showQuestionManager && selectedOlympiad &&
      <QuestionManager
        olympiad={selectedOlympiad}
        onClose={() => {
          setShowQuestionManager(false);
          setSelectedOlympiad(null);
          fetchOlympiads();
        }} />

      }

      {notification &&
      <NotificationToast
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification(null)} />

      }

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={t(confirmDialog.title)}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        onConfirm={handleConfirmApprove}
        onCancel={handleConfirmCancel} />

    </div>);

};

// Question Manager Component
const QuestionManager = ({ olympiad, onClose }) => {useLocale();
  const [allQuestions, setQuestions] = useState([]);
  const [gradeCategory, setGradeCategory] = useState('5');
  const questions = allQuestions.filter((question) => (question.gradeCategory || '') === gradeCategory);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [notification, setNotification] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmLabel: "Confirm"
  });
  const confirmResolverRef = useRef(null);
  const excelInputRef = useRef(null);
  const [importingExcel, setImportingExcel] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [questionForm, setQuestionForm] = useState({
    question: "",
    type: olympiad.type === "test" ? "multiple-choice" : "essay",
    options: ["", "", "", ""],
    correctAnswer: "",
    correctAnswers: [],
    allowMultipleCorrect: false,
    points: 10
  });

  useEffect(() => {
    fetchQuestions();
  }, [olympiad._id]);

  const fetchQuestions = async () => {
    try {
      const response = await adminAPI.getQuestions(olympiad._id);
      setQuestions(response.data || []);
    } catch (error) {
      setNotification({ message: "Failed to load questions", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const resetQuestionForm = () => {
    setQuestionForm({
      question: "",
      type: olympiad.type === "test" ? "multiple-choice" : "essay",
      options: ["", "", "", ""],
      correctAnswer: "",
      correctAnswers: [],
      allowMultipleCorrect: false,
      points: 10
    });
  };

  const handleExcelImport = async (e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;
    const allowed = [".xlsx", ".xls", ".csv"];
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!allowed.includes(ext)) {
      setNotification({ message: "Please choose an .xlsx, .xls, or .csv file.", type: "error" });
      e.target.value = "";
      return;
    }
    setImportingExcel(true);
    try {
      const { questions: parsed, errors } = await parseQuestionsFromExcelFile(file);
      const expectedType = olympiad.type === "test" ? "multiple-choice" : "essay";
      if (olympiad.type !== "mixed" && parsed.some((question) => question.type !== expectedType)) {
        throw new Error(`This ${olympiad.type} olympiad accepts only ${expectedType} questions. Use its template or change the Type column.`);
      }
      if (parsed.length === 0) {
        setNotification({
          message: errors.length ? errors[0] : "No valid questions found in the file.",
          type: "error"
        });
        e.target.value = "";
        return;
      }
      const existingOrders = (questions || []).map((q) => q.order != null ? q.order : 0);
      const startOrder = existingOrders.length ? Math.max(0, ...existingOrders) + 1 : 0;
      for (let i = 0; i < parsed.length; i++) {
        await adminAPI.addQuestion({
          olympiadId: olympiad._id,
          ...parsed[i],
          gradeCategory: gradeCategory || null,
          order: startOrder + i
        });
      }
      await fetchQuestions();
      const warn = errors.length ? ` ${errors.length} row(s) skipped.` : "";
      setNotification({ message: `Imported ${parsed.length} question(s).${warn}`, type: "success" });
    } catch (err) {
      setNotification({
        message: err?.message || "Failed to import file. Check the format.",
        type: "error"
      });
    } finally {
      setImportingExcel(false);
      e.target.value = "";
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();

    const isEditing = Boolean(editingQuestionId);
    const selectedCorrectAnswers = questionForm.allowMultipleCorrect ?
    (Array.isArray(questionForm.correctAnswers) ? questionForm.correctAnswers : []).filter((answer) =>
    (Array.isArray(questionForm.options) ? questionForm.options : []).includes(answer)
    ) :
    (typeof questionForm.correctAnswer === "string" ? [questionForm.correctAnswer] : []).filter((answer) =>
    (Array.isArray(questionForm.options) ? questionForm.options : []).includes(answer)
    );

    try {
      if (olympiad.type === "test") {
        if (!questionForm.question) {
          setNotification({
            message: "Please fill all required fields",
            type: "error"
          });
          return;
        }
        const validOptions = (Array.isArray(questionForm.options) ? questionForm.options : []).filter(
          (opt) => opt && String(opt).trim() !== ""
        );
        if (validOptions.length < 2) {
          setNotification({
            message: "Please provide at least 2 options",
            type: "error"
          });
          return;
        }

        if (selectedCorrectAnswers.length === 0) {
          setNotification({
            message: "Please select at least one correct answer",
            type: "error"
          });
          return;
        }

        const payload = {
          gradeCategory: gradeCategory || null,
          question: questionForm.question,
          type: "multiple-choice",
          options: validOptions,
          correctAnswer: selectedCorrectAnswers[0],
          correctAnswers: selectedCorrectAnswers,
          allowMultipleCorrect: Boolean(questionForm.allowMultipleCorrect),
          points: Number(questionForm.points) || 10
        };

        if (isEditing) {
          await adminAPI.updateQuestion(editingQuestionId, payload);
        } else {
          await adminAPI.addQuestion({
            olympiadId: olympiad._id,
            ...payload,
            order: (Array.isArray(questions) ? questions.length : 0) + 1
          });
        }
      } else {
        if (!questionForm.question) {
          setNotification({
            message: "Please enter a question",
            type: "error"
          });
          return;
        }

        const payload = {
          gradeCategory: gradeCategory || null,
          question: questionForm.question,
          type: "essay",
          points: Number(questionForm.points) || 10
        };

        if (isEditing) {
          await adminAPI.updateQuestion(editingQuestionId, payload);
        } else {
          await adminAPI.addQuestion({
            olympiadId: olympiad._id,
            ...payload,
            order: (Array.isArray(questions) ? questions.length : 0) + 1
          });
        }
      }

      setNotification({
        message: isEditing ? "Question updated successfully" : "Question added successfully",
        type: "success"
      });
      resetQuestionForm();
      setEditingQuestionId(null);
      setShowAddForm(false);
      fetchQuestions();
    } catch (error) {
      setNotification({
        message: error.response?.data?.message || "Failed to add question",
        type: "error"
      });
    }
  };

  const handleEditQuestion = (question) => {
    const normalizedOptions = Array.isArray(question?.options) ?
    question.options :
    [];
    const paddedOptions = [...normalizedOptions];
    while (paddedOptions.length < 4) {
      paddedOptions.push("");
    }
    const derivedCorrectAnswers = Array.isArray(question?.correctAnswers) && question.correctAnswers.length > 0 ?
    question.correctAnswers.filter((answer) => normalizedOptions.includes(answer)) :
    question?.correctAnswer ?
    [question.correctAnswer] :
    [];

    setQuestionForm({
      question: question?.question || "",
      type: question?.type === "multiple-choice" ? "multiple-choice" : "essay",
      options: paddedOptions,
      correctAnswer: derivedCorrectAnswers[0] || "",
      correctAnswers: derivedCorrectAnswers,
      allowMultipleCorrect: Boolean(question?.allowMultipleCorrect || derivedCorrectAnswers.length > 1),
      points: Number(question?.points) || 10
    });
    setEditingQuestionId(question?._id || null);
    setShowAddForm(true);
  };

  const handleCancelEdit = () => {
    setEditingQuestionId(null);
    resetQuestionForm();
    setShowAddForm(false);
  };

  const askForConfirmation = ({ title, message, confirmLabel = "Confirm" }) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      confirmLabel
    });

    return new Promise((resolve) => {
      confirmResolverRef.current = resolve;
    });
  };

  const handleConfirmApprove = () => {
    if (typeof confirmResolverRef.current === "function") {
      confirmResolverRef.current(true);
    }
    confirmResolverRef.current = null;
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
  };

  const handleConfirmCancel = () => {
    if (typeof confirmResolverRef.current === "function") {
      confirmResolverRef.current(false);
    }
    confirmResolverRef.current = null;
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
  };

  const handleDeleteQuestion = async (questionId) => {
    const shouldDelete = await askForConfirmation({
      title: "Confirm Question Delete",
      message: "Delete this question?",
      confirmLabel: "Delete"
    });
    if (!shouldDelete) return;
    try {
      await adminAPI.deleteQuestion(questionId);
      setNotification({ message: "Question deleted", type: "success" });
      fetchQuestions();
    } catch (error) {
      setNotification({
        message: error.response?.data?.message || "Failed to delete question",
        type: "error"
      });
    }
  };

  const handleOptionChange = (index, value) => {
    setQuestionForm((prev) => {
      const nextOptions = [...(Array.isArray(prev.options) ? prev.options : [])];
      nextOptions[index] = value;
      const validOptionSet = new Set(nextOptions.filter((opt) => String(opt).trim() !== ""));
      const nextCorrectAnswers = (Array.isArray(prev.correctAnswers) ? prev.correctAnswers : []).filter((answer) =>
      validOptionSet.has(answer)
      );
      const nextCorrectAnswer = validOptionSet.has(prev.correctAnswer) ? prev.correctAnswer : "";

      return {
        ...prev,
        options: nextOptions,
        correctAnswers: nextCorrectAnswers,
        correctAnswer: nextCorrectAnswer
      };
    });
  };

  const handleAddOption = () => {
    setQuestionForm((prev) => ({
      ...prev,
      options: [...(Array.isArray(prev.options) ? prev.options : []), ""]
    }));
  };

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="loading-spinner"></div>
        </div>
      </div>);

  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content question-manager"
        onClick={(e) => e.stopPropagation()}>

        <div className="modal-header">
          <h2>{t("Manage Questions - ")}{olympiad.title}</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="questions-header">
            <h3>{t("Questions (")}{t(Array.isArray(questions) ? questions.length : 0)})</h3>
            <label>{t("School grade / education")}<select value={gradeCategory} disabled={importingExcel} onChange={(e) => {setGradeCategory(e.target.value);setEditingQuestionId(null);setShowAddForm(false);resetQuestionForm();}}><option value="">{t("Shared (existing questions)")}</option>{GRADE_CATEGORIES.map((grade) => <option key={grade} value={grade}>{t(gradeLabel(grade))}</option>)}</select></label>
            <div className="questions-header-actions">
              <button type="button" className="button-secondary" onClick={() => downloadQuestionWorkbook(questions, gradeCategory)}>{t("Export questions")}</button>
              {
              <>
                  <input
                  ref={excelInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden-file-input"
                  onChange={handleExcelImport}
                  disabled={importingExcel} />

                  <button
                  type="button"
                  className="button-secondary"
                  onClick={() => excelInputRef.current?.click()}
                  disabled={importingExcel}>

                    {t(importingExcel ? "Importing…" : "Import from Excel")}
                  </button>
                  <a
                  href="#"
                  onClick={(event) => {event.preventDefault();downloadQuestionWorkbook([], gradeCategory, true, olympiad.type);}}
                  download="questions-import-template.xlsx"
                  className="button-secondary panel-plain-link">{t("Download template ")}


                </a>
                </>
              }
              <button
                className="button-primary"
                onClick={() => {
                  if (showAddForm) {
                    handleCancelEdit();
                  } else {
                    setShowAddForm(true);
                  }
                }}>

                {t(showAddForm ? "Cancel" : "+ Add Question")}
              </button>
            </div>
          </div>

          {showAddForm &&
          <form onSubmit={handleAddQuestion} className="question-form card">
              <div className="form-group">
                <label>{t("Question")}</label>
                <textarea
                value={questionForm.question}
                onChange={(e) =>
                setQuestionForm({
                  ...questionForm,
                  question: e.target.value
                })
                }
                placeholder={t("Enter your question...")}
                rows="3"
                required />

              </div>

              {olympiad.type === "test" &&
            <div className="form-group">
                  <label>{t("Options")}</label>
                  <div className="answer-mode-toggle-wrapper">
                    <label className="answer-mode-toggle">
                      <input
                    className="answer-mode-toggle-input"
                    type="checkbox"
                    checked={Boolean(questionForm.allowMultipleCorrect)}
                    onChange={(e) =>
                    setQuestionForm((prev) => {
                      const nextAllowMultiple = e.target.checked;
                      const nextCorrectAnswers = nextAllowMultiple ?
                      Array.from(
                        new Set([
                        ...(Array.isArray(prev.correctAnswers) ? prev.correctAnswers : []),
                        ...(prev.correctAnswer ? [prev.correctAnswer] : [])].
                        filter(Boolean))
                      ) :
                      [
                      (Array.isArray(prev.correctAnswers) ? prev.correctAnswers[0] : null) ||
                      prev.correctAnswer ||
                      ""].
                      filter(Boolean);

                      return {
                        ...prev,
                        allowMultipleCorrect: nextAllowMultiple,
                        correctAnswers: nextAllowMultiple ? nextCorrectAnswers : nextCorrectAnswers.slice(0, 1),
                        correctAnswer: nextCorrectAnswers[0] || ""
                      };
                    })
                    } />

                      <span className="answer-mode-toggle-slider" aria-hidden="true" />
                      <span className="answer-mode-toggle-text">{t("Allow multiple correct answers")}</span>
                    </label>
                  </div>
                  {(questionForm.options || []).map((option, index) => {
                const isSelected = questionForm.allowMultipleCorrect ?
                (Array.isArray(questionForm.correctAnswers) ? questionForm.correctAnswers : []).includes(option) && option.trim() !== "" :
                questionForm.correctAnswer === option && option.trim() !== "";
                return (
                  <div key={index} className={`option-input-row ${isSelected ? "is-selected" : ""}`}>
                      <span className="option-label">
                        {t(String.fromCharCode(65 + index))}.
                      </span>
                      <input
                      type="text"
                      value={option}
                      onChange={(e) =>
                      handleOptionChange(index, e.target.value)
                      }
                      placeholder={t(`Option ${String.fromCharCode(
                        65 + index
                      )}`)}
                      className="option-input" />

                      <label className="option-select-control">
                        {questionForm.allowMultipleCorrect ?
                      <input
                        className="option-select-input"
                        type="checkbox"
                        value={option}
                        checked={(Array.isArray(questionForm.correctAnswers) ? questionForm.correctAnswers : []).includes(option)}
                        onChange={(e) =>
                        setQuestionForm((prev) => {
                          const current = Array.isArray(prev.correctAnswers) ? prev.correctAnswers : [];
                          const nextCorrectAnswers = e.target.checked ?
                          [...new Set([...current, option])] :
                          current.filter((answer) => answer !== option);

                          return {
                            ...prev,
                            correctAnswers: nextCorrectAnswers,
                            correctAnswer: nextCorrectAnswers[0] || ""
                          };
                        })
                        }
                        disabled={!option.trim()} /> :


                      <input
                        className="option-select-input"
                        type="radio"
                        name="correctAnswer"
                        value={option}
                        checked={questionForm.correctAnswer === option}
                        onChange={(e) =>
                        setQuestionForm({
                          ...questionForm,
                          correctAnswer: e.target.value,
                          correctAnswers: [e.target.value]
                        })
                        }
                        disabled={!option.trim()} />

                      }
                        <span
                        className={`option-select-indicator ${questionForm.allowMultipleCorrect ? "is-checkbox" : "is-radio"} ${isSelected ? "is-selected" : ""}`}
                        aria-hidden="true">

                          {t(questionForm.allowMultipleCorrect && isSelected ? "✓" : "")}
                        </span>
                        <span className="option-select-text">{t("Correct")}</span>
                      </label>
                    </div>);

              })}
                  <button
                type="button"
                className="button-secondary"
                onClick={handleAddOption}>{t("+ Add Option ")}


              </button>
                </div>
            }

              <div className="form-row">
                <div className="form-group">
                  <label>{t("Points")}</label>
                  <input
                  type="number"
                  value={questionForm.points}
                  onChange={(e) =>
                  setQuestionForm({
                    ...questionForm,
                    points: Number(e.target.value) || 10
                  })
                  }
                  min="1"
                  required />

                </div>
              </div>

              <button type="submit" className="button-primary">
                {t(editingQuestionId ? "Update Question" : "Add Question")}
              </button>
            </form>
          }

          <div className="questions-list">
            <GradePrizesEditor olympiad={olympiad} gradeCategory={gradeCategory} />
            {!Array.isArray(questions) || questions.length === 0 ?
            <div className="empty-state">
                <p>{t("No questions yet. Add your first question!")}</p>
              </div> :

            (Array.isArray(questions) ? questions : []).map((q, index) =>
            <div key={q?._id || index} className="question-item card">
                  <div className="question-header">
                    <span className="question-number">{t("Q")}{t(index + 1)}</span>
                    <span className="question-points">{t(Number(q?.points) || 0)}{t(" pts")}</span>
                  </div>
                  <p className="question-text">{q?.question || t("No question text")}</p>
                  {q?.type === "multiple-choice" && Array.isArray(q?.options) && q.options.length > 0 &&
              <div className="question-options">
                      {q.options.map((opt, optIndex) =>
                (() => {
                  const correctList = Array.isArray(q.correctAnswers) && q.correctAnswers.length > 0 ?
                  q.correctAnswers :
                  q.correctAnswer ?
                  [q.correctAnswer] :
                  [];
                  const isCorrect = correctList.includes(opt);
                  return (
                    <div
                      key={optIndex}
                      className={`option ${isCorrect ? "correct" : ""}`}>

                          {t(String.fromCharCode(65 + optIndex))}. {t(opt)}
                        </div>);

                })()
                )}
                    </div>
              }
                  <div className="form-actions align-end">
                    <button
                  type="button"
                  className="button-secondary"
                  onClick={() => handleEditQuestion(q)}>{t("Edit ")}


                </button>
                    <button
                  type="button"
                  className="button-danger"
                  onClick={() => handleDeleteQuestion(q?._id)}>{t("Delete ")}


                </button>
                  </div>
                </div>
            )
            }
          </div>
        </div>

        {notification &&
        <NotificationToast
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)} />

        }

        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={t(confirmDialog.title)}
          message={confirmDialog.message}
          confirmLabel={confirmDialog.confirmLabel}
          onConfirm={handleConfirmApprove}
          onCancel={handleConfirmCancel} />

      </div>
    </div>);

};

export default AdminPanel;
