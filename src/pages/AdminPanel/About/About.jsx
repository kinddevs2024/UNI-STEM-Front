import { t, useLocale } from "../../../i18n/runtime";import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Scene3D from "../../components/3D/Scene3D";
import "./About.css";
import "../PanelRedesign.css";

const About = () => {useLocale();
  const { isAuthenticated } = useAuth();

  return (
    <div className="about-page brand-panel" data-brand-panel="admin-about">
      {/* Hero Section */}
      <section className="hero-section h-svh ">
        <div className="hero-3d">
          <Scene3D subject="math" />
        </div>
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="text-glow">{t("About Global Olympiads")}</span>
          </h1>
          <p className="hero-subtitle">{t("Empowering Students Worldwide")}</p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="info-section">
        <div className="section-3d">
          <Scene3D subject="physics" />
        </div>
        <div className="section-content">
          <div className="container">
            <h2 className="section-title">{t("Our Mission")}</h2>
            <div className="section-body">
              <p>{t("Global Olympiads is dedicated to providing a world-class platform for academic excellence and competition. We believe that every student deserves the opportunity to showcase their knowledge, challenge themselves, and compete on a global stage. ")}




              </p>
              <p>{t("Our mission is to create a fair, secure, and engaging environment where students from around the world can participate in academic competitions across multiple subjects, track their progress, and achieve their full potential. ")}




              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="info-section">
        <div className="section-3d">
          <Scene3D subject="chemistry" />
        </div>
        <div className="section-content">
          <div className="container">
            <h2 className="section-title">{t("Our Vision")}</h2>
            <div className="section-body">
              <p>{t("We envision a future where academic competitions are accessible to all students, regardless of their location or background. Through innovative technology and a commitment to excellence, we aim to become the leading platform for online academic competitions worldwide. ")}





              </p>
              <p>{t("Our platform combines cutting-edge proctoring technology, real-time leaderboards, and comprehensive assessment tools to ensure a seamless and fair competition experience for all participants. ")}



              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="info-section">
        <div className="section-3d">
          <Scene3D subject="english" />
        </div>
        <div className="section-content">
          <div className="container">
            <h2 className="section-title">{t("Our Values")}</h2>
            <div className="values-grid">
              <div className="value-card">
                <h3>{t("Integrity")}</h3>
                <p>{t("We maintain the highest standards of academic integrity through advanced proctoring and security measures. ")}


                </p>
              </div>
              <div className="value-card">
                <h3>{t("Excellence")}</h3>
                <p>{t("We strive for excellence in every aspect of our platform, from user experience to competition quality. ")}


                </p>
              </div>
              <div className="value-card">
                <h3>{t("Accessibility")}</h3>
                <p>{t("We believe education and competition should be accessible to all, regardless of geographical or economic barriers. ")}


                </p>
              </div>
              <div className="value-card">
                <h3>{t("Innovation")}</h3>
                <p>{t("We continuously innovate to provide the best possible experience for students, teachers, and administrators. ")}


                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated &&
      <section className="info-section">
          <div className="section-3d">
            <Scene3D subject="science" />
          </div>
          <div className="section-content">
            <div className="container">
              <h2 className="section-title">{t("Join Us Today")}</h2>
              <div className="section-body">
                <p className="get-started-text">{t("Ready to be part of the Global Olympiads community? Sign up now and start your journey towards academic excellence! ")}


              </p>
                <div className="cta-buttons">
                  <Link to="/auth" className="cta-button primary">{t("Sign Up Now ")}

                </Link>
                  <Link to="/auth" className="cta-button secondary">{t("Log In ")}

                </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      }

      {/* Footer */}
      <footer className="home-footer">
        <div className="container">
          <p>{t("© 2024 Global Olympiads. All rights reserved.")}</p>
        </div>
      </footer>
    </div>);

};

export default About;
