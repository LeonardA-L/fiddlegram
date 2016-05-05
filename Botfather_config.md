# Botfather configs

[BotFather](https://telegram.me/botfather) allows you to create Telegram bots, and instanciates authentication tokens. But it does more than that. To get the same settings as FiddleGram, follow this:

* Go to Botfather, use `/start` and follow the instructions to create your bot. Put the auth token in `token.js`
* Set up description and about text as you please
* Use /setcommands and give the following block:
```
start - [language] start a new repl session
stop - stop current repl session
languages - list currently supported languages
version - list bot and languages versions
help - display help
```
This will enable auto-completion on commands.

All done! Your Fiddlegram is ready to rock.