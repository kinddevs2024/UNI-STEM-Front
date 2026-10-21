import { t, useLocale } from "../i18n/runtime";import { useTranslation } from '../context/TranslationContext';
import { useEffect, useRef, useState } from "react";
import { GoogleLogin, useGoogleOAuth } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";

// One GIS initialization owns both the official button and One Tap on /auth.
export default function GoogleAuthButton({ onSuccess, onError, busy, disabled = false, allowOneTap }) {useLocale();
  const { targetLanguage } = useTranslation();
  const { loading, isAuthenticated, oneTapSignedOut } = useAuth();
  const { scriptLoadedSuccessfully } = useGoogleOAuth();
  const wrapper = useRef(null);
  const [width, setWidth] = useState(null);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.floor(Math.min(400, entry.contentRect.width)));
    });
    if (wrapper.current) observer.observe(wrapper.current);
    return () => observer.disconnect();
  }, []);

  return <div ref={wrapper} className={`go-auth-google ${disabled ? "is-busy" : ""}`} aria-busy={busy}>
    <div className={`go-auth-google-control ${width && scriptLoadedSuccessfully ? 'has-local-caption' : ''}`} data-caption={t("Continue with Google")} aria-disabled={disabled} inert={disabled ? "" : undefined}>
    {width && scriptLoadedSuccessfully ? <GoogleLogin
        onSuccess={onSuccess}
        onError={() => onError("Google sign-in failed. Try again or use email.")}
        useOneTap={allowOneTap && !disabled && !loading && !isAuthenticated && !oneTapSignedOut}
        use_fedcm_for_prompt={true}
        use_fedcm_for_button={false}
        ux_mode="popup"
        auto_select={false}
        cancel_on_tap_outside={false}
        context="signin"
        text="continue_with"
        theme="outline"
        shape="pill"
        size="large"
        width={width}
        key={targetLanguage} locale={targetLanguage}
        containerProps={{ style: { width: "100%", display: "flex", justifyContent: "center" } }} /> :
      <div className="go-auth-google-wait" role="status">{t("Connecting to Google…")}</div>}
    </div>
    {busy && <p className="go-auth-google-status" role="status">{t("Signing in with Google…")}</p>}
  </div>;
}
