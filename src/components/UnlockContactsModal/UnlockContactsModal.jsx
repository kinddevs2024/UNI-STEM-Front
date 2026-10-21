import { t, useLocale } from "../../i18n/runtime";import { useState } from "react";
import { Link } from "react-router-dom";
import "./UnlockContactsModal.css";

const UnlockContactsModal = ({ portfolio, balance = 0, coinsRequired = 10, onConfirm, onClose }) => {useLocale();
  const hasEnoughCoins = balance >= coinsRequired;
  const [showBuyInfo, setShowBuyInfo] = useState(false);

  return (
    <div className="verification-modal-overlay" onClick={onClose}>
      <div
        className="verification-modal-content"
        onClick={(e) => e.stopPropagation()}>

        <div className="verification-modal-header">
          <h3>{t("Unlock Student Contacts")}</h3>
          <button
            className="verification-modal-close"
            onClick={onClose}
            aria-label={t("Close")}>

            ×
          </button>
        </div>

        <div className="verification-modal-body">
          <div className="portfolio-info">
            <p>
              <strong>{t("Portfolio:")}</strong> {t(portfolio.title || portfolio.hero?.title || "Untitled")}
            </p>
            <p>
              <strong>{t("Student:")}</strong> {t(portfolio.studentName || portfolio.studentId || "Unknown")}
            </p>
          </div>

          <div className="unlock-info">
            <p>{t("Unlock access to this student's contact information. Cost: ")}
              {t(coinsRequired)}{t(" coins. ")}
              {!hasEnoughCoins &&
              <>
                  <span className="unlock-insufficient">{t(" Your balance: ")}{t(balance)}{t(" coins (insufficient).")}</span>
                  <button
                  type="button"
                  className="unlock-buy-link"
                  onClick={() => setShowBuyInfo(true)}>{t("How can I buy coins? ")}


                </button>
                </>
              }
            </p>
          </div>
          {showBuyInfo &&
          <div className="unlock-buy-info">
              <p>{t("Visit the Buy Coins page to see packages and submit a purchase request.")}</p>
              <Link to="/buy-coins" className="button-primary" onClick={onClose}>{t("Go to Buy Coins")}</Link>
            </div>
          }
        </div>

        <div className="verification-modal-footer">
          <button className="button-secondary" onClick={onClose}>{t("Cancel ")}

          </button>
          <button
            className="button-primary"
            onClick={onConfirm}
            disabled={!hasEnoughCoins}
            title={t(!hasEnoughCoins ? "Insufficient balance" : undefined)}>{t("Unlock Contacts (")}

            {t(coinsRequired)}{t(" coins) ")}
          </button>
        </div>
      </div>
    </div>);

};

export default UnlockContactsModal;
