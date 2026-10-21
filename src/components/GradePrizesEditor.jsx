import { t, useLocale } from "../i18n/runtime";import { useState } from 'react';
import api, { adminAPI } from '../services/api';
import { gradeLabel } from '../utils/gradeCategories';
export default function GradePrizesEditor({ olympiad, gradeCategory }) {useLocale();
  const [prizes, setPrizes] = useState(olympiad.gradePrizes || []);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const rows = prizes.map((prize, index) => ({ ...prize, index })).filter((prize) => prize.gradeCategory === gradeCategory);
  const update = (index, field, value) => setPrizes((previous) => previous.map((prize, i) => i === index ? { ...prize, [field]: value } : prize));
  const save = async () => {
    setBusy(true);setNotice('');
    try {await adminAPI.updateOlympiad(olympiad._id, { gradePrizes: prizes });setNotice('Prizes saved.');}
    catch (error) {setNotice(error?.response?.data?.message || 'Could not save prizes. Check names and places.');} finally
    {setBusy(false);}
  };
  const upload = async (index, file) => {
    if (!file) return;
    setBusy(true);setNotice('');
    try {const body = new FormData();body.append('photo', file);const response = await api.post('/admin/prize-image', body);update(index, 'photo', response.data.photo);}
    catch (error) {setNotice(error?.response?.data?.message || 'Could not upload the photo.');} finally
    {setBusy(false);}
  };
  if (!gradeCategory) return null;
  return <section className="card" style={{ padding: 20, marginBottom: 20 }}>
    <h3>{t("Prizes · ")}{t(gradeLabel(gradeCategory))}</h3>
    <p>{t("Set any number of places. A prize name is required; a photo is optional.")}</p>
    {rows.map((prize) => <div key={prize.index} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
      <label>{t("Place")}<input type="number" min="1" value={prize.place} onChange={(e) => update(prize.index, 'place', Number(e.target.value))} style={{ width: 80 }} /></label>
      <label>{t("Prize name")}<input required maxLength="160" value={prize.name} onChange={(e) => update(prize.index, 'name', e.target.value)} /></label>
      <label>{t("Photo URL (optional)")}<input type="url" placeholder={t("https://…")} value={prize.photo || ''} onChange={(e) => update(prize.index, 'photo', e.target.value)} /></label>
      <label>{t("Upload photo")}<input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={(e) => upload(prize.index, e.target.files?.[0])} /></label>
      <button type="button" className="button-secondary" onClick={() => setPrizes((previous) => previous.filter((_, index) => index !== prize.index))}>{t("Remove prize")}</button>
    </div>)}
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <button type="button" className="button-secondary" disabled={busy} onClick={() => setPrizes((previous) => [...previous, { gradeCategory, place: Math.max(0, ...rows.map((row) => Number(row.place) || 0)) + 1, name: '', photo: '' }])}>{t("Add prize")}</button>
      <button type="button" className="button-primary" disabled={busy} onClick={save}>{t(busy ? 'Saving…' : 'Save prizes')}</button>
    </div>
    {notice && <p role="status">{t(notice)}</p>}
  </section>;
}
