import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import PortfolioRenderer from "../../components/Portfolio/PortfolioRenderer";
import PortfolioHead from "../../components/Portfolio/PortfolioHead";
import { portfolioAPI } from "../../services/portfolioAPI";
import { usePortfolioAnalytics } from "../../hooks/usePortfolioAnalytics";
import { normalizeTheme, DEFAULT_THEME } from "../../utils/portfolioThemes";
import { useAuth } from "../../context/AuthContext";
import { PortfolioEditorProvider } from "../../context/PortfolioEditorContext";
import { VerificationProvider } from "../../context/VerificationContext";
import EditorSidePanel from "../../components/PortfolioEditor/EditorSidePanel";
import "./PortfolioView.css";

// Normalize portfolio structure from backend format to frontend format
const normalizePortfolioFromBackend = (backendPortfolio) => {
  const normalized = { ...backendPortfolio };
  
  // Normalize theme: backend has { colors, fonts, styles } -> frontend needs { colors, typography, spacing }
  if (normalized.theme) {
    const backendTheme = normalized.theme;
    normalized.theme = {
      name: backendTheme.name || "minimal",
      colors: {
        primary: backendTheme.colors?.primary || "#000000",
        secondary: backendTheme.colors?.secondary || "#666666",
        background: backendTheme.colors?.background || "#FFFFFF",
        text: backendTheme.colors?.text || "#000000",
        accent: backendTheme.colors?.accent || "#0066FF",
      },
      typography: {
        fontFamily: backendTheme.fonts?.body || backendTheme.fonts?.heading || "Inter, system-ui, sans-serif",
        headingSize: backendTheme.styles?.headingSize || "2.5rem",
        bodySize: backendTheme.styles?.bodySize || "1rem",
      },
      spacing: backendTheme.styles?.spacing || backendTheme.spacing || "normal",
      containerWidth: backendTheme.containerWidth || "medium",
    };
    // Normalize using our theme normalizer (preserves containerWidth)
    normalized.theme = normalizeTheme(normalized.theme);
  } else {
    normalized.theme = normalizeTheme(DEFAULT_THEME);
  }
  
  // Normalize sections: backend has { type, title, content/items, order } -> frontend needs { id, type, enabled, order, title, content }
  if (normalized.sections && Array.isArray(normalized.sections)) {
    normalized.sections = normalized.sections.map((section, index) => {
      if (!section || typeof section !== 'object') {
        return null;
      }
      const normalizedSection = {
        id: section.id || `${section.type}-${index + 1}`,
        type: section.type,
        enabled: section.enabled !== false,
        order: section.order !== undefined ? section.order : index,
        title: section.title || section.type.charAt(0).toUpperCase() + section.type.slice(1),
      };
      
      // Normalize content based on section type
      if (section.items) {
        normalizedSection.content = { [section.type]: section.items };
      } else if (section.content) {
        if (typeof section.content === 'string') {
          normalizedSection.content = { text: section.content };
        } else {
          normalizedSection.content = section.content;
        }
      } else if (section.type === 'about' && !section.content && !section.items) {
        normalizedSection.content = { text: "" };
      } else if (section.type === 'skills' && !section.content && !section.items) {
        normalizedSection.content = { skills: [] };
      } else if (section.type === 'achievements' && !section.content && !section.items) {
        normalizedSection.content = { achievements: [] };
      } else if (section.type === 'projects' && !section.content && !section.items) {
        normalizedSection.content = { projects: [] };
      } else if (section.type === 'education' && !section.content && !section.items) {
        normalizedSection.content = { education: [] };
      } else if (section.type === 'certificates' && !section.content && !section.items) {
        normalizedSection.content = { certificates: [] };
      }
      
      return normalizedSection;
    }).filter(section => section !== null);
  } else {
    normalized.sections = [];
  }
  
  // Handle certificates array - merge into sections if certificates section doesn't exist
  if (normalized.certificates && Array.isArray(normalized.certificates) && normalized.certificates.length > 0) {
    const sectionsArray = Array.isArray(normalized.sections) ? normalized.sections : [];
    const hasCertificatesSection = sectionsArray.some(s => s && s.type === 'certificates');
    if (!hasCertificatesSection) {
      sectionsArray.push({
        id: 'certificates-1',
        type: 'certificates',
        enabled: true,
        order: sectionsArray.length,
        title: 'Certificates',
        content: { certificates: normalized.certificates },
      });
      normalized.sections = sectionsArray;
    } else {
      const certSection = sectionsArray.find(s => s && s.type === 'certificates');
      if (certSection && (!certSection.content?.certificates || !Array.isArray(certSection.content.certificates) || certSection.content.certificates.length === 0)) {
        certSection.content = { certificates: Array.isArray(normalized.certificates) ? normalized.certificates : [] };
      }
    }
  }
  
  // Ensure logo field exists
  if (!normalized.logo) {
    normalized.logo = "";
  }

  // Ensure hero section exists - preserve backend hero data if it exists
  // Handle both null and undefined, and preserve actual values (including null)
  if (!normalized.hero || typeof normalized.hero !== "object") {
    normalized.hero = {
      title: null,
      subtitle: null,
      description: null,
      image: null,
      avatar: null,
      ctaText: null,
      ctaLink: null,
    };
  } else {
    // Ensure all hero fields are present, preserving backend values (including null)
    normalized.hero = {
      title: normalized.hero.title !== undefined ? normalized.hero.title : null,
      subtitle: normalized.hero.subtitle !== undefined ? normalized.hero.subtitle : null,
      description: normalized.hero.description !== undefined ? normalized.hero.description : null,
      image: normalized.hero.image !== undefined ? normalized.hero.image : null,
      avatar: normalized.hero.avatar !== undefined ? normalized.hero.avatar : null,
      ctaText: normalized.hero.ctaText !== undefined ? normalized.hero.ctaText : null,
      ctaLink: normalized.hero.ctaLink !== undefined ? normalized.hero.ctaLink : null,
    };
  }
  
  // Ensure animations object exists
  if (!normalized.animations) {
    normalized.animations = {
      enabled: true,
      type: "fade",
    };
  }
  
  // Map isPublic to visibility
  if (normalized.isPublic !== undefined && !normalized.visibility) {
    normalized.visibility = normalized.isPublic ? "public" : "private";
  } else if (!normalized.visibility) {
    normalized.visibility = "public";
  }
  
  // Preserve new features: SEO, social links, sharing, analytics, custom code, favicon, etc.
  // These fields are passed through as-is from backend
  if (!normalized.seo) normalized.seo = {};
  if (!normalized.socialLinks) normalized.socialLinks = [];
  if (!normalized.sharing) normalized.sharing = {};
  if (!normalized.analytics) normalized.analytics = {};
  if (!normalized.customCode) normalized.customCode = {};
  if (!normalized.favicon) normalized.favicon = '';
  if (!normalized.background) normalized.background = {};
  if (!normalized.fonts) normalized.fonts = {};
  // Handle both gallery and imageGallery field names
  if (!normalized.gallery && !normalized.imageGallery) {
    normalized.imageGallery = [];
  } else if (normalized.gallery && !normalized.imageGallery) {
    normalized.imageGallery = normalized.gallery;
  }
  if (!normalized.statistics) normalized.statistics = {};
  
  return normalized;
};

