import { getLang } from "../../db/guilds";
import i18n from "../i18n";
import QChannel from "../QChannel/QChannel";

export const getScreenName = (word: string): string => {
    if (word.startsWith('@')) {
        return word.substring(1);
    }
    const urlPrefix = 'twitter.com/';
    if (word.indexOf(urlPrefix) !== -1) {
        const hasParameters = word.indexOf('?');
        return word.substring(
        word.indexOf(urlPrefix) + urlPrefix.length,
        hasParameters === -1 ? word.length : hasParameters,
        );
    }
    return word;
};

export const formatScreenNames = async (qChannel: QChannel, screenNames: string[], lastName: string) => i18n(await getLang(qChannel.guildId()), 'formatUserNames', {
    count: screenNames.length + 1,
    names: screenNames.toString(),
    lastName,
});