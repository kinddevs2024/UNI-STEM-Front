let pendingSessionStreams = null;

export const setProctoringSessionStreams = ({ cameraStream, screenStream }) => {
  pendingSessionStreams = {
    cameraStream: cameraStream || null,
    screenStream: screenStream || null,
  };
};

export const consumeProctoringSessionStreams = () => {
  const current = pendingSessionStreams;
  pendingSessionStreams = null;
  return current;
};

export const clearProctoringSessionStreams = () => {
  if (pendingSessionStreams?.cameraStream) {
    pendingSessionStreams.cameraStream.getTracks().forEach((track) => track.stop());
  }
  if (pendingSessionStreams?.screenStream) {
    pendingSessionStreams.screenStream.getTracks().forEach((track) => track.stop());
  }
  pendingSessionStreams = null;
};
