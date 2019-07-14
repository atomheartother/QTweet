import fs from "fs";
import { FluentBundle } from "fluent";

const langDir = "./lang";
const langs = {};

fs.readdir(langDir, (err, files) => {
  if (err) {
    console.error(err);
    return;
  }
  files.forEach(file => {
    if (file.endsWith(".ftl")) {
      const lang = file.substr(0, file.length - 4);
      const b = new FluentBundle(lang);
      const errors = b.addMessages(
        fs.readFileSync(`${langDir}/${file}`, "utf8").toString("utf8")
      );
      if (errors.length) {
        console.log(`Errors parsing language file: ${file}`);
        console.log(errors);
        return;
      }
      langs[lang] = b;
      console.log(`Processed language file: ${file}`);
    }
  });
});

const i18n = (lang, key, options) => {
  console.log(options);
  const bundle = langs[lang];
  if (!bundle) {
    if (lang !== "en") return i18n("en", key, options);
    return key;
  }
  const msg = bundle.getMessage(key);
  if (!msg) {
    if (lang !== "en") return i18n("en", key, options);
    return `{$${key}}`;
  }
  const errors = [];
  const res = bundle.format(msg, options, errors);
  if (errors.length) {
    console.log(errors);
  }
  console.log(res);
  return res;
};

export default i18n;
