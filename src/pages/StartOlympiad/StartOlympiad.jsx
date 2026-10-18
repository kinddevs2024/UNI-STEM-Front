import { getEntryFee } from '../../utils/coinEntry';
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { olympiadAPI, authAPI } from "../../services/api";
import { GRADE_CATEGORIES, gradeLabel } from '../../utils/gradeCategories';
import {
  formatDate,
  isOlympiadActive,
  isOlympiadUpcoming,
  isOlympiadEnded,
  getTimeRemaining,
  getImageUrl,
} from "../../utils/helpers";
import { useAuth } from "../../context/AuthContext";
import { USER_ROLES } from "../../utils/constants";
import NotificationToast from "../../components/NotificationToast";
import { generateDeviceFingerprint } from "../../utils/device-fingerprint";
import { requestCameraStream, requestScreenStream, getMediaAccessErrorMessage, usesMobileCameraMode } from "../../utils/mediaAccess";
import { setPendingProctoringStreams, clearPendingProctoringStreams } from "../../utils/proctoringSession";
import "./StartOlympiad.css";

const StartOlympiad = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, setUser, balance, refreshBalance } = useAuth();
  const [savingGrade, setSavingGrade] = useState(false);
  const changeGrade = async gradeCategory => {
    if (!gradeCategory || savingGrade) return;
    setSavingGrade(true);
    try {
      const response = await authAPI.updateProfile({ gradeCategory });
      setUser(response.data.user);
      const details = await olympiadAPI.getById(id);
      setOlympiad(details.data);
    } catch (error) { setNotification({ type: 'error', message: error?.response?.data?.message || 'Could not save your class.' }); }
    finally { setSavingGrade(false); }
  };
  const [olympiad, setOlympiad] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [consentGiven, setConsentGiven] = useState(false);
  const [timeUntilStart, setTimeUntilStart] = useState(0);
  const [alreadySubmittedThisMonth, setAlreadySubmittedThisMonth] = useState(false);
  const [nextAvailableDate, setNextAvailableDate] = useState(null);
  const [proctoringStatus, setProctoringStatus] = useState(null);
  const [deviceFingerprint, setDeviceFingerprint] = useState(null);

  const mobileCameraOnly = usesMobileCameraMode();

  const getDisplaySurfaceFromStream = (stream) => {
    const track = stream?.getVideoTracks?.()[0];
    if (!track || typeof track.getSettings !== "function") {
      return null;
    }
    const settings = track.getSettings();
    return settings.displaySurface || settings.logicalSurface || null;
  };

  const requestEntireScreenStream = async () => {
    while (true) {
      try {
        const stream = await requestScreenStream({ video: true, audio: false });
        const displaySurface = getDisplaySurfaceFromStream(stream);

        if (displaySurface === "monitor") {
          return { stream, displaySurface };
        }

        stream.getTracks().forEach((track) => track.stop());
        setNotification({
          message:
            'Please select "Entire Screen" in the share dialog. Window/tab sharing is not allowed.',
          type: "error",
        });
      } catch (error) {
        const friendlyMessage = getMediaAccessErrorMessage(error, { needsScreen: true });
        const isFatalUnsupported =
          friendlyMessage.includes("secure context") ||
          friendlyMessage.includes("not supported") ||
          friendlyMessage.includes("unsupported");

        if (isFatalUnsupported) {
          throw error;
        }

        setNotification({
          message:
            'Screen sharing is required. Please choose "Entire Screen" to continue.',
          type: "error",
        });
      }

      await new Promise((resolve) => setTimeout(resolve, 150));
    }
  };

  useEffect(() => {
    fetchOlympiad();

    // Load or generate device fingerprint (persisted per olympiad)
    const storedFingerprint = localStorage.getItem(`olympiad_${id}_deviceFingerprint`);
    if (storedFingerprint) {
      try {
        setDeviceFingerprint(JSON.parse(storedFingerprint));
      } catch (err) {
        console.error('Error parsing stored device fingerprint:', err);
        localStorage.removeItem(`olympiad_${id}_deviceFingerprint`);
      }
    }

    if (!storedFingerprint) {
      generateDeviceFingerprint()
        .then(fp => {
          setDeviceFingerprint(fp);
          localStorage.setItem(`olympiad_${id}_deviceFingerprint`, JSON.stringify(fp));
        })
        .catch(err => {
          console.error('Error generating device fingerprint:', err);
        });
    }
  }, [id, user]);

  useEffect(() => {
    if (olympiad && isOlympiadUpcoming(olympiad.startTime)) {
      const interval = setInterval(() => {
        const remaining = getTimeRemaining(olympiad.startTime);
        setTimeUntilStart(remaining);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [olympiad]);

  const fetchOlympiad = async () => {
    try {
      const response = await olympiadAPI.getById(id);
      const olympiadData = response.data;
      setOlympiad(olympiadData);

      // Check if user has already submitted this month
      if (user) {
        try {
          const resultsResponse = await olympiadAPI.getResults(id, user._id);
          if (resultsResponse.data.success && resultsResponse.data.results) {
            const userResults = (resultsResponse.data.results || []).filter(
              (r) => r.userId === user._id
            );
            if (userResults.length > 0) {
              const latestResult = userResults[0];
              const completedDate = new Date(latestResult.completedAt);
              const now = new Date();
              const isSameMonth = 
                completedDate.getMonth() === now.getMonth() &&
                completedDate.getFullYear() === now.getFullYear();
              
              if (isSameMonth) {
                setAlreadySubmittedThisMonth(true);
                const nextMonth = new Date(completedDate);
                nextMonth.setMonth(nextMonth.getMonth() + 1);
                nextMonth.setDate(1);
                setNextAvailableDate(nextMonth);
              }
            }
          }
        } catch (error) {
          console.error('Error checking monthly submission:', error);
          // Don't block if check fails
        }
      }

      // Check if already started
      const alreadyStarted = localStorage.getItem(`olympiad_${id}_started`);
      if (alreadyStarted) {
        // Allow direct navigation if already started
        // User can continue from where they left
      }
    } catch (error) {
      setNotification({
        message: error?.response?.data?.message || error?.message || "Unable to load olympiad. Please refresh the page.",
        type: "error",
      });
      setTimeout(() => navigate("/dashboard"), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async (e) => {
    // Prevent any default behavior
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!olympiad) {
      console.error("❌ Olympiad data is missing");
      setNotification({
        message: "Olympiad data not loaded. Please refresh the page.",
        type: "error",
      });
      return;
    }

    if (!consentGiven) {
      console.warn("⚠️ Consent not given");
      setNotification({
        message: "Please read and accept the terms to continue",
        type: "error",
      });
      return;
    }

    let cameraStream = null;
    if (savingGrade || (olympiad.requiresGrade && !olympiad.gradeCategory)) {
      setNotification({ type: 'error', message: 'Choose your school grade or Student before starting.' });
      return;
    }
    let screenStream = null;
    let sharedDisplaySurface = null;
    try {
      clearPendingProctoringStreams();
      if (typeof MediaRecorder === 'undefined') throw new Error('Video recording is not supported. Please update your browser before starting.');

      cameraStream = await requestCameraStream({ video: { facingMode:'user' }, audio: false });
      if (!mobileCameraOnly) {
        const screenResult = await requestEntireScreenStream();
        screenStream = screenResult.stream;
        sharedDisplaySurface = screenResult.displaySurface;
      }

      setPendingProctoringStreams({ cameraStream, screenStream, mode:mobileCameraOnly?'mobile_camera':'desktop' });
    } catch (permissionError) {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
      }

      setNotification({
        message: getMediaAccessErrorMessage(permissionError, { needsScreen: true }),
        type: "error",
      });
      return;
    }

    // Request Full Screen
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) { /* Safari */
        await elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) { /* IE11 */
        await elem.msRequestFullscreen();
      }
    } catch (err) {
      console.warn("Full screen request failed:", err);
    }

    setStarting(true);

    try {
      // Check olympiad status
      const isUpcomingCheck = isOlympiadUpcoming(olympiad.startTime);
      const isActiveCheck = isOlympiadActive(
        olympiad.startTime,
        olympiad.endTime
      );
      const isEndedCheck = isOlympiadEnded(olympiad.endTime);


      // Validate olympiad is active
      if (!isActiveCheck) {
        if (isUpcomingCheck) {
          setNotification({
            message:
              "Olympiad has not started yet. Please wait for the start time.",
            type: "error",
          });
          setStarting(false);
          return;
        }
        if (isEndedCheck) {
          setNotification({
            message: "Olympiad has ended. You cannot start it anymore.",
            type: "error",
          });
          setStarting(false);
          return;
        }
      }

      // Validate olympiad has questions
      if (!Array.isArray(olympiad?.questions) || olympiad.questions.length === 0) {
        setNotification({
          message:
            "This olympiad has no questions yet. Please contact the administrator.",
          type: "error",
        });
        setStarting(false);
        return;
      }

      // Validate olympiad is published
      if (olympiad.status && olympiad.status !== "published") {
        setNotification({
          message: "This olympiad is not available for participation.",
          type: "error",
        });
        setStarting(false);
        return;
      }


      // Check proctoring status before starting
      // Note: In a full implementation, proctoring should be set up before this point
      // For now, we'll require basic proctoring status (this would be enhanced with actual camera/screen checks)
      const proctoringReady = {
        frontCameraActive: Boolean(cameraStream?.getVideoTracks().some(track=>track.readyState==='live')),
        backCameraActive: false,
        screenShareActive: Boolean(screenStream?.getVideoTracks().some(track=>track.readyState==='live')),
        displaySurface: sharedDisplaySurface || getDisplaySurfaceFromStream(screenStream),
        mode: mobileCameraOnly ? 'mobile_camera' : 'desktop',
      };

      // Generate device fingerprint if not already done
      let fingerprint = deviceFingerprint;
      if (!fingerprint) {
        fingerprint = await generateDeviceFingerprint();
        setDeviceFingerprint(fingerprint);
        localStorage.setItem(`olympiad_${id}_deviceFingerprint`, JSON.stringify(fingerprint));
      }

      // Start attempt via API (creates attempt record with server-authoritative timer)
      const startResponse = await olympiadAPI.startAttempt(id, {
        expectedEntryFeeCoins: getEntryFee(olympiad),
        proctoringStatus: proctoringReady,
        deviceFingerprint: fingerprint
      });

      if (!startResponse.data.success) {
        throw new Error(startResponse.data.message || 'Failed to start attempt');
      }

      await refreshBalance?.();
      const attempt = startResponse.data.attempt;
      localStorage.setItem(`olympiad_${id}_proctoringMode`, attempt.proctoringMode || proctoringReady.mode);

      // Store attempt information in localStorage for compatibility
      localStorage.setItem(`olympiad_${id}_started`, "true");
      localStorage.setItem(`olympiad_${id}_startTime`, attempt.startedAt);
      localStorage.setItem(`olympiad_${id}_consent`, "true");
      localStorage.setItem(`olympiad_${id}_attemptId`, attempt._id);
      localStorage.setItem(`olympiad_${id}_sessionToken`, attempt.sessionToken);

      // Show success message
      setNotification({
        message: "Starting olympiad...",
        type: "success",
      });

      // Small delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Navigate to the olympiad
      const targetPath =
        olympiad.type === "essay" ? `/olympiad/${id}/essay` : `/olympiad/${id}`;

      navigate(targetPath);
    } catch (error) {
      console.error("❌ Error starting olympiad:", error);
      clearPendingProctoringStreams();
      if (typeof MediaRecorder === 'undefined') throw new Error('Video recording is not supported. Please update your browser before starting.');
      const errorMessage = error?.response?.data?.message || error?.message;
      if (error?.response?.data?.code === 'ENTRY_FEE_CHANGED') {
        setOlympiad(prev=>({...prev,entryFeeCoins:error.response.data.entryFeeCoins}));
        setNotification({message:error.response.data.message,type:'warning',duration:null});
        setStarting(false);
        if (document.fullscreenElement && document.exitFullscreen) { try { await document.exitFullscreen(); } catch {} }
        return;
      }
      if (error?.response?.data?.code === 'INSUFFICIENT_COINS') {
        setNotification({message:error.response.data.message,type:'warning',duration:null,action:{label:'Top up coins →',to:'/buy-coins'}});
        await refreshBalance?.();
        setStarting(false);
        if (document.fullscreenElement && document.exitFullscreen) { try { await document.exitFullscreen(); } catch {} }
        return;
      }
      if (error?.response?.data?.code === 'OLYMPIAD_ALREADY_SUBMITTED') {
        setNotification({ message: error.response.data.message, type: 'warning', duration: null, action: { label: 'View saved result →', to: `/olympiad/${id}/results` } });
        setStarting(false);
        if (document.fullscreenElement && document.exitFullscreen) { try { await document.exitFullscreen(); } catch {} }
        return;
      }
      if (error?.response?.data?.code === "PROFILE_INCOMPLETE") {
        setNotification({ message:"Complete your profile before starting this olympiad. Save your details to return here.", type:"error", duration:null, action:{ label:"Complete profile →", to:"/profile/edit", state:{ returnTo:`/olympiad/${id}/start` } } });
        setStarting(false);
        if (document.fullscreenElement && document.exitFullscreen) {
          try { await document.exitFullscreen(); } catch { /* The profile link remains available. */ }
        }
        return;
      }
      setNotification({
        message: errorMessage 
          ? `Unable to start olympiad: ${errorMessage}` 
          : "Connection failed. Please try again.",
        type: "error",
      });
      setStarting(false);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className="start-olympiad-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!olympiad) {
    return (
      <div className="start-olympiad-page">
        <div className="container">
          <div className="error-state card">
            <h2>Olympiad not found</h2>
            <Link to="/dashboard" className="button-primary">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isUpcoming = isOlympiadUpcoming(olympiad.startTime);
  const isActive = isOlympiadActive(olympiad.startTime, olympiad.endTime);
  const isEnded = isOlympiadEnded(olympiad.endTime);
  const olympiadLogoField =
    olympiad?.olympiadLogo || olympiad?.logo || olympiad?.logoUrl || olympiad?.image || "";
  const olympiadLogoUrl = olympiadLogoField ? getImageUrl(olympiadLogoField) : "";

  return (
    <div className="start-olympiad-page">
      <div className="container">
        <div className="start-olympiad-content">
          {/* Header */}
          <div className="start-header card">
            <h1 className="start-title">{olympiad.title}</h1>
            <p className="start-subtitle">{olympiad.description}</p>
            {user?.role === 'student' && <div className="form-group"><label htmlFor="olympiad-grade">School grade / education</label><select id="olympiad-grade" value={olympiad.gradeCategory || user.gradeCategory || ''} disabled={savingGrade || olympiad.hasAttempt} onChange={e => changeGrade(e.target.value)}><option value="">Choose your class</option>{GRADE_CATEGORIES.map(grade => <option key={grade} value={grade}>{gradeLabel(grade)}</option>)}</select>{olympiad.hasAttempt && <small>Your class is fixed for this attempt.</small>}</div>}
            {(olympiad.gradePrizes || []).some(prize => prize.gradeCategory === (olympiad.gradeCategory || user?.gradeCategory)) && <section className="grade-prizes"><h2>Prizes · {gradeLabel(olympiad.gradeCategory || user?.gradeCategory)}</h2><div className="olympiad-info-grid">{olympiad.gradePrizes.filter(prize => prize.gradeCategory === (olympiad.gradeCategory || user?.gradeCategory)).sort((a,b) => a.place - b.place).map(prize => <article className="card" key={prize.place} style={{ padding: 16 }}>{prize.photo && <img src={getImageUrl(prize.photo)} alt={prize.name} style={{ width: '100%', maxHeight: 160, objectFit: 'contain' }} />}<strong>Place {prize.place}</strong><p>{prize.name}</p></article>)}</div></section>}

            {olympiadLogoUrl && (
              <div className="olympiad-hero-image-wrap">
                <img
                  src={olympiadLogoUrl}
                  alt={`${olympiad.title} banner`}
                  className="olympiad-hero-image"
                />
              </div>
            )}

          {user?.role==='student'&&<div className="coin-entry-notice"><p><strong>Entry: {getEntryFee(olympiad)} coins</strong> · Your balance: {balance ?? 0} coins</p><p>Charged once when you start. Resuming is free. First place earns 100 coins after the olympiad closes and results are checked.</p><Link to="/buy-coins">Need more coins? Top up →</Link></div>}
            <div className="olympiad-info-grid">
              <div className="info-item">
                <span className="info-label">Subject</span>
                <span className="info-value">{olympiad.subject}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Type</span>
                <span className="info-value">
                  {olympiad.type === "test" ? "Test" : "Essay"}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Duration</span>
                <span className="info-value">
                  {olympiad?.duration ? Math.floor((Number(olympiad.duration) || 0) / 60) : 0} minutes
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Questions</span>
                <span className="info-value">
                  {Array.isArray(olympiad?.questions) ? olympiad.questions.length : 0}
                </span>
              </div>
            </div>

            <div className="time-info">
              <div className="time-item">
                <span className="time-label">Start Time:</span>
                <span className="time-value">
                  {formatDate(olympiad.startTime)}
                </span>
              </div>
              <div className="time-item">
                <span className="time-label">End Time:</span>
                <span className="time-value">
                  {formatDate(olympiad.endTime)}
                </span>
              </div>
            </div>
          </div>

          {/* Status Messages */}
          {isUpcoming && (
            <div className="status-message card status-warning">
              <div className="status-icon">⏰</div>
              <div className="status-content">
                <h3>Olympiad Not Started Yet</h3>
                <p>
                  This olympiad will start in:{" "}
                  <strong>{formatTime(timeUntilStart)}</strong>
                </p>
                <p className="status-note">
                  Please wait until the start time to begin.
                </p>
              </div>
            </div>
          )}

          {isEnded && (
            <div className="status-message card status-error">
              <div className="status-icon">🔒</div>
              <div className="status-content">
                <h3>Olympiad Has Ended</h3>
                <p>This olympiad is no longer available for participation.</p>
                <Link to={`/olympiad/${id}/results`} className="button-primary">
                  View Results
                </Link>
              </div>
            </div>
          )}

          {alreadySubmittedThisMonth && (
            <div className="status-message card status-error">
              <div className="status-icon">📅</div>
              <div className="status-content">
                <h3>Already Taken This Month</h3>
                <p>
                  You have already taken this olympiad this month. You can take it again next month.
                </p>
                {nextAvailableDate && (
                  <p className="status-note">
                    Next available date: <strong>{formatDate(nextAvailableDate.toISOString())}</strong>
                  </p>
                )}
                <Link to={`/olympiad/${id}/results`} className="button-primary">
                  View Your Results
                </Link>
              </div>
            </div>
          )}

          {/* Instructions */}
          {isActive && (
            <>
              <div className="instructions-section card">
                <h2 className="section-title">Instructions</h2>
                <div className="instructions-list">
                  <div className="instruction-item">
                    <span className="instruction-icon">📝</span>
                    <div className="instruction-content">
                      <h4>Read Carefully</h4>
                      <p>
                        Read each question carefully before answering. Make sure
                        you understand what is being asked.
                      </p>
                    </div>
                  </div>

                  <div className="instruction-item">
                    <span className="instruction-icon">⏱️</span>
                    <div className="instruction-content">
                      <h4>Time Management</h4>
                      <p>
                        You have {olympiad?.duration ? Math.floor((Number(olympiad.duration) || 0) / 60) : 0} minutes to
                        complete this olympiad. The timer will start when you
                        click "Start Olympiad".
                      </p>
                    </div>
                  </div>

                  <div className="instruction-item">
                    <span className="instruction-icon">✅</span>
                    <div className="instruction-content">
                      <h4>Submission</h4>
                      <p>
                        Once you submit your answers, you cannot change them.
                        Make sure to review all answers before submitting.
                      </p>
                    </div>
                  </div>

                  {olympiad.type === "test" && (
                    <div className="instruction-item">
                      <span className="instruction-icon">🔢</span>
                      <div className="instruction-content">
                        <h4>Navigation</h4>
                        <p>
                          You can navigate between questions using the
                          Previous/Next buttons. You can change your answers at
                          any time before submission.
                        </p>
                      </div>
                    </div>
                  )}

                  {olympiad.type === "essay" && (
                    <div className="instruction-item">
                      <span className="instruction-icon">✍️</span>
                      <div className="instruction-content">
                        <h4>Essay Writing</h4>
                        <p>
                          Write your essay in the provided text editor. You can
                          see the word and character count as you type.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Proctoring Notice */}
              <div className="proctoring-notice card">
                <h2 className="section-title">Proctoring & Monitoring</h2>
                <div className="proctoring-content">
                  <p className="proctoring-warning">
                    ⚠️ This olympiad uses proctoring technology to ensure
                    academic integrity.
                  </p>
                  <ul className="proctoring-list">
                    <li>✓ Your camera will be monitored during the exam</li>
                    <li>{mobileCameraOnly ? '✓ Mobile mode: camera monitoring only; screen sharing is unavailable in this browser' : '✓ Your screen activity will be recorded'}</li>
                    <li>✓ Periodic screenshots will be taken automatically</li>
                    <li>✓ All monitoring data is securely stored</li>
                  </ul>
                  <p className="proctoring-note">
                    By starting this olympiad, you consent to being monitored.
                    Make sure you have a working camera and are in a quiet,
                    well-lit environment.
                  </p>
                </div>
              </div>

              {/* Rules */}
              <div className="rules-section card">
                <h2 className="section-title">Rules & Guidelines</h2>
                <ul className="rules-list">
                  <li>Do not use any external resources, books, or notes</li>
                  <li>Do not communicate with others during the exam</li>
                  <li>Do not leave the exam page or open other tabs</li>
                  <li>Ensure a stable internet connection</li>
                  <li>Stay in front of your camera throughout the exam</li>
                  <li>Do not use mobile phones or other devices</li>
                </ul>
              </div>

              {/* Consent Checkbox */}
              <div className="consent-section card">
                <label className="consent-checkbox">
                  <input
                    type="checkbox"
                    checked={consentGiven}
                    onChange={(e) => setConsentGiven(e.target.checked)}
                  />
                  <span className="consent-text">
                    I have read and understood all instructions, rules, and
                    proctoring requirements. I agree to be monitored during this
                    olympiad and will follow all guidelines.
                  </span>
                </label>
                {!consentGiven && (
                  <p className="consent-hint">
                    ⚠️ Please check the box above to enable the Start button
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="action-buttons">
                <Link to="/dashboard" className="button-secondary">
                  ← Back to Dashboard
                </Link>
                <button
                  type="button"
                  className="button-primary start-button"
                  onClick={handleStart}
                  disabled={!consentGiven || starting || !isActive || alreadySubmittedThisMonth}
                  aria-disabled={!consentGiven || starting || !isActive || alreadySubmittedThisMonth}
                >
                  {starting
                    ? "Starting..."
                    : !consentGiven
                    ? "Accept Terms to Start →"
                    : user?.role === "student" ? `Start Olympiad · ${getEntryFee(olympiad)} coins →` : "Start Olympiad →"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {notification && (
        <NotificationToast
          message={notification.message}
          type={notification.type}
          action={notification.action}
          duration={notification.duration}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default StartOlympiad;
