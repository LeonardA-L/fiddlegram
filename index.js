var child_process = require("child_process");
var pty = require("pty");
// (function() {
//     var oldSpawn = childProcess.spawn;
//     function mySpawn() {
//         console.log('spawn called');
//         console.log(arguments);
//         var result = oldSpawn.apply(this, arguments);
//         return result;
//     }
//     childProcess.spawn = mySpawn;
// })();
var spawn = child_process.spawn;
var TelegramBot = require('node-telegram-bot-api');
var token = require('./token').token;
console.log(token);

var shellSettings = {
  php:{
    command: ['run', '--name', '', '-it', 'dphp', 'php', '-a']
  }
};

// Setup polling way
var bot = new TelegramBot(token, {polling: true});
var envs = {};

child_process.exec('docker kill $(docker ps -a -q)');
child_process.exec('docker rm $(docker ps -a -q)');

function createEnv(id, type) {
  id = id.toString();
  var command = shellSettings[type].command.slice();
  command[2] = 'env'+id;
  console.log(command);
  var env = pty.spawn('docker', command);
  console.log(env.pid);
  env.stdout.on('data', function (data) {
      console.log(env.pid);
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
 
  createEnv(msg.from.id, type);

  bot.sendMessage(msg.from.id, 'Loaded up and looking fine');
};

function stop(env) {
  child_process.exec('docker kill env'+env.id);
  child_process.exec('docker rm env'+env.id);
  delete envs[env.id];
}

// Any kind of message
bot.on('message', function (msg) {
  var chatId = msg.chat.id;
  /*bot.sendMessage(msg.from.id, 'ok');
  return;*/
  //console.log(msg);
  var env = envs[msg.from.id.toString()];
  console.log(msg.text);
  if(msg.text === '/start') {
    if(env){
      return bot.sendMessage(msg.from.id, 'You already have a shell running. Run /stop to stop it');
    }
    start(msg);
  }
  else if(msg.text === '/stop') {
  console.log(msg.from.id);
    stop(env);
  }
  else if(env) {
    console.log('Writing '+msg.text+' to env');
    env.env.stdin.write(msg.text+'\n');
  }
  else {
    bot.sendMessage(msg.from.id, 'You don\'t have any env running');
  }
});

bot.on('inline_query', function (msg) {
	console.log(msg);
	bot.answerInlineQuery(msg.id, [{type:'text', text:'haha'}]);
});