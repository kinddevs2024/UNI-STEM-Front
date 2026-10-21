import { t, useLocale } from "../../i18n/runtime";import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Contact.css";

const Contact = () => {useLocale();
  const { isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically send the form data to your backend
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: "", email: "", subject: "", message: "" });
    }, 3000);
  };

  return (
    <div className="contact-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <p className="go-public-eyebrow">{t("LET'S START A CONVERSATION")}</p>
          <h1 className="hero-title">{t("Contact ")}
            <em>{t("Us")}</em>
          </h1>
          <p className="hero-subtitle">{t("We'd love to hear from you")}</p>
        </div>
        <div className="public-hero-art"><img src="/images/student-girl.webp" alt="" aria-hidden="true" width="260" height="280" /></div>
      </section>

      {/* Contact Section */}
      <section className="info-section">
        <div className="section-content">
          <div className="container">
            <div className="contact-container">
              <div className="contact-info">
                <h2 className="section-title">{t("Get in Touch")}</h2>
                <p className="contact-description">{t("Have questions, suggestions, or need support? We're here to help! Fill out the form below or reach out to us through the contact information provided. ")}



                </p>

                <div className="contact-details">
                  <div className="contact-item">
                    <h3>{t("Email")}</h3>
                    <p>{t("support@globalolympiad.com")}</p>
                  </div>
                  <div className="contact-item">
                    <h3>{t("Response Time")}</h3>
                    <p>{t("We typically respond within 24-48 hours")}</p>
                  </div>
                  <div className="contact-item">
                    <h3>{t("Support Hours")}</h3>
                    <p>{t("Monday - Friday: 9:00 AM - 6:00 PM (UTC)")}</p>
                  </div>
                </div>
              </div>

              <div className="contact-form-container">
                {submitted ?
                <div className="success-message">
                    <h3>{t("Thank you for contacting us!")}</h3>
                    <p>{t("We'll get back to you as soon as possible.")}</p>
                  </div> :

                <form className="contact-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                      <label htmlFor="name">{t("Name")}</label>
                      <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder={t("Your name")} />

                    </div>

                    <div className="form-group">
                      <label htmlFor="email">{t("Email")}</label>
                      <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder={t("your.email@example.com")} />

                    </div>

                    <div className="form-group">
                      <label htmlFor="subject">{t("Subject")}</label>
                      <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      placeholder={t("What is this regarding?")} />

                    </div>

                    <div className="form-group">
                      <label htmlFor="message">{t("Message")}</label>
                      <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows="6"
                      placeholder={t("Your message here...")} />

                    </div>

                    <button type="submit" className="submit-button">{t("Send Message ")}

                  </button>
                  </form>
                }
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated &&
      <section className="info-section contact-cta">
          <div className="section-content">
            <div className="container">
              <h2 className="section-title">{t("Ready to Get Started?")}</h2>
              <div className="section-body">
                <p className="get-started-text">{t("Join thousands of students competing in Global Olympiads today! ")}

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
          <p>&copy; {t(new Date().getFullYear())}{t(" Global Olympiads. All rights reserved.")}</p>
        </div>
      </footer>
    </div>);

};

export default Contact;
