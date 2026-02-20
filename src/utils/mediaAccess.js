const isMobileDevice = () => {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
};

const getLegacyGetUserMedia = () => {
  if (typeof navigator === 'undefined') return null;
  return (
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia ||
    null
  );
};

export const requestCameraStream = async (constraints = { video: true, audio: false }) => {
  if (typeof navigator === 'undefined') {
    throw new Error('Browser environment is not available.');
  }

  if (navigator.mediaDevices?.getUserMedia) {
    return navigator.mediaDevices.getUserMedia(constraints);
  }

  const legacyGetUserMedia = getLegacyGetUserMedia();
  if (legacyGetUserMedia) {
    return new Promise((resolve, reject) => {
      legacyGetUserMedia.call(navigator, constraints, resolve, reject);
    });
  }

  throw new Error('Camera API is not supported in this browser.');
};

export const requestScreenStream = async (constraints = { video: true, audio: false }) => {
  if (typeof navigator === 'undefined') {
    throw new Error('Browser environment is not available.');
  }

  if (navigator.mediaDevices?.getDisplayMedia) {
    return navigator.mediaDevices.getDisplayMedia(constraints);
  }

  if (typeof navigator.getDisplayMedia === 'function') {
    return navigator.getDisplayMedia(constraints);
  }

  throw new Error('Screen sharing API is not supported in this browser.');
};

export const getMediaAccessErrorMessage = (error, { needsScreen = true } = {}) => {
  const name = error?.name || '';
  const message = String(error?.message || '').toLowerCase();

  if (typeof window !== 'undefined' && !window.isSecureContext) {
    return 'Camera/screen sharing requires a secure context. Open the site via HTTPS (or localhost).';
  }

  if (isMobileDevice() && needsScreen) {
    return 'Screen sharing is limited on many mobile browsers. Use desktop Chrome/Edge/Firefox/Safari, or Android Chrome/Edge with screen-share support.';
  }

  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return 'Permission denied. Please allow camera and screen sharing in browser settings and try again.';
  }

  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return 'No camera/screen source found. Check device connection and try again.';
  }

  if (name === 'NotReadableError') {
    return 'Camera or screen is currently used by another app. Close other apps and try again.';
  }

  if (name === 'InvalidStateError' || message.includes('gesture') || message.includes('activation')) {
    return 'Browser blocked screen-share request. Click Start again and confirm the sharing prompt.';
  }

  return error?.message || 'Unable to access camera/screen sharing. Please try again.';
};
