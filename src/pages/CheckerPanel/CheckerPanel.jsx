import { useAuth } from "../../context/AuthContext";
import "./CheckerPanel.css";
import "../AdminPanel/PanelRedesign.css";

const CheckerPanel = () => {
  const { user } = useAuth();

  return (
    <div className="checker-panel-page brand-panel" data-brand-panel="checker">
      <div className="container">
        <div className="checker-header">
          <h1 className="checker-title text-glow">Portfolio Verification</h1>
          <p className="checker-subtitle">
            Portfolio verification functionality has been disabled
          </p>
        </div>

        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>Portfolio Feature Removed</h3>
          <p>The portfolio verification feature is no longer available in this system.</p>
        </div>
      </div>
    </div>
  );
};

export default CheckerPanel;

