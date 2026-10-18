import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./DashboardWelcome.css";

function readProgress(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

export default function DashboardWelcome() {
  const { user, isAuthenticated, loading } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const key = `dashboard-tour-v2:${user?._id || user?.id || user?.email || "account"}`;
  const [progress, setProgress] = useState({ key: null, step: 0, done: false });
  const [slot, setSlot] = useState(null);
  const [rect, setRect] = useState(null);
  const [phase, setPhase] = useState("ready");
  const transitionTimer = useRef(null);
  const locked = useRef(false);
  const stage = useRef(null);
  const demo = useRef(null);
  const stored = readProgress(key);
  const step = progress.key === key ? progress.step : stored === "1" ? 1 : stored === "2" ? 2 : 0;
  const done = stored === "done" || (progress.key === key && progress.done);
  const active = !loading && isAuthenticated && user?.role === "student" && !done
    && (pathname === "/dashboard" || (pathname === "/results" && step > 0));

  useEffect(() => {
    const id = active && step < 2 ? pathname === "/dashboard" ? "tutorial-dashboard-slot" : "tutorial-results-slot" : null;
    if (!id) { setSlot(null); return; }
    const find = () => { const element = document.getElementById(id); setSlot(element); return Boolean(element); };
    if (find()) return;
    const observer = new MutationObserver(() => { if (find()) observer.disconnect(); });
    observer.observe(document.body, { childList:true, subtree:true });
    return () => observer.disconnect();
  }, [active, step, pathname, done]);

  useLayoutEffect(() => {
    if (!active) { setRect(null); return; }
    const measure = () => {
      const target = step === 2
        ? [...document.querySelectorAll('.navbar .balance-display')].find(el => el.getBoundingClientRect().width > 0 && !el.closest('[inert]'))
        : demo.current;
      const bounds = target?.getBoundingClientRect();
      if (bounds) {
        const nextRect = { top:bounds.top, left:bounds.left, width:bounds.width, height:bounds.height };
        setRect(current => current && Object.keys(nextRect).every(field => Math.abs(current[field] - nextRect[field]) < 0.5) ? current : nextRect);
        if (locked.current && phase === "arriving") {
          clearTimeout(transitionTimer.current);
          transitionTimer.current = setTimeout(() => { locked.current = false; setPhase("ready"); }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 240);
        }
      }
    };
    if (step < 2) demo.current?.scrollIntoView({ block:"start", behavior:"instant" });
    measure();
    const focusable = () => [...(demo.current?.querySelectorAll('button') || []), ...(stage.current?.querySelectorAll('button') || [])];
    focusable()[0]?.focus({ preventScroll:true });
    const keydown = event => {
      if (event.key === 'Escape') { event.preventDefault(); stage.current?.querySelector('[data-tour-close]')?.click(); }
      if (event.key === 'Tab') {
        const buttons = focusable();
        const index = buttons.indexOf(document.activeElement);
        event.preventDefault();
        buttons[(index + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length]?.focus();
      }
    };
    window.addEventListener('resize', measure);
    const resizeObserver = new ResizeObserver(measure);
    if (demo.current) resizeObserver.observe(demo.current);
    window.addEventListener('scroll', measure, true);
    document.addEventListener('keydown', keydown);
    return () => {
      window.removeEventListener('resize', measure);
      resizeObserver.disconnect();
      window.removeEventListener('scroll', measure, true);
      document.removeEventListener('keydown', keydown);
    };
  }, [active, step, slot]);
  useEffect(() => () => clearTimeout(transitionTimer.current), []);

  const save = value => { try { localStorage.setItem(key, value); } catch { /* In-memory fallback. */ } };
  const finish = () => { clearTimeout(transitionTimer.current); locked.current = false; setPhase("ready"); save("done"); setProgress({ key, step, done:true }); navigate("/dashboard", { replace:true }); };
  const next = () => {
    if (step === 2) { finish(); return; }
    if (locked.current) return;
    locked.current = true;
    setPhase("leaving");
    transitionTimer.current = setTimeout(() => {
      save(String(step + 1));
      setPhase("arriving");
      setProgress({ key, step:step + 1, done:false });
      if (step === 0) navigate("/results", { replace:true });
    }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 150);
  };
  if (!active) {
    return null;
  }

  const card = step === 0 ? <article ref={demo} className="olympiad-card card tutorial-demo-card">
    <span className="dashboard-tour-badge">DEMO · TUTORIAL ONLY</span>
    <div className="olympiad-card-logo-container"><img className="olympiad-card-logo" src="/images/trophy.webp" width="150" height="110" alt="" /></div>
    <div className="olympiad-card-header"><h3 className="olympiad-title">Discovery Olympiad</h3><span className="status-badge status-active">Active</span></div>
    <div className="olympiad-meta"><p>Mathematics · 5 questions</p><p>Duration: 10 minutes</p></div>
    <button type="button" className="button-primary dashboard-tour-start" onClick={next}>Start · 50 coins →</button>
  </article> : <article ref={demo} className="result-item-card card tutorial-demo-card">
    <span className="dashboard-tour-badge">DEMO RESULT · LEARNING EXAMPLE</span>
    <div className="result-item-header"><h3 className="result-item-title">Discovery Olympiad</h3><span className="result-item-badge">test</span></div>
    <div className="result-item-content"><div className="result-item-score"><span className="score-value">85</span><span className="score-divider">/</span><span className="score-total">100</span><span className="score-percentage">(85%)</span></div>
    <div className="result-item-meta"><div className="meta-item"><span className="meta-label">Your place:</span><span className="meta-value">3 out of 120 participants</span></div></div></div>
    <p className="tutorial-demo-note">This is an example, not a real result.</p>
  </article>;
  const coachWidth = Math.min(400, window.innerWidth - 32);
  const coachHeight = window.innerWidth < 760 ? 260 : 310;
  const coachLeft = rect ? step === 2 ? rect.left + rect.width - coachWidth : rect.left + rect.width + 24 : 16;
  const coachTop = rect ? step === 2 || window.innerWidth < 760 ? rect.top + rect.height + 24 : Math.max(100, rect.top) : 110;
  const content = <section ref={stage} className={`dashboard-tour tour-stage tour-coach tour-phase-${phase}`} role="dialog" aria-modal="true" aria-labelledby="dashboard-tour-title"
    aria-busy={phase !== "ready"}
    style={{ top:Math.max(90,Math.min(coachTop, window.innerHeight - coachHeight - 16)), left:Math.max(16, Math.min(coachLeft, window.innerWidth - coachWidth - 16)) }}>
    <div className="dashboard-tour-heading"><span>GET TO KNOW YOUR DASHBOARD · {step + 1} / 3</span><button type="button" data-tour-close onClick={finish} aria-label="Close tutorial">×</button></div>
    <div className="dashboard-tour-step">
      <h2 id="dashboard-tour-title">{["This is an olympiad", "Your results appear here", "These are your coins"][step]}</h2>
      <p className="dashboard-tour-description">{[
        "Choose an olympiad and press Start to take part. This card is a learning example.",
        "You are now on the Results page. After an olympiad, your score and place among participants will appear here.",
        "The highlighted block shows your coin balance. Click it to top up through the administrator on Telegram. This demo does not charge any coins.",
      ][step]}</p>
    </div>
    <div className="dashboard-tour-actions"><button type="button" className="dashboard-tour-skip" onClick={finish}>Skip</button><button type="button" className="button-primary" disabled={phase !== "ready"} onClick={next}>{step === 2 ? "Got it" : "Next →"}</button></div>
  </section>;

  return <>
    <div className="tour-blocker" data-step={step} aria-hidden="true" />
    {rect && <div className="tour-spotlight" aria-hidden="true" style={{ top:rect.top - 8, left:rect.left - 8, width:rect.width + 16, height:rect.height + 16 }} />}
    {step < 2 && slot && createPortal(card, slot)}
    {rect && content}
  </>;
}
