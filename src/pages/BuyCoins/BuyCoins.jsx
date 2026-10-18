import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './BuyCoins.css';
const TELEGRAM = 'https://t.me/GlobalOlimpiad';
export default function BuyCoins() {
  const { balance } = useAuth();
  const [selected, setSelected] = useState(100);
  const [custom, setCustom] = useState('');
  const amount = selected === 'custom' ? Number(custom) : selected;
  const valid = Number.isSafeInteger(amount) && amount > 0 && amount <= 1000000;
  return <div className="buy-coins-page">
    <header className="buy-coins-header"><div className="buy-coins-header-copy"><p className="go-account-eyebrow">YOUR NEXT OLYMPIAD</p><h1 className="buy-coins-title">Top up <em>Coins</em></h1><p className="buy-coins-subtitle">Use coins to enter olympiads. Each entry fee is shown before you start.</p><div className="buy-coins-balance"><img src="/images/coins-generated.webp" width="28" height="28" alt=""/><span>Your balance: <strong>{balance ?? 0}</strong> coins</span></div></div><img className="buy-coins-art" src="/images/trophy.webp" alt="" width="190" height="190"/></header>
    <section className="buy-coins-content"><div className="card buy-coins-card"><h2 className="section-title">How many coins do you need?</h2><p className="section-description">Choose an amount, then contact the administrator on Telegram. Online payments are not available yet.</p><div className="coin-packages">{[50,100,250].map(coins=><button type="button" key={coins} className={`coin-package ${selected === coins ? 'selected' : ''}`} aria-pressed={selected===coins} onClick={()=>setSelected(coins)}><div className="package-coins">{coins} coins</div></button>)}<button type="button" className={`coin-package ${selected==='custom'?'selected':''}`} aria-pressed={selected==='custom'} onClick={()=>setSelected('custom')}><div className="package-coins">Custom</div></button></div>{selected==='custom'&&<div className="form-group custom-amount-row"><label htmlFor="coin-amount">Amount of coins</label><input id="coin-amount" type="number" min="1" max="1000000" step="1" value={custom} onChange={e=>setCustom(e.target.value)} placeholder="e.g. 150"/></div>}
    <div className="buy-coins-form-section"><h3>Contact the administrator</h3><p className="form-description">Request {valid?amount:'your chosen amount'} coins from @GlobalOlimpiad. Include your account email and agree on payment details directly with the administrator. Coins are added manually after confirmation.</p><a className="button-primary" href={TELEGRAM} target="_blank" rel="noopener noreferrer">Open Telegram →</a></div></div><div className="card buy-coins-info"><h3>How coins work</h3><ul><li>The standard olympiad entry fee is 50 coins. Organizers can set a different fee.</li><li>The entry fee is deducted when you start, once per olympiad. Resuming does not charge you again.</li><li>First place earns 100 coins after the olympiad closes and results are checked.</li></ul><Link to="/dashboard" className="button-secondary">Back to Dashboard</Link></div></section>
  </div>;
}