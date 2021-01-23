/* eslint no-bitwise: 0 */
// This module defines subscription flags
const FlagsEnum = Object.freeze({
  notext: 1,
  retweet: 2,
  noquote: 4,
  ping: 8,
  replies: 16,
});

export class Flags {
  val: number;
  constructor() {
    this.val = 0;
  }

  set(flag: string) {
    if (!(this.val & FlagsEnum[flag])) this.val += FlagsEnum[flag];
  }

  unset(flag: string) {
    this.val -= this.val & FlagsEnum[flag];
  }

  isSet(flag: string) {
    return this.val && FlagsEnum[flag];
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
export const compute = (options: string[]) => {
  const flags = new Flags();
  options.forEach((opt) => {
    if (FlagsEnum[opt]) {
      flags.set(opt);
    }
  });
  return flags.serialize();
};

export const isSet = (val: number, flag: string) => (val & FlagsEnum[flag] ? 1 : 0);
