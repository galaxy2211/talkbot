/*jshint esversion: 9 */
// class for all the details of a command
var Common = require('@helpers/common');

class Command {

  static get command (){
    return this.instance = this.instance || new this;
  }

  get hidden() {
    return true;
  }

  get order() {
    return 99;
  }

  get command_name() {
    return this.constructor.name.toLowerCase();
  }

  get group() {
    return 'misc';
  }

  get short_help() {
    return `${this.command_name}.shorthelp`;
  }

  get long_help() {
    return `${this.command_name}.longhelp`;
  }

  get sequence() {
    return {
      message : 0,
      token : 0,
    };
  }


  /**
   * [execute main command execute function]
   *
   * @param {*} msg
   * @param {*} server
   * @param {*} world
   *
   * @return  {[type]}  [return description]
   */
  execute (details, server, world) {
    Common.out('Please implement the execute function');
  }


  /**
   * [listeners register listeners]
   *
   * @return  {[type]}  [return description]
   */
  get listeners() {
    var self = this;
    return {
      message : self.onMessage || null,
      token : self.onToken || null,
      
      messageDelivered : self.onMessageDelivered || null,
      validate: self.onValidate || null,

      joinVoice: self.onJoinVoice || null,
      leaveVoice: self.onLeaveVoice || null,

      follow: self.onFollow || null,
      unfollow: self.onUnfollow || null,

      configureVoice: self.onConfigureVoice || null
    }
  }
}

module.exports = Command;
