import { t, useLocale } from "../../i18n/runtime";import { Link } from "react-router-dom";
import "./About.css";

const About = () => {useLocale();
  return (
    <div className="about-page">
      <section className="hero-section">
        <div className="hero-content">
          <p className="go-public-eyebrow">{t("TALENT HAS NO BORDERS")}</p>
          <h1 className="hero-title">{t("About Global ")}
            <em>{t("Olympiads")}</em>
          </h1>
          <p className="hero-subtitle">{t("Academic competitions for everyone")}</p>
        </div>
        <div className="public-hero-art"><img src="/images/student-girl.webp" alt="" aria-hidden="true" width="260" height="280" /></div>
      </section>

      <section className="info-section">
        <div className="about-content">
          <div className="about-mission"><p className="go-public-eyebrow">{t("KNOWLEDGE OPENS DOORS")}</p><h2>{t("Our ")}<em>{t("Mission")}</em></h2>
          <p>{t("Global Olympiads is the premier online platform for academic competitions across Mathematics, Physics, Chemistry, English, and Science. We bring together students from around the world to compete, learn, and excel in their chosen fields. ")}




            </p>
          <p>{t("We provide a fair, secure, and engaging environment for students to showcase their knowledge and skills through test-based and essay olympiads, with advanced proctoring and instant results. ")}



            </p>
          </div>
          <aside className="about-start"><img src="/images/trophy.webp" alt="" aria-hidden="true" width="140" height="140" /><h2>{t("Get ")}<em>{t("Started")}</em></h2>
          <p>
            <Link to="/auth" className="about-link">{t("Sign in ")}

              </Link>{t(" ")}{t("or")}
              {t(" ")}
            <Link to="/" className="about-link">{t("explore the platform ")}

              </Link>{t(" ")}{t("to join the next competition. ")}

            </p>
          </aside>
        </div>
      </section>
    </div>);

};

export default About;
