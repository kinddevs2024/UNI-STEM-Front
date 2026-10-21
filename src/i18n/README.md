# Website languages

The website supports `uz`, `en`, and `ru`. Russian and Uzbek interface catalogs
are bundled locally; no page content is sent to a translation service.

Use `t('English source text')` for interface labels, placeholders, messages,
and accessibility labels. Components that use `t` subscribe to language changes
with an unconditional `useLocale()` call, or through `useTranslation()`.
Add the same source key to `translations/ru.json` and `translations/uz.json`.
English normally uses the original source text. `en.json` contains equivalents
for legacy messages originally written in Russian.

Numbered placeholders such as `{0}` must be preserved in both catalogs. The
runtime also recognizes rendered templates such as `Grade 7` using `Grade {0}`.
Use `getIntlLocale()` for dates and numbers. Uzbek month names are explicitly
formatted in `formatDate` for browsers with incomplete Uzbek Intl data.

Translate labels, not form values or stored data. Select options must have
explicit original `value` properties. Keep user names, uploaded filenames,
authored olympiad questions, submitted answers, and other participant content
unchanged.

The account's `language` field is authoritative after sign-in. Browser storage
remembers the anonymous language preference. Student onboarding requires a
class first and a language second; incomplete accounts stay on `/auth`.
Language changes in Settings are applied only after the profile API confirms
that the preference was saved.
