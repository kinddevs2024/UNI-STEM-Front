const KEY = 'global_olympiad_cookie_consent';

export function readDeviceCookieConsent() {
  try {
    const value = JSON.parse(localStorage.getItem(KEY));
    return value?.version === 1 && typeof value.accepted === 'boolean'
      ? value.accepted : null;
  } catch { return null; }
}

export function writeDeviceCookieConsent(accepted) {
  if (typeof accepted !== 'boolean') return false;
  try {
    localStorage.setItem(KEY, JSON.stringify({version:1, accepted}));
    return readDeviceCookieConsent() === accepted;
  } catch { return false; }
}

export function hasCookieDecision(user) {
  if (readDeviceCookieConsent() !== null) return true;
  const saved = user?.cookies;
  if (![true, false, 'true', 'false'].includes(saved)) return false;
  // Remember an existing account choice on this device as well.
  writeDeviceCookieConsent(saved === true || saved === 'true');
  return true;
}

export const COOKIE_CONSENT_STORAGE_KEY = KEY;
