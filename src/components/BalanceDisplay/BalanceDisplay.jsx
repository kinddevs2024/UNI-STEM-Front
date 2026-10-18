import { Link } from 'react-router-dom';
import { useAuth } from "../../context/AuthContext";
import "./BalanceDisplay.css";

/**
 * Compact balance/coins display for navbar.
 * Uses existing design tokens and spacing.
 */
const BalanceDisplay = () => {
  const { balance, user } = useAuth();
  if (user?.role !== 'student') return null;

  return (
    <Link to="/buy-coins" className="balance-display" title="Coin balance" aria-label={`Balance: ${balance ?? 0} coins`}>
      <span className="balance-icon" aria-hidden="true">
        <img src="/images/coins-generated.webp" width="25" height="25" alt="" />
      </span>
      <span className="balance-value">{balance}</span>
    </Link>
  );
};

export default BalanceDisplay;
