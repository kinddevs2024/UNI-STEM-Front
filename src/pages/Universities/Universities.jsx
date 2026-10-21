import { t, useLocale } from "../../i18n/runtime";import { useState, useEffect } from "react";
import { adminAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import NotificationToast from "../../components/NotificationToast";
import { formatDate } from "../../utils/helpers";
import "./Universities.css";
import "../AdminPanel/PanelRedesign.css";

const Universities = () => {useLocale();
  const { user } = useAuth();
  const [universities, setUniversities] = useState([]);
  const [universitiesWithStats, setUniversitiesWithStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchUniversities();
  }, []);

  const fetchUniversities = async () => {
    try {
      setLoading(true);
      const [usersResponse, olympiadsResponse, resultsResponse] = await Promise.all([
      adminAPI.getUsers(),
      adminAPI.getAllOlympiads(),
      adminAPI.getSubmissions()]
      );

      // Filter users with university role
      const universityUsers = (usersResponse.data?.data || usersResponse.data || []).filter(
        (u) => u.role === "university"
      );

      const allOlympiads = olympiadsResponse.data?.data || olympiadsResponse.data || [];
      const allResults = resultsResponse.data?.data || resultsResponse.data || [];

      // Calculate stats for each university
      const universitiesWithStatsData = universityUsers.map((univ) => {
        // Count olympiads created by this university
        const olympiadCount = allOlympiads.filter(
          (olympiad) => olympiad.createdBy === univ._id
        ).length;

        // Get olympiad IDs created by this university
        const universityOlympiadIds = allOlympiads.
        filter((olympiad) => olympiad.createdBy === univ._id).
        map((olympiad) => olympiad._id);

        // Count unique students who have results/submissions for these olympiads
        const studentIds = new Set();
        allResults.forEach((result) => {
          if (universityOlympiadIds.includes(result.olympiadId)) {
            if (result.userId) {
              studentIds.add(result.userId);
            }
          }
        });

        return {
          ...univ,
          olympiadCount,
          studentCount: studentIds.size
        };
      });

      setUniversities(universitiesWithStatsData);
      setUniversitiesWithStats(universitiesWithStatsData);
      setError(null);
    } catch (err) {
      console.error("Error fetching universities:", err);
      setError("Failed to load universities");
      setNotification({
        type: "error",
        message: "Failed to load universities. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUniversities = universitiesWithStats.filter((univ) => {
    const matchesSearch =
    univ.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    univ.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    univ.schoolName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
    filterStatus === "all" ||
    filterStatus === "active" && !univ.userBan ||
    filterStatus === "blocked" && univ.userBan;

    return matchesSearch && matchesStatus;
  });

  const handleBlockToggle = async (universityId, currentStatus) => {
    try {
      // Use adminAPI to update user ban status
      // This assumes a backend endpoint exists or will be created
      // For now, we'll use a PUT request to update the user
      const response = await adminAPI.getUsers();
      const allUsers = response.data?.data || response.data || [];
      const university = allUsers.find((u) => u._id === universityId && u.role === "university");

      if (!university) {
        setNotification({
          type: "error",
          message: "University not found"
        });
        return;
      }

      // Update user ban status via profile endpoint (admin/owner can update other users)
      // Note: This requires backend support for admin/owner to update userBan
      setNotification({
        type: "info",
        message: `Block/unblock functionality requires backend endpoint implementation. Current status: ${currentStatus ? "Blocked" : "Active"}`
      });

      // After backend endpoint is implemented:
      // await adminAPI.toggleUserBan(universityId, !currentStatus);
      // fetchUniversities();
    } catch (err) {
      setNotification({
        type: "error",
        message: "Failed to update university status"
      });
    }
  };

  const handleViewDetails = (university) => {
    setSelectedUniversity(university);
    setShowDetailsModal(true);
  };

  const handleCloseDetails = () => {
    setShowDetailsModal(false);
    setSelectedUniversity(null);
  };

  if (loading) {
    return (
      <div className="universities-page brand-panel" data-brand-panel="universities">
        <div className="container">
          <div className="loading-spinner"></div>
        </div>
      </div>);

  }

  return (
    <div className="universities-page brand-panel" data-brand-panel="universities">
      <div className="container">
        <div className="universities-header">
          <h1 className="universities-title text-glow">{t("Universities Management")}</h1>
          <div className="universities-header-actions">
            <input
              type="text"
              placeholder={t("Search universities...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input" />

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="status-filter">

              <option value="all">{t("All Status")}</option>
              <option value="active">{t("Active")}</option>
              <option value="blocked">{t("Blocked")}</option>
            </select>
          </div>
        </div>

        {error &&
        <div className="error-message card">
            <p>{t(error)}</p>
            <button
            className="button-secondary"
            onClick={fetchUniversities}>{t("Retry ")}


          </button>
          </div>
        }

        <div className="universities-stats card">
          <div className="stat-item">
            <span className="stat-label">{t("Total Universities")}</span>
            <span className="stat-value">{t(universitiesWithStats.length)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">{t("Active")}</span>
            <span className="stat-value">
              {t(universitiesWithStats.filter((u) => !u.userBan).length)}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">{t("Blocked")}</span>
            <span className="stat-value">
              {t(universitiesWithStats.filter((u) => u.userBan).length)}
            </span>
          </div>
        </div>

        <div className="universities-list">
          {filteredUniversities.length === 0 ?
          <div className="empty-state card">
              <p>{t("No universities found")}</p>
            </div> :

          <div className="universities-table">
              <table>
                <thead>
                  <tr>
                    <th>{t("Name")}</th>
                    <th>{t("Email")}</th>
                    <th>{t("Status")}</th>
                    <th>{t("Olympiads")}</th>
                    <th>{t("Students")}</th>
                    <th>{t("Created")}</th>
                    <th>{t("Actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUniversities.map((univ) =>
                <tr key={univ._id}>
                      <td>{univ.name || t("N/A")}</td>
                      <td>{univ.email || t("N/A")}</td>
                      <td>
                        <span
                      className={`status-badge ${
                      univ.userBan ? "blocked" : "active"}`
                      }>

                          {t(univ.userBan ? "Blocked" : "Active")}
                        </span>
                      </td>
                      <td>{t(univ.olympiadCount || 0)}</td>
                      <td>{t(univ.studentCount || 0)}</td>
                      <td>
                        {t(univ.createdAt ?
                    formatDate(univ.createdAt) :
                    "N/A")}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                        className="button-secondary small"
                        onClick={() => handleViewDetails(univ)}
                        title={t("View Details")}>{t("View ")}


                      </button>
                          <button
                        className={`button-secondary small ${
                        univ.userBan ? "button-success" : "button-danger"}`
                        }
                        onClick={() =>
                        handleBlockToggle(univ._id, univ.userBan)
                        }>

                            {t(univ.userBan ? "Unblock" : "Block")}
                          </button>
                        </div>
                      </td>
                    </tr>
                )}
                </tbody>
              </table>
            </div>
          }
        </div>
      </div>

      {notification &&
      <NotificationToast
        type={notification.type}
        message={notification.message}
        onClose={() => setNotification(null)} />

      }

      {/* University Details Modal */}
      {showDetailsModal && selectedUniversity &&
      <div className="modal-overlay" onClick={handleCloseDetails}>
          <div
          className="modal-content university-details-modal"
          onClick={(e) => e.stopPropagation()}>

            <div className="modal-header">
              <h2>{t("University Details")}</h2>
              <button className="modal-close" onClick={handleCloseDetails}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="university-details">
                <div className="detail-section">
                  <h3>{t("Basic Information")}</h3>
                  <div className="detail-row">
                    <span className="detail-label">{t("Name:")}</span>
                    <span className="detail-value">{selectedUniversity.name || t("N/A")}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">{t("Email:")}</span>
                    <span className="detail-value">{selectedUniversity.email || t("N/A")}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">{t("Phone:")}</span>
                    <span className="detail-value">{t(selectedUniversity.tel || "N/A")}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">{t("Address:")}</span>
                    <span className="detail-value">{t(selectedUniversity.address || "N/A")}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">{t("School/Organization:")}</span>
                    <span className="detail-value">{t(selectedUniversity.schoolName || "N/A")}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>{t("Status & Statistics")}</h3>
                  <div className="detail-row">
                    <span className="detail-label">{t("Status:")}</span>
                    <span
                    className={`status-badge ${
                    selectedUniversity.userBan ? "blocked" : "active"}`
                    }>

                      {t(selectedUniversity.userBan ? "Blocked" : "Active")}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">{t("Olympiad Count:")}</span>
                    <span className="detail-value">{t(selectedUniversity.olympiadCount || 0)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">{t("Student Count:")}</span>
                    <span className="detail-value">{t(selectedUniversity.studentCount || 0)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">{t("Created At:")}</span>
                    <span className="detail-value">
                      {t(selectedUniversity.createdAt ?
                    formatDate(selectedUniversity.createdAt) :
                    "N/A")}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">{t("Last Updated:")}</span>
                    <span className="detail-value">
                      {t(selectedUniversity.updatedAt ?
                    formatDate(selectedUniversity.updatedAt) :
                    "N/A")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
              className={`button-secondary ${
              selectedUniversity.userBan ? "button-success" : "button-danger"}`
              }
              onClick={() => {
                handleBlockToggle(selectedUniversity._id, selectedUniversity.userBan);
              }}>

                {t(selectedUniversity.userBan ? "Unblock" : "Block")}
              </button>
              <button className="button-secondary" onClick={handleCloseDetails}>{t("Close ")}

            </button>
            </div>
          </div>
        </div>
      }
    </div>);

};

export default Universities;
