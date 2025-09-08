const { Server } = require('socket.io');

const configureSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", 'stripe-signature'],
    },
  });

  io.on('connection', (socket) => {
    socket.join('leaderboard');
    socket.on('join-leaderboard', () => {
      socket.join('leaderboard');
    });

    socket.on('join-team', (teamId) => {
      if (teamId) {
        socket.join(`team-${teamId}`);
      }
    });

    socket.on('leave-team', (teamId) => {
      if (teamId) {
        socket.leave(`team-${teamId}`);
      }
    });

    socket.on('disconnect', () => {
    });
  });

  io.announceToTeam = (teamId, event, data) => {
    if (teamId) {
      io.to(`team-${teamId}`).emit(event, data);
    }
  }

  return io;
};

module.exports = { configureSocket };