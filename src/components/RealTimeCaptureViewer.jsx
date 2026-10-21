import { getIntlLocale } from '../i18n/runtime';
import { t, useLocale } from "../i18n/runtime";import { useState, useEffect, useRef } from 'react';
import { schoolTeacherAPI } from '../services/api';
import './RealTimeCaptureViewer.css';

const RealTimeCaptureViewer = ({ student, onBack }) => {useLocale();
  const [cameraImage, setCameraImage] = useState(null);
  const [screenImage, setScreenImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const refreshIntervalRef = useRef(null);

  useEffect(() => {
    fetchCaptures();

    // Set up auto-refresh every 1 second
    refreshIntervalRef.current = setInterval(() => {
      fetchCaptures();
    }, 1000);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [student]);

  const fetchCaptures = async () => {
    try {
      const response = await schoolTeacherAPI.getStudentCaptures(
        student.userId || student.user?._id || student._id,
        student.olympiadId || student.olympiad?._id
      );

      const data = response.data;

      // Update images if available
      if (data.cameraImage) {
        setCameraImage(data.cameraImage);
      }
      if (data.screenImage) {
        setScreenImage(data.screenImage);
      }

      setLastUpdate(new Date());
      setError(null);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching captures:', error);
      if (loading) {
        setError('Failed to load captures');
        setLoading(false);
      }
    }
  };

  return (
    <div className="capture-viewer">
      <div className="viewer-header">
        <button className="back-button" onClick={onBack}>{t("← Back to Students ")}

        </button>
        <div className="viewer-title">
          <h2>{t("Live Monitoring: ")}{student.user?.name || student.name || t('Student')}</h2>
          <p className="viewer-subtitle">
            {student.olympiadTitle || student.olympiad?.title || t('Olympiad')}
            {lastUpdate &&
            <span className="last-update">
                {t(' ')}{t("• Last update: ")}{t(lastUpdate.toLocaleTimeString(getIntlLocale()))}
              </span>
            }
          </p>
        </div>
      </div>

      {loading && !cameraImage && !screenImage ?
      <div className="capture-loading">
          <div className="loading-spinner"></div>
          <p>{t("Loading live captures...")}</p>
        </div> :
      error ?
      <div className="capture-error">
          <p>{t(error)}</p>
        </div> :

      <div className="capture-grid">
          <div className="capture-panel card">
            <div className="capture-header">
              <h3>{t("📷 Camera Feed")}</h3>
              <span className="capture-status active">{t("Live")}</span>
            </div>
            <div className="capture-content">
              {cameraImage ?
            <img
              src={cameraImage}
              alt={t("Camera feed")}
              className="capture-image"
              onError={() => setCameraImage(null)} /> :


            <div className="capture-placeholder">
                  <div className="placeholder-icon">📷</div>
                  <p>{t("No camera feed available")}</p>
                </div>
            }
            </div>
          </div>

          <div className="capture-panel card">
            <div className="capture-header">
              <h3>{t("🖥️ Screen Feed")}</h3>
              <span className="capture-status active">{t("Live")}</span>
            </div>
            <div className="capture-content">
              {screenImage ?
            <img
              src={screenImage}
              alt={t("Screen feed")}
              className="capture-image"
              onError={() => setScreenImage(null)} /> :


            <div className="capture-placeholder">
                  <div className="placeholder-icon">🖥️</div>
                  <p>{t("No screen feed available")}</p>
                </div>
            }
            </div>
          </div>
        </div>
      }
    </div>);

};

export default RealTimeCaptureViewer;
