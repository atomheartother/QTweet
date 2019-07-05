// This module defines subscription flags

const FlagsEnum = Object.freeze({
  notext: 1,
  retweet: 2,
  noquote: 4,
  ping: 8
});

// Return a serialized flag from a bunch of strings
export const compute = options => {
  const flags = new Flags();
  options.forEach(opt => {
    if (FlagsEnum[opt]) {
      flags.set(opt);
    }
  });
  return flags.serialize();
};

export const isSet = (val, flag) => val & FlagsEnum[flag];

export class Flags {
  constructor() {
    this.val = 0;
  }

  set(flag) {
    if (!(this.val & FlagsEnum[flag])) this.val += FlagsEnum[flag];
  }

  unset(flag) {
    this.val -= this.val & FlagsEnum[flag];
  }

  isSet(flag) {
    return this.val && FlagsEnum[flag];
  }

  serialize() {
    return this.val;
  }
}
