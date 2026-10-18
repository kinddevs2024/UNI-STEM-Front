import { Link } from "react-router-dom";
import "./ProfileCompletionNotice.css";

const labels = { firstName:"first name", secondName:"last name", tel:"phone number", address:"address", schoolName:"school name", dateBorn:"date of birth", gender:"gender" };
export default function ProfileCompletionNotice({ olympiadId, missingFields = [] }) {
  const missing = missingFields.map(field => labels[field]).filter(Boolean);
  return <section className="profile-completion-notice" role="alert" aria-labelledby="profile-completion-title">
    <div><h2 id="profile-completion-title">Complete your profile to continue</h2>
      <p>Your profile needs a few more details before you can start this olympiad.</p>
      {missing.length > 0 && <p><strong>Missing details:</strong> {missing.join(", ")}.</p>}
      <p>Save your profile and you will return to this olympiad.</p>
    </div>
    <Link className="button-primary" to="/profile/edit" state={{ returnTo:`/olympiad/${olympiadId}/start` }}>Complete profile →</Link>
  </section>;
}
