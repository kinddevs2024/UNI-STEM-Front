// Console security warning
if (typeof console !== 'undefined') {
  console.warn(
    '%cОстановитесь!',
    'font-size: 24px; font-weight: bold; color: red;'
  ) // eslint-disable-line no-console   

  
  console.warn(
    '%cЭта функция браузера предназначена для разработчиков. Если кто-то предложил вам скопировать и вставить что-то здесь, чтобы включить какую-либо функцию в глобальном олимпиаде или взломать чей-то аккаунт, это мошенники. Выполнив эти действия, вы предоставите им доступ к своему аккаунту аккаунт.',
    'font-size: 14px; color: red; line-height: 1.5;'
  )
}
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";
import GoogleOneTap from "./components/GoogleOneTap";
import { getAuthDestination, needsGradeSelection } from "./utils/authDestination";
import Navbar from "./components/Navbar";
import DashboardWelcome from "./components/DashboardWelcome";
import ErrorBoundary from "./components/ErrorBoundary";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import TestOlympiad from "./pages/TestOlympiad";
import EssayOlympiad from "./pages/EssayOlympiad";
import StartOlympiad from "./pages/StartOlympiad";
import Leaderboard from "./pages/Leaderboard";
import Results from "./pages/Results";
import AdminRecordings from "./pages/AdminRecordings/AdminRecordings";
import AdminTickets from "./pages/AdminTickets/AdminTickets";
import TicketAccess from "./pages/TicketAccess/TicketAccess";
import AdminUsers from "./pages/AdminUsers/AdminUsers";
import AdminPanel from "./pages/AdminPanel";
import OwnerPanel from "./pages/OwnerPanel";
import Profile from "./pages/Profile";
import ProfileEdit from "./pages/ProfileEdit";
import ResolterPanel from "./pages/ResolterPanel";
import SchoolTeacherPanel from "./pages/SchoolTeacherPanel";
import CheckerPanel from "./pages/CheckerPanel";
import UniversityDashboard from "./pages/UniversityDashboard";
import UniversityPanel from "./pages/UniversityPanel";
import Settings from "./pages/Settings";
import Universities from "./pages/Universities";
import Schools from "./pages/Schools";
import BuyCoins from "./pages/BuyCoins";
import UpdatePassword from "./pages/UpdatePassword";
import VerifyEmail from "./pages/VerifyEmail";
import { USER_ROLES, GOOGLE_CLIENT_ID } from "./utils/constants";
import { ThemeProvider } from "./context/ThemeContext";
import { TranslationProvider } from "./context/TranslationContext";
import CookieConsentModal from "./components/CookieConsentModal/CookieConsentModal";
import Home from "./pages/Home/Home";
import "./styles/design-tokens.css";
import "./styles/globals.css";
import "./styles/animations.css";
import "@fontsource-variable/golos-text";
import "@fontsource/cormorant-garamond/600-italic.css";
import "./styles/brand-system.css";
import "./styles/dark-theme.css";

