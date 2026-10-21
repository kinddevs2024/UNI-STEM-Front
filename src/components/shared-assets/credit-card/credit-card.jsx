// Adapted from Untitled UI React (MIT). See LICENSE.untitled-ui.
import './credit-card.css';
export default function CreditCard({type='gray-dark',company='Bank transfer',cardNumber='',cardHolder='',cardExpiration='',className=''}) {
 return <div className={`ui-credit-card ui-credit-card--${type} ${className}`}>
  <div className="ui-credit-card-header"><span>{company}</span><svg aria-hidden="true" width="20" height="24" viewBox="0 0 20 24" fill="none"><path d="M15 2a21 21 0 0 1 0 20M10.5 4a16 16 0 0 1 0 16M6 6a12 12 0 0 1 0 12M1.5 8a7 7 0 0 1 0 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg></div>
  <div className="ui-credit-card-footer"><div className="ui-credit-card-details">{(cardHolder||cardExpiration)&&<div className="ui-credit-card-meta"><span>{cardHolder}</span><span>{cardExpiration}</span></div>}<div className="ui-credit-card-number">{cardNumber}</div></div></div>
 </div>;
}
