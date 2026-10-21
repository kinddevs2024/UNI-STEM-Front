import {useSyncExternalStore} from 'react';
import en from '../translations/en.json';
import ru from '../translations/ru.json';
import uz from '../translations/uz.json';
export const languages=[{code:'uz',name:'Oʻzbekcha'},{code:'en',name:'English'},{code:'ru',name:'Русский'}];
const valid=code=>['en','ru','uz'].includes(code);
let language='en';
try { const stored=localStorage.getItem('olympiad_language')||localStorage.getItem('olympiad_translate_language');const device=navigator.language?.split('-')[0];language=valid(stored)?stored:valid(device)?device:'en'; } catch {}
const listeners=new Set();
export function setLocale(code) {
 if(!valid(code)) throw new Error('Unsupported language');
 language=code;
 try {localStorage.setItem('olympiad_language',code);localStorage.removeItem('olympiad_auto_translate');localStorage.removeItem('olympiad_translate_language');} catch {}
 if(typeof document!=='undefined') document.documentElement.lang=code;
 listeners.forEach(fn=>fn());
}
export const getLocale=()=>language;
export const getIntlLocale=()=>({en:'en-US',ru:'ru-RU',uz:'uz-UZ'}[language]);
export const subscribe=fn=>{listeners.add(fn);return()=>listeners.delete(fn);};
export const useLocale=()=>useSyncExternalStore(subscribe,getLocale,()=> 'en');
const catalogs={en,ru,uz};
const escapeRegex=value=>value.replace(/[.*+?^$()|[\]\\]/g,'\\$&');
const templates=Object.keys(ru).filter(key=>/\{\d+\}/.test(key)).map(key=>{
 const slots=[];let pattern='',offset=0;
 for(const match of key.matchAll(/\{(\d+)\}/g)){pattern+=escapeRegex(key.slice(offset,match.index))+'(.+?)';slots.push(match[1]);offset=match.index+match[0].length;}
 pattern+=escapeRegex(key.slice(offset));
 return {key,slots,regex:new RegExp('^'+pattern+'$')};
});
export function t(value, params) {
 if(typeof value!=='string'||!value.trim()) return value;
 const key=value.replace(/\s+/g,' ').trim();
 let result=catalogs[language]?.[key];
 if(result===undefined&&language!=='en') {
  for(const template of templates){const match=template.regex.exec(key);if(!match)continue;const values=Object.fromEntries(template.slots.map((slot,i)=>[slot,match[i+1]]));result=(catalogs[language][template.key]||key).replace(/\{(\d+)\}/g,(m,k)=>values[k]??m);break;}
 }
 result??=key;
 if(params) result=result.replace(/\{(\w+)\}/g,(match,key)=>params[key]??match);
 return value.match(/^\s*/)[0]+result+value.match(/\s*$/)[0];
}
