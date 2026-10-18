import { useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from '../../context/TranslationContext';
import './Settings.css';

const Settings = () => {
  const {
    currentTheme,
    changeTheme,
    availableThemes,
  } = useTheme();

  const [languageSearch, setLanguageSearch] = useState('');
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const languagePickerRef = useRef(null);
  
  const {
    autoTranslate,
    targetLanguage,
    isTranslating,
    toggleAutoTranslate,
    changeLanguage,
    availableLanguages,
  } = useTranslation();
  
  // Filter languages based on search
  const filteredLanguages = useMemo(() => {
    if (!languageSearch.trim()) return availableLanguages;
    const searchLower = languageSearch.toLowerCase();
    return availableLanguages.filter(
      (lang) =>
        lang.name.toLowerCase().includes(searchLower) ||
        lang.code.toLowerCase().includes(searchLower)
    );
  }, [availableLanguages, languageSearch]);

  const selectedLanguage = useMemo(
    () => availableLanguages.find((lang) => lang.code === targetLanguage) || { code: targetLanguage, name: targetLanguage },
    [availableLanguages, targetLanguage]
  );

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!languagePickerRef.current?.contains(event.target)) {
        setLanguageMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  useEffect(() => {
    setLanguageSearch('');
  }, [targetLanguage]);

  const handleThemeChange = (themeName) => {
    changeTheme(themeName);
  };


  return (
    <div className="settings-page">
      <div className="container">
        <div className="settings-header">
          <p className="go-account-eyebrow">YOUR SPACE, YOUR WAY</p>
          <h1 className="settings-title">Your <em>Settings</em></h1>
          <p className="settings-subtitle">Customize your experience</p>
        </div>

        <div className="settings-content">
          {/* Translation Settings */}
          <div className="settings-section card">
            <h2 className="section-title">🌐 Auto Translation</h2>
            <p className="section-description">
              Automatically translate all text to your preferred language using Google Translate
            </p>
            
            <div className="translation-settings">
              <div className="settings-toggle">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={autoTranslate}
                    onChange={(e) => toggleAutoTranslate(e.target.checked)}
                    className="toggle-input"
                    data-translate="false"
                  />
                  <span className="toggle-slider"></span>
                  <span className="toggle-text">
                    {autoTranslate ? "Auto Translation Enabled" : "Auto Translation Disabled"}
                  </span>
                </label>
              </div>
              
              {autoTranslate && (
                <div className="language-selector" data-translate="false">
                  <label className="settings-label" data-translate="false">
                    Target Language ({availableLanguages.length} languages available)
                    <div className="language-picker" ref={languagePickerRef} data-translate="false">
                      <div className="language-picker-controls">
                        <input
                          type="text"
                          placeholder="Search language by name or code..."
                          value={languageSearch}
                          onChange={(e) => {
                            setLanguageSearch(e.target.value);
                            setLanguageMenuOpen(true);
                          }}
                          onFocus={() => setLanguageMenuOpen(true)}
                          className="language-search-input"
                          data-translate="false"
                        />

                        <button
                          type="button"
                          className="language-current-button"
                          onClick={() => setLanguageMenuOpen((open) => !open)}
                          data-translate="false"
                          aria-expanded={languageMenuOpen}
                          aria-haspopup="listbox"
                        >
                          <span className="language-current-label">{selectedLanguage.name}</span>
                          <span className="language-current-code">{selectedLanguage.code.toUpperCase()}</span>
                        </button>
                      </div>

                      {languageMenuOpen && (
                        <div className="language-options" role="listbox" data-translate="false">
                          {filteredLanguages.length > 0 ? (
                            filteredLanguages.map((lang) => (
                              <button
                                key={lang.code}
                                type="button"
                                className={`language-option ${lang.code === targetLanguage ? 'active' : ''}`}
                                onClick={() => {
                                  if (lang.code !== targetLanguage) {
                                    changeLanguage(lang.code);
                                  }
                                  setLanguageMenuOpen(false);
                                }}
                                role="option"
                                aria-selected={lang.code === targetLanguage}
                                data-translate="false"
                              >
                                <span>{lang.name}</span>
                                <span className="language-option-code">{lang.code.toUpperCase()}</span>
                              </button>
                            ))
                          ) : (
                            <div className="language-option-empty" data-translate="false">
                              No languages found for “{languageSearch}”
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </label>
                  {isTranslating && (
                    <p className="settings-hint" data-translate="false">Applying translation...</p>
                  )}
                  <p className="settings-hint" data-translate="false">
                    All text on the page will be automatically translated to the selected language.
                    The default language is detected from your Google account.
                    {languageSearch && ` Showing ${filteredLanguages.length} of ${availableLanguages.length} languages.`}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Theme Selection */}
          <div className="settings-section card">
            <h2 className="section-title">🎨 Theme</h2>
            <p className="section-description">Choose your preferred theme</p>
            
            <div className="theme-selector">
              {availableThemes.map((theme) => {
                // Get theme preview colors
                let bgGradient, textColor, displayName;
                
                if (theme === 'light' || theme === 'kid-friendly') {
                  bgGradient = '#fbf9f3';
                  textColor = '#171530';
                  displayName = 'Light';
                } else if (theme === 'dark') {
                  bgGradient = '#171530';
                  textColor = '#fbf9f3';
                  displayName = 'Dark';
                } else if (theme === 'system') {
                  bgGradient = 'linear-gradient(90deg, #fbf9f3 50%, #171530 50%)';
                  textColor = '#171530';
                  displayName = 'System';
                } else {
                  bgGradient = '#fbf9f3';
                  textColor = '#171530';
                  displayName = theme.charAt(0).toUpperCase() + theme.slice(1);
                }

                return (
                  <button
                    key={theme}
                    className={`theme-option ${currentTheme === theme ? 'active' : ''}`}
                    aria-pressed={currentTheme === theme}
                    onClick={() => handleThemeChange(theme)}
                  >
                    <div className="theme-preview">
                      <div
                        className="theme-preview-bg"
                        style={{
                          background: bgGradient,
                        }}
                      >
                        <div
                          className={`theme-preview-text ${theme === 'system' ? 'theme-preview-split' : ''}`}
                          style={{
                            color: textColor,
                          }}
                        >
                          Aa
                        </div>
                      </div>
                      {theme === 'kid-friendly' && <div className="theme-brand-swatches" aria-hidden="true"><i /><i /><i /></div>}
                    </div>
                    <span className="theme-name">{displayName}</span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Settings;

