import { t, useLocale } from "../../i18n/runtime";import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { formatDate, getImageUrl } from "../../utils/helpers";
import { USER_ROLES } from "../../utils/constants";
import "./Profile.css";

const Profile = () => {useLocale();
  const { user, balance } = useAuth();
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <div className="profile-page page-container">
        <div>
          <div className="profile-loading">
            <div className="loading-spinner"></div>
          </div>
        </div>
      </div>);

  }

  return (
    <div className="profile-page page-container">
      <div>
        <div className="profile-header">
          <div><p className="go-account-eyebrow">{t("YOUR STORY, IN ONE PLACE")}</p><h1 className="profile-title"><em>{t("My profile")}</em></h1></div>
          <div className="profile-actions">
            <Link to="/profile/edit" className="button-primary">{t("Edit Profile ")}

            </Link>
            <Link to="/settings" className="button-secondary">{t("Settings ")}

            </Link>
          </div>
        </div>

        <div className="profile-content">
          <div className="profile-card card">
            <div className="profile-avatar-section">
              {user.userLogo ?
              <img
                src={getImageUrl(user.userLogo)}
                alt={t("Profile")}
                className="profile-avatar" /> :


              <div className="profile-avatar-placeholder">
                  {user.name?.charAt(0).toUpperCase() || t("U")}
                </div>
              }
              <div className="profile-name-section">
                <h2 className="profile-name">{user.name || t("No Name")}</h2>
                <p className="profile-email">
                  {user.email || user.gmail || t("No Email")}
                </p>
                <span className="profile-role-badge">
                  {user.role || t("student")}
                </span>
              </div>
            </div>

            <div className="profile-details">
              <div className="profile-section">
                <h3 className="section-title">{t("Personal Information")}</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">{t("First Name")}</span>
                    <span className="detail-value">
                      {user.firstName || t("Not set")}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">{t("Last Name")}</span>
                    <span className="detail-value">
                      {user.secondName || t("Not set")}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">{t("Date of Birth")}</span>
                    <span className="detail-value">
                      {user.dateBorn ? formatDate(user.dateBorn) : t("Not set")}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">{t("Gender")}</span>
                    <span className="detail-value">
                      {user.gender ?
                      user.gender.charAt(0).toUpperCase() +
                      user.gender.slice(1) : t(
                        "Not set")}
                    </span>
                  </div>
                  <div className="detail-item full-width">
                    <span className="detail-label">{t("Address")}</span>
                    <span className="detail-value">
                      {user.address || t("Not set")}
                    </span>
                  </div>
                </div>
              </div>

              {user.role === USER_ROLES.STUDENT &&
              <div className="profile-section">
                  <h3 className="section-title">{t("School Information")}</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">{t("School Name")}</span>
                      <span className="detail-value">
                        {user.schoolName || t("Not set")}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">{t("School ID")}</span>
                      <span className="detail-value">
                        {user.schoolId || t("Not set")}
                      </span>
                    </div>
                  </div>
                </div>
              }

              <div className="profile-section">
                <h3 className="section-title">{t("Contact Information")}</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">{t("Phone Number")}</span>
                    <span className="detail-value">
                      {user.tel || t("Not set")}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">{t("Gmail")}</span>
                    <span className="detail-value">
                      {user.email || t("Not set")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="profile-section">
                <h3 className="section-title">{t("Account Information")}</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">{t("Role")}</span>
                    <span className="detail-value">
                      {user.role || t("student")}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">{t("Account Status")}</span>
                    <span
                      className={`detail-value ${
                      user.userBan ? "banned" : "active"}`
                      }>

                      {user.userBan ? t("Banned") : t("Active")}
                    </span>
                  </div>
                  {user?.role === "student" && <div className="detail-item full-width profile-coins-row">
                    <span className="detail-label">{t("Coins")}</span>
                    <span className="detail-value">
                      <span className="profile-balance"><img src="/images/coins-generated.webp" width="25" height="25" alt="" /> {t(balance ?? 0)}{t(" coins")}</span>
                      <Link to="/buy-coins" className="profile-get-more">{t("Get more ")}

                      </Link>
                    </span>
                  </div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>);

};

export default Profile;
