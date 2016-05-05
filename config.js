module.exports = {
  shellSettings: {
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
    javascript:{
      command: ['run', '--name', '', '-it', 'djs', 'js24'],
      suffix: ';'
    },
    ruby:{
      command: ['run', '--name', '', '-it', 'druby', 'irb']
    }
  },
  killInactiveDelay: 20 * 1000, //ms
  inactiveThreshold: 5 * 60,    //s
  defaultLanguage: 'python'
};