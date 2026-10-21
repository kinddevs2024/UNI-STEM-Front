import {useState} from 'react';
import {useTranslation} from '../context/TranslationContext';
import {t} from '../i18n/runtime';
import './LanguageSwitcher.css';
export default function LanguageSwitcher(){
 const {targetLanguage,changeLanguage,availableLanguages}=useTranslation();
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 return <div className="site-language-switch"><div role="group" aria-label={t('Website language')}>
 {availableLanguages.map(lang=><button key={lang.code} type="button" lang={lang.code} title={lang.name} aria-label={lang.name} aria-pressed={lang.code===targetLanguage} disabled={busy} onClick={async()=>{setBusy(true);setError('');try{await changeLanguage(lang.code);}catch{setError(t('Could not save your language. Please try again.'));}finally{setBusy(false);}}}>{lang.code.toUpperCase()}</button>)}
 </div>{error&&<p role="alert">{error}</p>}</div>;
}
