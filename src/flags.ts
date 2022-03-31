/* eslint no-bitwise: 0 */
// This module defines subscription flags
const FlagsEnum = Object.freeze({
  notext: 1,
  retweets: 2,
  noquotes: 4,
  // We don't use 8, it was the ping value before msg
  replies: 16,
});

export type FlagName = 'notext' | 'retweets' | 'noquotes' | 'replies'

export class Flags {
  val: number;
  constructor() {
    this.val = 0;
  }

  set(flag: string) {
    this.val |= FlagsEnum[flag];
  }

  unset(flag: string) {
    this.val &= ~FlagsEnum[flag];
  }

  isSet(flag: string) {
    return this.val & FlagsEnum[flag];
  }

  serialize() {
    return this.val;
  }
}

// // OBSOLETE
// // Returns a serialized int from flags
// export const serialize = (flags) => {
//   let f = 0;
//   Object.keys(FlagsEnum).forEach((k) => {
//     if (flags[k]) {
//       f += FlagsEnum[k];
//     }
//   });
//   return f;
// };

// // OBSOLETE
// // Returns flags object from a serialized int
// export const unserialize = (f) => {
//   const flags = {};
//   Object.keys(FlagsEnum).forEach((k) => {
//     flags[k] = (f & FlagsEnum[k]) === FlagsEnum[k];
//   });
//   return flags;
// };

// Return a serialized flag from a bunch of strings
export const compute = (options: string[]): number => {
  const flags = new Flags();
  options.forEach((opt) => {
    if (FlagsEnum[opt]) {
      flags.set(opt);
    }
  });
  return flags.serialize();
};

export const isSet = (val: number, flag: FlagName) => (val & FlagsEnum[flag] ? 1 : 0);
