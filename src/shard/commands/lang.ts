import { CmdFn } from ".";
import { getLang, setLang } from "../../subs";
import { formatLanguages } from "../format";
import { supportedLangs } from '../../../config.json';
import { embeds, translated } from "../post";
import log from "../../log";

const lang: CmdFn = async ({ args }, qChannel) => {
    const verb = args.shift();
    switch (verb[0]) {
      case 'l': {
        const gid = qChannel.guildId();
        const language = await getLang(gid);
        const { embeds: pages } = await formatLanguages(qChannel.serialize(), supportedLangs, language);
        embeds(qChannel, pages);
        break;
      }
      case 's': {
        const language = args.shift();
        if (!language) {
          translated(qChannel, 'usage-lang-set');
          return;
        }
        if (supportedLangs.indexOf(language) === -1) {
          translated(qChannel, 'noSuchLang', { language });
          return;
        }
        await setLang(qChannel.guildId(), language);
        translated(qChannel, 'langSuccess');
        log(`Changed language to ${language}`, qChannel);
        break;
      }
      default:
        translated(qChannel, 'invalidVerb', { verb });
    }
  };

export default lang;