import { t, useLocale } from "../../i18n/runtime";import { Link } from 'react-router-dom';
import { useAuth } from "../../context/AuthContext";
import "./BalanceDisplay.css";

/**
 * Compact balance/coins display for navbar.
 * Uses existing design tokens and spacing.
 */
const BalanceDisplay = () => {useLocale();
  const { balance, user } = useAuth();
  if (user?.role !== 'student') return null;

  return (
    <Link to="/buy-coins" className="balance-display" title={t("Coin balance")} aria-label={t(`Balance: ${balance ?? 0} coins`)}>
      <span className="balance-icon" aria-hidden="true">
        <img src="/images/coins-generated.webp" width="25" height="25" alt="" />
      </span>
      <span className="balance-value">{t(balance)}</span>
    </Link>);

};

export default BalanceDisplay;
