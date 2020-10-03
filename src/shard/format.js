// A module for formatting data for displaying

import Discord from 'discord.js';
import * as config from '../../config.json';
import { isSet } from '../flags';
import i18n from './i18n';

const defaults = {
  data: [],
  formatTitle: () => '',
  formatField: () => '',
  description: null,
  noElements: 'genericEmptyList',
  objectName: 'genericObjects',
  color: 0x0e7675,
};

const computeFormattedRow = async (elem, params, formatTitle, formatField) => {
  const titlePromise = formatTitle(elem, params);
  const fieldPromise = formatField(elem, params);
  return { title: await titlePromise, field: await fieldPromise };
};

export const formatGenericList = async (
  { qc, lang },
  {
    data = defaults.data,
    formatTitle = defaults.formatTitle,
    formatField = defaults.formatField,
    description = defaults.description,
    noElements = defaults.noElements,
    objectName = defaults.objectName,
    color = defaults.color,
    params = {},
  } = {},
) => {
  if (data.length === 0) {
    return {
      cmd: 'postTranslated',
      qc,
      trCode: noElements,
    };
  }
  let page = 1;
  const embeds = [];
  let embed = new Discord.MessageEmbed()
    .setColor(color)
    .setTitle(`${i18n(lang, objectName, { count: data.length })}:`)
    .setURL(config.profileURL);
  if (description) {
    embed.setDescription(description);
  }
  let counter = 0;
  const formattedData = await Promise.all(data.map((
    elem,
  ) => computeFormattedRow(elem,
    params,
    formatTitle,
    formatField)));
  for (let i = 0; i < data.length; i += 1) {
    embed.addField(
      formattedData[i].title,
      formattedData[i].field,
    );
    counter += 1;
    if (counter > 20) {
      page += 1;
      embeds.push({ embed: { ...embed } });
      embed = new Discord.MessageEmbed()
        .setColor(color)
        .setTitle(
          `${i18n(lang, objectName, { count: data.length })} (${page}):`,
        )
        .setURL(config.profileURL);
      counter = 0;
    }
  }
  if (counter > 0) {
    embeds.push({ embed: { ...embed } });
  }
  return {
    cmd: 'postList',
    embeds,
    qc,
  };
};

export const formatTwitterUserShort = (name) => `@${name} (https://twitter.com/${name})`;

export const formatFlags = (lang, flags) => i18n(lang, 'formatFlags', {
  notext: isSet(flags, 'notext'),
  retweet: isSet(flags, 'retweet'),
  noquote: isSet(flags, 'noquote'),
  ping: isSet(flags, 'ping'),
  replies: isSet(flags, 'replies'),
});

export const formatSubsList = async (qc, subs, lang) => formatGenericList({ qc, lang }, {
  data: subs,
  formatTitle: ({ name }) => formatTwitterUserShort(name),
  formatField: ({ twitterId, flags }) => `**${i18n(lang, 'id')}:** ${twitterId}\n${formatFlags(lang, flags)}`,
  noElements: 'noSubscriptions',
  objectName: 'subscriptions',
});

export const formatLanguages = async (qc, languagesList, lang) => formatGenericList({ qc, lang }, {
  data: languagesList,
  formatTitle: (k) => (k === lang ? `[${k}]` : k),
  formatField: (k) => i18n(k, 'languageCredit'),
  objectName: 'languages',
});
