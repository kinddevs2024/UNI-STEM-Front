import { t, useLocale } from "../../i18n/runtime";import { useState, useEffect } from "react";
import { adminAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import NotificationToast from "../../components/NotificationToast";
import { formatDate } from "../../utils/helpers";
import "./Schools.css";
import "../AdminPanel/PanelRedesign.css";

const Schools = () => {useLocale();
  const { user } = useAuth();
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRole, setFilterRole] = useState("all");
  const [selectedSchool, setSelectedSchool] = useState(null);

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getUsers();
      // Filter users with school-admin or school-teacher roles
      const schoolUsers = response.data.filter(
        (u) =>
        u.role === "school-admin" ||
        u.role === "school_admin" ||
        u.role === "school-teacher" ||
        u.role === "school_teacher"
      );
      setSchools(schoolUsers);
      setError(null);
    } catch (err) {
      console.error("Error fetching schools:", err);
      setError("Failed to load schools");
      setNotification({
        type: "error",
        message: "Failed to load schools. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const isSchoolAdmin = (role) => {
    return role === "school-admin" || role === "school_admin";
  };

  const isSchoolTeacher = (role) => {
    return role === "school-teacher" || role === "school_teacher";
  };

  const getRoleLabel = (role) => {
    if (isSchoolAdmin(role)) return "School Admin";
    if (isSchoolTeacher(role)) return "School Teacher";
    return role;
  };

  const filteredSchools = schools.filter((school) => {
    const matchesSearch =
    school.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.schoolName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
    filterStatus === "all" ||
    filterStatus === "active" && !school.userBan ||
    filterStatus === "banned" && school.userBan;

    const matchesRole =
    filterRole === "all" ||
    filterRole === "admin" && isSchoolAdmin(school.role) ||
    filterRole === "teacher" && isSchoolTeacher(school.role);

    return matchesSearch && matchesStatus && matchesRole;
  });

  const schoolAdmins = filteredSchools.filter((s) => isSchoolAdmin(s.role));
  const schoolTeachers = filteredSchools.filter((s) => isSchoolTeacher(s.role));

  const handleBlockToggle = async (schoolId, currentStatus) => {
    try {
      // Note: This would require a backend endpoint to block/unblock users
      // For now, we'll just show a notification
      setNotification({
        type: "info",
        message: `Block/unblock functionality requires backend implementation`
      });
      // After backend is implemented, you would call:
      // await adminAPI.toggleUserBan(schoolId, !currentStatus);
      // fetchSchools();
    } catch (err) {
      setNotification({
        type: "error",
        message: "Failed to update school status"
      });
    }
  };

  const handleViewDetails = (school) => {
    setSelectedSchool(school);
  };

  const closeDetails = () => {
    setSelectedSchool(null);
  };

  const renderTable = (schoolsList, title) => {
    if (schoolsList.length === 0) return null;

    return (
      <div className="schools-group">
        <h2 className="schools-group-title">{t(title)}</h2>
        <div className="schools-table">
          <table>
            <thead>
              <tr>
                <th>{t("Name")}</th>
                <th>{t("Email")}</th>
                <th>{t("School Name")}</th>
                <th>{t("Status")}</th>
                <th>{t("Created")}</th>
                <th>{t("Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {schoolsList.map((school) =>
              <tr key={school._id}>
                  <td>{school.name || t("N/A")}</td>
                  <td>{school.email || t("N/A")}</td>
                  <td>{t(school.schoolName || "N/A")}</td>
                  <td>
                    <span
                    className={`status-badge ${
                    school.userBan ? "banned" : "active"}`
                    }>

                      {t(school.userBan ? "Banned" : "Active")}
                    </span>
                  </td>
                  <td>
                    {t(school.createdAt ? formatDate(school.createdAt) : "N/A")}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                      className="button-secondary small"
                      onClick={() => handleViewDetails(school)}>{t("View Details ")}


                    </button>
                      <button
                      className="button-secondary small"
                      onClick={() =>
                      handleBlockToggle(school._id, school.userBan)
                      }>

                        {t(school.userBan ? "Unblock" : "Block")}
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>);

  };

  if (loading) {
    return (
      <div className="schools-page brand-panel" data-brand-panel="schools">
        <div className="container">
          <div className="loading-spinner"></div>
        </div>
      </div>);

  }

  return (
    <div className="schools-page brand-panel" data-brand-panel="schools">
      <div className="container">
        <div className="schools-header">
          <h1 className="schools-title text-glow">{t("Schools Management")}</h1>
          <div className="schools-header-actions">
            <input
              type="text"
              placeholder={t("Search schools...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input" />

            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="role-filter">

              <option value="all">{t("All Roles")}</option>
              <option value="admin">{t("School Admin")}</option>
              <option value="teacher">{t("School Teacher")}</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="status-filter">

              <option value="all">{t("All Status")}</option>
              <option value="active">{t("Active")}</option>
              <option value="banned">{t("Banned")}</option>
            </select>
          </div>
        </div>

        {error &&
        <div className="error-message card">
            <p>{t(error)}</p>
            <button className="button-secondary" onClick={fetchSchools}>{t("Retry ")}

          </button>
          </div>
        }

        <div className="schools-stats card">
          <div className="stat-item">
            <span className="stat-label">{t("Total Schools")}</span>
            <span className="stat-value">{t(schools.length)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">{t("School Admins")}</span>
            <span className="stat-value">
              {t(schools.filter((s) => isSchoolAdmin(s.role)).length)}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">{t("School Teachers")}</span>
            <span className="stat-value">
              {t(schools.filter((s) => isSchoolTeacher(s.role)).length)}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">{t("Active")}</span>
            <span className="stat-value">
              {t(schools.filter((s) => !s.userBan).length)}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">{t("Banned")}</span>
            <span className="stat-value">
              {t(schools.filter((s) => s.userBan).length)}
            </span>
          </div>
        </div>

        <div className="schools-list">
          {filteredSchools.length === 0 ?
          <div className="empty-state card">
              <p>{t("No schools found")}</p>
            </div> :

          <>
              {t(renderTable(schoolAdmins, "School Admins"))}
              {t(renderTable(schoolTeachers, "School Teachers"))}
            </>
          }
        </div>
      </div>

      {selectedSchool &&
      <div className="details-modal-overlay" onClick={closeDetails}>
          <div
          className="details-modal card"
          onClick={(e) => e.stopPropagation()}>

            <div className="details-modal-header">
              <h2>{t("School Details")}</h2>
              <button className="details-modal-close" onClick={closeDetails}>
                ×
              </button>
            </div>
            <div className="details-modal-content">
              <div className="detail-row">
                <span className="detail-label">{t("Name:")}</span>
                <span className="detail-value">
                  {selectedSchool.name || t("N/A")}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">{t("Email:")}</span>
                <span className="detail-value">
                  {selectedSchool.email || t("N/A")}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">{t("School Name:")}</span>
                <span className="detail-value">
                  {t(selectedSchool.schoolName || "N/A")}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">{t("Role:")}</span>
                <span className="detail-value">
                  {t(getRoleLabel(selectedSchool.role))}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">{t("Status:")}</span>
                <span
                className={`status-badge ${
                selectedSchool.userBan ? "banned" : "active"}`
                }>

                  {t(selectedSchool.userBan ? "Banned" : "Active")}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">{t("Created:")}</span>
                <span className="detail-value">
                  {t(selectedSchool.createdAt ?
                formatDate(selectedSchool.createdAt) :
                "N/A")}
                </span>
              </div>
              {selectedSchool.schoolId &&
            <div className="detail-row">
                  <span className="detail-label">{t("School ID:")}</span>
                  <span className="detail-value">
                    {t(selectedSchool.schoolId)}
                  </span>
                </div>
            }
            </div>
          </div>
        </div>
      }

      {notification &&
      <NotificationToast
        type={notification.type}
        message={notification.message}
        onClose={() => setNotification(null)} />

      }
    </div>);

};

export default Schools;
