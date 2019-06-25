// This module defines subscription flags

const FlagsEnum = Object.freeze({
  notext: 1,
  retweet: 2,
  noquote: 4,
  ping: 8
});

export const defaultFlags = (keys => {
  let x = {};
  keys.forEach(k => {
    x[k] = false;
  });
  return x;
})(Object.keys(FlagsEnum));

// Returns a serialized int from flags
export const serialize = flags => {
  let f = 0;
  Object.keys(FlagsEnum).forEach(k => {
    if (flags[k]) {
      f += FlagsEnum[k];
    }
  });
  return f;
};

// Returns flags from a serialized int
export const unserialize = f => {
  const flags = {};
  Object.keys(FlagsEnum).forEach(k => {
    flags[k] = (f & FlagsEnum[k]) === FlagsEnum[k];
  });
  return flags;
};

// Return flags from a bunch of strings
export const compute = options => {
  const flags = { ...defaultFlags };
  options.forEach(opt => {
    if (FlagsEnum[opt]) {
      flags[opt] = true;
    }
  });
  return flags;
};
