import { t, useLocale } from "../../i18n/runtime";import { useAuth } from "../../context/AuthContext";
import "./CheckerPanel.css";
import "../AdminPanel/PanelRedesign.css";

const CheckerPanel = () => {useLocale();
  const { user } = useAuth();

  return (
    <div className="checker-panel-page brand-panel" data-brand-panel="checker">
      <div className="container">
        <div className="checker-header">
          <h1 className="checker-title text-glow">{t("Portfolio Verification")}</h1>
          <p className="checker-subtitle">{t("Portfolio verification functionality has been disabled ")}

          </p>
        </div>

        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>{t("Portfolio Feature Removed")}</h3>
          <p>{t("The portfolio verification feature is no longer available in this system.")}</p>
        </div>
      </div>
    </div>);

};

export default CheckerPanel;
