import { t, useLocale } from "../i18n/runtime";import { Link } from "react-router-dom";
import "./ProfileCompletionNotice.css";

const labels = { firstName: "first name", secondName: "last name", tel: "phone number", address: "address", schoolName: "school name", dateBorn: "date of birth", gender: "gender" };
export default function ProfileCompletionNotice({ olympiadId, missingFields = [] }) {useLocale();
  const missing = missingFields.map((field) => labels[field]).filter(Boolean);
  return <section className="profile-completion-notice" role="alert" aria-labelledby="profile-completion-title">
    <div><h2 id="profile-completion-title">{t("Complete your profile to continue")}</h2>
      <p>{t("Your profile needs a few more details before you can start this olympiad.")}</p>
      {missing.length > 0 && <p><strong>{t("Missing details:")}</strong> {t(missing.join(", "))}.</p>}
      <p>{t("Save your profile and you will return to this olympiad.")}</p>
    </div>
    <Link className="button-primary" to="/profile/edit" state={{ returnTo: `/olympiad/${olympiadId}/start` }}>{t("Complete profile →")}</Link>
  </section>;
}
