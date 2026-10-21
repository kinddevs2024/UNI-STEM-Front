import { t, useLocale } from "../../i18n/runtime";import React from 'react';
import './EmulatorBlock.css';

/**
 * EmulatorBlock Component
 *
 * Full-screen blocking overlay that prevents access to the application
 * when an emulator is detected. This component cannot be dismissed.
 */
const EmulatorBlock = () => {useLocale();
  return (
    <div className="emulator-block-overlay">
      <div className="emulator-block-card">
        <div className="emulator-block-title">{t("Похоже, сайт открыт через эмулятор. ")}

        </div>
        <div className="emulator-block-message">{t("Пожалуйста, откройте сайт на вашем реальном устройстве или на компьютере, используя ваш личный браузер. ")}

        </div>
        <div className="emulator-block-message">{t("Для продолжения работы закройте эмулятор и перезайдите на сайт. ")}

        </div>
      </div>
    </div>);

};

export default EmulatorBlock;
