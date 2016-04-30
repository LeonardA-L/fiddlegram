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
  },
  python:{
    command: ['run', '--name', '', '-it', 'dpython', 'python']
  },
  python3:{
    command: ['run', '--name', '', '-it', 'dpython3', 'python3']
  },
  erlang:{
    command: ['run', '--name', '', '-it', 'derlang', 'erl']
  }
};
shellSettings.python2 = shellSettings.python;

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
  var type = defaultLanguage;

  if(msg.text.split(' ').length > 1){
    type = msg.text.split(' ')[1];
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
    env.lastActive = new Date();
    env.env.stdin.write(msg.text+'\n');
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

killAndRemove();
console.log('Bot is up and running');