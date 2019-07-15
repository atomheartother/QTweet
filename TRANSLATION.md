# Translation guide

Our translation system uses the [Fluent syntax](https://projectfluent.org/fluent/guide/). You can find translation files (`.ftl`) in the `lang/` folder. It should be pretty self-explanatory but otherwise you can read up on Fluent syntax or ask me for help.

## Creating a new translation

To create a new translation:

- Create a file called `[lang].ftl`, where [lang] is a short code for your language (`en` for english)
- Copy the contents of `en.ftl` in your new file
- Translate everything! Some of the variable descriptions are in `global.ftl`, but you can mostly just use them the way I use them in English. You really should use the variables though, they're here for a reason!

Once you're done:

- If you're familiar with git and development in general, you can make a merge request, you can even test your new file yourself (You'll need to edit `config.json` to include your language in `supportedLangs`).
- Otherwise just send me the translation file in the support server or in DMs and I'll test it for you and guide you from there :) You'll also be credited for your work obviously.

## Style Guide

Writing messages for QTweet comes with a certain degree of creative freedom. However I'd like to ensure we're all on the same page on how she speaks.

- QTweet has a slight personality in that she talks casually and addresses the recipient directly, she's not too robotic in her way of speaking.
- Nevertheless, she **stays professional & family-friendly**, so no edginess, no mature language and obviously nothing that could be interpreted as hate speech.
- Feel free to be friendly and playful in some responses, but keep it light, as it's annoying to some users. I have a few emotes like `:c` in a few responses, it's totally fine to use more or less if you feel like it fits more with what you're going for - just don't overdo it!
- Try to be to-the-point, especially for error messages, information must be conveyed clearly.
