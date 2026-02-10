import { useState, useEffect } from "react";
import { checkerAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import PortfolioStatusBadge from "../../components/PortfolioStatusBadge/PortfolioStatusBadge";
import PortfolioVerificationModal from "../../components/PortfolioVerificationModal/PortfolioVerificationModal";
import NotificationToast from "../../components/NotificationToast";
import "./CheckerPanel.css";

const CheckerPanel = () => {
  const { user } = useAuth();
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchPortfolios();
  }, []);

  const fetchPortfolios = async () => {
    try {
      setLoading(true);
      const response = await checkerAPI.getAllPortfolios();
      const portfoliosData =
        response.data?.data || response.data?.portfolios || response.data || [];
      setPortfolios(Array.isArray(portfoliosData) ? portfoliosData : []);
    } catch (error) {
      console.error("Error fetching portfolios:", error);
      setNotification({
        message: "Failed to load portfolios",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (portfolioId, comment = "") => {
    try {
      await checkerAPI.verifyPortfolio(portfolioId, comment);
      setNotification({
        message: "Portfolio verified successfully",
        type: "success",
      });
      setShowModal(false);
      setSelectedPortfolio(null);
      fetchPortfolios();
    } catch (error) {
      console.error("Error verifying portfolio:", error);
      setNotification({
        message: error.response?.data?.message || "Failed to verify portfolio",
        type: "error",
      });
    }
  };

  const handleReject = async (portfolioId, comment = "") => {
    try {
      await checkerAPI.rejectPortfolio(portfolioId, comment);
      setNotification({
        message: "Portfolio rejected",
        type: "success",
      });
      setShowModal(false);
      setSelectedPortfolio(null);
      fetchPortfolios();
    } catch (error) {
      console.error("Error rejecting portfolio:", error);
      setNotification({
        message: error.response?.data?.message || "Failed to reject portfolio",
        type: "error",
      });
    }
  };

  const handlePortfolioAction = (portfolio, action) => {
    setSelectedPortfolio({ ...portfolio, action });
    setShowModal(true);
  };

  const getFilteredPortfolios = () => {
    if (filter === "all") return portfolios;
    return portfolios.filter((p) => p.verificationStatus === filter);
  };

  const filteredPortfolios = getFilteredPortfolios();

  if (loading) {
    return (
      <div className="checker-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="checker-panel-page">
      <div className="container">
        <div className="checker-header">
          <h1 className="checker-title text-glow">Portfolio Verification</h1>
          <p className="checker-subtitle">
            Review and verify student portfolios
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="dashboard-filters">
          <button
            className={`filter-button ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            className={`filter-button ${filter === "unverified" ? "active" : ""}`}
            onClick={() => setFilter("unverified")}
          >
            Unverified
          </button>
          <button
            className={`filter-button ${filter === "pending" ? "active" : ""}`}
            onClick={() => setFilter("pending")}
          >
            Pending
          </button>
          <button
            className={`filter-button ${filter === "verified" ? "active" : ""}`}
            onClick={() => setFilter("verified")}
          >
            Verified
          </button>
          <button
            className={`filter-button ${filter === "rejected" ? "active" : ""}`}
            onClick={() => setFilter("rejected")}
          >
            Rejected
          </button>
        </div>

        {/* Portfolio Cards Grid */}
        {filteredPortfolios.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No portfolios found</h3>
            <p>There are no portfolios matching your filter.</p>
          </div>
        ) : (
          <div className="olympiads-grid">
            {filteredPortfolios.map((portfolio) => (
              <div key={portfolio._id} className="olympiad-card card card-interactive">
                <div className="olympiad-card-header">
                  <div className="olympiad-title">
                    {portfolio.title || portfolio.hero?.title || "Untitled Portfolio"}
                  </div>
                  <div className="status-badges-container">
                    {portfolio.verificationStatus && (
                      <PortfolioStatusBadge
                        status={portfolio.verificationStatus}
                        size="medium"
                      />
                    )}
                  </div>
                </div>

                <div className="olympiad-meta">
                  <div className="olympiad-meta-item">
                    <span className="meta-label">Student:</span>
                    <span className="meta-value">
                      {portfolio.studentName || portfolio.studentId || "Unknown"}
                    </span>
                  </div>
                  {portfolio.portfolioRating !== undefined && (
                    <div className="olympiad-meta-item">
                      <span className="meta-label">Rating:</span>
                      <span className="meta-value">{portfolio.portfolioRating}</span>
                    </div>
                  )}
                  <div className="olympiad-meta-item">
                    <span className="meta-label">Status:</span>
                    <span className="meta-value">
                      {portfolio.verificationStatus || "unverified"}
                    </span>
                  </div>
                </div>

                <div className="olympiad-card-actions">
                  <a
                    href={`/portfolio/${portfolio.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="button-secondary"
                    style={{ textDecoration: "none", display: "inline-block" }}
                  >
                    View Portfolio
                  </a>
                  {portfolio.verificationStatus !== "verified" && (
                    <button
                      className="button-primary"
                      onClick={() => handlePortfolioAction(portfolio, "verify")}
                    >
                      Verify
                    </button>
                  )}
                  {portfolio.verificationStatus !== "rejected" && (
                    <button
                      className="button-secondary"
                      onClick={() => handlePortfolioAction(portfolio, "reject")}
                    >
                      Reject
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Verification Modal */}
        {showModal && selectedPortfolio && (
          <PortfolioVerificationModal
            portfolio={selectedPortfolio}
            action={selectedPortfolio.action}
            onVerify={handleVerify}
            onReject={handleReject}
            onClose={() => {
              setShowModal(false);
              setSelectedPortfolio(null);
            }}
          />
        )}

        {/* Notification Toast */}
        {notification && (
          <NotificationToast
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}
      </div>
    </div>
  );
};

export default CheckerPanel;

