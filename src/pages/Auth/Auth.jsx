import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "../../context/TranslationContext";
import NotificationToast from "../../components/NotificationToast";
import { authAPI } from "../../services/api";
import { testAPIConnection } from "../../utils/apiTest";
import Intro from "../../components/Intro";
import "./Auth.css";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    secondName: "",
  });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showIntro, setShowIntro] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [authView, setAuthView] = useState("main");
  const [pendingEmail, setPendingEmail] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const { login, register, loginWithGoogle, completeAuth } = useAuth();
  const { initializeFromGoogleLocale } = useTranslation();
  const navigate = useNavigate();

  const resetAuxForms = () => {
    setEmailCode("");
    setResetCode("");
    setNewPassword("");
    setConfirmNewPassword("");
  };

  // Test API connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      const result = await testAPIConnection();
      if (!result.success) {
        setNotification({
          message: "Connection failed. Please try again.",
          type: "error",
        });
      }
    };
    checkConnection();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setNotification(null);

    if (!isLogin) {
      if (formData.password !== formData.confirmPassword) {
        setNotification({ message: "Passwords do not match", type: "error" });
        setLoading(false);
        return;
      }
      if (formData.password.length < 6) {
        setNotification({
          message: "Password must be at least 6 characters",
          type: "error",
        });
        setLoading(false);
        return;
      }
    }

    try {
      let result;
      if (isLogin) {
        result = await login(formData.email, formData.password);
      } else {
        // Simple registration with only essential fields
        // Backend expects 'name' field, not 'firstName' and 'secondName'
        const fullName = `${formData.firstName || ""} ${
          formData.secondName || ""
        }`.trim();
        if (!fullName) {
          setNotification({
            message: "First name and second name are required",
            type: "error",
          });
          setLoading(false);
          return;
        }

        const registerData = {
          email: formData.email,
          password: formData.password,
          name: fullName,
          firstName: formData.firstName || "",
          secondName: formData.secondName || "",
          phone: null,
        };

        result = await register(registerData);
      }

      if (result.success) {
        // Redirect to complete profile page after registration
        if (!isLogin) {
          if (result.emailVerificationRequired) {
            setPendingEmail(formData.email);
            setAuthView("verify-email");
            setNotification({
              message:
                result.message ||
                "We sent a 6-digit verification code to your email.",
              type: "info",
            });
            setFormData({
              email: formData.email,
              password: "",
              confirmPassword: "",
              firstName: "",
              secondName: "",
            });
            setLoading(false);
            return;
          }
          // Check if user has already seen the intro
          const introWatched = localStorage.getItem("introWatched");
          if (!introWatched) {
            setIsNewUser(true);
            setShowIntro(true);
          } else {
            navigate("/complete-profile");
          }
        } else {
          navigate("/dashboard");
        }
      } else {
        if (result.emailVerificationRequired) {
          setPendingEmail(formData.email);
          setAuthView("verify-email");
          setNotification({
            message:
              result.error ||
              "Email is not verified. Enter the 6-digit code sent to your Gmail.",
            type: "info",
          });
        } else if (result.passwordResetRequired) {
          setPendingEmail(formData.email);
          setAuthView("forgot-verify");
          setNotification({
            message:
              result.error ||
              "We sent a 6-digit code to your Gmail. Enter it and set a new password.",
            type: "info",
          });
        } else {
          setNotification({ message: result.error, type: "error" });
        }
      }
    } catch (error) {
      setNotification({
        message: "An error occurred. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmailCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setNotification(null);

    if (!pendingEmail || !emailCode) {
      setNotification({ message: "Enter email and verification code", type: "error" });
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.verifyEmail({ email: pendingEmail, code: emailCode });
      if (response.data?.success && response.data?.token && response.data?.user) {
        completeAuth(response.data.token, response.data.user);
        setNotification({ message: "Email verified successfully.", type: "success" });
        navigate("/dashboard");
      } else {
        setNotification({
          message: response.data?.message || "Failed to verify email code",
          type: "error",
        });
      }
    } catch (error) {
      setNotification({
        message: error.response?.data?.message || "Failed to verify code",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerificationCode = async () => {
    if (!pendingEmail) {
      setNotification({ message: "Enter your email first", type: "error" });
      return;
    }

    try {
      setLoading(true);
      const response = await authAPI.resendVerificationCode({ email: pendingEmail });
      setNotification({
        message: response.data?.message || "Verification code sent",
        type: "success",
      });
    } catch (error) {
      setNotification({
        message: error.response?.data?.message || "Failed to resend code",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestResetCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setNotification(null);

    if (!pendingEmail) {
      setNotification({ message: "Enter your Gmail", type: "error" });
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.requestPasswordResetCode({ email: pendingEmail });
      setAuthView("forgot-verify");
      setNotification({
        message: response.data?.message || "Reset code sent to your email",
        type: "success",
      });
    } catch (error) {
      setNotification({
        message: error.response?.data?.message || "Failed to send reset code",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyResetCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setNotification(null);

    if (!pendingEmail || !resetCode) {
      setNotification({ message: "Enter email and reset code", type: "error" });
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.verifyPasswordResetCode({
        email: pendingEmail,
        code: resetCode,
      });
      if (response.data?.success) {
        setAuthView("forgot-reset");
        setNotification({ message: "Code verified. Set a new password.", type: "success" });
      } else {
        setNotification({
          message: response.data?.message || "Invalid reset code",
          type: "error",
        });
      }
    } catch (error) {
      setNotification({
        message: error.response?.data?.message || "Invalid reset code",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setNotification(null);

    if (newPassword.length < 6) {
      setNotification({ message: "Password must be at least 6 characters", type: "error" });
      setLoading(false);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setNotification({ message: "Passwords do not match", type: "error" });
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.resetPasswordWithCode({
        email: pendingEmail,
        code: resetCode,
        password: newPassword,
      });

      if (response.data?.success) {
        setNotification({ message: "Password updated. Sign in now.", type: "success" });
        setAuthView("main");
        setIsLogin(true);
        setFormData((prev) => ({ ...prev, password: "" }));
        resetAuxForms();
      } else {
        setNotification({
          message: response.data?.message || "Failed to reset password",
          type: "error",
        });
      }
    } catch (error) {
      setNotification({
        message: error.response?.data?.message || "Failed to reset password",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Google Login Handler
  const handleGoogleSuccess = async (tokenResponse) => {
    setGoogleLoading(true);
    setNotification(null);

    try {
      // Get user info from Google using access token
      const userInfoResponse = await fetch(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        }
      );

      if (!userInfoResponse.ok) {
        throw new Error("Failed to fetch user info from Google");
      }

      const userInfo = await userInfoResponse.json();

      // Initialize translation from Google user locale
      if (userInfo.locale) {
        initializeFromGoogleLocale(userInfo.locale);
      }

      // Send access token to backend for authentication
      const result = await loginWithGoogle(tokenResponse.access_token);

      if (result.success) {
        // Check if profile is complete, redirect accordingly
        const user = result.user;
        const hasCompleteInfo =
          user &&
          user.name &&
          user.tel &&
          user.address &&
          user.dateBorn &&
          user.gender &&
          (user.role !== "student" || (user.schoolName && user.schoolId));

        if (!hasCompleteInfo) {
          // Check if user has already seen the intro (for new Google users)
          const introWatched = localStorage.getItem("introWatched");
          if (!introWatched) {
            setIsNewUser(true);
            setShowIntro(true);
          } else {
            navigate("/complete-profile");
          }
        } else {
          navigate("/dashboard");
        }
      } else {
        setNotification({ message: result.error, type: "error" });
      }
    } catch (error) {
      console.error("Google login error:", error);
      setNotification({
        message: "Failed to authenticate with Google. Please try again.",
        type: "error",
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = (error) => {
    console.error("Google OAuth error:", error);
    let errorMessage = "Google login failed. Please try again.";

    // Handle specific error types
    if (error?.error === "popup_closed_by_user") {
      errorMessage = "Google login was cancelled.";
    } else if (error?.error === "access_denied") {
      errorMessage = "Access denied. Please grant the necessary permissions.";
    } else if (error?.error === "popup_blocked") {
      errorMessage = "Popup was blocked. Please allow popups for this site.";
    } else if (
      error?.error?.includes("origin_mismatch") ||
      error?.error?.includes("redirect_uri_mismatch")
    ) {
      errorMessage =
        'Redirect URI mismatch. Please add http://localhost:5173 to BOTH "Authorized JavaScript origins" AND "Authorized redirect URIs" in Google Cloud Console. See docs/FIX_GOOGLE_OAUTH_ERROR.md for details.';
    } else if (error?.error) {
      errorMessage = `Google login error: ${error.error}`;
    }

    setNotification({ message: errorMessage, type: "error" });
    setGoogleLoading(false);
  };

  // Google Login Button Component
  const GoogleLoginButton = ({ onSuccess, onError, loading }) => {
    const googleLogin = useGoogleLogin({
      onSuccess: onSuccess,
      onError: (error) => {
        console.error("=== GOOGLE OAUTH ERROR DEBUG ===");
        console.error("Error:", error);
        console.error("Current origin:", window.location.origin);
        console.error("Current URL:", window.location.href);
        console.error("Full error:", JSON.stringify(error, null, 2));

        // Show helpful message with the exact URI needed
        const currentOrigin = window.location.origin;
        console.error(
          `\n🔧 TO FIX: Add this EXACT URI to Google Cloud Console:`
        );
        console.error(`   Authorized redirect URIs: ${currentOrigin}`);
        console.error(`   Authorized JavaScript origins: ${currentOrigin}`);
        console.error("================================\n");

        onError(error);
      },
      scope: "openid email profile", // Request necessary scopes
    });

    return (
      <button
        type="button"
        className="button-google"
        onClick={() => googleLogin()}
        disabled={loading || googleLoading}
      >
        {loading || googleLoading ? (
          "Processing..."
        ) : (
          <>
            <svg
              className="google-icon"
              viewBox="0 0 24 24"
              width="20"
              height="20"
            >
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </>
        )}
      </button>
    );
  };

  const handleIntroComplete = () => {
    setShowIntro(false);
    navigate("/complete-profile");
  };

  // Show intro video if needed
  if (showIntro) {
    return <Intro onComplete={handleIntroComplete} />;
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card card">
          <div className="auth-header">
            <h1 className="auth-title text-glow">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="auth-subtitle">
              {isLogin
                ? "Sign in to continue to Global Olympiads"
                : "Join Global Olympiads"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {authView === "verify-email" ? (
              <>
                <div className="form-group">
                  <label htmlFor="verifyEmail">Gmail</label>
                  <input
                    type="email"
                    id="verifyEmail"
                    value={pendingEmail}
                    onChange={(e) => setPendingEmail(e.target.value)}
                    autoComplete="email"
                    required
                    placeholder="Enter your Gmail"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="emailCode">6-digit Code</label>
                  <input
                    type="text"
                    id="emailCode"
                    value={emailCode}
                    onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    autoComplete="one-time-code"
                    required
                    placeholder="Enter code from email"
                  />
                </div>

                <button
                  type="button"
                  className="button-primary auth-submit"
                  onClick={handleVerifyEmailCode}
                  disabled={loading || emailCode.length !== 6}
                >
                  {loading ? "Processing..." : "Verify Email"}
                </button>

                <button
                  type="button"
                  className="button-secondary"
                  onClick={handleResendVerificationCode}
                  disabled={loading}
                >
                  Resend Code
                </button>

                <button
                  type="button"
                  className="auth-switch-button"
                  onClick={() => {
                    setAuthView("main");
                    setIsLogin(true);
                    resetAuxForms();
                  }}
                >
                  Back to Sign In
                </button>
              </>
            ) : authView === "forgot-request" ? (
              <>
                <div className="form-group">
                  <label htmlFor="forgotEmail">Gmail</label>
                  <input
                    type="email"
                    id="forgotEmail"
                    value={pendingEmail}
                    onChange={(e) => setPendingEmail(e.target.value)}
                    autoComplete="email"
                    required
                    placeholder="Enter your Gmail"
                  />
                </div>

                <button
                  type="button"
                  className="button-primary auth-submit"
                  onClick={handleRequestResetCode}
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send Reset Code"}
                </button>

                <button
                  type="button"
                  className="auth-switch-button"
                  onClick={() => {
                    setAuthView("main");
                    setIsLogin(true);
                    resetAuxForms();
                  }}
                >
                  Back to Sign In
                </button>
              </>
            ) : authView === "forgot-verify" ? (
              <>
                <div className="form-group">
                  <label htmlFor="forgotEmailReadonly">Gmail</label>
                  <input
                    type="email"
                    id="forgotEmailReadonly"
                    value={pendingEmail}
                    onChange={(e) => setPendingEmail(e.target.value)}
                    autoComplete="email"
                    required
                    placeholder="Enter your Gmail"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="resetCode">6-digit Reset Code</label>
                  <input
                    type="text"
                    id="resetCode"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    autoComplete="one-time-code"
                    required
                    placeholder="Enter reset code"
                  />
                </div>

                <button
                  type="button"
                  className="button-primary auth-submit"
                  onClick={handleVerifyResetCode}
                  disabled={loading || resetCode.length !== 6}
                >
                  {loading ? "Verifying..." : "Verify Code"}
                </button>

                <button
                  type="button"
                  className="button-secondary"
                  onClick={handleRequestResetCode}
                  disabled={loading}
                >
                  Resend Code
                </button>
              </>
            ) : authView === "forgot-reset" ? (
              <>
                <div className="form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    placeholder="Enter new password"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmNewPassword">Confirm New Password</label>
                  <input
                    type="password"
                    id="confirmNewPassword"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    placeholder="Confirm new password"
                  />
                </div>

                <button
                  type="button"
                  className="button-primary auth-submit"
                  onClick={handleResetPassword}
                  disabled={loading || resetCode.length !== 6}
                >
                  {loading ? "Updating..." : "Update Password"}
                </button>
              </>
            ) : (
              <>
            {!isLogin && (
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    autoComplete="given-name"
                    required
                    placeholder="Enter your first name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="secondName">Second Name</label>
                  <input
                    type="text"
                    id="secondName"
                    name="secondName"
                    value={formData.secondName}
                    onChange={handleChange}
                    autoComplete="family-name"
                    required
                    placeholder="Enter your last name"
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                required
                placeholder="Enter your email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                autoComplete={isLogin ? "current-password" : "new-password"}
                required
                placeholder="Enter your password"
              />
              {isLogin && (
                <button
                  type="button"
                  className="auth-link-button"
                  onClick={() => {
                    setPendingEmail(formData.email || "");
                    setAuthView("forgot-request");
                    resetAuxForms();
                  }}
                >
                  Forgot password?
                </button>
              )}
            </div>

            {!isLogin && (
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required={!isLogin}
                  placeholder="Confirm your password"
                />
              </div>
            )}

            <button
              type="submit"
              className="button-primary auth-submit"
              disabled={loading}
            >
              {loading ? "Processing..." : isLogin ? "Sign In" : "Sign Up"}
            </button>
              </>
            )}
          </form>

          {/* Google Login Button */}
          {authView === "main" && (
            <>
              <div className="auth-divider">
                <span>or</span>
              </div>

              <GoogleLoginButton
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                loading={googleLoading}
              />
            </>
          )}

          <div className="auth-switch">
            {authView === "main" ? (
              <>
                <span>
                  {isLogin
                    ? "Don't have an account? "
                    : "Already have an account? "}
                </span>
                <button
                  className="auth-switch-button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setNotification(null);
                    setFormData({
                      email: "",
                      password: "",
                      confirmPassword: "",
                      firstName: "",
                      secondName: "",
                    });
                  }}
                >
                  {isLogin ? "Sign Up" : "Sign In"}
                </button>
              </>
            ) : (
              <button
                className="auth-switch-button"
                onClick={() => {
                  setAuthView("main");
                  setIsLogin(true);
                  resetAuxForms();
                }}
              >
                Back to Sign In
              </button>
            )}
          </div>
        </div>
      </div>

      {notification && (
        <NotificationToast
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default Auth;
