// Module required
var child_process = require("child_process");
var pty = require("pty");
var async = require("async");
var TelegramBot = require('node-telegram-bot-api');

var token = require('./token').token;

// Init stuff
var shellSettings = {
  php:{
    command: ['run', '--name', '', '-it', 'dphp', 'php', '-a'],
    suffix: ';',
    skipIntro: 'Interactive mode enabled'
  },
  python2:{
    command: ['run', '--name', '', '-it', 'dpython', 'python'],
    skipIntro: '[GCC 4.9.2] on linux2'
  },
  python3:{
    command: ['run', '--name', '', '-it', 'dpython3', 'python3'],
    skipIntro: '[GCC 4.9.1] on linux'
  },
  erlang:{
    command: ['run', '--name', '', '-it', 'derlang', 'erl']
  },
  haskell:{
    command: ['run', '--name', '', '-it', 'dhaskell', 'ghci']
  },
  javascript:{
    command: ['run', '--name', '', '-it', 'djs', 'js24'],
    suffix: ';'
  },
  ruby:{
    command: ['run', '--name', '', '-it', 'druby', 'irb']
  }
};

var availableLanguages = '';
for(var i in shellSettings){
  availableLanguages += '- '+i+'\n';
}

shellSettings.python = shellSettings.python2;
shellSettings.js = shellSettings.javascript;

var killInactiveDelay = 20 * 1000; //ms
var inactiveThreshold = 5 * 60;    //s
var defaultLanguage = 'python';
var envs = {};

// Create bot
var bot = new TelegramBot(token, {polling: true});

function killAndRemove(container, callback) {
  container = container || '$(docker ps -a -q)';
  async.series([
    function (next){
      child_process.exec('docker kill '+container, function(){
        next();
      });

    },
    function (next){
      child_process.exec('docker rm '+container, function(){
        next();
      });
    }
  ], function(){
    if(callback){
      callback();
    }
  });
}

function respond(id, data){
  var env = envs[id];
  var lines = data.split('\r\n');
  var lmIdx = lines.indexOf(env.lastMessage);
  if(lmIdx !== -1){
    lines.splice(lmIdx, 1);
  }
  while(lines.indexOf(env.lastMessage) !== -1){
    lines.splice(lines.indexOf(env.lastMessage), 1);
  }
  /*
  if(env.shellLine && data === env.shellLine){
    return;
  }*/
  bot.sendMessage(id, lines.join('\n'));
}

function createEnv(id, type) {
  id = id.toString();
  var command = shellSettings[type].command.slice();
  command[2] = 'env'+id;
  var env = pty.spawn('docker', command);
  env.stdout.on('data', function (data) {
    respond(id, data.toString());
  });

  env.on('close', function (code) {
    console.log('child process exited with code '+code);
    bot.sendMessage(id, 'Env killed');
    stop(env);
  });

  envs[id] = {
    id: id,
    type: type,
    env: env,
    started: new Date(),
    lastActive: new Date(),
    pid: env.pid,
    lastMessage:shellSettings[type].skipIntro || ''
  };
}

// Matches /echo [whatever]
function start(msg) {
  console.log('Spawning');
  var type = defaultLanguage;

  if(msg.text.split(' ').length > 1){
    type = msg.text.split(' ')[1].toLowerCase();
    if(!shellSettings.hasOwnProperty(type)){
      return bot.sendMessage(msg.from.id, 'The language '+type+' is not supported. Type /languages for a list of supported languages.');
    }
  }

  async.series([
    function (next){
      killAndRemove('env'+msg.from.id.toString(), next);
    },
    function (next) {
      createEnv(msg.from.id, type);
      bot.sendMessage(msg.from.id, 'Loaded up and looking fine');
      next();
    }
  ]);

};

function stop(env) {
  killAndRemove('env'+env.id);
  delete envs[env.id];
}

function send(command, env){
  env.lastActive = new Date();
  if(shellSettings[env.type].hasOwnProperty('suffix')){
    command+=shellSettings[env.type].suffix;
  }
  env.lastMessage = command.toString().replace(/[^\x20-\x7E]+/g, '');
  env.env.stdin.write(command+'\n');
}

function languages(id){
  var languages = 'Available languages:\n'+availableLanguages+'Use /start [language] to start a new session.';
  bot.sendMessage(id, languages);
}

function version(id) {
  bot.sendMessage(id,'Fiddlegram v1.0 with:\n\
  - Erlang \n\
  - Haskell: ghci 7.6.3\n\
  - JavaScript: Spidermonkey C24.2.0\n\
  - PHP: 5.6.20\n\
  - Python2: 2.7.9\n\
  - Python3: 3.4.2\n\
  - Ruby: 2.1.5\n\
  Use /start [language] to start a new session.');
}

function help(id){
  bot.sendMessage(id,'Fiddlegram launches an interactive language shell (REPL) in the language of your choosing, just like at home.\nUse the following commands to use the bot:\n\
    /start - [language] start a new repl session\n\
    /stop - stop current repl session\n\
    /languages - list currently supported languages\n\
    /version - list bot and languages versions\n\
    /help - display this help');
}

// Any kind of message
bot.on('message', function (msg) {
  var chatId = msg.chat.id;
  /*bot.sendMessage(msg.from.id, 'ok');
  return;*/
  var env = envs[msg.from.id.toString()];
  console.log(msg.text);
  if(msg.text.match('/start\s?.*')) {
    if(env){
      return bot.sendMessage(msg.from.id, 'You already have a shell running. Run /stop to stop it.');
    }
    start(msg);
  }
  else if(msg.text === '/stop') {
    stop(env);
  }
  else if(env) {
    send(msg.text, env);
  }
  else if(msg.text.indexOf('/lang') === 0){
    languages(msg.from.id);
  }
  else if(msg.text.indexOf('/v') === 0){
    version(msg.from.id);
  }
  else if(msg.text.indexOf('/h') === 0){
    help(msg.from.id);
  }
  else {
    bot.sendMessage(msg.from.id, 'You don\'t have any env running. Run /start to start one, or /help to get help.');
  }
});

/*bot.on('inline_query', function (msg) {
	console.log(msg);
	bot.answerInlineQuery(msg.id, [{type:'text', text:'haha'}]);
});
*/

setInterval(function(){
  //console.log('Killing inactive envs');
  var now = new Date();
  for(var i in envs){
    var e = envs[i];
    var dateDiff = (now - e.lastActive) / 1000;
    if(dateDiff > inactiveThreshold){
      //console.log('Killing inactive env '+i);
      bot.sendMessage(i, 'Your console session has been inactive for '+inactiveThreshold/60+' minutes and has been killed');
      stop(e);
    }
  }
}, killInactiveDelay);

async.series([
  function (next){
    killAndRemove(null, next);
  },
  function (next){
    console.log('Bot is up and running');
    next();
  }]
);