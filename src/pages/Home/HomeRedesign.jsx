import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ArrowRight, GlobeHemisphereWest, Sparkle, List, X, BookOpen, GraduationCap, CheckCircle } from "@phosphor-icons/react";
import "@fontsource-variable/golos-text";
import "@fontsource/cormorant-garamond/600-italic.css";
import { useAuth } from "../../context/AuthContext";
import "./HomeRedesign.css";

const faqItems = [
  { question: "How do olympiad coins work?", answer: "The standard entry fee is 50 coins, and each olympiad shows its price before you start. First place earns 100 coins after the olympiad closes and results are checked. Contact @GlobalOlimpiad on Telegram to top up." },
  { question: "Can I take part from home?", answer: "Yes. You need a stable internet connection, a camera and a microphone, as required by the olympiad rules." },
  { question: "What olympiad formats are available?", answer: "Multiple-choice tests, open-answer questions, essays and mixed formats. The organizer sets the rules and duration." },
  { question: "How is fair participation checked?", answer: "During an olympiad, the platform records activity and proctoring materials: camera, audio and screen. You can review the requirements and test your devices before starting." },
  { question: "What do participants receive?", answer: "Verified results are available after completion. Winners receive official certificates; the organizer determines any selection benefits and conditions." },
  { question: "How can a school or university host an olympiad?", answer: "Contact our team. We can help prepare questions, choose a format, set a schedule and launch your olympiad." },
];
const navItems = [["#about", "About"], ["#services", "How it works"], ["#faq", "FAQ"]];
const steps = [
  ["Create an olympiad", "Choose a format, prepare questions and set a schedule in an easy-to-use builder.", "Tests · Essays · Mixed formats"],
  ["Host it online", "Participants can join from anywhere. Timers and attempt controls are built into the platform.", "One process for everyone"],
  ["Discover new talent", "View rankings, reports and results. Celebrate participant achievements with official certificates.", "Achievements you can see"],
];
function Brand() { return <><img src="/logo_logo.png" width="39" height="39" alt="" /><span>global<span>olympiad</span></span></>; }
const Arrow = () => <ArrowUpRight size={21} aria-hidden="true" />;

