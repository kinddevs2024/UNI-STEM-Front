import { t, useLocale } from "../../i18n/runtime";import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Services.css";

const Services = () => {useLocale();
  const { isAuthenticated } = useAuth();

  const services = [
  {
    title: "Test-Based Olympiads",
    description:
    "Participate in multiple-choice and short-answer competitions with real-time scoring and instant feedback.",
    icon: "📝",
    subject: "math"
  },
  {
    title: "Essay Olympiads",
    description:
    "Showcase your writing and analytical skills in comprehensive essay-based competitions.",
    icon: "✍️",
    subject: "english"
  },
  {
    title: "Real-Time Proctoring",
    description:
    "Advanced camera and screen monitoring ensures fair competition and academic integrity.",
    icon: "📹",
    subject: "physics"
  },
  {
    title: "Live Leaderboards",
    description:
    "Track your ranking in real-time and see how you compare with other participants worldwide.",
    icon: "📊",
    subject: "chemistry"
  },
  {
    title: "Multiple Subjects",
    description:
    "Compete across Mathematics, Physics, Chemistry, English, and Science disciplines.",
    icon: "📚",
    subject: "science"
  },
  {
    title: "Comprehensive Results",
    description:
    "Get detailed feedback on your performance with analytics and improvement suggestions.",
    icon: "📈",
    subject: "math"
  }];


  return (
    <div className="services-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <p className="go-public-eyebrow">{t("A PLACE TO GO FURTHER")}</p>
          <h1 className="hero-title">{t("Our ")}
            <em>{t("Services")}</em>
          </h1>
          <p className="hero-subtitle">{t("Everything you need to excel")}</p>
        </div>
        <div className="public-hero-art"><img src="/images/student-boy.webp" alt="" aria-hidden="true" width="260" height="280" /></div>
      </section>

      {/* Services Grid */}
      <section className="info-section">
        <div className="section-content">
          <div className="container">
            <h2 className="section-title">{t("What We Offer")}</h2>
            <div className="services-grid">
              {services.map((service, index) =>
              <div key={index} className="service-card">
                  <div className="service-icon">{t(service.icon)}</div>
                  <h3>{t(service.title)}</h3>
                  <p>{t(service.description)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="info-section">
        <div className="section-content">
          <div className="container">
            <h2 className="section-title">{t("Key Features")}</h2>
            <div className="features-list">
              <div className="feature-item">
                <div className="feature-number">01</div>
                <div className="feature-content">
                  <h3>{t("Secure Platform")}</h3>
                  <p>{t("State-of-the-art security measures protect your data and ensure fair competition. ")}


                  </p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-number">02</div>
                <div className="feature-content">
                  <h3>{t("User-Friendly Interface")}</h3>
                  <p>{t("Intuitive design makes it easy to navigate and participate in competitions. ")}


                  </p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-number">03</div>
                <div className="feature-content">
                  <h3>{t("24/7 Access")}</h3>
                  <p>{t("Access your dashboard, results, and upcoming competitions anytime, anywhere. ")}


                  </p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-number">04</div>
                <div className="feature-content">
                  <h3>{t("Expert Support")}</h3>
                  <p>{t("Our dedicated support team is always ready to help you with any questions or issues. ")}


                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated &&
      <section className="info-section services-cta">
          <div className="section-content">
            <div className="container">
              <h2 className="section-title">{t("Ready to Get Started?")}</h2>
              <div className="section-body">
                <p className="get-started-text">{t("Join thousands of students and start competing in Global Olympiads today! ")}


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
          <img className="services-cta-art" src="/images/trophy.webp" alt="" aria-hidden="true" width="170" height="170" />
        </section>
      }

      {/* Footer */}
      <footer className="home-footer">
        <div className="container">
          <p>&copy; {t(new Date().getFullYear())}{t(" Global Olympiads. All rights reserved.")}</p>
        </div>
      </footer>
    </div>);

};

export default Services;
