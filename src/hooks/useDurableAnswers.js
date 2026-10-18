import { useEffect, useRef, useState } from 'react';
import { olympiadAPI } from '../services/api';
import { getSavedAnswers, deleteSavedAnswers } from '../utils/indexeddb';

const read = key => { try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch { return {}; } };
const object = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};

export function useDurableAnswers(id, userId, attemptId, legacySuffix = 'answers') {
  const key = id && userId ? `olympiad_answers_v2_${userId}_${id}` : null;
  const [answers, setState] = useState({});
  const [readyKey, setReadyKey] = useState(null);
  const current = useRef({});
  const queue = useRef(Promise.resolve());
  const keyRef = useRef(key);
  const completedKey = useRef(null);
  keyRef.current = key;
  const persist = value => {
    if (!key) return;
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (error) { console.error('Local draft save failed', error); }
  };
  const setAnswers = update => {
    const next = typeof update === 'function' ? update(current.current) : update;
    current.current = next;
    persist(next); // Synchronous: survives an immediate reload after a click or keystroke.
    setState(next);
  };
  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    current.current = object(read(key));
    setState(current.current);
    setReadyKey(null);
    (async () => {
      let legacy = {};
      const storedAttempt = localStorage.getItem(`olympiad_${id}_attemptId`);
      if (attemptId && storedAttempt === String(attemptId)) {
        legacy = { ...object(await getSavedAnswers(id)), ...object(read(`olympiad_${id}_${legacySuffix}`)) };
      }
      let server = {};
      try { server = object((await olympiadAPI.getDraft(id)).data?.draft?.answers); } catch (error) { console.warn('Using local answer backup', error); }
      if (cancelled) return;
      // Local edits always win over a delayed or older server response, including cleared answers.
      const restored = { ...server, ...legacy, ...object(read(key)), ...current.current };
      current.current = restored;
      persist(restored);
      setState(restored);
      setReadyKey(key);
    })();
    return () => { cancelled = true; };
  }, [key, attemptId]);

  useEffect(() => {
    if (!key || readyKey !== key || !Object.keys(answers).length) return;
    const timer = setTimeout(() => {
      queue.current = queue.current.catch(() => {}).then(() => {
        if (keyRef.current === key && completedKey.current !== key) return olympiadAPI.saveDraft(id, current.current);
      }).catch(error => console.warn('Server draft save deferred; local backup retained', error));
    }, 400);
    return () => clearTimeout(timer);
  }, [answers, key, readyKey, id]);

  useEffect(() => {
    const retry = () => {
      if (readyKey === key && key && completedKey.current !== key && Object.keys(current.current).length) {
        queue.current = queue.current.catch(() => {}).then(() => olympiadAPI.saveDraft(id, current.current)).catch(() => {});
      }
    };
    window.addEventListener('online', retry);
    return () => window.removeEventListener('online', retry);
  }, [key, readyKey, id]);

  const clearAnswers = () => {
    completedKey.current = key;
    keyRef.current = null;
    current.current = {};
    setReadyKey(null);
    setState({});
    try { if (key) localStorage.removeItem(key); localStorage.removeItem(`olympiad_${id}_${legacySuffix}`); } catch {}
    deleteSavedAnswers(id);
  };
  return { answers, setAnswers, clearAnswers };
}