export default function HomeRedesign() {
  const { isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const pageRef = useRef(null);
  useEffect(() => {
    const page = pageRef.current;
    if (!page || !window.IntersectionObserver) return;
    const motionPreference = window.matchMedia("(prefers-reduced-motion: no-preference)");
    const elements = page.querySelectorAll(".go-partners, .go-section-heading, .go-opportunity, .go-steps article, .go-security, .go-faq-intro, .go-faq-list, .go-contact, .go-footer");
    let observer;
    const reveal = element => {
      element.classList.remove("go-reveal-pending", "go-reveal-enter");
      observer?.unobserve(element);
    };
    const reset = () => {
      observer?.disconnect();
      elements.forEach(element => element.classList.remove("go-reveal-pending", "go-reveal-enter"));
    };
    const setup = () => {
      reset();
      if (!motionPreference.matches) return;
      observer = new IntersectionObserver(entries => entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        reveal(entry.target);
        entry.target.classList.add("go-reveal-enter");
      }), { threshold: 0.08, rootMargin: "0px 0px -24px 0px" });
      elements.forEach(element => {
        element.classList.add("go-reveal-pending");
        observer.observe(element);
      });
    };
    const revealFocused = event => {
      const element = event.target.closest(".go-reveal-pending, .go-reveal-enter");
      if (element) reveal(element);
    };
    setup();
    motionPreference.addEventListener("change", setup);
    page.addEventListener("focusin", revealFocused);
    return () => { reset(); motionPreference.removeEventListener("change", setup); page.removeEventListener("focusin", revealFocused); };
  }, []);
  const participationPath = isAuthenticated ? "/dashboard" : "/auth";
  return <div className="go-home" ref={pageRef}><div className="go-page">
    <header className="go-header go-container">
      <a href="#hero" className="go-brand" aria-label="Global Olympiad — home"><Brand /></a>
      <nav className="go-desktop-nav" aria-label="Main navigation">{navItems.map(([href, label]) => <a key={href} href={href}>{label}</a>)}<a href="#contact">Contact</a></nav>
      <div className="go-header-actions"><Link className="go-login" to={participationPath}>{isAuthenticated ? "Dashboard" : "Sign in"}<Arrow /></Link><button type="button" className="go-menu-toggle" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} aria-controls="go-mobile-nav" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={23} /> : <List size={23} />}</button></div>
      {menuOpen && <nav id="go-mobile-nav" className="go-mobile-nav" aria-label="Mobile navigation">{[...navItems, ["#contact", "Contact"]].map(([href, label]) => <a key={href} href={href} onClick={() => setMenuOpen(false)}>{label}<Arrow /></a>)}</nav>}
    </header>
    <section id="hero" className="go-hero go-container" aria-labelledby="go-hero-title">
      <div className="go-hero-label"><Sparkle size={16} weight="fill" aria-hidden="true" /> YOUR TALENT HAS NO LIMITS</div>
      <div className="go-hero-portrait go-portrait-boy" aria-hidden="true"><img src="/images/student-boy.webp" width="210" height="230" alt="" fetchpriority="high" /><span>Think bigger.</span></div>
      <div className="go-hero-portrait go-portrait-girl" aria-hidden="true"><img src="/images/student-girl.webp" width="210" height="230" alt="" fetchpriority="high" /><span>Dream bigger.</span></div>
      <BookOpen className="go-hero-book" size={46} weight="light" aria-hidden="true" />
      <h1 id="go-hero-title">Big wins<br />begin<br /><em>with you.</em></h1>
      <p className="go-hero-description">Online olympiads connecting talented students, schools and universities. Show what you can do.</p>
      <div className="go-hero-actions"><Link to={participationPath} className="go-button go-button-dark">Find an olympiad <Arrow /></Link><a href="#services" className="go-hero-secondary">How it works <ArrowRight size={19} aria-hidden="true" /></a></div>
      <div className="go-hero-note"><GlobeHemisphereWest size={30} weight="light" aria-hidden="true" /><span>Online.<br />From anywhere.</span></div>
      <a href="#about" className="go-hero-discover">YOUR NEXT CHAPTER<ArrowRight size={19} aria-hidden="true" /></a>
    </section>
    <section className="go-partners go-container" aria-label="Our partners"><p>Talent grows.<br /><strong>Together with us.</strong></p><div className="go-partner"><img src="/450751796_805988671636911_1329545327916699300_n-removebg-preview.png" alt="" width="42" height="42" loading="lazy" /><span>OzZone School</span></div><div className="go-partner"><img src="/380841402_1328363917810010_4142529405919519408_n-removebg-preview.png" alt="" width="42" height="42" loading="lazy" /><span>Salam International School</span></div><span className="go-partner-tag"><GraduationCap size={21} aria-hidden="true" /> Education with opportunity</span></section>
    <section id="about" className="go-section go-container" aria-labelledby="go-about-title">
      <div className="go-section-heading"><div><p className="go-eyebrow">KNOWLEDGE CHANGES EVERYTHING</p><h2 id="go-about-title">Your next <em>chapter.</em></h2></div><p className="go-section-intro">One platform. Many paths to success.<br />Find the one that fits you.</p></div>
      <div className="go-opportunities">
        <Link to={participationPath} className="go-opportunity go-opportunity-lilac"><span className="go-card-tag">FOR STUDENTS</span><h3>Show your<br />talent</h3><p>Take part in olympiads.<br />Discover new opportunities.</p><img src="/images/student-girl.webp" alt="Student holding a book" width="230" height="230" loading="lazy" /><span className="go-card-arrow" aria-hidden="true"><ArrowUpRight size={26} /></span><span className="go-card-bottom">Start your journey</span></Link>
        <a href="#contact" className="go-opportunity go-opportunity-blue"><span className="go-card-tag">FOR SCHOOLS & UNIVERSITIES</span><h3>Discover future<br />stars</h3><p>Host olympiads online.<br />Bring talented people together.</p><img src="/images/student-boy.webp" alt="Student holding a notebook" width="230" height="230" loading="lazy" /><span className="go-card-arrow" aria-hidden="true"><ArrowUpRight size={26} /></span><span className="go-card-bottom">Become an organizer</span></a>
        <Link to={isAuthenticated ? "/results" : "/auth"} className="go-opportunity go-opportunity-yellow"><span className="go-card-tag">FOR YOUR NEXT WIN</span><h3>Every effort<br />counts</h3><p>Verified results,<br />certificates and achievements.</p><img className="go-card-trophy" src="/images/trophy.webp" alt="Golden winner trophy" width="230" height="230" loading="lazy" /><span className="go-card-arrow" aria-hidden="true"><ArrowUpRight size={26} /></span><span className="go-card-bottom">View results</span></Link>
      </div>
    </section>
    <section id="services" className="go-section go-container go-how" aria-labelledby="go-how-title"><div className="go-section-heading"><div><p className="go-eyebrow">FROM IDEA TO ACHIEVEMENT</p><h2 id="go-how-title">It all starts<br />with <em>one step.</em></h2></div><a className="go-button go-button-outline" href="#contact">Host an olympiad<Arrow /></a></div><div className="go-steps">{steps.map(([title, copy, meta], index) => <article key={title}><span className="go-step-number">0{index + 1}</span><h3>{title}</h3><p>{copy}</p><span className="go-step-meta">{meta}</span></article>)}</div></section>
    <section id="security" className="go-security go-container" aria-labelledby="go-security-title"><div className="go-security-art"><img src="/images/fair-play-student.webp" alt="Student participating fairly in an olympiad" width="280" height="280" loading="lazy" /></div><div><p className="go-eyebrow">FAIR PLAY</p><h2 id="go-security-title">Talent deserves<br /><em>a fair result.</em></h2><p>Attempt controls and proctoring materials help organizers review olympiad participation.</p><ul>{["Camera and audio", "Screen monitoring", "Activity log"].map(label => <li key={label}><CheckCircle size={19} aria-hidden="true" />{label}</li>)}</ul></div></section>
    <section id="faq" className="go-section go-container go-faq" aria-labelledby="go-faq-title"><div className="go-faq-intro"><p className="go-eyebrow">IN CASE YOU WERE WONDERING</p><h2 id="go-faq-title">Good<br /> <em>questions.</em></h2><p>Everything to know<br />before your first start.</p><a href="mailto:support@unistem.uz">Still have questions?<Arrow /></a></div><div className="go-faq-list">{faqItems.map((item, index) => <article key={item.question} className={openFaq === index ? "go-faq-item is-open" : "go-faq-item"}><h3><button type="button" aria-expanded={openFaq === index} aria-controls={`go-faq-answer-${index}`} onClick={() => setOpenFaq(openFaq === index ? null : index)}><span>{item.question}</span><span className="go-faq-toggle" aria-hidden="true"><span /><span /></span></button></h3><div id={`go-faq-answer-${index}`} className="go-faq-answer" aria-hidden={openFaq !== index}><div className="go-faq-answer-clip"><p>{item.answer}</p></div></div></article>)}</div></section>
    <section id="contact" className="go-contact go-container" aria-labelledby="go-contact-title"><div><p className="go-eyebrow">YOUR NEXT WIN IS AHEAD</p><h2 id="go-contact-title">Let us create<br /><em>more opportunities.</em></h2><p>For students, schools and universities.<br />The Global Olympiad team can help you get started.</p><a href="mailto:support@unistem.uz" className="go-button go-button-dark">Contact our team<Arrow /></a></div><img src="/images/trophy.webp" alt="Trophy with ribbons" width="350" height="330" loading="lazy" /></section>
    <footer className="go-footer go-container"><a href="#hero" className="go-brand" aria-label="Global Olympiad — home"><Brand /></a><p>For those ready to go further.</p><a href="mailto:support@unistem.uz">support@unistem.uz<ArrowUpRight size={17} aria-hidden="true" /></a><span>© {new Date().getFullYear()} Global Olympiad</span></footer>
  </div></div>;
}


