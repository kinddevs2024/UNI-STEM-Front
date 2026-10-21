import { t, useLocale } from "../../i18n/runtime";import { useState } from "react";
import "./CookieConsentModal.css";

const CookieConsentModal = ({ onAccept, onReject }) => {useLocale();
  const [showDetails, setShowDetails] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const save = async (consent) => {
    if (saving) return;
    setSaving(true);setError("");
    try {await (consent ? onAccept(true) : onReject ? onReject() : onAccept(false));}
    catch {setError("Could not save your choice. Please try again.");} finally
    {setSaving(false);}
  };
  const handleAcceptAll = () => save(true);
  const handleReject = () => save(false);

  return (
    <div className="cookie-consent-overlay">
      <div className="cookie-consent-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cookie-consent-header">
          <div className="cookie-icon">🍪</div>
          <h2 className="cookie-consent-title">{t("Cookie Consent")}</h2>
        </div>

        <div className="cookie-consent-body">
          <p className="cookie-consent-description">{t("We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. By clicking \"Accept All Cookies\", you consent to our use of cookies. ")}



          </p>

          {showDetails &&
          <div className="cookie-details">
              <div className="cookie-type">
                <h4>{t("Essential Cookies")}</h4>
                <p>{t("These cookies are necessary for the website to function properly. They enable core functionality such as security, network management, and accessibility. ")}



              </p>
              </div>
              <div className="cookie-type">
                <h4>{t("Analytics Cookies")}</h4>
                <p>{t("These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. ")}



              </p>
              </div>
              <div className="cookie-type">
                <h4>{t("Functional Cookies")}</h4>
                <p>{t("These cookies enable enhanced functionality and personalization, such as remembering your preferences and login status. ")}



              </p>
              </div>
            </div>
          }

          <button
            className="cookie-details-toggle"
            onClick={() => setShowDetails(!showDetails)}>

            {t(showDetails ? "Hide Details" : "Show Details")}
          </button>
        </div>

        {error && <p role="alert" style={{ padding: "0 24px", color: "#a23f49" }}>{t(error)}</p>}
        <div className="cookie-consent-footer" aria-busy={saving}>
          <button className="button-secondary" disabled={saving} onClick={handleReject}>{t("Reject All ")}

          </button>
          <button className="button-primary" disabled={saving} onClick={handleAcceptAll}>{t("Accept All Cookies ")}

          </button>
        </div>
      </div>
    </div>);

};

export default CookieConsentModal;
