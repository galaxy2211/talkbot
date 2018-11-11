

function leave (msg, server) {
  if (server.isBound() && !server.isMaster(msg.user_id)) {
    msg.response(server.lang('leave.nope'));
  } else {
    server.leaveVoiceChannel();
  }
};

exports.register = function (commands) {
  commands.add('leave', leave);
};

exports.unRegister = function (commands) {
  commands.remove('leave');
};
