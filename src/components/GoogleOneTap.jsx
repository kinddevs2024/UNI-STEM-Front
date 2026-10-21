import { t, useLocale } from "../i18n/runtime";import { useRef, useState } from 'react';
import { useGoogleOneTapLogin } from '@react-oauth/google';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './GoogleOneTap.css';
import { getAuthDestination } from '../utils/authDestination';

export default function GoogleOneTap() {useLocale();
  const { loading, isAuthenticated, oneTapSignedOut, loginWithGoogle } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const inFlight = useRef(false);
  const [failed, setFailed] = useState(false);
  const [error, setError] = useState('');
  // The /auth page owns its button and One Tap in a single GIS initialization.
  const eligible = pathname === '/';

  useGoogleOneTapLogin({
    disabled: loading || isAuthenticated || oneTapSignedOut || !eligible || failed,
    use_fedcm_for_prompt: true,
    auto_select: false,
    cancel_on_tap_outside: true,
    onSuccess: async ({ credential }) => {
      if (inFlight.current || isAuthenticated || oneTapSignedOut || !eligible) return;
      inFlight.current = true;
      try {
        const result = await loginWithGoogle(credential, 'id_token');
        if (!result.success) {
          setFailed(true);
          setError(result.error || 'Google sign-in failed. Try again from the sign-in page.');
          return;
        }
        navigate(getAuthDestination(result.user), { replace: true });
      } catch {
        setFailed(true);
        setError('Could not complete Google sign-in. Please try again.');
      } finally {
        inFlight.current = false;
      }
    },
    // Google/browser dismissal or unavailability leaves ordinary sign-in available.
    onError: () => {}
  });

  if (!error || !eligible || isAuthenticated) return null;
  return (
    <div className="one-tap-error" role="alert">
      <span>{t(error)}</span>
      <Link to="/auth" onClick={() => setError('')}>{t("Sign in")}</Link>
      <button type="button" aria-label={t("Dismiss sign-in message")} onClick={() => setError('')}>×</button>
    </div>);

}
