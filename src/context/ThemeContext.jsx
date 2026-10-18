import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};

// System theme - follows OS preference (dark/light)
const getSystemTheme = () => {
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return "light";
};

const SYSTEM_DARK_THEME = {
  name: "system",
  bgPrimary: "#171530",
  bgSecondary: "#23203a",
  bgTertiary: "#302b48",
  textPrimary: "#fbf9f3",
  textSecondary: "#c8c2d7",
  textTertiary: "#a49bb6",
  accent: "#dfcff5",
  border: "#443d59",
  borderHover: "#a48cc6",
  glow: "rgba(0, 0, 0, 0.08)",
  glowStrong: "rgba(0, 0, 0, 0.12)",
  success: "#77c6a4",
  error: "#f095a5",
  warning: "#f9e78f",
};

const SYSTEM_LIGHT_THEME = {
  name: "system",
  bgPrimary: "#fbf9f3",
  bgSecondary: "#ffffff",
  bgTertiary: "#f1edf5",
  textPrimary: "#171530",
  textSecondary: "#716f7a",
  textTertiary: "#898392",
  accent: "#171530",
  border: "#ded9e2",
  borderHover: "#b6a3d0",
  glow: "rgba(23, 21, 48, 0.06)",
  glowStrong: "rgba(23, 21, 48, 0.12)",
  success: "#287657",
  error: "#b74355",
  warning: "#94661f",
};

const THEMES = {
  light: { ...SYSTEM_LIGHT_THEME, name:"light" },
  dark: { ...SYSTEM_DARK_THEME, name:"dark" },
  "kid-friendly": {
    ...SYSTEM_LIGHT_THEME,
    name: "kid-friendly",
  },
};

const DEFAULT_CUSTOM_THEME = {
  name: "custom",
  bgPrimary: "#1a1a2e",
  bgSecondary: "#16213e",
  bgTertiary: "#0f3460",
  textPrimary: "#e94560",
  textSecondary: "#c4c4c4",
  textTertiary: "#8b8b8b",
  accent: "#e94560",
  border: "rgba(233, 69, 96, 0.2)",
  borderHover: "rgba(233, 69, 96, 0.4)",
  glow: "rgba(233, 69, 96, 0.3)",
  glowStrong: "rgba(233, 69, 96, 0.5)",
  success: "#00ff88",
  error: "#ff4444",
  warning: "#ffaa00",
};

