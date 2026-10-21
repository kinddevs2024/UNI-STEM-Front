import {createContext,useCallback,useContext,useEffect} from 'react';
import {useAuth} from './AuthContext';
import {authAPI} from '../services/api';
import {languages,setLocale,useLocale,t} from '../i18n/runtime';
const TranslationContext=createContext(null);
export function useTranslation(){const value=useContext(TranslationContext);if(!value)throw new Error('TranslationProvider is missing');return value;}
export function TranslationProvider({children}) {
 const {user,setUser}=useAuth();
 const targetLanguage=useLocale();
 useEffect(()=>{if(['uz','en','ru'].includes(user?.language))setLocale(user.language);},[user?._id,user?.language]);
 useEffect(()=>{document.documentElement.lang=targetLanguage;},[targetLanguage]);
 const changeLanguage=useCallback(async(code,{persist=true}={})=>{
  if(!languages.some(item=>item.code===code)) throw new Error('Unsupported language');
  if(persist&&user){const {data}=await authAPI.updateProfile({language:code});if(data.user?.language!==code)throw new Error('Language was not saved');setUser(data.user);}
  setLocale(code);
 },[user,setUser]);
 return <TranslationContext.Provider value={{targetLanguage,changeLanguage,availableLanguages:languages,t}}>{children}</TranslationContext.Provider>;
}
