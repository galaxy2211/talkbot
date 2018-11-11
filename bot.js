var _config = './config',
  //commands_path = './commands',
  state_path = '../state.json',
  auth_path = '../auth.json',
  lang_path = _config + '/lang.json';

var paths = require('./config/urls');


//npm imports
var fs = require('fs'),
  request = require('request'),
  Discord = require('discord.io'),
  textToSpeech = require('@google-cloud/text-to-speech');

//helpers
var SSML = require('./src/helpers/discord-to-ssml'),
  commands = require('./src/commands/index'),
  botStuff = require('./src/helpers/bot-stuff');
common = require('./src/helpers/common');

//models
var world = require('./src/models/World'),
  Server = require('./src/models/Server'),
  MessageDetails = require('./src/models/MessageDetails');

//configs
var auth = require(auth_path),
  messages = require(lang_path),
  state = require(state_path);

// Creates a client


var bot = botStuff.bot;

var ssml = new SSML({});

// var bot = new Discord.Client({
//   token: auth.token,
//   autorun: true
// });

bot.on('ready', function (evt) {
  console.log('Logged in as: ' + bot.username + ' - (' + bot.id + ')');

  // cool status
  bot.setPresence({
    status: 'online',
    game: {
      name: auth.tagline || 'Killing all the humans',
      type: 1,
      url: ''
    }
  });

  // init all other servers
  world.initServers();
  // load the state
  world.load();

});

bot.on('disconnect', function (evt) {
  console.log('Disconnected');
  bot.connect();
});

bot.on('any', function (evt) {

  if (evt.t == 'GUILD_CREATE') {

    // when added to a server do this - need to wait a bit for the library to init
    var add_server = function () { world.addServer(bot.servers[evt.d.id]); };

    setTimeout(add_server, 10000);
  }
  else if (evt.t == 'VOICE_STATE_UPDATE') {
    // if my master's voice status changes
    var channel_id = null;
    if (evt.d)
      var channel_id = evt.d.channel_id;
    var server = world.getServerFromChannel(channel_id);
    if (server == null) {
      console.log("What server?: " + channel_id);
      world.checkMastersVoiceChannels(evt.d.user_id);
      return null;
    }

    //was this eventer the current
    if (evt.d && server.isMaster(evt.d.user_id)) {

      if (!channel_id) {
        if (server.inChannel()) {
          server.leaveVoiceChannel();
        }
      } else if (!botStuff.isVoiceChannel(channel_id)) {
        console.log('Not a voice channel');
      } else {
        server.joinVoiceChannel(channel_id);
      }
    }
  }
});

bot.on('message', function (username, user_id, channel_id, message, evt) {

  var command_char = auth.command_char || '!';

  if (common.isMessageExcluded(message)) return null;

  var server = world.getServerFromChannel(channel_id);

  if (server == null) {
    console.error("Can't find server for " + channel_id);
    return null;
  }

  // is the message a command?
  if (message.substring(0, command_char.length) == command_char) {

    server.resetNeglectTimeout();
    //var args = message.substring(command_char.length).split(' ');
    var parts = message.match(
      new RegExp("(" + common.escapeRegExp(command_char) + ")([^ ]+)(.*)", "i")
    );

    if (!parts || parts.length < 2) {
      return;
    }


    var cmdChar = parts[1];
    var cmdVerb = parts[2] || null;
    var cmdArgs = (parts[3] && parts[3].trim().split(/\s+/)) || [];
    var cmdMessage = (parts[3] || "").trim()

    if(!cmdVerb || !cmdChar){
      return;
    }

    var msgDets = new MessageDetails({
      channel_id: channel_id,
      user_id: user_id,
      bot: botStuff.bot,
      world: world,
      server: server,
      username: username,
      cmdChar: cmdChar,
      cmd: cmdVerb,
      args: cmdArgs,
      message: cmdMessage,
    });

    commands.run(msgDets.cmd, [msgDets, server, world]);

  } else {
    if (message == null) return;

    // tts bit
    message = botStuff.resolveMessageSnowFlakes(channel_id, message);
    if (!server.permitted[user_id] || !server.permitted[user_id].use_ssml) {
      message = common.cleanMessage(message);
    }
    message = ssml.build(message);

    if (message.length < 1) return;

    if (server.inChannel()) {
      if (server.isPermitted(user_id)) {
        server.talk(message, server.permitted[user_id]);
      }
    }
  }
});


process.on('SIGINT', function () {
  world.save();
  bot.disconnect();
  process.exit();
});
