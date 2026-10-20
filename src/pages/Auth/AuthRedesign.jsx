import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Eye, EyeSlash, EnvelopeSimple, LockKey, Sparkle, CheckCircle, WarningCircle } from "@phosphor-icons/react";
import "@fontsource-variable/golos-text";
import "@fontsource/cormorant-garamond/600-italic.css";
import { useAuth } from "../../context/AuthContext";
import api, { authAPI } from "../../services/api";
import { getAuthDestination } from "../../utils/authDestination";
import GoogleAuthButton from "../../components/GoogleAuthButton";
import "./AuthRedesign.css";
import { GRADE_CATEGORIES, gradeLabel } from '../../utils/gradeCategories';

const emptyForm = {email:"",password:"",firstName:"",secondName:"",gradeCategory:""};
const titles = {
  "activate-account":["Make this account yours.","Choose your own password to finish your first sign-in."],
  login:["Welcome back.", "Sign in and continue your journey to new achievements."],
  register:["It starts here.", "Create an account and take your first step towards success."],
  "verify-email":["Check your inbox.", "Enter the six-digit code from your email to verify your address."],
  "forgot-request":["Let us get you back in.", "Enter your account email to receive a recovery code."],
  "forgot-verify":["Your code is on its way.", "Enter the six-digit code we sent to your email."],
  "forgot-reset":["New password. Fresh start.", "Choose a password with at least 6 characters."],
};
function errorMessage(error, fallback) { return error?.response?.data?.message || fallback; }

function PasswordField({id,label,value,onChange,autoComplete="new-password",minLength=6}) {
  const [visible,setVisible] = useState(false);
  return <div className="go-auth-field"><label htmlFor={id}>{label}</label><div className="go-auth-input-wrap"><LockKey size={19} aria-hidden="true" /><input id={id} name={id} type={visible ? "text" : "password"} value={value} onChange={onChange} autoComplete={autoComplete} minLength={minLength} required placeholder={autoComplete === "current-password" ? "Your password" : `At least ${minLength} characters`} /><button type="button" className="go-auth-password-toggle" aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible} onClick={()=>setVisible(!visible)}>{visible ? <EyeSlash size={20} /> : <Eye size={20} />}</button></div></div>;
}

