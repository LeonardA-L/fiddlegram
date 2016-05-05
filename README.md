# FiddleGram

FiddleGram is a Telegram bot who launches an interactive language shell (REPL) in the language of your choosing, just like at home.

----

[Go ahead and try it!](If you see this it means I haven't put the link in. Sorry.)
You want a python3 console? Just run `/start python3`!

## Usage
Use the following commands to use the bot:

* `/start` - *[language]* start a new repl session. Default python2
* `/stop` - stop current repl session
* `/languages` - list currently supported languages
* `/version` - list bot and languages versions
* `/help` - display help

Once a session is started, every message will be forwarded to the REPL.

----

## Installation

If you want your own FiddleGram bot on your very own server, here's what you have to do:
* First, get a server, preferably Ubuntu
* `git clone` this repo onto the server
* Run the [provisionning script](vagrant_provision.sh)
* If that didn't work out, well you gonna have to troubleshoot it yourself but it's pretty simple. Everything is relative to a /vagrant folder since the development environment uses vagrant.
* Then go to the [BotFather](https://telegram.me/botfather) and create your very own Telegram bot. [Here](Botfather_config.md)'s a more detailed set of instructions on what to do.
* Put the provided token into the [token.js](token.js) file
* Run `node index.js` to run your server. Daemonize it, nohup it, & it, do as you wish
* Your FiddleGram is up and running

## Tinkering

What FiddleGram does when receiving a `/start` command, is to instantiate a Docker container with the desired language, to run the user's input inside of it safely. Then, every message that isn't a command is simply forwarded to the docker input so you can write code. Everything runs in containers, and there is one Docker image per language. This means you can get inspiration from [existing Dockerfiles](dockerImages/phpImage/Dockerfile) to put your own language to Fiddlegram.

Once your Dockerfile is complete, you can run
```bash
cd /vagrant/dockerImages/myImage/
docker build -t dmyLanguage .
```
(Again, replace vagrant with the root of your repo)

Then go to [index.js](index.js) and add the language in the `shellSettings` object. It's mostly copy-pasting.

In order to avoid too many inactive instances running and overloading the server, FiddleGram kills inactive sessions after **5 minutes**. You can change this by changing the `inactiveThreshold` variable.

## License

MIT, [here](LICENSE)