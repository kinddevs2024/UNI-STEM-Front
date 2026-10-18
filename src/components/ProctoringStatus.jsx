const ProctoringStatus = ({ isRecording, cameraActive, screenActive, cameraError, screenError, mobileCameraOnly = false }) => {
  const hasError = Boolean(cameraError || screenError);
  const active = !hasError && isRecording && cameraActive && (mobileCameraOnly || screenActive);
  const state = hasError ? 'attention' : active ? 'active' : 'connecting';
  const label = hasError ? 'Check connection' : active ? 'Monitoring active' : 'Connecting';
  const description = hasError
    ? 'Check camera and screen sharing permissions. See the message above.'
    : active ? (mobileCameraOnly ? 'Camera monitoring is active. Mobile camera-only mode.' : 'Camera and screen monitoring are active.') : 'Connecting camera and screen monitoring.';
  return <div className="monitor-status-card" role="status" aria-live="polite">
    <span className="monitor-status-label">Status</span>
    <div className={`monitor-status-badge ${state}`} title={description}>
      <span className="monitor-status-dot" aria-hidden="true" />
      <span className="monitor-status-text">{label}</span>
    </div>
  </div>;
};
export default ProctoringStatus;