import fs from 'fs';
import { FluentBundle } from 'fluent';
import log from './log';
import { supportedLangs } from '../config.json';

const langDir = './lang';
const langs = {};
{
  const globalConf = fs
    .readFileSync(`${langDir}/global.o.ftl`, 'utf8')
    .toString('utf8');

  supportedLangs.forEach((lang) => {
    const b = new FluentBundle(lang, { useIsolating: false });
    b.addMessages(globalConf);
    const errors = b.addMessages(
      fs.readFileSync(`${langDir}/${lang}.o.ftl`, 'utf8').toString('utf8'),
    );
    if (errors.length) {
      log(`Errors parsing language: ${lang}`);
      log(errors);
      return;
    }
    langs[lang] = b;
    log(`i18n - Added language: ${lang}`);
  });
}
const i18n = (lang, key, options) => {
  const bundle = langs[lang];
  if (!bundle) {
    if (lang !== 'en') return i18n('en', key, options);
    return key;
  }
  const msg = bundle.getMessage(key);
  if (!msg) {
    if (lang !== 'en') return i18n('en', key, options);
    log(`i18n - Could not resolve key: ${key}`);
    return `{$${key}}`;
  }
  const errors = [];
  const res = bundle.format(msg, options, errors);
  if (errors.length) {
    log(`i18n - Errors with ${key}`);
    log(options);
    log(errors);
  }
  return res;
};

export default i18n;
