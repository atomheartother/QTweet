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
  