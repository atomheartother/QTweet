# Translation guide

First of all if you've decided to help with translating QTweet - thank you! Writing the translation for a new language from the ground up should take you a few hours, so it's a solid bit of work!

Our translation system uses the [Fluent syntax](https://projectfluent.org/fluent/guide/). You can find translation files (`.ftl`) in the `lang/` folder, [here is the english file](https://github.com/atomheartother/QTweet/blob/master/lang/en.ftl). It should be pretty self-explanatory but otherwise you can read up on Fluent syntax or ask me for help.

## Creating a new translation

To create a new translation:

- Create a file called `[lang].ftl`, where [lang] is a short code for your language (`en` for english)
- Copy the contents of `en.ftl` in your new file
- Translate everything! Some of the variable descriptions are in `global.ftl`, but you can mostly just use them the way I use them in English. You really should use the variables though, they're here for a reason!

You can also edit an existing translation by simply copying the file over and editing it.

Once you're done:

- If you're familiar with git and development in general, you can make a merge request, you can even test your new file yourself (You'll need to edit `config.json` to include your language in `supportedLangs`).
- Otherwise just send me the translation file in the support server or in DMs and I'll test it for you and guide you from there :) You'll also be credited for your work obviously.

## Style Guide

Writing messages for QTweet comes with a certain degree of creative freedom. However I'd like to ensure we're all on the same page on how she speaks.

- QTweet has a slight personality in that she talks casually and addresses the recipient directly, she's not too robotic in her way of speaking. For example in French she uses "tu" to address people, the casual form, instead of "vous", which is a more formal way of speaking.
- Nevertheless, she **stays professional & family-friendly**, so no mean language, no mature language and obviously nothing that could be interpreted as hate speech.
- Feel free to be friendly and playful in some responses, but keep it light, as it's annoying to some users. I have a few emotes like `:c` in a few responses, it's totally fine to use more or less if you feel like it fits more with what you're going for - just don't overdo it!
- Try to be clear and concise, especially with errors, information must be conveyed clearly.
- Keep in mind that as much as I respect your creative freedom, as the maintaner I will always have the final word on what ends up in production.

## Tips

### Language code

For your language code, try to use an official code, `eng` won't work for English.

### Plural Rules

Fluent is smart, and uses plural rules to stay consistent with a language's internal logic. For example some languages will consider 2 objects to be singular.

Keep in mind your language may have different _plural rules_ than English, so you might have to adapt the selectors. You can find your language's plural rules [here](https://www.unicode.org/cldr/charts/latest/supplemental/language_plural_rules.html) and you can learn about Fluent selectors [here](https://projectfluent.org/fluent/guide/selectors.html).

Here's a good example of a problem with plurals and how to fix them, take this stopChannel rule:

```
stopChannelSuccess =
  I've unsubscribed you from {$subs ->
    [one] one user
    *[other] {$subs} users
  }.
```

In English, 1 is singular and everything else is plural, including 0. So if you unsubscribe from 0 people, here it will say "I've unsubscribed you from 0 users". Ok, now let's look at the French literal translation:

```
stopChannelSuccess =
  {-b}Je t'ai désabonné {$subs ->
    [one] d'un utilisateur
    *[other] de {$subs} utilisateurs
  }.{-b}
```

Seems fine, except if you look at [the entry for French](https://www.unicode.org/cldr/charts/latest/supplemental/language_plural_rules.html#fr) in the plural rules table you'll see French actually considers 0 to be singular and not plural, so if you unsubscribe from 0 users you'll get "Unsubscribed from one user" in French.

The fix for this is to use the actual value and not the plural rule selector to override the language's default, basically adding a special rule:

```
  {-b}Je {$subs ->
    [0] ne t'ai désabonné de personne
    [one] t'ai désabonné d'un utilisateur
    *[other] t'ai désabonné de {$subs} utilisateurs
  }.{-b}
```

Now unsubscribing from 0 users will print out "I've unsubscribed you from nobody", which is much better.
