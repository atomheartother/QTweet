// A module for formatting data for displaying

import Discord, {MessageOptions} from 'discord.js';
import { isSet } from '../flags';
import i18n from './i18n';
import { QCSerialized } from './QChannel/type';
import process from 'process'

const defaults = {
  data: [],
  formatTitle: () => '',
  formatField: () => '',
  description: null,
  noElements: 'genericEmptyList',
  objectName: 'genericObjects',
  color: 0x0e7675,
};

type FormatFunc<T, P> = (t: T, p: P) => Promise<string> | string;

const computeFormattedRow = async <T, P=object>(
  elem: T,
  params: P,
  formatTitle: FormatFunc<T, P>,
  formatField: FormatFunc<T, P>
) => {
  const titlePromise = formatTitle(elem, params);
  const fieldPromise = formatField(elem, params);
  return { title: await titlePromise, field: await fieldPromise };
};

export const FORMAT_POST_TRANSLATED = 'postTranslated';
export const FORMAT_POST_EMBEDS = 'postEmbeds';

interface PostTranslatedReturn {
  cmd: typeof FORMAT_POST_TRANSLATED,
  qc: QCSerialized,
  trCode: string,
}

interface PostEmbedsReturn {
  cmd: typeof FORMAT_POST_EMBEDS,
  qc: QCSerialized,
  embeds: MessageOptions[],
}

export const formatGenericList = async <T, P=object>(
  { qc, lang }: {qc: QCSerialized, lang: string},
  {
    data = defaults.data,
    formatTitle = defaults.formatTitle,
    formatField = defaults.formatField,
    description = defaults.description,
    noElements = defaults.noElements,
    objectName = defaults.objectName,
    color = defaults.color,
    params,
  }: {
    data?: T[],
    formatTitle: FormatFunc<T, P>,
    formatField: FormatFunc<T, P>,
    description?: string,
    noElements?: string,
    objectName?: string,
    color?: number,
    params?: P
  },
): Promise<PostEmbedsReturn | PostTranslatedReturn> => {
  if (data.length === 0) {
    return {
      cmd: FORMAT_POST_TRANSLATED,
      qc,
      trCode: noElements,
    };
  }
  let page = 1;
  const embeds: MessageOptions[] = [];
  let embed = new Discord.MessageEmbed()
    .setColor(color)
    .setTitle(`${i18n(lang, objectName, { count: data.length })}:`)
    .setURL(process.env.PROFILE_URL);
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
      embeds.push({ embeds: [{...embed}] });
      embed = new Discord.MessageEmbed()
        .setColor(color)
        .setTitle(
          `${i18n(lang, objectName, { count: data.length })} (${page}):`,
        )
        .setURL(process.env.PROFILE_URL);
      counter = 0;
    }
  }
  if (counter > 0) {
    embeds.push({ embeds: [{ ...embed }]});
  }
  return {
    cmd: FORMAT_POST_EMBEDS,
    embeds,
    qc,
  };
};

export const formatTwitterUserShort = (name) => `@${name} (https://twitter.com/${name})`;

const formatSubMsg = (msg: string | undefined) => {
  if (!msg) return '';
  return `\nWith message: \`${msg}\``;
};

export const formatFlags = (lang: string, flags: number) => i18n(lang, 'formatFlags', {
  notext: isSet(flags, 'notext'),
  retweet: isSet(flags, 'retweets'),
  noquote: isSet(flags, 'noquotes'),
  replies: isSet(flags, 'replies'),
});

export const formatSubsList = async (qc: QCSerialized, subs, lang: string) => formatGenericList({ qc, lang }, {
  data: subs,
  formatTitle: ({ name }) => formatTwitterUserShort(name),
  formatField: ({ twitterId, flags, msg }) => `**${i18n(lang, 'id')}:** ${twitterId}\n${formatFlags(lang, flags)}${formatSubMsg(msg)}`,
  noElements: 'noSubscriptions',
  objectName: 'subscriptions',
});

export const formatLanguages = async (qc: QCSerialized, languagesList: string[], lang: string) => formatGenericList<string>({ qc, lang }, {
  data: languagesList,
  formatTitle: (k: string) => (k === lang ? `[${k}]` : k),
  formatField: (k: string) => i18n(k, 'languageCredit'),
  objectName: 'languages',
});