const PortfolioView = () => {
  const { slug, sectionId } = useParams();
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Check if current user is the portfolio owner
  const isOwner = user && portfolio && user?._id === portfolio?.studentId;
  
  // Apply portfolio's theme to body when portfolio loads
  // Portfolio theme is different from user's Settings theme
  useEffect(() => {
    if (portfolio && portfolio.theme) {
      const normalizedTheme = normalizeTheme(portfolio.theme);
      // Apply portfolio's background color to body
      document.body.style.backgroundColor = normalizedTheme.colors.background || "#ffffff";
      document.body.style.color = normalizedTheme.colors.text || "#000000";
    }
    
    return () => {
      // Reset body styles when component unmounts
      document.body.style.backgroundColor = "";
      document.body.style.color = "";
    };
  }, [portfolio?.theme]);

  const fetchPortfolio = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await portfolioAPI.getPortfolioBySlug(slug);
      
      // Handle nested response structure: { success: true, data: {...} }
      let portfolioData = null;
      if (response && response.data) {
        // Check for nested structure first: { success: true, data: {...} }
        if (response.data.success !== undefined && response.data.data) {
          portfolioData = response.data.data;
        } 
        // Check if response.data itself is the portfolio (has _id or slug)
        else if (response.data._id || response.data.slug) {
          portfolioData = response.data;
        }
        // If response.data has a data property, try that
        else if (response.data.data) {
          portfolioData = response.data.data;
        }
      }

      if (portfolioData) {
        // Normalize portfolio structure from backend format to frontend format
        const normalizedPortfolio = normalizePortfolioFromBackend(portfolioData);
        setPortfolio(normalizedPortfolio);
      } else {
        setError("Portfolio not found.");
      }
    } catch (err) {
      console.error("Error fetching portfolio:", err);
      // Handle network errors vs API errors
      if (err.code === "ERR_NETWORK" || err.message?.includes("Network")) {
        setError("Connection failed. Please try again.");
      } else {
        // Backend handles privacy - if portfolio is private, backend will return error message
        // Check for common private portfolio messages
        const errorMessage = err.response?.data?.message || 
                            err.response?.data?.error ||
                            "Portfolio not found or is unavailable.";
        
        // If backend says portfolio is private, show that message
        if (errorMessage.toLowerCase().includes("private") || 
            err.response?.status === 403) {
          setError(errorMessage);
        } else {
          setError(errorMessage);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (slug) {
      fetchPortfolio();
    } else {
      setLoading(false);
      setError("Invalid portfolio URL.");
    }
  }, [slug, fetchPortfolio]);

  // Track analytics
  usePortfolioAnalytics(portfolio?._id, portfolio?.visibility);

  if (loading) {
    return (
      <div className="portfolio-page-container page-container">
        <div className="portfolio-view-loading">
          <div className="loading-spinner"></div>
          <p>Loading portfolio...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="portfolio-page-container page-container">
        <div className="portfolio-view-error">
          <div className="error-icon">⚠️</div>
          <h2>Portfolio Not Found</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="portfolio-page-container page-container">
        <div className="portfolio-view-error">
          <div className="error-icon">📭</div>
          <h2>Portfolio Not Found</h2>
          <p>This portfolio does not exist.</p>
        </div>
      </div>
    );
  }

  // Backend handles privacy - if we get here, portfolio is accessible

  // Ensure portfolio is valid before rendering
  if (!portfolio || typeof portfolio !== 'object') {
    return (
      <div className="portfolio-view">
        <div className="portfolio-view-error">
          <div className="error-icon">⚠️</div>
          <h2>Invalid Portfolio Data</h2>
          <p>The portfolio data is invalid or corrupted.</p>
        </div>
      </div>
    );
  }

  // Wrap with verification provider for all viewers
  const portfolioContent = (
    <>
      <PortfolioHead portfolio={portfolio} />
    <div className="portfolio-page-container">
      <VerificationProvider portfolio={portfolio}>
        {isOwner ? (
          <PortfolioEditorProvider portfolio={portfolio} isOwner={isOwner}>
            <div className={`portfolio-view-container ${isEditorOpen ? "editor-open" : ""}`}>
              <EditorSidePanel
                isOpen={isEditorOpen}
                onToggle={() => setIsEditorOpen(!isEditorOpen)}
                position="right"
              />
              <div className="portfolio-content-wrapper">
                <PortfolioRenderer portfolio={portfolio} sectionId={sectionId} isOwner={isOwner} />
              </div>
            </div>
          </PortfolioEditorProvider>
        ) : (
            <div className="portfolio-view-container">
          <PortfolioRenderer portfolio={portfolio} sectionId={sectionId} isOwner={false} />
            </div>
        )}
      </VerificationProvider>
    </div>
    </>
  );

  return portfolioContent;
};

export default PortfolioView;

