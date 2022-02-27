import { readFileSync } from 'fs';
import { FluentBundle } from 'fluent';
import log from '../log';
import process from 'process';

export const supportedLangs = process.env.SUPPORTED_LANGS.split(' ');

const langDir = './lang';
const langs : {
  [key:string]: FluentBundle
} = {};

export type i18nOptions = {
  [key:string]: string | number;
}

{
  const globalConf = readFileSync(`${langDir}/global.o.ftl`, 'utf8')
    .toString();

  supportedLangs.forEach((lang) => {
    const b = new FluentBundle(lang, { useIsolating: false });
    b.addMessages(globalConf);
    const errors = b.addMessages(
      readFileSync(`${langDir}/${lang}.o.ftl`, 'utf8').toString(),
    );
    if (errors.length) {
      log(`Errors parsing language: ${lang}`);
      log(errors);
      return;
    }
    langs[lang] = b;
    log(`Loaded language: ${lang}`);
  });
}

const i18n = (lang: string, key: string, options: i18nOptions = {}): string => {
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
