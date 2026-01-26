import { useMemo, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import PortfolioThemeProvider from "./ThemeProvider";
import PortfolioHeader from "./PortfolioHeader";
import HeroSection from "./sections/HeroSection";
import SocialLinks from "./SocialLinks";
import ShareButtons from "./ShareButtons";
import EditableSectionWrapper from "../PortfolioEditor/EditableSectionWrapper";
import DraggableSection from "../PortfolioEditor/DraggableSection";
import PortfolioStatusBadge from "../PortfolioStatusBadge/PortfolioStatusBadge";
import { usePortfolioEditor } from "../../hooks/usePortfolioEditor";
import { useState } from "react";
import "../../styles/portfolio.css";

const AboutSection = lazy(() => import("./sections/AboutSection"));
const SkillsSection = lazy(() => import("./sections/SkillsSection"));
const AchievementsSection = lazy(() => import("./sections/AchievementsSection"));
const ProjectsSection = lazy(() => import("./sections/ProjectsSection"));
const CertificatesSection = lazy(() => import("./sections/CertificatesSection"));
const InterestsSection = lazy(() => import("./sections/InterestsSection"));
const EducationSection = lazy(() => import("./sections/EducationSection"));
const CustomSection = lazy(() => import("./sections/CustomSection"));

const SECTION_COMPONENTS = {
  hero: HeroSection,
  about: AboutSection,
  skills: SkillsSection,
  achievements: AchievementsSection,
  projects: ProjectsSection,
  certificates: CertificatesSection,
  interests: InterestsSection,
  education: EducationSection,
  custom: CustomSection,
};

/**
 * Portfolio Renderer Component
 * Converts portfolio JSON config to rendered UI
 * @param {Object} portfolio - Portfolio data object
 * @param {string} sectionId - Optional section ID/slug for multi-page layouts
 * @param {boolean} isOwner - Whether the current user owns this portfolio
 */
const PortfolioRenderer = ({ portfolio, sectionId = null, isOwner = false }) => {
  const { layout, theme, hero, sections, animations } = portfolio || {};
  const [draggedSectionId, setDraggedSectionId] = useState(null);
  
  // Get editor functions if in editor mode
  let editorFunctions = null;
  try {
    editorFunctions = isOwner ? usePortfolioEditor() : null;
  } catch (e) {
    // Not in editor context, that's fine
    editorFunctions = null;
  }
  
  // Use editor portfolio if available, otherwise use passed portfolio
  const displayPortfolio = editorFunctions?.portfolio || portfolio;

  // Handle drag and drop
  const handleDragStart = (sectionId, index) => {
    setDraggedSectionId(sectionId);
  };

  const handleDragEnd = () => {
    setDraggedSectionId(null);
  };

  const handleDrop = (draggedId, targetId, draggedIndex, targetIndex) => {
    if (!editorFunctions || draggedId === targetId) return;

    const currentSections = [...(displayPortfolio?.sections || [])];
    const draggedSection = currentSections.find((s) => s.id === draggedId);
    
    if (!draggedSection) return;

    // Remove dragged section
    const filteredSections = currentSections.filter((s) => s.id !== draggedId);
    
    // Find target index
    const targetSectionIndex = filteredSections.findIndex((s) => s.id === targetId);
    const insertIndex = targetIndex < draggedIndex ? targetSectionIndex : targetSectionIndex + 1;
    
    // Insert at new position
    filteredSections.splice(insertIndex, 0, draggedSection);
    
    // Update order
    const reorderedSections = filteredSections.map((section, index) => ({
      ...section,
      order: index,
    }));

    // Update portfolio
    editorFunctions.updatePortfolio({
      sections: reorderedSections,
    });
  };

  // Sort sections by order and filter enabled ones
  const sortedSections = useMemo(() => {
    const sectionsToUse = displayPortfolio?.sections || sections;
    if (!sectionsToUse || !Array.isArray(sectionsToUse)) return [];
    
    return sectionsToUse
      .filter((section) => section.enabled !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [displayPortfolio?.sections, sections]);

  // Enhanced animation variants based on animation type
  const getAnimationVariants = (animationType = "fade") => {
    const baseTransition = {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1], // Smooth easing
    };

    switch (animationType) {
      case "slide":
        return {
          hidden: { opacity: 0, y: 40, scale: 0.95 },
          visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
              ...baseTransition,
              duration: 0.4,
            },
          },
        };
      case "scale":
        return {
          hidden: { opacity: 0, scale: 0.9 },
          visible: {
            opacity: 1,
            scale: 1,
            transition: baseTransition,
          },
        };
      case "fade":
      default:
        return {
          hidden: { opacity: 0, y: 20 },
          visible: {
            opacity: 1,
            y: 0,
            transition: baseTransition,
          },
        };
    }
  };

  const animationType = displayPortfolio?.animations?.type || "fade";
  const sectionVariants = getAnimationVariants(animationType);

  const containerClass = `${layout === "multi-page" ? "portfolio-multi-page" : "portfolio-single-page"} ${isOwner ? "portfolio-editor-mode" : ""}`;
  const containerWidth = displayPortfolio?.theme?.containerWidth || "medium";

  // Check if we have any content to render
  const displayHero = displayPortfolio?.hero || hero || {};
  // Check if hero has any content (handle null/undefined/empty string)
  const hasHeroContent = displayHero && (
    (displayHero.title && displayHero.title.trim && displayHero.title.trim() !== "") ||
    (displayHero.subtitle && displayHero.subtitle.trim && displayHero.subtitle.trim() !== "") ||
    (displayHero.description && displayHero.description.trim && displayHero.description.trim() !== "") ||
    (displayHero.image && displayHero.image !== null && displayHero.image !== "") ||
    (displayHero.avatar && displayHero.avatar !== null && displayHero.avatar !== "")
  );
  const hasSections = sortedSections.length > 0;

  // For multi-page layouts, filter sections based on sectionId
  const sectionsToRender = useMemo(() => {
    if (layout === "multi-page" && sectionId) {
      // Find the section matching the sectionId
      const sectionSlug = sectionId.toLowerCase();
      const matchingSection = sortedSections.find((section) => {
        // Check if section.slug matches
        if (section.slug && section.slug.toLowerCase() === sectionSlug) {
          return true;
        }
        // Check if section.id matches (e.g., "about-1" -> "about")
        if (section.id && section.id.toLowerCase().startsWith(sectionSlug)) {
          return true;
        }
        // Check if section.type matches
        if (section.type && section.type.toLowerCase() === sectionSlug) {
          return true;
        }
        return false;
      });
      return matchingSection ? [matchingSection] : [];
    }
    // For single-page or home page, return all sections
    return sortedSections;
  }, [layout, sectionId, sortedSections]);

  if (!hasHeroContent && !hasSections) {
    return (
      <PortfolioThemeProvider theme={theme}>
        <div 
          className={`portfolio-container ${containerClass}`}
          data-container-width={containerWidth}
        >
          <div style={{ padding: "4rem 2rem", textAlign: "center" }}>
            <h1>Portfolio</h1>
            <p>This portfolio is empty. Add content to see it here.</p>
          </div>
        </div>
      </PortfolioThemeProvider>
    );
  }

  // For multi-page layouts with sectionId, show only that section (no hero on section pages)
  const shouldShowHero = layout === "multi-page" && sectionId ? false : hasHeroContent;
  const shouldAnimate = displayPortfolio?.animations?.enabled;

  return (
    <PortfolioThemeProvider theme={displayPortfolio?.theme || theme}>
      {/* Portfolio container uses user's Settings theme for page background */}
      {/* Portfolio content sections use portfolio's own theme */}
      <div 
        className={`portfolio-container ${containerClass}`}
        data-container-width={containerWidth}
      >
        {/* Render Header for multi-page layouts */}
        {displayPortfolio?.layout === "multi-page" && (
          <PortfolioHeader portfolio={displayPortfolio} hero={displayHero} />
        )}

        {/* Render Hero Section if exists and has content (only on home page for multi-page) */}
        {shouldShowHero && (
          <motion.div
            initial={shouldAnimate ? "hidden" : false}
            animate={shouldAnimate ? "visible" : false}
            variants={sectionVariants}
          >
            <HeroSection data={displayHero} isOwner={isOwner} portfolio={displayPortfolio} />
          </motion.div>
        )}

        {/* Render Sections */}
        {sectionsToRender.length > 0 ? (
          sectionsToRender.map((section, index) => {
            const SectionComponent = SECTION_COMPONENTS[section.type];
            
            if (!SectionComponent) {
              return null;
            }

            const sectionElement = (
              <Suspense fallback={<div style={{ minHeight: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />}>
                <SectionComponent
                  data={section.content || {}}
                  title={section.title}
                  style={section.style || {}}
                  isOwner={isOwner}
                  section={section}
                  portfolio={displayPortfolio}
                />
              </Suspense>
            );

            const animationDelay = displayPortfolio?.animations?.enabled 
              ? index * 0.05 
              : 0;
            const shouldAnimate = displayPortfolio?.animations?.enabled;

            // Wrap with editable wrapper and draggable if owner
            if (isOwner && editorFunctions) {
              return (
                <motion.div
                  key={section.id || index}
                  initial={shouldAnimate ? "hidden" : false}
                  animate={shouldAnimate ? "visible" : false}
                  whileHover={shouldAnimate ? { 
                    scale: 1.01,
                    transition: { duration: 0.2 }
                  } : {}}
                  variants={sectionVariants}
                  transition={{
                    delay: animationDelay,
                  }}
                >
                  <DraggableSection
                    section={section}
                    index={index}
                    isOwner={isOwner}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDrop={handleDrop}
                  >
                    <EditableSectionWrapper
                      section={section}
                      isOwner={isOwner}
                      onUpdate={(updates) => editorFunctions.updateSection(section.id, updates)}
                      onRemove={() => editorFunctions.removeSection(section.id)}
                      onDuplicate={() => editorFunctions.duplicateSection(section.id)}
                      onReorder={(newIndex) => {
                        // Handled by drag and drop
                      }}
                    >
                      {sectionElement}
                    </EditableSectionWrapper>
                  </DraggableSection>
                </motion.div>
              );
            }

            // Non-owner or no editor context - render normally with animations
            // Use whileInView for scroll-triggered animations instead of animate
            return (
              <motion.div
                key={section.id || index}
                initial={shouldAnimate ? "hidden" : false}
                animate={shouldAnimate ? "visible" : false}
                viewport={{ once: true, margin: "-100px" }}
                variants={sectionVariants}
                transition={{
                  delay: animationDelay,
                }}
              >
                {sectionElement}
              </motion.div>
            );
          })
        ) : (
          <div style={{ padding: "2rem", textAlign: "center" }}>
            <p>No sections to display.</p>
          </div>
        )}

        {/* Image Gallery */}
        {displayPortfolio?.imageGallery && Array.isArray(displayPortfolio.imageGallery) && displayPortfolio.imageGallery.length > 0 && (
          <motion.div
            initial={shouldAnimate ? "hidden" : false}
            animate={shouldAnimate ? "visible" : false}
            variants={sectionVariants}
            className="portfolio-image-gallery-section"
            style={{ padding: "4rem 2rem" }}
          >
            <h2 className="portfolio-section-title" style={{ marginBottom: "2rem", textAlign: "center" }}>
              Gallery
            </h2>
            <div className="portfolio-image-gallery" style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "1.5rem",
              maxWidth: "1200px",
              margin: "0 auto",
            }}>
              {displayPortfolio.imageGallery.map((image, index) => {
                const imageUrl = image.url || image;
                const getImageUrl = (url) => {
                  if (!url) return '';
                  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
                    return url;
                  }
                  if (url.startsWith('/')) {
                    // Get API base URL - use Vite env variable if available, otherwise use current origin
                    let apiBaseUrl = window.location.origin;
                    try {
                      // Try Vite environment variable first
                      if (import.meta && import.meta.env && import.meta.env.VITE_API_URL) {
                        apiBaseUrl = import.meta.env.VITE_API_URL;
                      }
                    } catch (e) {
                      // If import.meta is not available, use window.location.origin (already set)
                    }
                    return `${apiBaseUrl}${url}`;
                  }
                  return url;
                };
                return (
                  <div
                    key={image.id || index}
                    className="portfolio-gallery-item"
                    style={{
                      position: "relative",
                      paddingTop: "75%",
                      backgroundColor: "var(--bg-tertiary)",
                      borderRadius: "8px",
                      overflow: "hidden",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <img
                      src={getImageUrl(imageUrl)}
                      alt={image.title || `Gallery image ${index + 1}`}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      onError={(e) => {
                        console.error('Failed to load gallery image:', imageUrl);
                        e.target.style.display = 'none';
                      }}
                    />
                    {(image.title || image.description) && (
                      <div style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
                        padding: "1rem",
                        color: "white",
                      }}>
                        {image.title && <h3 style={{ margin: 0, fontSize: "1rem", marginBottom: "0.25rem" }}>{image.title}</h3>}
                        {image.description && <p style={{ margin: 0, fontSize: "0.875rem", opacity: 0.9 }}>{image.description}</p>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Social Links */}
        {displayPortfolio?.socialLinks && displayPortfolio.socialLinks.length > 0 && (
          <SocialLinks socialLinks={displayPortfolio.socialLinks} />
        )}

        {/* Share Buttons */}
        {displayPortfolio?.sharing && (
          <ShareButtons portfolio={displayPortfolio} sharing={displayPortfolio.sharing} />
        )}

        {/* Portfolio Footer Credit */}
        <footer className="portfolio-footer">
          <div className="portfolio-footer-content">
            <p className="portfolio-footer-text">
              This portfolio was created by{" "}
              <a href="/" className="portfolio-footer-link" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                UNI STEM
                {/* Portfolio verification status badge */}
                {displayPortfolio?.verificationStatus && (
                  <PortfolioStatusBadge status={displayPortfolio.verificationStatus} size="small" />
                )}
              </a>{" "}
              company
            </p>
          </div>
        </footer>
      </div>
    </PortfolioThemeProvider>
  );
};

export default PortfolioRenderer;

