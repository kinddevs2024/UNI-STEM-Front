import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Home.css";

const valuePoints = [
  "Для учеников: участие из любой точки",
  "Для школ: готовая инфраструктура",
  "Для вузов: быстрый отбор лучших",
];

const workSteps = [
  {
    title: "Создайте олимпиаду",
    description: "Темы, задания и расписание в понятном конструкторе.",
  },
  {
    title: "Проведите онлайн",
    description: "Автоматический таймер, контроль попыток и единый процесс.",
  },
  {
    title: "Получите результаты",
    description: "Рейтинг, отчеты и официальные грамоты после завершения.",
  },
];

const securityItems = [
  "Запись камеры и аудио во время прохождения",
  "Снимки экрана и мониторинг активности",
  "Надежное хранение данных и журнал событий",
];

const roleItems = [
  {
    role: "Студент",
    features: "Участие в олимпиадах, личный кабинет и результаты.",
  },
  {
    role: "Учитель / Организатор",
    features: "Создание заданий, настройка процесса и модерация.",
  },
  {
    role: "Университет",
    features: "Аналитика, отбор лучших участников и отчетность.",
  },
];

const olympiadTypes = [
  "Тестовые",
  "С открытыми ответами и эссе",
  "Смешанные форматы",
];

const faqItems = [
  {
    question: "Можно ли участвовать онлайн из дома?",
    answer:
      "Да. Для участия нужен стабильный интернет, камера и микрофон в соответствии с правилами олимпиады.",
  },
  {
    question: "Какие требования к камере и микрофону?",
    answer:
      "Подойдет ноутбук или ПК с рабочей камерой и микрофоном. Перед стартом проводится быстрая проверка устройств.",
  },
  {
    question: "Как гарантируется честность?",
    answer:
      "Платформа фиксирует активность пользователя, события сессии и материалы прокторинга для проверки.",
  },
  {
    question: "Что получает победитель?",
    answer:
      "Участники получают подтвержденные результаты, а победители — официальные грамоты и преимущества при отборе.",
  },
  {
    question: "Сколько длится олимпиада?",
    answer:
      "Длительность задается организатором. Таймер отображается во время прохождения и завершает попытку автоматически.",
  },
  {
    question: "Как вуз может запустить олимпиаду?",
    answer:
      "Оставьте заявку через форму контактов — команда поможет подготовить задания и запустить олимпиаду за несколько дней.",
  },
];

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="homepage">
      <header className="homepage-nav-wrap">
        <div className="homepage-shell-header homepage-nav">
          <a href="#hero" className="homepage-brand">
            <img src="/logo.png" alt="Global Olympiads logo" className="homepage-brand-logo" />
          </a>

          <nav className="homepage-nav-links" aria-label="Главная навигация">
            <a href="#about">О нас</a>
            <a href="#services">Сервисы</a>
            <a href="#security">Безопасность</a>
            <a href="#faq">FAQ</a>
            <a href="#contact">Контакты</a>
          </nav>

          <Link to={isAuthenticated ? "/dashboard" : "/auth"} className="homepage-nav-login">
            {isAuthenticated ? "Кабинет" : "Войти"}
          </Link>
        </div>
      </header>

      <section id="hero" className="homepage-shell homepage-hero section-card">
        <img src="/Illustration_2.png" alt="" aria-hidden="true" className="hero-decor hero-decor-left" />
        <img src="/Illustration_1.png" alt="" aria-hidden="true" className="hero-decor hero-decor-right" />

        <div className="hero-content">
          <p className="section-kicker">UNI STEM</p>
          <h1>Онлайн-олимпиады, которые открывают путь в университет</h1>
          <p>
            Университеты и школы проводят олимпиады онлайн, а талантливые ученики получают официальные грамоты и приглашения на поступление.
          </p>
          <div className="hero-actions">
            <Link to={isAuthenticated ? "/dashboard" : "/auth"} className="btn btn-primary">
              Найти олимпиаду
            </Link>
            <a href="#contact" className="btn btn-secondary">
              Провести олимпиаду
            </a>
          </div>
        </div>
      </section>

      <section id="about" className="homepage-shell section-grid-two">
        <div>
          <p className="section-kicker">О платформе</p>
          <h2>Мы соединяем таланты и вузы</h2>
          <p className="section-text">
            Платформа для онлайн-олимпиад с официальными результатами, автоматической проверкой и прозрачной аналитикой.
          </p>
          <ul className="check-list">
            {valuePoints.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="illustration-box">
          <img src="/Illustration_3.png" alt="Иллюстрация о состоянии участника" />
        </div>
      </section>

      <section id="services" className="homepage-shell">
        <p className="section-kicker section-center">Как это работает</p>
        <h2 className="section-center">Простой путь к проведению олимпиады</h2>

        <div className="cards-grid cards-grid-3">
          {workSteps.map((step) => (
            <article key={step.title} className="info-card">
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="security" className="homepage-shell section-card section-security">
        <div>
          <p className="section-kicker">Безопасность</p>
          <h2>Серьезная защита и контроль</h2>
          <p className="section-text">
            Мы фиксируем камеру, аудио и экран, чтобы результаты были честными и признаваемыми.
          </p>
          <ul className="check-list">
            {securityItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <img src="/illustration_4.png" alt="Иллюстрация контроля и проверки" className="security-image" />
      </section>

      <section className="homepage-shell">
        <p className="section-kicker section-center">Роли и возможности</p>
        <h2 className="section-center">Кому подходит платформа</h2>

        <div className="cards-grid cards-grid-3">
          {roleItems.map((item) => (
            <article key={item.role} className="info-card role-card">
              <h3>{item.role}</h3>
              <p>{item.features}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="homepage-shell section-card section-types">
        <div>
          <p className="section-kicker">Виды олимпиад</p>
          <h2>Форматы под разные задачи</h2>
          <ul className="pill-list">
            {olympiadTypes.map((type) => (
              <li key={type}>{type}</li>
            ))}
          </ul>
        </div>
        <img src="/illustration_6.png" alt="Иллюстрация форматов олимпиад" className="types-image" />
      </section>

      <section className="homepage-shell">
        <p className="section-kicker section-center">Партнеры</p>
        <h2 className="section-center">С нами работают школы и вузы</h2>

        <div className="partners-row" role="list" aria-label="Партнеры">
          <span role="listitem">University One</span>
          <span role="listitem">STEM School</span>
          <span role="listitem">Edu Center</span>
          <span role="listitem">Science Hub</span>
          <span role="listitem">Future Campus</span>
        </div>
      </section>

      <section className="homepage-shell section-grid-two section-card">
        <div>
          <p className="section-kicker">Результаты</p>
          <h2>Официальные грамоты и отчеты</h2>
          <p className="section-text">
            После завершения олимпиады участники получают подтвержденные результаты, а университеты — аналитические отчеты.
          </p>
          <Link to={isAuthenticated ? "/results" : "/auth"} className="btn btn-primary">
            Смотреть результаты
          </Link>
        </div>

        <img src="/illustration_7.png" alt="Иллюстрация дипломов и достижений" className="docs-image" />
      </section>

      <section id="faq" className="homepage-shell">
        <p className="section-kicker section-center">FAQ</p>
        <h2 className="section-center">Частые вопросы</h2>

        <div className="faq-grid w-full">
          <div className="faq-list w-full">
            {faqItems.map((item) => (
              <details key={item.question} className="faq-item">
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="homepage-shell section-card final-cta">
        <div>
          <p className="section-kicker">Контакты</p>
          <h2>Готовы провести олимпиаду?</h2>
          <p className="section-text">Запустите свой конкурс за несколько дней.</p>
          <a href="mailto:support@unistem.uz" className="btn btn-primary">
            Связаться с нами
          </a>
        </div>
        <img src="/Illustration_11.png" alt="Декоративная иллюстрация поддержки" className="cta-image" />
      </section>
    </div>
  );
};

export default Home;
