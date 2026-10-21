import { t, useLocale } from "../../i18n/runtime";import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from '../../context/TranslationContext';
import './Settings.css';

const Settings = () => {useLocale();
  const {
    currentTheme,
    changeTheme,
    availableThemes
  } = useTheme();

  const { targetLanguage, changeLanguage, availableLanguages } = useTranslation();
  const [languageBusy, setLanguageBusy] = useState(false);
  const [languageError, setLanguageError] = useState('');
  const saveLanguage = async (code) => {
    setLanguageBusy(true);setLanguageError('');
    try {await changeLanguage(code);}
    catch {setLanguageError('Could not save your language. Please try again.');} finally
    {setLanguageBusy(false);}
  };

  const handleThemeChange = (themeName) => {
    changeTheme(themeName);
  };


  return (
    <div className="settings-page">
      <div className="container">
        <div className="settings-header">
          <p className="go-account-eyebrow">{t("YOUR SPACE, YOUR WAY")}</p>
          <h1 className="settings-title"><em>{t("Your settings")}</em></h1>
          <p className="settings-subtitle">{t("Customize your experience")}</p>
        </div>

        <div className="settings-content">
          <section className="settings-section card">
            <h2 className="section-title">{t("Language")}</h2>
            <p className="section-description">{t("Choose the language of the website. Your choice is saved to your account.")}</p>
            <div className="site-language-options" role="group" aria-label={t("Website language")}>
              {availableLanguages.map((lang) => <button key={lang.code} type="button" className={targetLanguage === lang.code ? 'is-selected' : ''} aria-pressed={targetLanguage === lang.code} disabled={languageBusy} onClick={() => saveLanguage(lang.code)} lang={lang.code}><span>{lang.name}</span><span aria-hidden="true">{t(targetLanguage === lang.code ? '✓' : lang.code.toUpperCase())}</span></button>)}
            </div>
            {languageError && <p role="alert">{t(languageError)}</p>}
          </section>

          {/* Theme Selection */}
          <div className="settings-section card">
            <h2 className="section-title">{t("🎨 Theme")}</h2>
            <p className="section-description">{t("Choose your preferred theme")}</p>

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
                    onClick={() => handleThemeChange(theme)}>

                    <div className="theme-preview">
                      <div
                        className="theme-preview-bg"
                        style={{
                          background: bgGradient
                        }}>

                        <div
                          className={`theme-preview-text ${theme === 'system' ? 'theme-preview-split' : ''}`}
                          style={{
                            color: textColor
                          }}>{t("Aa ")}


                        </div>
                      </div>
                      {theme === 'kid-friendly' && <div className="theme-brand-swatches" aria-hidden="true"><i /><i /><i /></div>}
                    </div>
                    <span className="theme-name">{t(displayName)}</span>
                  </button>);

              })}
            </div>
          </div>

        </div>
      </div>
    </div>);

};

export default Settings;
