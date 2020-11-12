import QChannel from "../QChannel/QChannel";
import { ParsedCmd } from '../discord'
import { User } from "discord.js";
import * as checks from './checks';
import start from './start'
import lang from './lang'
import qtprefix from './qtprefix'
import list from './list'
import tweet from './tweet'
import tweetId from './tweetId'
import stop from './stop';
import stopchannel from './stopchannel'
import help from './help'
import announce from './announce'
import { translated } from "../post";
import log from "../../log";

export type CmdFn = (cmd: ParsedCmd, qChannel: QChannel, author: User) => void | Promise<void>;
export type CheckFn = (author: User, qChannel : QChannel) => Promise<boolean> | boolean;

const AllCommands = ['start', 'lang', 'qtprefix', 'stop', 'list', 'tweet', 'tweetid', 'stopchannel', 'help', 'announce'] as const;

type COMMANDS_TUPLE = typeof AllCommands;
export type Command = COMMANDS_TUPLE[number];

type CommandCheck = {
    f: CheckFn;
    badB: string;
}

type CommandList = {
    [key in Command]: {
        function: CmdFn;
        checks: CommandCheck[];
        minArgs?: number;
    }
}

const cmdList : CommandList= {
    start: {
      function: start,
      checks: [
        {
          f: checks.isChannelMod,
          badB: 'startForMods',
        },
      ],
      minArgs: 1,
    },
    lang: {
      function: lang,
      checks: [
        {
          f: checks.isServerMod,
          badB: 'langForMods',
        },
      ],
      minArgs: 1,
    },
    qtprefix: {
      function: qtprefix,
      checks: [
        {
          f: checks.isServerMod,
          badB: 'prefixForMods',
        },
      ],
      minArgs: 1,
    },
    stop: {
      function: stop,
      checks: [
        {
          f: checks.isChannelMod,
          badB: 'stopForMods',
        },
      ],
      minArgs: 1,
    },
    list: {
      function: list,
      checks: [],
      minArgs: 0,
    },
    tweet: {
      function: tweet,
      checks: [],
      minArgs: 1,
    },
    tweetid: {
      function: tweetId,
      checks: [],
      minArgs: 1,
    },
    stopchannel: {
      function: stopchannel,
      checks: [
        {
          f: checks.isChannelMod,
          badB: 'stopForMods',
        },
      ],
    },
    help: {
      function: help,
      checks: [],
      minArgs: 0,
    },
    announce: {
      function: announce,
      checks: [
        {
          f: checks.isOwner,
          badB: 'announceForAdmin',
        },
      ],
    },
};

const nameIsCommand = (name: string): name is Command => AllCommands.includes(name as Command);

const handleCommand = async (commandName: string, author: User, qChannel: QChannel, parsedArgs: ParsedCmd) => {
    if (!nameIsCommand(commandName)) return;
    const command = cmdList[commandName];
    // Check that the command exists
    if (command) {
      const { args } = parsedArgs;
      // Check that there's the right number of args
      if (args.length < command.minArgs) {
        translated(qChannel, `usage-${commandName}`);
        return;
      }
      log(
        `Executing command: "${commandName} ${args}" from ${author.tag}`,
        qChannel,
      );
      const passedArray = await Promise.all(command.checks.map(({ f }) => f(author, qChannel)));
      for (let i = 0; i < command.checks.length; i += 1) {
        const { badB } = command.checks[i];
        if (!passedArray[i]) {
          // If it's not met and we were given a bad boy, post it
          if (badB) translated(qChannel, badB);
          log(`Rejected command "${commandName} ${args}" with reason: ${badB}`);
          return;
        }
      }
      command.function(parsedArgs, qChannel, author);
    }
};

export default handleCommand