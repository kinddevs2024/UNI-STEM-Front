import { t, useLocale } from "../../i18n/runtime";import { getEntryFee } from '../../utils/coinEntry';
import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { olympiadAPI, adminAPI } from "../../services/api";
import {
  formatDate,
  isOlympiadActive,
  isOlympiadUpcoming,
  isOlympiadEnded } from
"../../utils/helpers";
import { USER_ROLES } from "../../utils/constants";
import { useAuth } from "../../context/AuthContext";
import "./Dashboard.css";
import Pagination from '../../components/Pagination';
import { useTheme } from '../../context/ThemeContext';

const Dashboard = () => {useLocale();
  const { user } = useAuth();
  const { itemsPerPage } = useTheme();
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const [olympiads, setOlympiads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOlympiad, setSelectedOlympiad] = useState(null);
  const [olympiadDetails, setOlympiadDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Determine user role
  const isAdminOrOwner =
  user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.OWNER;
  const isStudent = user?.role === USER_ROLES.STUDENT;

  // Students default to seeing active olympiads (null = active), admins/owners see all
  const [filter, setFilter] = useState(isAdminOrOwner ? "all" : null);
  useEffect(() => {setCurrentPage(1);}, [filter]);

  const fetchOlympiads = useCallback(async () => {
    try {
      let response;
      if (isAdminOrOwner) {
        response = await adminAPI.getAllOlympiads();
      } else {
        response = await olympiadAPI.getAll();
      }
      // Handle paginated response structure: { success: true, data: [...], pagination: {...} }
      // or legacy array response
      const olympiadsData = response.data?.data || response.data || [];
      setOlympiads(Array.isArray(olympiadsData) ? olympiadsData : []);
    } catch (error) {
      console.error("Error fetching olympiads:", error);
      setOlympiads([]);
    } finally {
      setLoading(false);
    }
  }, [isAdminOrOwner]);

  useEffect(() => {
    fetchOlympiads();
  }, [fetchOlympiads]);

  // Get olympiads by status - memoized
  const getVisibleOlympiads = useMemo(() => {
    if (!Array.isArray(olympiads)) return [];
    if (isAdminOrOwner) {
      return olympiads;
    } else {
      return olympiads.filter((olympiad) => olympiad.status === "published");
    }
  }, [olympiads, isAdminOrOwner]);

  const getActiveOlympiads = useMemo(() => {
    return getVisibleOlympiads.filter((olympiad) =>
    isOlympiadActive(olympiad.startTime, olympiad.endTime)
    );
  }, [getVisibleOlympiads]);

  const getUpcomingOlympiads = useMemo(() => {
    return getVisibleOlympiads.filter((olympiad) =>
    isOlympiadUpcoming(olympiad.startTime)
    );
  }, [getVisibleOlympiads]);

  const getEndedOlympiads = useMemo(() => {
    return getVisibleOlympiads.filter((olympiad) =>
    isOlympiadEnded(olympiad.endTime)
    );
  }, [getVisibleOlympiads]);

  const getFilteredOlympiads = useMemo(() => {
    if (filter === "all") return getVisibleOlympiads;
    if (filter === "active") return getActiveOlympiads;
    if (filter === "upcoming") return getUpcomingOlympiads;
    if (filter === "ended") return getEndedOlympiads;
    return getVisibleOlympiads;
  }, [filter, getVisibleOlympiads, getActiveOlympiads, getUpcomingOlympiads, getEndedOlympiads]);

  // Get time-based status badge (Active, Upcoming, Ended) - memoized
  const getTimeStatusBadge = useCallback((olympiad) => {
    if (isOlympiadActive(olympiad.startTime, olympiad.endTime)) {
      return <span className="status-badge status-active">{t("Active")}</span>;
    }
    if (isOlympiadUpcoming(olympiad.startTime)) {
      return <span className="status-badge status-upcoming">{t("Upcoming")}</span>;
    }
    return <span className="status-badge status-ended">{t("Ended")}</span>;
  }, []);

  // Get olympiad status badge (Draft, Published, Unpublished) - for admins/owners - memoized
  const getOlympiadStatusBadge = useCallback((status) => {
    if (!isAdminOrOwner) return null;

    const statusMap = {
      published: { label: "Published", class: "status-published" },
      unpublished: { label: "Unpublished", class: "status-unpublished" },
      draft: { label: "Draft", class: "status-draft" }
    };
    const statusInfo = statusMap[status] || statusMap["draft"];
    return (
      <span className={`status-badge ${statusInfo.class}`}>
        {t(statusInfo.label)}
      </span>);

  }, [isAdminOrOwner]);

  // Handle olympiad click - open modal for admins/owners, navigate for students - memoized
  const handleOlympiadClick = useCallback(async (olympiad) => {
    if (isAdminOrOwner) {
      setSelectedOlympiad(olympiad);
      setLoadingDetails(true);
      try {
        // Fetch full olympiad details including questions
        const response = await adminAPI.getOlympiadById(olympiad._id);
        const details = response.data.data || response.data;
        const questionsResponse = await adminAPI.getQuestions(olympiad._id);
        setOlympiadDetails({
          ...details,
          questions: questionsResponse.data || []
        });
      } catch (error) {
        console.error("Error fetching olympiad details:", error);
        setOlympiadDetails(olympiad); // Fallback to basic data
      } finally {
        setLoadingDetails(false);
      }
    }
  }, [isAdminOrOwner]);

  // Close modal - memoized
  const handleCloseModal = useCallback(() => {
    setSelectedOlympiad(null);
    setOlympiadDetails(null);
  }, []);

  // Render olympiad card component
  const renderOlympiadCard = useCallback((olympiad) => {
    if (!olympiad) return null;

    // Get logo URL - handle both relative and absolute URLs
    // Check multiple possible field names for logo
    const logoField =
    olympiad.olympiadLogo ||
    olympiad.logo ||
    olympiad.photo ||
    olympiad.image;

    const getLogoUrl = (logo) => {
      if (!logo) return null;
      // If it's already a full URL (starts with http), return as is
      if (logo.startsWith("http://") || logo.startsWith("https://")) {
        return logo;
      }
      // If it starts with /api, it's already correct for proxy
      if (logo.startsWith("/api")) {
        return logo;
      }
      // Otherwise, prepend /api if in dev mode, or construct full URL
      const API_BASE_URL =
      import.meta.env.VITE_API_URL ||
      "/api";
      return logo.startsWith("/") ?
      `${API_BASE_URL}${logo}` :
      `${API_BASE_URL}/${logo}`;
    };

    const logoUrl = getLogoUrl(logoField);

    const cardContent =
    <>
        <div className="olympiad-card-logo-container">
          {logoUrl ?
        <img
          src={logoUrl}
          alt={t(`${olympiad.title} logo`)}
          className="olympiad-card-logo"
          onError={(e) => {
            // Show placeholder if image fails to load
            e.target.style.display = "none";
            const container = e.target.parentElement;
            if (
            container &&
            !container.querySelector(".logo-placeholder"))
            {
              const placeholder = document.createElement("div");
              placeholder.className = "logo-placeholder";
              placeholder.textContent = "📋";
              container.appendChild(placeholder);
            }
          }} /> :


        <div className="logo-placeholder">📋</div>
        }
        </div>
        <div className="olympiad-card-header">
          <h3 className="olympiad-title">{olympiad.title}</h3>
          <div className="status-badges-container">
            {t(getOlympiadStatusBadge(olympiad.status))}
            {t(getTimeStatusBadge(olympiad))}
          </div>
        </div>

        <div className="olympiad-meta">
          <div className="olympiad-meta-item">
            <span className="meta-label">{t("Subject:")}</span>
            <span className="meta-value">{t(olympiad.subject)}</span>
          </div>
          <div className="olympiad-meta-item">
            <span className="meta-label">{t("Type:")}</span>
            <span className="meta-value">{t(olympiad.type)}</span>
          </div>
          <div className="olympiad-meta-item">
            <span className="meta-label">{t("Duration:")}</span>
            <span className="meta-value">
              {olympiad?.duration ? Math.floor((Number(olympiad.duration) || 0) / 60) : 0}{t(" minutes ")}
          </span>
          </div>
        </div>

        <div className="olympiad-dates">
          <div className="date-item">
            <span className="date-label">{t("Starts:")}</span>
            <span className="date-value">{t(formatDate(olympiad.startTime))}</span>
          </div>
          <div className="date-item">
            <span className="date-label">{t("Ends:")}</span>
            <span className="date-value">{t(formatDate(olympiad.endTime))}</span>
          </div>
        </div>

        <div className="olympiad-action">
          {isAdminOrOwner ?
        <span className="action-text">{t("View Details →")}</span> :
        isOlympiadActive(olympiad.startTime, olympiad.endTime) ?
        <span className="button-primary olympiad-start-button">{t("Start · ")}{t(getEntryFee(olympiad))}{t(" coins →")}</span> :
        isOlympiadUpcoming(olympiad.startTime) ?
        <span className="action-text">{t("Coming Soon")}</span> :

        <span className="action-text">{t("View Results →")}</span>
        }
        </div>
      </>;


    // For students: use Link to navigate
    if (isStudent) {
      return (
        <Link
          key={olympiad._id}
          to={`/olympiad/${olympiad._id}/entry`}
          className="olympiad-card card card-interactive">

          {t(cardContent)}
        </Link>);

    }

    // For admins/owners: use button to open modal
    return (
      <div
        key={olympiad._id}
        onClick={() => handleOlympiadClick(olympiad)}
        className="olympiad-card card card-interactive"
        style={{ cursor: "pointer" }}>

        {t(cardContent)}
      </div>);

  }, [isAdminOrOwner, isStudent, getOlympiadStatusBadge, getTimeStatusBadge, handleOlympiadClick]);

  // Render section with olympiads
  const renderOlympiadSection = useCallback((
  title,
  subtitle,
  olympiadsList,
  emptyMessage) =>
  {
    if (olympiadsList.length === 0) {
      return null; // Don't show empty sections
    }

    return (
      <div className="olympiad-section">
        <div className="section-header">
          <h2 className="section-title">{t(title)}</h2>
          <p className="section-subtitle">{t(subtitle)}</p>
        </div>
        <div className="olympiads-grid">
          {t((olympiadsList || []).map((olympiad) => renderOlympiadCard(olympiad)))}
        </div>
      </div>);

  }, [renderOlympiadCard]);

  const filteredOlympiads = getFilteredOlympiads;
  const activeOlympiads = getActiveOlympiads;
  const upcomingOlympiads = getUpcomingOlympiads;
  const endedOlympiads = getEndedOlympiads;
  const pageItems = isStudent ? filter === 'upcoming' ? upcomingOlympiads : filter === 'ended' ? endedOlympiads : activeOlympiads : getFilteredOlympiads;
  const totalPages = Math.max(1, Math.ceil(pageItems.length / itemsPerPage));
  const displayedPage = Math.min(currentPage, totalPages);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
      </div>);

  }

  return (
    <div className="dashboard-page page-container">
      <div>
        <div className="dashboard-header">
          <div className="dashboard-welcome-copy">
          <p className="go-account-eyebrow">{t("YOUR NEXT CHAPTER")}</p>
          <h1 className="dashboard-title"><em>{t("Your olympiads")}</em></h1>
          <p className="dashboard-subtitle">
            {t(isStudent ?
              filter === null ?
              "Active olympiads you can participate in right now" :
              filter === "upcoming" ?
              "Upcoming olympiads that will start soon" :
              "Finished olympiads you have completed" :
              "Select an olympiad to manage")}
          </p>
          <div className="dashboard-overview" aria-label={t("Olympiad overview")}>
            <span><strong>{t(activeOlympiads.length)}</strong>{t(" Active")}</span>
            <span><strong>{t(upcomingOlympiads.length)}</strong>{t(" Upcoming")}</span>
            <span><strong>{t(endedOlympiads.length)}</strong>{t(" Ended")}</span>
          </div>
          </div>
          <picture className="dashboard-welcome-art" aria-hidden="true">
            <img src="/images/fair-play-student.webp" alt="" width="640" height="480" />
          </picture>
        </div>

        {isStudent ?
        // Student view: Show filter tabs to choose between Active, Upcoming, and Ended
        <>
            <div className="dashboard-filters">
              <button
              className={`filter-button ${filter === null ? "active" : ""}`}
              onClick={() => setFilter(null)}
              aria-pressed={filter === null}>{t("Active ")}


            </button>
              <button
              className={`filter-button ${
              filter === "upcoming" ? "active" : ""}`
              }
              onClick={() => setFilter("upcoming")}
              aria-pressed={filter === "upcoming"}>{t("Upcoming ")}


            </button>
              <button
              className={`filter-button ${
              filter === "ended" ? "active" : ""}`
              }
              onClick={() => setFilter("ended")}
              aria-pressed={filter === "ended"}>{t("Ended ")}


            </button>
            </div>

            <div className="olympiads-grid">
              <div id="tutorial-dashboard-slot" className="tutorial-grid-slot" />
              {(() => {
              let displayOlympiads = [];
              let emptyMessage = "";

              if (filter === null) {
                // Show active olympiads (default)
                displayOlympiads = activeOlympiads;
                emptyMessage = "New olympiads will appear here. Check back soon.";
              } else if (filter === "upcoming") {
                // Show upcoming olympiads
                displayOlympiads = upcomingOlympiads;
                emptyMessage = "No olympiads are scheduled yet. Stay tuned for updates.";
              } else if (filter === "ended") {
                // Show ended olympiads
                displayOlympiads = endedOlympiads;
                emptyMessage = "Completed olympiads will appear here.";
              }

              if (displayOlympiads.length === 0) {
                return (
                  <div className="empty-state">
                      <div className="empty-icon"><img src="/images/empty-olympiads-generated.webp" alt="" width="180" height="180" /></div>
                      <h3>{t("No olympiads yet")}</h3>
                      <p>{t(emptyMessage)}</p>
                    </div>);

              }

              return (displayOlympiads || []).slice((displayedPage - 1) * itemsPerPage, displayedPage * itemsPerPage).map((olympiad) =>
              renderOlympiadCard(olympiad)
              );
            })()}
            </div>
          </> :

        // Admin/Owner view: Show filter tabs
        <>
            <div className="dashboard-filters">
              <button
              className={`filter-button ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
              aria-pressed={filter === "all"}>{t("All ")}


            </button>
              <button
              className={`filter-button ${
              filter === "active" ? "active" : ""}`
              }
              onClick={() => setFilter("active")}
              aria-pressed={filter === "active"}>{t("Active ")}


            </button>
              <button
              className={`filter-button ${
              filter === "upcoming" ? "active" : ""}`
              }
              onClick={() => setFilter("upcoming")}
              aria-pressed={filter === "upcoming"}>{t("Upcoming ")}


            </button>
              <button
              className={`filter-button ${
              filter === "ended" ? "active" : ""}`
              }
              onClick={() => setFilter("ended")}
              aria-pressed={filter === "ended"}>{t("Ended ")}


            </button>
            </div>

            <div className="olympiads-grid">
              {filteredOlympiads.length === 0 ?
            <div className="empty-state">
                  <div className="empty-icon"><img src="/images/empty-olympiads-generated.webp" alt="" width="180" height="180" /></div>
                  <h3>{t("No olympiads yet")}</h3>
                  <p>{t("There are no olympiads matching your filter.")}</p>
                </div> :

            filteredOlympiads.slice((displayedPage - 1) * itemsPerPage, displayedPage * itemsPerPage).map((olympiad) =>
            renderOlympiadCard(olympiad)
            )
            }
            </div>
          </>
        }

        {totalPages > 1 && <Pagination currentPage={displayedPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
        {/* Olympiad Details Modal for Admins/Owners */}
        {isAdminOrOwner && selectedOlympiad &&
        <div className="modal-overlay" onClick={handleCloseModal}>
            <div
            className="modal-content card"
            onClick={(e) => e.stopPropagation()}>

              <div className="modal-header">
                <h2 className="modal-title">{t(selectedOlympiad.title)}</h2>
                <button className="modal-close" onClick={handleCloseModal}>
                  ×
                </button>
              </div>

              {loadingDetails ?
            <div className="modal-loading">
                  <div className="loading-spinner"></div>
                </div> :

            <div className="modal-body">
                  {/* Olympiad Logo */}
                  {(() => {
                const modalLogoField =
                selectedOlympiad.olympiadLogo ||
                selectedOlympiad.logo ||
                selectedOlympiad.photo ||
                selectedOlympiad.image;

                const getModalLogoUrl = (logo) => {
                  if (!logo) return null;
                  if (
                  logo.startsWith("http://") ||
                  logo.startsWith("https://"))
                  {
                    return logo;
                  }
                  if (logo.startsWith("/api")) {
                    return logo;
                  }
                  const API_BASE_URL =
                  import.meta.env.VITE_API_URL ||
                  "/api";
                  return logo.startsWith("/") ?
                  `${API_BASE_URL}${logo}` :
                  `${API_BASE_URL}/${logo}`;
                };

                const modalLogoUrl = getModalLogoUrl(modalLogoField);

                return modalLogoUrl ?
                <div className="modal-logo-container">
                        <img
                    src={modalLogoUrl}
                    alt={t(`${selectedOlympiad.title} logo`)}
                    className="modal-logo" />

                      </div> :
                null;
              })()}

                  {/* Status Badges */}
                  <div className="modal-badges">
                    {t(getOlympiadStatusBadge(selectedOlympiad.status))}
                    {t(getTimeStatusBadge(selectedOlympiad))}
                  </div>

                  {/* Basic Information */}
                  <div className="modal-section">
                    <h3 className="section-title">{t("📋 Basic Information")}</h3>
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="info-label">{t("Subject:")}</span>
                        <span className="info-value">
                          {t(selectedOlympiad.subject)}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">{t("Type:")}</span>
                        <span className="info-value">
                          {t(selectedOlympiad.type)}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">{t("Duration:")}</span>
                        <span className="info-value">
                          {t(selectedOlympiad?.duration ? Math.floor((Number(selectedOlympiad.duration) || 0) / 60) : 0)}{t(" minutes ")}
                    </span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">{t("Status:")}</span>
                        <span className="info-value">
                          {t(selectedOlympiad.status)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {olympiadDetails?.description &&
              <div className="modal-section">
                      <h3 className="section-title">{t("📝 Description")}</h3>
                      <p className="description-text">
                        {t(olympiadDetails.description)}
                      </p>
                    </div>
              }

                  {/* Dates */}
                  <div className="modal-section">
                    <h3 className="section-title">{t("📅 Schedule")}</h3>
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="info-label">{t("Start Time:")}</span>
                        <span className="info-value">
                          {t(formatDate(selectedOlympiad.startTime))}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">{t("End Time:")}</span>
                        <span className="info-value">
                          {t(formatDate(selectedOlympiad.endTime))}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Questions */}
                  {olympiadDetails?.questions && Array.isArray(olympiadDetails.questions) &&
              <div className="modal-section">
                      <h3 className="section-title">{t("❓ Questions (")}
                  {t(olympiadDetails.questions.length)})
                      </h3>
                      <div className="questions-preview">
                        {olympiadDetails.questions.length > 0 ?
                  <div className="questions-list">
                            {olympiadDetails.questions.
                    slice(0, 5).
                    map((q, index) =>
                    <div
                      key={q?._id || index}
                      className="question-preview-item">

                                  <span className="question-number">{t("Q")}
                        {t(index + 1)}
                                  </span>
                                  <span className="question-text">
                                    {q?.question || q?.questionText || ""}
                                  </span>
                                  <span className="question-points">
                                    {t(Number(q?.points) || 0)}{t(" pts ")}
                      </span>
                                </div>
                    )}
                            {olympiadDetails.questions.length > 5 &&
                    <div className="more-questions">
                                +{t(olympiadDetails.questions.length - 5)}{t(" more questions ")}

                    </div>
                    }
                          </div> :

                  <p className="no-questions">{t("No questions added yet")}</p>
                  }
                      </div>
                    </div>
              }

                  {/* Actions */}
                  <div className="modal-actions">
                    <button
                  className="button-secondary"
                  onClick={() => {
                    handleCloseModal();
                    navigate(`/admin?edit=${selectedOlympiad._id}`);
                    // Note: AdminPanel will need to handle opening edit form for this olympiad
                  }}>{t("✏️ Edit Olympiad ")}


                </button>
                    <button
                  className="button-secondary"
                  onClick={() => {
                    handleCloseModal();
                    navigate("/admin");
                    // Note: AdminPanel will need to handle opening question manager for this olympiad
                  }}>{t("❓ Manage Questions ")}


                </button>
                    <button
                  className="button-secondary"
                  onClick={() => {
                    handleCloseModal();
                    navigate(
                      `/olympiad/${selectedOlympiad._id}/leaderboard`
                    );
                  }}>{t("🏆 View Leaderboard ")}


                </button>
                    <button
                  className="button-primary"
                  onClick={handleCloseModal}>{t("Close ")}


                </button>
                  </div>
                </div>
            }
            </div>
          </div>
        }
      </div>
    </div>);

};

export default Dashboard;
