import { t, useLocale } from "../../i18n/runtime";import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { olympiadAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import Timer from '../../components/Timer';
import ProctoringMonitor from '../../components/ProctoringMonitor';
import NotificationToast from '../../components/NotificationToast';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { getTimeRemaining, getTimeRemainingFromDuration } from '../../utils/helpers';
import '../TestOlympiad/TestOlympiad.css';
import './EssayOlympiad.css';
import { useDurableAnswers } from '../../hooks/useDurableAnswers';

const EssayOlympiad = () => {useLocale();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { on } = useSocket();

  const [olympiad, setOlympiad] = useState(null);
  const [questions, setQuestions] = useState([]);
  const { answers, setAnswers, clearAnswers } = useDurableAnswers(id, user?._id, localStorage.getItem(`olympiad_${id}_attemptId`), 'essay_answers');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceCheckReady, setFaceCheckReady] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm'
  });
  const draftSaveTimeoutRef = useRef(null);
  const confirmResolverRef = useRef(null);

  useEffect(() => {
    fetchOlympiad();

    if (on) {
      on('timer-update', (data) => {
        if (data.olympiadId === id) {
          setTimeRemaining(data.timeRemaining);
        }
      });
    }
  }, [id, on]);

  // Update timer every second based on duration
  useEffect(() => {
    if (!olympiad || !id || submitted) return;

    const startTime = localStorage.getItem(`olympiad_${id}_startTime`);
    const duration = olympiad.duration || 3600; // Duration in seconds (e.g., 3600 = 60 minutes)

    if (!startTime || !duration) {
      // If no start time, try to initialize it now
      if (olympiad.duration) {
        const now = new Date().toISOString();
        localStorage.setItem(`olympiad_${id}_startTime`, now);
        setTimeRemaining(duration);
      }
      return;
    }

    const interval = setInterval(() => {
      const remaining = getTimeRemainingFromDuration(duration, startTime);
      setTimeRemaining(remaining);

      // Auto-submit when time expires
      if (remaining <= 0 && !submitted) {
        handleTimeExpire();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [olympiad, id, submitted]);

  const fetchOlympiad = async () => {
    try {
      const response = await olympiadAPI.getById(id);
      const olympiadData = response.data;
      setOlympiad(olympiadData);
      setQuestions(olympiadData.questions || []);

      // Calculate remaining time based on duration from start time
      const startTime = localStorage.getItem(`olympiad_${id}_startTime`);
      const duration = olympiadData.duration || 3600; // Default to 60 minutes (3600 seconds)

      if (startTime && duration) {
        // Use duration-based timer (countdown from when user started)
        const remaining = getTimeRemainingFromDuration(duration, startTime);
        setTimeRemaining(remaining);
      } else {
        // Fallback to endTime-based timer if no start time recorded
        const remaining = getTimeRemaining(olympiadData.endTime);
        setTimeRemaining(remaining);
      }
    } catch (error) {
      setNotification({ message: 'Failed to load olympiad', type: 'error' });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value
    }));
  };

  const getWordCount = (text) => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  };

  const askForConfirmation = ({ title, message, confirmLabel = 'Confirm' }) => {
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
    if (typeof confirmResolverRef.current === 'function') {
      confirmResolverRef.current(true);
    }
    confirmResolverRef.current = null;
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
  };

  const handleConfirmCancel = () => {
    if (typeof confirmResolverRef.current === 'function') {
      confirmResolverRef.current(false);
    }
    confirmResolverRef.current = null;
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
  };

  const handleSubmit = async ({ confirm = true } = {}) => {
    if (confirm) {
      const shouldSubmit = await askForConfirmation({
        title: 'Confirm Submission',
        message: 'Are you sure you want to submit? You cannot change answers after submission.',
        confirmLabel: 'Submit'
      });
      if (!shouldSubmit) return;
    }

    try {
      await olympiadAPI.submit(id, { answers });
      setSubmitted(true);
      // Clear saved answers and draft after successful submission
      clearAnswers();
      if (draftSaveTimeoutRef.current) {
        clearTimeout(draftSaveTimeoutRef.current);
      }
      setNotification({ message: 'Essay submitted successfully!', type: 'success' });
      setTimeout(() => {
        navigate(`/olympiad/${id}/results`);
      }, 2000);
    } catch (error) {
      const response = error.response?.data;
      const existingSubmission = response?.code === 'OLYMPIAD_ALREADY_SUBMITTED';
      setNotification({
        message: response?.message || 'Submission failed. Your answers are still saved on this device. Please try again.',
        type: 'error',
        duration: existingSubmission ? null : 6000,
        action: existingSubmission ? { label: 'View saved result →', to: `/olympiad/${id}/results` } : undefined
      });
    }
  };

  const handleTimeExpire = () => {
    handleSubmit({ confirm: false });
  };

  if (loading) {
    return (
      <div className="olympiad-loading">
        <div className="loading-spinner"></div>
      </div>);

  }

  if (submitted) {
    return (
      <div className="olympiad-submitted">
        <div className="submitted-card card">
          <h2>{t("✓ Submitted Successfully")}</h2>
          <p>{t("Your essay has been submitted.")}</p>
          <button className="button-primary" onClick={() => navigate(`/olympiad/${id}/results`)}>{t("View Results ")}

          </button>
        </div>
      </div>);

  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestion._id] || '';
  const wordCount = getWordCount(currentAnswer);
  const faceAllowed = faceCheckReady && faceDetected;
  const canProceed = isRecording && faceAllowed;

  return (
    <div className="essay-olympiad-page">
      <ProctoringMonitor
        olympiadId={id}
        userId={user?._id}
        olympiadTitle={olympiad?.title}
        onRecordingStatusChange={setIsRecording}
        onFaceStatusChange={({ detected, ready }) => {
          setFaceDetected(detected);
          setFaceCheckReady(ready);
        }} />


      <div className="olympiad-container">
        {/* Blocking overlay when not recording */}
        {!isRecording &&
        <div className="recording-block-overlay">
            <div className="blocking-message card">
              <h2>{t("⏸️ Recording Not Active")}</h2>
              <p>{t("Please wait for monitoring to start.")}</p>
              <p className="blocking-hint">{t("You cannot answer questions until recording is active. ")}

            </p>
            </div>
          </div>
        }
        {isRecording && !faceAllowed &&
        <div className="recording-block-overlay">
            <div className="blocking-message card">
              <h2>{t("⚠️ Face Not Detected")}</h2>
              <p>{t("Please keep your face visible in the camera.")}</p>
              <p className="blocking-hint">{t("The olympiad will resume once your face is detected. ")}

            </p>
            </div>
          </div>
        }
        <div className="olympiad-header">
          <h1 className="olympiad-title">{olympiad?.title}</h1>
          <Timer
            initialSeconds={timeRemaining}
            onExpire={handleTimeExpire}
            className="olympiad-timer" />

        </div>

        <div className="olympiad-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(currentQuestionIndex + 1) / questions.length * 100}%` }} />

          </div>
          <div className="progress-text">{t("Question ")}
            {t(currentQuestionIndex + 1)}{t(" of ")}{t(questions.length)}
            {savingDraft && <span className="exam-saving-status">{t("💾 Saving...")}</span>}
          </div>
        </div>

        <div className="questions-navigation">
          {questions.map((_, index) =>
          <button
            key={index}
            className={`nav-button ${index === currentQuestionIndex ? 'active' : ''} ${answers[questions[index]._id] ? 'answered' : ''}`}
            onClick={() => setCurrentQuestionIndex(index)}
            disabled={!canProceed || submitted}>

              {t(index + 1)}
            </button>
          )}
        </div>

        {currentQuestion &&
        <div className="essay-question-card card">
            <div className="question-header">
              <span className="question-number">{t("Question ")}
              {t(currentQuestionIndex + 1)}{t(" of ")}{t(questions.length)}
              </span>
              <span className="question-points">{currentQuestion.points}{t(" points")}</span>
            </div>

            <div className="question-text">
              {currentQuestion.question || currentQuestion.questionText}
            </div>

            <div className="essay-editor">
              <textarea
              className="essay-textarea"
              value={currentAnswer}
              onChange={(e) => handleAnswerChange(currentQuestion._id, e.target.value)}
              placeholder={t("Write your essay here...")}
              disabled={!canProceed || submitted}
              rows={20} />

              <div className="essay-stats">
                <span className="word-count">{t("Words: ")}{t(wordCount)}</span>
                <span className="char-count">{t("Characters: ")}{t(currentAnswer.length)}</span>
              </div>
            </div>
          </div>
        }

        <div className="olympiad-actions">
          <button
            className="button-secondary"
            onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
            disabled={!canProceed || currentQuestionIndex === 0 || submitted}>{t("← Previous ")}


          </button>

          {currentQuestionIndex < questions.length - 1 ?
          <button
            className="button-primary"
            onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
            disabled={!canProceed || submitted}>{t("Next → ")}


          </button> :

          <button
            className="button-primary"
            onClick={handleSubmit}
            disabled={!canProceed || submitted}>{t("Submit Essay ")}


          </button>
          }
        </div>
      </div>

      {notification &&
      <NotificationToast
        message={notification.message}
        type={notification.type}
        action={notification.action}
        duration={notification.duration}
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

export default EssayOlympiad;
