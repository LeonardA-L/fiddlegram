var childProcess = require("child_process");
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
var spawn = childProcess.spawn;
var TelegramBot = require('node-telegram-bot-api');
var token = require('./token').token;
console.log(token);

var shellSettings = {
  php:{
    command: ['run', '-it', 'dphp', 'php', '-a'];
  }
};

// Setup polling way
var bot = new TelegramBot(token, {polling: true});
var envs = {};

// Matches /echo [whatever]
function start(msg) {
  console.log('Spawning');
  var type = 'php'; // TODO
  //var js = pty.spawn('./process.sh', []);
  var js = pty.spawn('docker', shellSettings[type].command);


  js.stdout.on('data', function (data) {
      console.log(data.toString());
      bot.sendMessage(msg.from.id, data.toString());
  });
/*
  js.stderr.on('data', function (data) {
    console.log('stderr: '+data);
    bot.sendMessage(msg.from.id, 'Err: '+data.toString());
  });
*/
  js.on('close', function (code) {
    console.log('child process exited with code '+code);
    bot.sendMessage(msg.from.id, 'Env killed');
    stop(msg.from.id);
  });

  envs[msg.from.id.toString()] = js;
  console.log(msg.from.id);

  bot.sendMessage(msg.from.id, 'Loaded up and looking fine');
};

function stop(id) {
  var env = envs[id.toString()];
  env.stdin.removeAllListeners('data')
  env.kill('SIGKILL');
  delete envs[id];
}

// Any kind of message
bot.on('message', function (msg) {
  var chatId = msg.chat.id;
  //console.log(msg);
  var env = envs[msg.from.id.toString()];
  if(msg.text === '/start') {
    if(env){
      return bot.sendMessage(msg.from.id, 'You already have a shell running. Run /stop to stop it');
    }
    start(msg);
  }
  else if(msg.text === '/stop') {
  console.log(msg.from.id);
    stop(msg.from.id);
  }
  else if(env) {
    console.log('Writing '+msg.text+' to env');
    env.stdin.write(msg.text+'\n');
  }
  else {
    bot.sendMessage(msg.from.id, 'You don\'t have any env running');
  }
});

bot.on('inline_query', function (msg) {
	console.log(msg);
	bot.answerInlineQuery(msg.id, [{type:'text', text:'haha'}]);
});