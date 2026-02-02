module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("Admin connected to metrics socket");

    socket.on("disconnect", () => {
      console.log("Admin disconnected");
    });
  });
};
