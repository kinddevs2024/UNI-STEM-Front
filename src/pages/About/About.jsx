import { Link } from "react-router-dom";
import "./About.css";

const About = () => {
  return (
    <div className="about-page">
      <section className="hero-section">
        <div className="hero-content">
          <p className="go-public-eyebrow">TALENT HAS NO BORDERS</p>
          <h1 className="hero-title">
            About Global <em>Olympiads</em>
          </h1>
          <p className="hero-subtitle">Academic competitions for everyone</p>
        </div>
        <div className="public-hero-art"><img src="/images/student-girl.webp" alt="" aria-hidden="true" width="260" height="280" /></div>
      </section>

      <section className="info-section">
        <div className="about-content">
          <div className="about-mission"><p className="go-public-eyebrow">KNOWLEDGE OPENS DOORS</p><h2>Our <em>Mission</em></h2>
          <p>
            Global Olympiads is the premier online platform for academic competitions
            across Mathematics, Physics, Chemistry, English, and Science. We
            bring together students from around the world to compete, learn, and
            excel in their chosen fields.
          </p>
          <p>
            We provide a fair, secure, and engaging environment for students to
            showcase their knowledge and skills through test-based and essay
            olympiads, with advanced proctoring and instant results.
          </p>
          </div>
          <aside className="about-start"><img src="/images/trophy.webp" alt="" aria-hidden="true" width="140" height="140" /><h2>Get <em>Started</em></h2>
          <p>
            <Link to="/auth" className="about-link">
              Sign in
            </Link>{" "}
            or{" "}
            <Link to="/" className="about-link">
              explore the platform
            </Link>{" "}
            to join the next competition.
          </p>
          </aside>
        </div>
      </section>
    </div>
  );
};

export default About;
