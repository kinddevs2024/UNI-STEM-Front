import { createContext, useContext, useState, useEffect } from "react";
import { googleLogout } from "@react-oauth/google";
import { authAPI } from "../services/api";
import {hasCookieDecision, readDeviceCookieConsent, writeDeviceCookieConsent, COOKIE_CONSENT_STORAGE_KEY} from '../utils/cookieConsent';
import {
  getToken,
  setToken,
  removeToken,
  getUser,
  setUser,
  removeUser,
} from "../utils/helpers";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showCookieConsent, setShowCookieConsent] = useState(false);
  const [oneTapSignedOut, setOneTapSignedOut] = useState(() => {
    try { return sessionStorage.getItem('googleOneTapSignedOut') === '1'; }
    catch { return false; }
  });

  const checkCookieConsent = hasCookieDecision;

  useEffect(() => {
    const update = event => {
      if (event.key === COOKIE_CONSENT_STORAGE_KEY && readDeviceCookieConsent() !== null) {
        setShowCookieConsent(false);
      }
    };
    window.addEventListener('storage', update);
    return () => window.removeEventListener('storage', update);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const token = getToken();
      const savedUser = getUser();

      if (token && savedUser) {
        try {
          const response = await authAPI.getMe();
          const userData = response.data;

          // Ensure devices array exists
          if (!userData.devices) {
            userData.devices = [];
          }

          setUserState(userData);
          setUser(userData);
          setIsAuthenticated(true);

          // Check if user has given cookie consent (cookies field is null)
          setShowCookieConsent(!checkCookieConsent(userData));
        } catch (error) {
          removeToken();
          removeUser();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({
        email,
        password,
      });
      if (response.data.passwordChangeRequired) return {...response.data,success:false};
      const { token } = response.data;

      setToken(token);

      // Fetch updated user data with devices and cookies from /me endpoint
      try {
        const meResponse = await authAPI.getMe();
        const userData = meResponse.data;

        // Ensure devices array exists
        if (!userData.devices) {
          userData.devices = [];
        }

        setUser(userData);
        setUserState(userData);
        setIsAuthenticated(true);

        // Check if user has given cookie consent (cookies field is null)
        setShowCookieConsent(!checkCookieConsent(userData));
      } catch (meError) {
        console.error("Error fetching user data after login:", meError);
        // Fallback to user data from login response if /me fails
        const { user } = response.data;
        if (!user.devices) {
          user.devices = [];
        }
        setUser(user);
        setUserState(user);
        setIsAuthenticated(true);

        setShowCookieConsent(!checkCookieConsent(user));
      }

      return { success: true, user: getUser() };
    } catch (error) {
      if (error.response?.status !== 401) {
        console.error("Login error:", error);
      }
      const passwordResetRequired =
        error.response?.data?.passwordResetRequired === true;
      const emailVerificationRequired =
        error.response?.data?.emailVerificationRequired === true;
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        (error.code === "ERR_NETWORK"
          ? "Connection failed. Please try again."
          : "Login failed");
      return {
        success: false,
        error: errorMessage,
        passwordResetRequired,
        emailVerificationRequired,
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register({
        ...userData,
      });
      const { token, emailVerificationRequired, message } = response.data || {};

      if (emailVerificationRequired) {
        return { success: true, emailVerificationRequired, message };
      }

      if (!token) {
        return {
          success: false,
          error: message || "Registration failed",
        };
      }

      setToken(token);

      // Fetch updated user data with devices and cookies from /me endpoint
      try {
        const meResponse = await authAPI.getMe();
        const userDataFromMe = meResponse.data;

        // Ensure devices array exists
        if (!userDataFromMe.devices) {
          userDataFromMe.devices = [];
        }

        setUser(userDataFromMe);
        setUserState(userDataFromMe);
        setIsAuthenticated(true);

        // Check if user has given cookie consent (cookies field is null)
        setShowCookieConsent(!checkCookieConsent(userDataFromMe));
      } catch (meError) {
        console.error("Error fetching user data after registration:", meError);
        // Fallback to user data from register response if /me fails
        const { user } = response.data;
        if (!user.devices) {
          user.devices = [];
        }
        setUser(user);
        setUserState(user);
        setIsAuthenticated(true);

        setShowCookieConsent(!checkCookieConsent(user));
      }

      return { success: true, user: getUser() };
    } catch (error) {
      console.error("Registration error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        (error.code === "ERR_NETWORK"
          ? "Connection failed. Please try again."
          : "Registration failed");
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const loginWithGoogle = async (googleToken, tokenType = 'access_token') => {
    try {
      const response = await authAPI.loginWithGoogle(
        tokenType === 'id_token' ? { credential: googleToken } : { token: googleToken }
      );
      const { token } = response.data;

      setToken(token);

      // Fetch updated user data with devices and cookies from /me endpoint
      try {
        const meResponse = await authAPI.getMe();
        const userData = meResponse.data;

        // Ensure devices array exists
        if (!userData.devices) {
          userData.devices = [];
        }

        setUser(userData);
        setUserState(userData);
        setIsAuthenticated(true);

        // Check if user has given cookie consent (cookies field is null)
        setShowCookieConsent(!checkCookieConsent(userData));

        return { success: true, user: userData };
      } catch (meError) {
        console.error("Error fetching user data after Google login:", meError);
        // Fallback to user data from Google login response if /me fails
        const { user } = response.data;
        if (!user.devices) {
          user.devices = [];
        }
        setUser(user);
        setUserState(user);
        setIsAuthenticated(true);

        setShowCookieConsent(!checkCookieConsent(user));

        return { success: true, user };
      }
    } catch (error) {
      console.warn("Google sign-in could not be completed.");
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        (error.code === "ERR_NETWORK"
          ? "Connection failed. Please try again."
          : "Google login failed");
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const logout = () => {
    setShowCookieConsent(false);
    googleLogout();
    setOneTapSignedOut(true);
    try { sessionStorage.setItem('googleOneTapSignedOut', '1'); } catch { /* Storage may be unavailable. */ }
    removeToken();
    removeUser();
    setUserState(null);
    setIsAuthenticated(false);
  };

  const updateUser = (userData) => {
    setUserState(userData);
    setUser(userData);
  };

  const completeAuth = (token, userData) => {
    if (token) {
      setToken(token);
    }

    if (userData) {
      const normalizedUser = { ...userData };
      if (!normalizedUser.devices) {
        normalizedUser.devices = [];
      }
      setUserState(normalizedUser);
      setUser(normalizedUser);
      setIsAuthenticated(true);

      setShowCookieConsent(!checkCookieConsent(normalizedUser));
    }
  };

  // Balance/coins: derive from user, refresh from API
  const balance = typeof user?.coins === "number" ? user.coins : 0;

  const refreshBalance = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await authAPI.getBalance();
      if (res.data?.success && typeof res.data.coins === "number") {
        setUserState((prev) => {
          if (!prev || prev.coins === res.data.coins) return prev;
          const updated = { ...prev, coins: res.data.coins };
          if (updated) setUser(updated);
          return updated;
        });
        return res.data.coins;
      }
    } catch (err) {
      console.warn("Refresh balance failed:", err);
    }
    return null;
  };

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'student') return;
    const refresh = () => refreshBalance();
    refresh();
    const timer = setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    return () => { clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, [isAuthenticated, user?._id, user?.role]);

  const handleCookieConsent = async (consent) => {
    if (typeof consent !== 'boolean') throw new Error('Invalid cookie choice');
    const actorId = user?._id;
    const apply = () => {
      setUserState(current => {
        if (!current || current._id !== actorId) return current;
        const updated = {...current, cookies:String(consent)};
        try {setUser(updated);} catch { /* Device storage may be restricted. */ }
        return updated;
      });
      setShowCookieConsent(false);
    };
    const syncAccount = async () => {
      const response = await authAPI.updateCookieConsent({consent});
      if (response.data?.success !== true || response.data?.cookies !== String(consent)) {
        throw new Error("Your cookie preference was not saved. Please try again.");
      }
    };
    if (writeDeviceCookieConsent(consent)) {
      apply();
      // Device persistence works even when the account endpoint is unavailable.
      void syncAccount().catch(() => {});
    } else {
      await syncAccount();
      apply();
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    oneTapSignedOut,
    login,
    register,
    loginWithGoogle,
    logout,
    setUser: updateUser,
    completeAuth,
    showCookieConsent,
    handleCookieConsent,
    balance,
    refreshBalance,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
