let pendingStreams = null;

export const setPendingProctoringStreams = ({ cameraStream, screenStream, mode }) => {
  pendingStreams = {
    cameraStream: cameraStream || null,
    screenStream: screenStream || null,
    mode: mode || 'desktop',
  };
};

export const consumePendingProctoringStreams = () => {
  const current = pendingStreams;
  pendingStreams = null;
  return current;
};

export const clearPendingProctoringStreams = () => {
  if (pendingStreams?.cameraStream) {
    pendingStreams.cameraStream.getTracks().forEach((track) => track.stop());
  }
  if (pendingStreams?.screenStream) {
    pendingStreams.screenStream.getTracks().forEach((track) => track.stop());
  }
  pendingStreams = null;
};
