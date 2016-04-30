// Module required
var child_process = require("child_process");
var pty = require("pty");
var async = require("async");
var TelegramBot = require('node-telegram-bot-api');

var token = require('./token').token;

// Init stuff
var shellSettings = {
  php:{
    command: ['run', '--name', '', '-it', 'dphp', 'php', '-a']
  }
};
var envs = {};

// Create bot
var bot = new TelegramBot(token, {polling: true});

function killAndRemove(container) {
  container = container || '$(docker ps -a -q)';
  child_process.exec('docker kill '+container);
  child_process.exec('docker rm '+container);
}

function createEnv(id, type) {
  id = id.toString();
  var command = shellSettings[type].command.slice();
  command[2] = 'env'+id;
  var env = pty.spawn('docker', command);
  env.stdout.on('data', function (data) {
      bot.sendMessage(id, data.toString());
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
    pid: env.pid
  };
}

// Matches /echo [whatever]
function start(msg) {
  console.log('Spawning');
  var type = 'php'; // TODO
 
  killAndRemove('env'+msg.from.id.toString());
  createEnv(msg.from.id, type);
  bot.sendMessage(msg.from.id, 'Loaded up and looking fine');

};

function stop(env) {
  killAndRemove('env'+env.id);
  delete envs[env.id];
}

// Any kind of message
bot.on('message', function (msg) {
  var chatId = msg.chat.id;
  /*bot.sendMessage(msg.from.id, 'ok');
  return;*/
  var env = envs[msg.from.id.toString()];
  console.log(msg.text);
  if(msg.text === '/start') {
    if(env){
      return bot.sendMessage(msg.from.id, 'You already have a shell running. Run /stop to stop it');
    }
    start(msg);
  }
  else if(msg.text === '/stop') {
    stop(env);
  }
  else if(env) {
    env.env.stdin.write(msg.text+'\n');
  }
  else {
    bot.sendMessage(msg.from.id, 'You don\'t have any env running. Run /start to start one');
  }
});

/*bot.on('inline_query', function (msg) {
	console.log(msg);
	bot.answerInlineQuery(msg.id, [{type:'text', text:'haha'}]);
});
*/

killAndRemove(null);
console.log('Bot is up and running');