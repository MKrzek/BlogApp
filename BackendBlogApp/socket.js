let io;
module.exports = {
  init: httpServer => {
    // eslint-disable-next-line global-require
    io = require('socket.io')(httpServer);

    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error('Socket.io not initialized');
    }
    return io;
  },
};