const STORAGE_KEYS = {
  theme: "olympiad_theme",
  customTheme: "olympiad_custom_theme",
  itemsPerPage: "olympiad_items_per_page",
};

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(() => {
    try { const saved=localStorage.getItem(STORAGE_KEYS.theme); return saved === "kid-friendly" ? "light" : ["light","dark","system"].includes(saved) ? saved : "system"; }
    catch { return "system"; }
  });
  const [customTheme, setCustomTheme] = useState(DEFAULT_CUSTOM_THEME);
  const itemsPerPage = 10;
  const [systemPreference, setSystemPreference] = useState(getSystemTheme());

  // Listen to system theme changes
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

      const handleChange = (e) => {
        setSystemPreference(e.matches ? "dark" : "light");
      };

      // Modern browsers
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
      }
      // Legacy browsers
      else if (mediaQuery.addListener) {
        mediaQuery.addListener(handleChange);
        return () => mediaQuery.removeListener(handleChange);
      }
    }
  }, []);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedTheme =
      localStorage.getItem(STORAGE_KEYS.theme) || "system";
    const savedCustomTheme = localStorage.getItem(STORAGE_KEYS.customTheme);

    // Preserve explicit light/dark choices; migrate the previous brand-light label.
    if (savedTheme === "kid-friendly") {
      localStorage.setItem(STORAGE_KEYS.theme, "light");
      setCurrentTheme("light");
    } else {
      setCurrentTheme(["light","dark","system"].includes(savedTheme) ? savedTheme : "system");
    }

    if (savedCustomTheme) {
      try {
        setCustomTheme(JSON.parse(savedCustomTheme));
      } catch (e) {
        console.error("Error parsing custom theme:", e);
      }
    }

  }, []);

  // Apply theme to CSS variables
  useEffect(() => {
    let theme;

    if (currentTheme === "custom") {
      theme = customTheme;
    } else if (currentTheme === "system") {
      // Use system preference for system theme
      theme =
        systemPreference === "dark" ? SYSTEM_DARK_THEME : SYSTEM_LIGHT_THEME;
    } else {
      theme = THEMES[currentTheme];
    }

    if (theme) {
      const root = document.documentElement;
      const body = document.body;
      const resolvedMode = currentTheme === "system" ? systemPreference : currentTheme === "dark" ? "dark" : currentTheme === "custom" ? (parseInt(theme.bgPrimary.replace('#','').slice(0,2),16) < 128 ? "dark" : "light") : "light";
      root.dataset.colorMode = resolvedMode;
      root.style.colorScheme = resolvedMode;
      const browserTheme = document.querySelector('meta[name="theme-color"]');
      if (browserTheme) browserTheme.setAttribute('content', resolvedMode==='dark' ? '#171530' : '#dfcff5');

      // Set CSS variables
      root.style.setProperty("--bg-primary", theme.bgPrimary);
      root.style.setProperty("--bg-secondary", theme.bgSecondary);
      root.style.setProperty("--bg-tertiary", theme.bgTertiary);
      root.style.setProperty("--text-primary", theme.textPrimary);
      root.style.setProperty("--text-secondary", theme.textSecondary);
      root.style.setProperty("--text-tertiary", theme.textTertiary);
      root.style.setProperty("--accent", theme.accent);
      root.style.setProperty("--accent-dark", theme.accentDark || theme.accent);
      root.style.setProperty("--accent-light", theme.accentLight || "#dfcff5");
      root.style.setProperty("--accent-green", theme.accent);
      root.style.setProperty("--secondary-yellow", "#f9e78f");
      root.style.setProperty("--border", theme.border);
      root.style.setProperty("--border-hover", theme.borderHover);
      root.style.setProperty("--glow", theme.glow);
      root.style.setProperty("--glow-strong", theme.glowStrong);
      root.style.setProperty("--success", theme.success);
      root.style.setProperty("--error", theme.error);
      root.style.setProperty("--warning", theme.warning);

      // Set data-theme attribute for conditional styling
      if (body) {
        body.setAttribute("data-theme", currentTheme);
        body.dataset.colorMode = resolvedMode;
      }
    }
  }, [currentTheme, customTheme, systemPreference]);

  const changeTheme = (themeName) => {
    if (["light","dark","system"].includes(themeName)) {
      setCurrentTheme(themeName);
      localStorage.setItem(STORAGE_KEYS.theme, themeName);
    }
  };

  const updateCustomTheme = (themeUpdates) => {
    const updated = { ...customTheme, ...themeUpdates };
    setCustomTheme(updated);
    localStorage.setItem(STORAGE_KEYS.customTheme, JSON.stringify(updated));

    // If custom theme is active, apply changes immediately
    if (currentTheme === "custom") {
      setCurrentTheme("custom"); // Trigger re-render
    }
  };


  const resetCustomTheme = () => {
    setCustomTheme(DEFAULT_CUSTOM_THEME);
    localStorage.setItem(
      STORAGE_KEYS.customTheme,
      JSON.stringify(DEFAULT_CUSTOM_THEME)
    );
    if (currentTheme === "custom") {
      setCurrentTheme("custom"); // Trigger re-render
    }
  };

  const value = {
    currentTheme,
    customTheme,
    itemsPerPage,
    changeTheme,
    updateCustomTheme,
    resetCustomTheme,
    availableThemes: ["light", "dark", "system"],
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