const AppRoutes = () => {
  const { isAuthenticated, user, loading } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={loading ? (
          <div style={{ display: "grid", placeItems: "center", minHeight: "100vh" }} role="status" aria-label="Loading account">
            <div className="loading-spinner" />
          </div>
        ) : isAuthenticated ? <Navigate to={getAuthDestination(user)} replace /> : <Home />}
      />

      <Route
        path="/auth"
        element={loading ? <div style={{minHeight:"100svh",display:"grid",placeItems:"center"}} role="status" aria-label="Loading account"><div className="loading-spinner" /></div> : isAuthenticated && !needsGradeSelection(user) ? <Navigate to={getAuthDestination(user)} replace /> : <Auth />}
      />

      <Route path="/updatepassword" element={<UpdatePassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/olympiad/:id/start"
        element={
          <ProtectedRoute>
            <StartOlympiad />
          </ProtectedRoute>
        }
      />

      <Route
        path="/olympiad/:id"
        element={
          <ProtectedRoute>
            <ErrorBoundary>
              <TestOlympiad />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />

      <Route
        path="/olympiad/:id/essay"
        element={
          <ProtectedRoute>
            <EssayOlympiad />
          </ProtectedRoute>
        }
      />

      <Route
        path="/olympiad/:id/leaderboard"
        element={
          <ProtectedRoute>
            <ErrorBoundary>
              <Leaderboard />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />

      <Route
        path="/olympiad/:id/results"
        element={
          <ProtectedRoute>
            <Results />
          </ProtectedRoute>
        }
      />

      <Route
        path="/results"
        element={
          <ProtectedRoute>
            <Results />
          </ProtectedRoute>
        }
      />

      <Route path="/ticket" element={<TicketAccess />} />
      <Route path="/admin/recordings" element={<ProtectedRoute allowedRoles={[USER_ROLES.ADMIN,USER_ROLES.OWNER]}><AdminRecordings /></ProtectedRoute>} />
      <Route path="/admin/tickets" element={<ProtectedRoute allowedRoles={[USER_ROLES.ADMIN,USER_ROLES.OWNER]}><AdminTickets /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute allowedRoles={[USER_ROLES.ADMIN,USER_ROLES.OWNER]}><AdminUsers /></ProtectedRoute>} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole={USER_ROLES.ADMIN}>
            <AdminPanel />
          </ProtectedRoute>
        }
      />

      <Route
        path="/universities"
        element={
          <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.OWNER]}>
            <Universities />
          </ProtectedRoute>
        }
      />

      <Route
        path="/schools"
        element={
          <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.OWNER]}>
            <Schools />
          </ProtectedRoute>
        }
      />

      <Route
        path="/owner"
        element={
          <ProtectedRoute requiredRole={USER_ROLES.OWNER}>
            <OwnerPanel />
          </ProtectedRoute>
        }
      />

      <Route
        path="/resolter"
        element={
          <ProtectedRoute requiredRole={USER_ROLES.RESOLTER}>
            <ResolterPanel />
          </ProtectedRoute>
        }
      />

      <Route
        path="/school-teacher"
        element={
          <ProtectedRoute requiredRole={USER_ROLES.SCHOOL_TEACHER}>
            <SchoolTeacherPanel />
          </ProtectedRoute>
        }
      />

      <Route
        path="/checker"
        element={
          <ProtectedRoute requiredRole={USER_ROLES.CHECKER}>
            <CheckerPanel />
          </ProtectedRoute>
        }
      />

      <Route
        path="/university"
        element={
          <ProtectedRoute requiredRole={USER_ROLES.UNIVERSITY}>
            <UniversityDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/university-panel"
        element={
          <ProtectedRoute requiredRole={USER_ROLES.UNIVERSITY}>
            <UniversityPanel />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute
            allowedRoles={[
              USER_ROLES.STUDENT,
              USER_ROLES.ADMIN,
              USER_ROLES.OWNER,
              USER_ROLES.UNIVERSITY,
              USER_ROLES.SCHOOL_ADMIN,
              USER_ROLES.SCHOOL_TEACHER,
              USER_ROLES.CHECKER,
            ]}
          >
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile/edit"
        element={
          <ProtectedRoute
            allowedRoles={[
              USER_ROLES.STUDENT,
              USER_ROLES.ADMIN,
              USER_ROLES.OWNER,
              USER_ROLES.UNIVERSITY,
              USER_ROLES.SCHOOL_ADMIN,
              USER_ROLES.SCHOOL_TEACHER,
              USER_ROLES.CHECKER,
            ]}
          >
            <ProfileEdit />
          </ProtectedRoute>
        }
      />

      <Route
        path="/complete-profile"
        element={
          <ProtectedRoute>
            <Navigate to="/dashboard" replace />
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />

      <Route
        path="/buy-coins"
        element={
          <ProtectedRoute requiredRole={USER_ROLES.STUDENT}>
            <BuyCoins />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

function RouteScene() {
  const { pathname } = useLocation();
  return <div key={pathname} className="route-scene"><AppRoutes /></div>;
}

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <TranslationProvider>
        <AuthProvider>
          <ThemeProvider>
            <SocketProvider>
              <Router
                future={{
                  v7_startTransition: true,
                  v7_relativeSplatPath: true,
                }}
              >
                <ScrollToTop />
                <GoogleOneTap />
                <CookieConsentWrapper />
                <div className="app">
                  <Navbar />
                  <main className="main-content">
                    <RouteScene />
                  </main>
                </div>
                <DashboardWelcome />
              </Router>
            </SocketProvider>
          </ThemeProvider>
        </AuthProvider>
      </TranslationProvider>
    </GoogleOAuthProvider>
  );
}

// Separate component to handle cookie consent modal
const CookieConsentWrapper = () => {
  const { showCookieConsent, handleCookieConsent, user } = useAuth();

  if (!showCookieConsent || needsGradeSelection(user)) return null;

  return (
    <CookieConsentModal
      onAccept={handleCookieConsent}
      onReject={() => handleCookieConsent(false)}
    />
  );
};

export default App;