export default function AuthRedesign() {
  const [view,setView] = useState("login");
  const [form,setForm] = useState(emptyForm);
  const [busy,setBusy] = useState(false);
  const [googleBusy,setGoogleBusy] = useState(false);
  const [telegramBusy,setTelegramBusy] = useState(false);
  const [telegramConfirmation,setTelegramConfirmation] = useState(null);
  const [notice,setNotice] = useState(null);
  const [setupToken,setSetupToken] = useState("");
  const [pendingEmail,setPendingEmail] = useState("");
  const [code,setCode] = useState("");
  const [newPassword,setNewPassword] = useState("");
  const [confirmNewPassword,setConfirmNewPassword] = useState("");
  const [resendCooldown,setResendCooldown] = useState(0);
  const googleInFlight = useRef(false);
  const telegramInFlight = useRef(false);
  const submitInFlight = useRef(false);
  const {login,register,loginWithGoogle,completeAuth} = useAuth();
  const navigate = useNavigate();
  const mainView = view === "login" || view === "register";
  const disabled = busy || googleBusy || telegramBusy;
  const [title,description] = titles[view];

  useEffect(()=> {
    if (!resendCooldown) return;
    const timer=setTimeout(()=>setResendCooldown(value=>Math.max(0,value-1)),1000);
    return ()=>clearTimeout(timer);
  },[resendCooldown]);

  const change = event => setForm(prev=>({...prev,[event.target.name]:event.target.value}));
  const showError = message => setNotice({type:"error",message});
  const showInfo = message => setNotice({type:"info",message});
  const changeView = next => {
    setTelegramConfirmation(null);
    setNotice(null); setCode(""); setNewPassword(""); setConfirmNewPassword("");
    setForm(prev=>({...prev,password:""}));
    setView(next);
  };

  useEffect(() => {
    const consumeTelegram = () => {
    const values = new URLSearchParams(window.location.hash.slice(1));
    const code = values.get('telegram_code');
    if (!code || telegramInFlight.current) return;
    telegramInFlight.current = true;
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    setTelegramBusy(true);
    api.post('/auth/telegram/consume', { code }).then(({data}) => {
      if (data.confirmationRequired) { setTelegramConfirmation({ code, profile:data.profile }); return; }
      completeAuth(data.token, data.user);
      navigate(getAuthDestination(data.user), { replace:true });
    }).catch(error => showError(errorMessage(error, 'Telegram sign-in failed. Please try again.')))
      .finally(() => { telegramInFlight.current = false; setTelegramBusy(false); });
    };
    consumeTelegram();
    window.addEventListener('hashchange', consumeTelegram);
    return () => window.removeEventListener('hashchange', consumeTelegram);
  }, []);

  const handleTelegram = async () => {
    if (disabled || telegramInFlight.current) return;
    telegramInFlight.current = true; setTelegramBusy(true); setNotice(null);
    try { const {data} = await api.post('/auth/telegram/start'); window.location.assign(data.url); }
    catch(error) { showError(errorMessage(error, 'Telegram is unavailable. Please try again.')); }
    finally { telegramInFlight.current = false; setTelegramBusy(false); }
  };

  const confirmTelegram = async () => {
    if (disabled || !telegramConfirmation || telegramInFlight.current) return;
    telegramInFlight.current = true; setTelegramBusy(true); setNotice(null);
    try {
      const {data} = await api.post('/auth/telegram/consume', {code:telegramConfirmation.code,confirm:true});
      if (!data.token || !data.user) throw Error('Telegram confirmation failed');
      setTelegramConfirmation(null); completeAuth(data.token,data.user);
      navigate(getAuthDestination(data.user),{replace:true});
    } catch(error) { showError(errorMessage(error,'This Telegram link has expired. Please press Start in the bot again.')); }
    finally { telegramInFlight.current=false;setTelegramBusy(false); }
  };

  const handleGoogleSuccess = async ({credential}) => {
    if (!credential || googleInFlight.current || submitInFlight.current) return;
    googleInFlight.current=true; setGoogleBusy(true); setNotice(null);
    try {
      const result=await loginWithGoogle(credential,"id_token");
      if (!result.success) { showError(result.error || "Google sign-in failed."); return; }
      navigate(getAuthDestination(result.user),{replace:true});
    } catch { showError("Could not complete sign-in. Please try again."); }
    finally { googleInFlight.current=false; setGoogleBusy(false); }
  };

  const handleSubmit = async event => {
    event.preventDefault();
    if (submitInFlight.current || googleInFlight.current) return;
    setNotice(null);
    if (view === "register" && (!form.firstName.trim() || !form.secondName.trim())) { showError("Enter your first and last name."); return; }
    if ((view === "forgot-reset" || view === "activate-account") && newPassword !== confirmNewPassword) { showError("Passwords do not match."); return; }
    submitInFlight.current=true; setBusy(true);
    try {
      if (mainView) {
        const email=form.email.trim();
        const result=view === "login" ? await login(email,form.password) : await register({
          email,password:form.password,name:`${form.firstName.trim()} ${form.secondName.trim()}`.trim(),
          firstName:form.firstName.trim(),secondName:form.secondName.trim(),phone:null,
          gradeCategory:form.gradeCategory,
        });
        if (result.passwordChangeRequired) {
          setSetupToken(result.setupToken);setPendingEmail(result.username);setView("activate-account");setNewPassword("");setConfirmNewPassword("");setForm(prev=>({...prev,password:""}));
        } else if (result.emailVerificationRequired) {
          setPendingEmail(email); setCode(""); setResendCooldown(60); setView("verify-email");
          setForm(prev=>({...prev,password:""}));
          showInfo("Verification code sent. Check your inbox and spam folder.");
        } else if (result.passwordResetRequired) {
          setPendingEmail(email); setCode(""); setView("forgot-verify");
          showInfo("A recovery code was sent to your email.");
        } else if (result.success) {
          navigate(result.user ? getAuthDestination(result.user) : "/",{replace:true});
        } else { showError(result.error || "Could not sign in. Check your details and try again."); }
      } else if (view === "activate-account") {
        await api.post('/auth/activate-account',{setupToken,password:newPassword});
        const result=await login(pendingEmail,newPassword);if(!result.success)throw new Error(result.error||'Sign in with your new password.');setSetupToken('');navigate('/profile',{replace:true});
      } else if (view === "verify-email") {
        const {data}=await authAPI.verifyEmail({email:pendingEmail.trim(),code});
        if (!data?.success || !data.token || !data.user) throw new Error("Invalid verification response");
        completeAuth(data.token,data.user);
        navigate(getAuthDestination(data.user),{replace:true});
      } else if (view === "forgot-request") {
        await authAPI.requestPasswordResetCode({email:pendingEmail.trim()});
        setCode(""); setResendCooldown(60); setView("forgot-verify"); showInfo("Code sent. Check your inbox and spam folder.");
      } else if (view === "forgot-verify") {
        const {data}=await authAPI.verifyPasswordResetCode({email:pendingEmail.trim(),code});
        if (!data?.success) { showError(data?.message || "Could not verify the code."); return; }
        setView("forgot-reset"); setNotice(null);
      } else if (view === "forgot-reset") {
        const {data}=await authAPI.resetPasswordWithCode({email:pendingEmail.trim(),code,password:newPassword});
        if (!data?.success) { showError(data?.message || "Could not update the password."); return; }
        setView("login"); setNewPassword(""); setConfirmNewPassword(""); setCode("");
        setForm(prev=>({...prev,email:pendingEmail,password:""}));
        setNotice({type:"success",message:"Password updated. You can now sign in."});
      }
    } catch(error) { showError(errorMessage(error,"The request failed. Please try again.")); }
    finally { submitInFlight.current=false; setBusy(false); }
  };

  const resendCode=async()=> {
    if (submitInFlight.current || resendCooldown) return;
    submitInFlight.current=true; setBusy(true); setNotice(null);
    try {
      if (view === "verify-email") await authAPI.resendVerificationCode({email:pendingEmail.trim()});
      else await authAPI.requestPasswordResetCode({email:pendingEmail.trim()});
      setResendCooldown(60); showInfo("A new code was sent to your email.");
    } catch(error) { showError(errorMessage(error,"Could not send the code. Please try again.")); }
    finally { submitInFlight.current=false; setBusy(false); }
  };

  return <div className="go-auth-page" data-view={view} data-translate="false">
    <img src="/images/auth-landscape.webp" className="go-auth-backdrop" alt="" aria-hidden="true" fetchpriority="high" />
    <div className="go-auth-shade" aria-hidden="true" />
    <header className="go-auth-header"><Link to="/" className="go-auth-brand" aria-label="Global Olympiad — home"><img src="/logo_logo.png" width="40" height="40" alt="" /><span>global<span>olympiad</span></span></Link><Link to="/" className="go-auth-home-link"><ArrowLeft size={17} aria-hidden="true" />Back to home</Link></header>
    <div className="go-auth-layout">
      <section className="go-auth-story" aria-label="Global Olympiad"><span className="go-auth-story-tag"><Sparkle size={16} weight="fill" aria-hidden="true" />YOUR TALENT HAS NO LIMITS</span><h2>Dream bigger.<br />Reach <em>higher.</em></h2><p>Your knowledge can open up a world of opportunities.<br />Start your journey with Global Olympiad.</p><div className="go-auth-story-note"><GlobeNote />Online olympiads. Real opportunities.</div></section>
      <section className={`go-auth-card ${view === "register" ? "is-registration" : ""}`} aria-labelledby="go-auth-title" aria-busy={disabled}>
        {mainView ? <div className="go-auth-tabs" data-active={view} role="group" aria-label="Choose sign-in or registration"><button type="button" className={view === "login" ? "is-active" : ""} aria-pressed={view === "login"} disabled={disabled} onClick={()=>changeView("login")}>Sign in</button><button type="button" className={view === "register" ? "is-active" : ""} aria-pressed={view === "register"} disabled={disabled} onClick={()=>changeView("register")}>Sign up</button></div> : <button className="go-auth-back" type="button" disabled={disabled} onClick={()=>changeView("login")}><ArrowLeft size={17} aria-hidden="true" />Back to sign in</button>}
        <div className="go-auth-heading" key={view}><h1 id="go-auth-title">{title}</h1><p>{description}</p></div>
        {mainView && !telegramConfirmation && <><GoogleAuthButton onSuccess={handleGoogleSuccess} onError={showError} busy={googleBusy} disabled={disabled} allowOneTap={!disabled} />{mainView && <button type="button" className="go-auth-telegram" disabled={disabled} onClick={handleTelegram}><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="#229ED9" d="M21.7 3.3 18.4 20c-.2 1.2-.9 1.5-1.9.9l-5-3.7-2.4 2.3c-.3.3-.5.5-1 .5l.4-5.1 9.4-8.5c.4-.4-.1-.6-.6-.2L5.7 13.5.8 12c-1.1-.4-1.1-1.1.2-1.6L20 3c.9-.3 1.7.2 1.7.3Z"/></svg><span>Continue with Telegram</span></button>}
        <div className="go-auth-divider"><span>or continue with email</span></div></>}
        {notice && <div className={`go-auth-notice ${notice.type}`} role={notice.type === "error" ? "alert" : "status"}>{notice.type === "error" ? <WarningCircle size={19} aria-hidden="true" /> : <CheckCircle size={19} aria-hidden="true" />}<span>{notice.message}</span></div>}
        {telegramConfirmation && <div className="go-auth-telegram-confirmation"><p>Sign in with this Telegram profile?</p><p><strong>{telegramConfirmation.profile.name}</strong>{telegramConfirmation.profile.telegramUsername && <> · @{telegramConfirmation.profile.telegramUsername}</>}</p><button type="button" className="go-auth-telegram" disabled={disabled} onClick={confirmTelegram}><span>{telegramBusy ? "Signing in…" : "Continue with this account"}</span></button><button type="button" className="go-auth-back" disabled={disabled} onClick={()=>setTelegramConfirmation(null)}>Cancel</button></div>}
        <form className="go-auth-form" hidden={Boolean(telegramConfirmation)} onSubmit={handleSubmit}>
          <fieldset disabled={disabled}>
            {view === "register" && <div className="go-auth-name-row"><div className="go-auth-field"><label htmlFor="firstName">First name</label><input id="firstName" name="firstName" value={form.firstName} onChange={change} required autoComplete="given-name" placeholder="Your first name" /></div><div className="go-auth-field"><label htmlFor="secondName">Last name</label><input id="secondName" name="secondName" value={form.secondName} onChange={change} required autoComplete="family-name" placeholder="Your last name" /></div></div>}
            {mainView && <><div className="go-auth-field"><label htmlFor="email">{view === "login" ? "Email or username" : "Email"}</label><div className="go-auth-input-wrap"><EnvelopeSimple size={19} aria-hidden="true" /><input id="email" name="email" type={view === "login" ? "text" : "email"} value={form.email} onChange={change} autoComplete="username" required placeholder="you@example.com" /></div></div><PasswordField id="password" label={view === "register" ? "New Password" : "Password"} value={form.password} onChange={change} autoComplete={view === "login" ? "current-password" : "new-password"} minLength={view === "login" ? null : 6} />{view === "login" && <button type="button" className="go-auth-forgot" onClick={()=>{setPendingEmail(form.email);changeView("forgot-request");}}>Forgot password?</button>}</>}
            {!mainView && view !== "forgot-reset" && view !== "activate-account" && <div className="go-auth-field"><label htmlFor="pendingEmail">{view === "forgot-request" ? "Account email" : "Code sent to"}</label><div className="go-auth-input-wrap"><EnvelopeSimple size={19} aria-hidden="true" /><input id="pendingEmail" type="email" value={pendingEmail} onChange={e=>setPendingEmail(e.target.value)} autoComplete="email" required readOnly={view !== "forgot-request"} placeholder="you@example.com" /></div></div>}
            {(view === "verify-email" || view === "forgot-verify") && <div className="go-auth-field"><label htmlFor="emailCode">Email verification code</label><input className="go-auth-code" id="emailCode" type="text" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,"").slice(0,6))} pattern="[0-9]{6}" minLength={6} maxLength={6} required placeholder="000000" /></div>}
            {(view === "forgot-reset" || view === "activate-account") && <><PasswordField id="newPassword" label="New password" minLength={view === "activate-account" ? 8 : 6} value={newPassword} onChange={e=>setNewPassword(e.target.value)} /><PasswordField id="confirmNewPassword" label="Confirm new password" minLength={view === "activate-account" ? 8 : 6} value={confirmNewPassword} onChange={e=>setConfirmNewPassword(e.target.value)} /></>}
            {view === "register" && <div className="go-auth-field"><label htmlFor="gradeCategory">School grade / education</label><select id="gradeCategory" name="gradeCategory" value={form.gradeCategory} onChange={change} required><option value="">Choose your class</option>{GRADE_CATEGORIES.map(grade => <option key={grade} value={grade}>{gradeLabel(grade)}</option>)}</select></div>}
            <button type="submit" className="go-auth-submit">{busy ? "Please wait…" : view === "login" ? "Sign in" : view === "register" ? "Create account" : view === "forgot-request" ? "Send code" : (view === "forgot-reset" || view === "activate-account") ? "Save password" : "Verify code"}<ArrowUpRight size={20} aria-hidden="true" /></button>
            {(view === "verify-email" || view === "forgot-verify") && <button type="button" className="go-auth-resend" disabled={resendCooldown > 0} onClick={resendCode}>{resendCooldown ? `Resend in ${resendCooldown}s` : "Resend code"}</button>}
          </fieldset>
        </form>
        {!mainView && <p className="go-auth-bottom">{view === "activate-account" ? "Your temporary password will stop working after this change." : "If the email has not arrived, check your spam folder."}</p>}
        
      </section>
    </div>
    <footer className="go-auth-footer"><span>© {new Date().getFullYear()} Global Olympiad</span><a href="mailto:support@unistem.uz">Need help?<ArrowUpRight size={16} aria-hidden="true" /></a></footer>
  </div>;
}

function GlobeNote() { return <CheckCircle size={17} aria-hidden="true" />; }


