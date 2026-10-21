import { t, useLocale } from "../../i18n/runtime";import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { olympiadAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import Timer from '../../components/Timer';
import QuestionCard from '../../components/QuestionCard';
import ProctoringMonitor from '../../components/ProctoringMonitor';
import NotificationToast from '../../components/NotificationToast';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { useServerTimer } from '../../hooks/useServerTimer';
import { useAttemptSession } from '../../hooks/useAttemptSession';
import { useAntiCheat } from '../../hooks/useAntiCheat';
import { useDurableAnswers } from '../../hooks/useDurableAnswers';
import { getTimeRemaining, getTimeRemainingFromDuration } from '../../utils/helpers';
import { generateDeviceFingerprint } from '../../utils/device-fingerprint';
import './TestOlympiad.css';

const TestOlympiad = () => {useLocale();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { emit } = useSocket();

  const [olympiad, setOlympiad] = useState(null);
  const [questions, setQuestions] = useState([]);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [nextSubmitting, setNextSubmitting] = useState(false);
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
  const [attemptId, setAttemptId] = useState(null);
  const [deviceFingerprint, setDeviceFingerprint] = useState(null);
  const attemptIndexSyncedRef = useRef(false);

  // Load attempt session
  const { attempt, loading: attemptLoading, error: attemptError, isActive, isExpired, isCompleted } = useAttemptSession(id);

  const { answers, setAnswers, clearAnswers } = useDurableAnswers(id, user?._id, attempt?._id);

  // Set attempt ID when loaded
  useEffect(() => {
    if (attempt?._id) {
      setAttemptId(attempt._id);
      if (!attemptIndexSyncedRef.current && typeof attempt.currentQuestionIndex === 'number') {
        setCurrentQuestionIndex(attempt.currentQuestionIndex);
        attemptIndexSyncedRef.current = true;
      }
    }
  }, [attempt]);

  // Server-authoritative timer
  const { remainingSeconds, expired, formatted: timerFormatted, synced } = useServerTimer(
    id,
    attemptId,
    attempt?.endsAt
  );

  // Anti-cheat monitoring
  // Only enable if attempt is active and not submitted
  const shouldEnableAntiCheat = Boolean(isActive && !submitted && attemptId);
  useAntiCheat(id, attemptId, shouldEnableAntiCheat);

  // Update timeRemaining from server timer
  useEffect(() => {
    setTimeRemaining(remainingSeconds);
    if (expired && !submitted) {
      handleTimeExpire();
    }
  }, [remainingSeconds, expired, submitted]);

  useEffect(() => {
    fetchOlympiad();

    // Get attempt ID from localStorage if available
    const storedAttemptId = localStorage.getItem(`olympiad_${id}_attemptId`);
    if (storedAttemptId) {
      setAttemptId(storedAttemptId);
    }

    // Join WebSocket room for attempt (emit sends to server; on registers listener)
    if (emit && (attemptId || storedAttemptId)) {
      emit('join-olympiad', { olympiadId: id, attemptId: attemptId || storedAttemptId });
    }
  }, [id, emit, attemptId]);

  useEffect(() => {
    // Load or generate device fingerprint (persisted per olympiad)
    const storedFingerprint = localStorage.getItem(`olympiad_${id}_deviceFingerprint`);
    if (storedFingerprint) {
      try {
        setDeviceFingerprint(JSON.parse(storedFingerprint));
        return;
      } catch (err) {
        console.error('Error parsing stored device fingerprint:', err);
        localStorage.removeItem(`olympiad_${id}_deviceFingerprint`);
      }
    }

    generateDeviceFingerprint().
    then((fp) => {
      setDeviceFingerprint(fp);
      localStorage.setItem(`olympiad_${id}_deviceFingerprint`, JSON.stringify(fp));
    }).
    catch((err) => {
      console.error('Error generating device fingerprint:', err);
    });
  }, [id]);

  // Load current question from server if missing or missing nonce
  useEffect(() => {
    const loadCurrentQuestion = async () => {
      if (!attempt || attemptLoading) return;
      if (!attemptId || questions.length === 0) return;

      const authoritativeIndex =
      typeof attempt.currentQuestionIndex === 'number' ?
      attempt.currentQuestionIndex :
      currentQuestionIndex;

      if (authoritativeIndex > currentQuestionIndex) {
        setCurrentQuestionIndex(authoritativeIndex);
      }

      const currentQuestion = questions[authoritativeIndex];
      if (!currentQuestion || !currentQuestion.nonce) {
        try {
          const response = await olympiadAPI.getQuestion(id, authoritativeIndex);
          if (response.data.success && response.data.question) {
            const fetchedQuestion = response.data.question;
            setQuestions((prev) => {
              const next = [...prev];
              const targetIndex = response.data.questionIndex ?? authoritativeIndex;
              next[targetIndex] = {
                ...(next[targetIndex] || {}),
                ...fetchedQuestion
              };
              return next;
            });
          }
        } catch (error) {
          const serverIndex = error.response?.data?.currentQuestionIndex;
          const code = error.response?.data?.code;
          if (code === 'INVALID_QUESTION_ACCESS' && typeof serverIndex === 'number') {
            setCurrentQuestionIndex(serverIndex);
          } else {
            console.error('Error loading current question:', error);
          }
        }
      }
    };
    loadCurrentQuestion();
  }, [id, attemptId, attempt, attemptLoading, currentQuestionIndex, questions]);

  const fetchOlympiad = async () => {
    try {
      const response = await olympiadAPI.getById(id);
      const olympiadData = response.data;
      setOlympiad(olympiadData);
      setQuestions(olympiadData.questions || []);

      // Check if user has gone through start page (optional check)
      const started = localStorage.getItem(`olympiad_${id}_started`);
      if (!started && olympiadData.status === 'published') {









        // Optional: redirect to start page if not started
        // Uncomment if you want to force users to go through start page
        // navigate(`/olympiad/${id}/start`);
      } // Calculate remaining time based on duration from start time
      const startTime = localStorage.getItem(`olympiad_${id}_startTime`);const duration = olympiadData.duration || 3600; // Default to 60 minutes (3600 seconds)
      if (startTime && duration) {// Use duration-based timer (countdown from when user started)
        const remaining = getTimeRemainingFromDuration(duration, startTime);setTimeRemaining(remaining);} else {// Fallback to endTime-based timer if no start time recorded
        const remaining = getTimeRemaining(olympiadData.endTime);setTimeRemaining(remaining);
      }
    } catch (error) {
      setNotification({ message: 'Failed to load olympiad', type: 'error' });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    // Update local state
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer
    }));


  };

  const hasAnswerValue = (value) => {
    if (Array.isArray(value)) {
      return value.filter((item) => typeof item === 'string' && item.trim() !== '').length > 0;
    }
    if (typeof value === 'string') {
      return value.trim() !== '';
    }
    return value !== undefined && value !== null;
  };

  const currentQuestion = questions[currentQuestionIndex];

  // Submit current answer and move to next question
  const handleNext = async () => {
    if (!attemptId || !currentQuestion || nextSubmitting) return;
    let nextIndexOverride = null;
    setNextSubmitting(true);

    try {
      // Submit current answer if provided
      const currentAnswer = answers[currentQuestion._id];
      if (hasAnswerValue(currentAnswer)) {
        try {
          let nonce = null;
          try {
            const nonceResponse = await olympiadAPI.getQuestion(id, currentQuestionIndex);
            if (nonceResponse.data.success && nonceResponse.data.question?.nonce) {
              nonce = nonceResponse.data.question.nonce;
              const fetchedQuestion = nonceResponse.data.question;
              setQuestions((prev) => {
                const next = [...prev];
                next[currentQuestionIndex] = {
                  ...(next[currentQuestionIndex] || {}),
                  ...fetchedQuestion
                };
                return next;
              });
            }
          } catch (nonceError) {
            // If nonce refresh fails, fall back to existing nonce if any
            nonce = currentQuestion?.nonce || null;
          }

          if (!nonce) {
            setNotification({
              message: 'Failed to load question nonce. Please retry.',
              type: 'error'
            });
            return;
          }
          const submitResponse = await olympiadAPI.submitAnswer(id, {
            questionIndex: currentQuestionIndex,
            answer: currentAnswer,
            nonce,
            deviceFingerprint
          });

          const nextIndexFromServer = submitResponse.data?.nextQuestionIndex;
          const isLastQuestion = submitResponse.data?.isLastQuestion;
          if (typeof nextIndexFromServer === 'number') {
            nextIndexOverride = nextIndexFromServer;
            setCurrentQuestionIndex(nextIndexFromServer);
          }

          if (isLastQuestion) {
            return;
          }
        } catch (error) {
          const responseData = error.response?.data;
          const serverIndex = responseData?.currentQuestionIndex;
          const code = responseData?.code;

          if (
          (code === 'INVALID_QUESTION_INDEX' || code === 'INVALID_QUESTION_ACCESS') &&
          typeof serverIndex === 'number')
          {
            setCurrentQuestionIndex(serverIndex);
            try {
              await olympiadAPI.getQuestion(id, serverIndex);
            } catch (syncError) {
              console.error('Error syncing question after index mismatch:', syncError);
            }
          }

          setNotification({
            message: responseData?.message || 'Failed to submit answer',
            type: 'error'
          });
          return; // Don't advance if submission failed
        }
      }

      // Move to next question if not last
      const nextIndex = typeof nextIndexOverride === 'number' ?
      nextIndexOverride :
      currentQuestionIndex + 1;

      if (nextIndex < questions.length) {
        try {
          const resolvedIndex = typeof nextIndexOverride === 'number' ?
          nextIndexOverride :
          nextIndex;
          setCurrentQuestionIndex(resolvedIndex);
          const response = await olympiadAPI.getQuestion(id, nextIndex);

          if (response.data.success) {
            // Update current question index from server response
            if (typeof nextIndexOverride !== 'number' && typeof response.data.currentQuestionIndex === 'number') {
              setCurrentQuestionIndex(response.data.currentQuestionIndex);
            }

            // Add question to questions array if not already there
            if (response.data.question && !questions.find((q) => q._id === response.data.question._id)) {
              setQuestions((prev) => [...prev, response.data.question]);
            }
          }
        } catch (error) {
          const responseData = error.response?.data;
          const serverIndex = responseData?.currentQuestionIndex;
          const code = responseData?.code;

          if (code === 'INVALID_QUESTION_ACCESS' && typeof serverIndex === 'number') {
            setCurrentQuestionIndex(serverIndex);
          }

          setNotification({
            message: responseData?.message || 'Failed to load next question',
            type: 'error'
          });
        }
      }
    } finally {
      setNextSubmitting(false);
    }
  };

  // Forward-only navigation - no previous button allowed
  // Removed handlePrevious function

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
    if (!confirm) {
      setNotification({ message: 'Time expired. Submitting...', type: 'warning' });
    }

    try {
      setSubmitting(true);
      await olympiadAPI.submit(id, { answers });
      setSubmitted(true);
      // Clear saved answers and draft after successful submission
      clearAnswers();
      if (draftSaveTimeoutRef.current) {
        clearTimeout(draftSaveTimeoutRef.current);
      }
      setNotification({ message: 'Answers submitted successfully!', type: 'success' });
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
    } finally {
      setSubmitting(false);
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
          <p>{t("Your answers have been submitted.")}</p>
          <button className="button-primary" onClick={() => navigate(`/olympiad/${id}/results`)}>{t("View Results ")}

          </button>
        </div>
      </div>);

  }

  const answeredCount = Object.values(answers).filter((value) => hasAnswerValue(value)).length;
  const faceAllowed = faceCheckReady && faceDetected;
  const canProceed = isRecording && faceAllowed;

  // Show message if no questions available
  if (questions.length === 0) {
    return (
      <div className="test-olympiad-page">
        <div className="olympiad-container">
          <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
            <h2>{t("No Questions Available")}</h2>
            <p>{t("This olympiad doesn't have any questions yet.")}</p>
            <button className="button-primary" onClick={() => navigate('/dashboard')}>{t("Back to Dashboard ")}

            </button>
          </div>
        </div>
      </div>);

  }

  // Check attempt status
  if (attemptLoading) {
    return (
      <div className="olympiad-loading">
        <div className="loading-spinner"></div>
      </div>);

  }

  if (attemptError || !attempt) {
    return (
      <div className="test-olympiad-page">
        <div className="olympiad-container">
          <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
            <h2>{t("No Active Attempt")}</h2>
            <p>{t(attemptError || 'Please start the olympiad first.')}</p>
            <button className="button-primary" onClick={() => navigate(`/olympiad/${id}/start`)}>{t("Go to Start Page ")}

            </button>
          </div>
        </div>
      </div>);

  }

  if (isExpired || isCompleted) {
    return (
      <div className="test-olympiad-page">
        <div className="olympiad-container">
          <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
            <h2>{t(isExpired ? 'Time Expired' : 'Attempt Completed')}</h2>
            <p>{t("This attempt has ")}{t(isExpired ? 'expired' : 'been completed')}.</p>
            <button className="button-primary" onClick={() => navigate(`/olympiad/${id}/results`)}>{t("View Results ")}

            </button>
          </div>
        </div>
      </div>);

  }

  return (
    <div className="test-olympiad-page">
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
            className="olympiad-timer"
            formatted={timerFormatted} />

        </div>

        <div className="olympiad-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(currentQuestionIndex + 1) / questions.length * 100}%` }} />

          </div>
          <div className="progress-text">{t("Question ")}
            {t(currentQuestionIndex + 1)}{t(" of ")}{t(questions.length)}
            ({t(answeredCount)}{t(" answered) ")}
            {savingDraft && <span className="exam-saving-status">{t("💾 Saving...")}</span>}
          </div>
        </div>

        <div className="questions-navigation">
          {questions.map((_, index) =>
          <button
            key={index}
            className={`nav-button ${index === currentQuestionIndex ? 'active' : ''} ${hasAnswerValue(answers[questions[index]._id]) ? 'answered' : ''}`}
            onClick={() => setCurrentQuestionIndex(index)}
            disabled={!canProceed || submitted}>

              {t(index + 1)}
            </button>
          )}
        </div>

        {/* Question Card - This is where the question appears */}
        {currentQuestion ?
        <QuestionCard
          question={currentQuestion}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={questions.length}
          selectedAnswer={answers[currentQuestion._id]}
          onAnswerChange={handleAnswerChange}
          disabled={!canProceed || submitted} /> :


        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
            <p>{t("Question not found. Please try selecting a different question.")}</p>
          </div>
        }

        <div className="olympiad-actions">
          {/* Forward-only navigation - no previous button */}
          {currentQuestionIndex < questions.length - 1 ?
          <button
            className="button-primary"
            onClick={handleNext}
            disabled={!canProceed || submitted || nextSubmitting}>{t("Next → ")}


          </button> :

          <button
            className="button-primary"
            onClick={handleSubmit}
            disabled={!canProceed || submitted || submitting}>{t("Submit Answers ")}


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

export default TestOlympiad;
