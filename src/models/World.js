
var fs = require('fs'),
  paths = require('@paths'),
  botStuff = require("@helpers/bot-stuff"),
  Server = require("@models/Server"),
  auth = require("@auth"),
  Common = require("@helpers/common"),
  bot = botStuff.bot;

class World {

  constructor() {
    this.servers = {};
    this.presence_timeout = null;
    this.default_title = 'master';    
  }

/* * *
 * startup()
 *
 * Actions that run when the world object is created
 * * */
  startup() {
    var world = this;
    world.setPresence();
    world.startRebootTimer();
    bot.guilds.tap(guild => world.addServer(guild));
  };  
    
/* * *
 * addServer()
 *
 * Add a server to the world - pass Guild
 * * */
  addServer(guild) {
    this.servers[guild.id] = new Server(guild, this);
  }
  
/* * *
 * removeServer()
 *
 * Remove a server from the world - pass Guild
 * * */
  removeServer(guild) {
    if ( !this.servers[guild.id] ) return;
    var server = this.servers[guild.id];
    delete this.servers[guild.id];
    server.save();
    server.dispose();
  }

/* * *
 * setPresence()
 *
 * Set the bot's presence  
 * * */
  setPresence() {

    var w = this;
    var presence_timer = function() {
      w.presence_timeout = null;

      bot.user.setPresence({
        status: 'online',
        game: {
          name: w.renderPresenceHelp(),
          type: 1,
          url: 'https://github.com/nullabork/talkbot'
        }
      });
    };
    
    // this protects against spamming discord with presence updates
    // and getting banned
    if ( this.presence_timeout )
      clearTimeout(this.presence_timeout);
    this.presence_timeout = setTimeout(presence_timer, 50);
  };
  
/* * *
 * renderPresenceHelp()
 *
 * Create a presence string  
 * * */
  renderPresenceHelp() {
    var cmds = require("@commands");
    return cmds.command_char + "help, " + bot.guilds.size + " servers";
  };
  
  
/* * *
 * saveAll()
 *
 * Save the state of every server in the world 
 * * */
  saveAll() {
    for (var server_id in this.servers) {
      this.servers[server_id].save();
    }
  };
  
/* * *
 * releaseAll()
 *
 * Call release() on each server 
 * * */
  releaseAll() {
    for (var server_id in this.servers) {
      this.servers[server_id].release();
    }
  };
  
/* * *
 * kill()
 *
 * Attempts to shutdown gracefully - pass a reason 
 * * */
  kill(reason) {
    if (reason) Common.out('kill(): ' + reason);
    this.releaseAll();
    this.saveAll();
    bot.destroy();
    process.exit();
  };
  
/* * *
 * getActiveServersCount()
 *
 * Gets the number of servers where someone is !following 
 * * */
  getActiveServersCount() {
    var w = this;
    var c = 0;
    for (var s in w.servers) {
      if (w.servers[s].isBound()) c++;
    }
    return c;
  };
    
/* * *
 * startRebootTimer()
 *
 * When called sets the bot to automatically reboot when no one is using it
 * Its a hack to work around network bugs and so forth 
 * * */
  startRebootTimer() {
    var world = this;
    
    var reboot_timer = function() {
      
      if ( world.getActiveServersCount() == 0 ) {
        world.kill('Inactivity reboot');
        return;
      }
      
      // if someone is using it it'll get here and we'll 
      // check again in an hour to see if we can reboot it
      setTimeout(reboot_timer, 60 * 60 * 1000); 
    };
    
    // kick off in 12 hours
    setTimeout(reboot_timer, 12 * 60 * 60 * 1000); 
  };

/* * *
 * dispose()
 *
 * Safely clean up any resources for this class
 * * */ 
  dispose() {
    for ( var s in this.servers ) {
      this.servers[s].dispose();
    }
  };
  
}

module.exports = new World();
